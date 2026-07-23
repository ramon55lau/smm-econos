import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeFacebookToken, getFacebookPages, getFacebookAdAccounts } from "@/lib/social/facebook";
import { getInstagramAccountId } from "@/lib/social/instagram";
import { exchangeYouTubeToken } from "@/lib/social/youtube";

/**
 * GET /api/social/callback/[provider]?code=xxxxx
 * Handles the OAuth callback from Facebook or YouTube
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const session = await getServerSession(authOptions);

  // Stable redirectUri using NEXTAUTH_URL as priority - Defined at the top to avoid TDZ
  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/social/callback/${provider}`;

  if (!session) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // Is it "facebook", "instagram" or "popup"?
  const isPopup = state === "popup";
  const intendedProvider = state === "instagram" ? "instagram" : "facebook";

  if (!code) {
    if (isPopup) {
      return getPopupErrorHtml("No se pudo obtener el código de autorización.");
    }
    return NextResponse.redirect(new URL("/settings/accounts?error=missing_code", baseUrl));
  }

  try {
    let accessToken = "";
    let refreshToken: string | null = null;
    let expiresAt: Date | null = null;
    let providerAccountId = "";

    // New fields
    let accountName: string | null = null;
    let pageId: string | null = null;
    let pageName: string | null = null;
    let igAccountId: string | null = null;
    let adAccountId: string | null = null;

    if (provider === "facebook") {
      const tokens = await exchangeFacebookToken(code, redirectUri);
      accessToken = tokens.accessToken; // User Access Token
      expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      // Get user's Facebook profile
      const meRes = await fetch(`https://graph.facebook.com/v25.0/me?fields=id,name&access_token=${accessToken}`);
      const meData = await meRes.json();
      const userId = meData.id;
      const userName = meData.name;

      // 0. Fetch Ad Accounts (User level) - Only focus if we want ads/facebook
      if (intendedProvider === "facebook") {
        try {
          const adAccounts = await getFacebookAdAccounts(accessToken);
          const activeAdAccount = adAccounts.find(a => a.account_status === 1);
          if (activeAdAccount) adAccountId = activeAdAccount.id;
          else if (adAccounts.length > 0) adAccountId = adAccounts[0].id;
        } catch (e: any) {
          console.error("[FB_CALLBACK] Ad Accounts error:", e.message);
        }
      }

      // 1. Fetch ALL Facebook Pages (which now includes Instagram accounts)
      const pages = await getFacebookPages(accessToken);

      if (pages && pages.length > 0) {
        for (const page of pages) {
          // Save as FACEBOOK provider if intended
          if (intendedProvider === "facebook") {
            await prisma.socialAccount.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "facebook",
                  providerAccountId: page.id,
                },
              },
              update: {
                userId: session.user.id,
                accessToken: page.access_token,
                expiresAt,
                accountName: userName,
                pageId: page.id,
                pageName: page.name,
                igAccountId: page.instagram_business_account?.id || null,
                adAccountId,
              },
              create: {
                userId: session.user.id,
                provider: "facebook",
                providerAccountId: page.id,
                accessToken: page.access_token,
                expiresAt,
                accountName: userName,
                pageId: page.id,
                pageName: page.name,
                igAccountId: page.instagram_business_account?.id || null,
                adAccountId,
              },
            });
          }

          // Save as INSTAGRAM provider if it has a linked IG account
          if (page.instagram_business_account) {
            const ig = page.instagram_business_account;
            await prisma.socialAccount.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "instagram",
                  providerAccountId: ig.id,
                },
              },
              update: {
                userId: session.user.id,
                accessToken: page.access_token, // IG Graph API uses Page Token or User Token
                expiresAt,
                accountName: ig.username || ig.name || "Instagram Account",
                pageId: page.id,
                pageName: page.name,
                igAccountId: ig.id,
                adAccountId,
              },
              create: {
                userId: session.user.id,
                provider: "instagram",
                providerAccountId: ig.id,
                accessToken: page.access_token,
                expiresAt,
                accountName: ig.username || ig.name || "Instagram Account",
                pageId: page.id,
                pageName: page.name,
                igAccountId: ig.id,
                adAccountId,
              },
            });
          }
        }
      }

      // Finalize for the Titular User profile
      providerAccountId = userId;
      accountName = userName;
      // The provider for the final common upsert will be "facebook" (Titular)
    } else if (provider === "youtube") {
      const tokens = await exchangeYouTubeToken(code, redirectUri);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      // Get user's Google ID, Name & Email
      const meRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      const meData = await meRes.json();
      providerAccountId = meData.id;
      accountName = meData.name || meData.email || "Cuenta de Google";

      // Fetch YouTube Channel Info
      try {
        const ytRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const ytData = await ytRes.json();
        if (ytData.items && ytData.items.length > 0) {
          pageId = ytData.items[0].id;
          pageName = ytData.items[0].snippet.title;
        } else {
          pageName = "Canal de YouTube";
        }
      } catch (e) {
        console.warn("[YT_CALLBACK] Could not fetch channel info", e);
      }

    } else {
      if (isPopup) return getPopupErrorHtml("Proveedor de OAuth inválido.");
      return NextResponse.redirect(new URL("/settings/accounts?error=invalid_provider", baseUrl));
    }

    // 1. Fetch user to check limits including package info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        package: true,
        socialAccounts: true,
      }
    });

    if (!user) {
      if (isPopup) return getPopupErrorHtml("Usuario no encontrado.");
      return NextResponse.redirect(new URL("/settings/accounts?error=user_not_found", baseUrl));
    }

    const pkg = user.package || { maxFacebook: 1, maxInstagram: 1, maxYouTube: 1 };

    // 2. Enforce limits per platform
    const platformAccounts = (user.socialAccounts || []).filter((a: any) => a.provider === provider);
    const existingThisAccount = platformAccounts.find((a: any) => a.providerAccountId === providerAccountId);

    if (!existingThisAccount) {
      if (provider === "facebook") {
        const fbCount = (user.socialAccounts || []).filter((a: any) => a.provider === "facebook").length;
        const fbLimit = pkg.maxFacebook;
        if (fbCount >= fbLimit) {
          const errMsg = `Has alcanzado el límite de ${fbLimit} cuentas de Facebook.`;
          if (isPopup) return getPopupErrorHtml(errMsg);
          return NextResponse.redirect(new URL(`/settings/accounts?error=${encodeURIComponent(errMsg)}`, baseUrl));
        }
      } else if (provider === "youtube") {
        const ytCount = (user.socialAccounts || []).filter((a: any) => a.provider === "youtube").length;
        const ytLimit = pkg.maxYouTube;
        if (ytCount >= ytLimit) {
          const errMsg = `Has alcanzado el límite de ${ytLimit} cuentas de YouTube.`;
          if (isPopup) return getPopupErrorHtml(errMsg);
          return NextResponse.redirect(new URL(`/settings/accounts?error=${encodeURIComponent(errMsg)}`, baseUrl));
        }
      } else if (provider === "instagram") {
        const igCount = (user.socialAccounts || []).filter((a: any) => a.provider === "instagram").length;
        const igLimit = pkg.maxInstagram;
        if (igCount >= igLimit) {
          const errMsg = `Has alcanzado el límite de ${igLimit} cuentas de Instagram.`;
          if (isPopup) return getPopupErrorHtml(errMsg);
          return NextResponse.redirect(new URL(`/settings/accounts?error=${encodeURIComponent(errMsg)}`, baseUrl));
        }
      }
    }

    // 3. Upsert the social account using provider & providerAccountId
    await prisma.socialAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: provider,
          providerAccountId: providerAccountId,
        },
      },
      update: {
        userId: session.user.id,
        accessToken,
        refreshToken,
        expiresAt,
        accountName,
        pageId,
        pageName,
        igAccountId,
        adAccountId,
      },
      create: {
        userId: session.user.id,
        provider,
        providerAccountId,
        accessToken,
        refreshToken,
        expiresAt,
        accountName,
        pageId,
        pageName,
        igAccountId,
        adAccountId,
      },
    });

    // Mirror registration for Google Ads if YouTube (Google) account was connected
    if (provider === "youtube") {
      await prisma.socialAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google-ads",
            providerAccountId: providerAccountId,
          },
        },
        update: {
          userId: session.user.id,
          accessToken,
          refreshToken,
          expiresAt,
          accountName, // Display the Google profile name
          pageId: null,
          pageName: "Google Ads",
          igAccountId: null,
          adAccountId: null,
        },
        create: {
          userId: session.user.id,
          provider: "google-ads",
          providerAccountId,
          accessToken,
          refreshToken,
          expiresAt,
          accountName, // Display the Google profile name
          pageId: null,
          pageName: "Google Ads",
          igAccountId: null,
          adAccountId: null,
        },
      });
    }

    if (isPopup) {
      return getPopupSuccessHtml();
    }
    return NextResponse.redirect(new URL("/settings/accounts?success=true", baseUrl));
  } catch (error: any) {
    console.error(`OAuth callback error (${provider}):`, error.message);
    if (isPopup) {
      return getPopupErrorHtml(error.message);
    }
    return NextResponse.redirect(
      new URL(`/settings/accounts?error=${encodeURIComponent(error.message)}`, baseUrl)
    );
  }
}

// ── Helpers to render self-closing success/error HTML views in Popups ──

function getPopupSuccessHtml() {
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Conexión exitosa</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #fdfcfa;
            color: #4a3f35;
            text-align: center;
          }
          .card {
            padding: 40px;
            border-radius: 24px;
            background: white;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
            border: 1px solid #eae6e1;
            max-width: 320px;
          }
          h2 { margin: 0 0 8px 0; color: #b08d6d; font-size: 1.5rem; }
          p { color: #8a7a6e; font-size: 0.95rem; line-height: 1.4; margin: 0 0 20px 0; }
          .spinner {
            width: 24px; height: 24px;
            border: 3px solid #eae6e1;
            border-top: 3px solid #b08d6d;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🎉 ¡Conexión exitosa!</h2>
          <p>Tu canal de YouTube ha sido conectado correctamente.</p>
          <div class="spinner"></div>
        </div>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage("social-account-synced", "*");
            }
          } catch(e) {}
          setTimeout(() => {
            window.close();
          }, 1000);
        </script>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function getPopupErrorHtml(errorMsg: string) {
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Error de conexión</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #fffafa;
            color: #4a3f35;
            text-align: center;
          }
          .card {
            padding: 40px;
            border-radius: 24px;
            background: white;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
            border: 1px solid #fee2e2;
            max-width: 320px;
          }
          h2 { margin: 0 0 8px 0; color: #dc2626; font-size: 1.5rem; }
          p { color: #8a7a6e; font-size: 0.95rem; line-height: 1.4; margin: 0 0 16px 0; }
          button {
            background: #dc2626; color: white; border: none;
            padding: 10px 20px; border-radius: 20px;
            font-weight: 600; cursor: pointer; font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>❌ Error al conectar</h2>
          <p>${errorMsg || "Ocurrió un error inesperado al sincronizar."}</p>
          <button onclick="window.close()">Cerrar ventana</button>
        </div>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
