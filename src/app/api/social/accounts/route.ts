import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/social/accounts — List connected social accounts for the user
 * DELETE /api/social/accounts — Disconnect a social account
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        accountName: true,
        pageId: true, // Necessary to distinguish between Feed and Fanpages in wizard
        pageName: true,
        adAccountId: true,
        accessToken: true,
        expiresAt: true,
      },
    });

    // Auto-fix Google account names if generic or matching SMM username
    const resolvedAccounts = await Promise.all(
      accounts.map(async (acc) => {
        if ((acc.provider === "google-ads" || acc.provider === "youtube") && acc.accessToken) {
          const isGenericOrSmmName =
            !acc.accountName ||
            acc.accountName === "Cuenta de Google Ads" ||
            acc.accountName === "Google Ads" ||
            acc.accountName === session.user.name;

          if (isGenericOrSmmName) {
            try {
              const meRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${acc.accessToken}`);
              if (meRes.ok) {
                const meData = await meRes.json();
                const realGoogleName = meData.name || meData.email;
                if (realGoogleName) {
                  await prisma.socialAccount.update({
                    where: { id: acc.id },
                    data: { accountName: realGoogleName },
                  });
                  acc.accountName = realGoogleName;
                }
              }
            } catch (e) {
              console.warn("[ACCOUNTS_API] Could not auto-resolve Google name:", e);
            }
          }
        }
        return acc;
      })
    );

    // Omit accessToken before returning to client for security
    const sanitizedAccounts = resolvedAccounts.map(({ accessToken, ...rest }) => rest);

    return NextResponse.json(sanitizedAccounts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { accountId, providerAccountId, provider } = await req.json();
    
    if (providerAccountId && provider) {
      // Bulk disconnect by Titular
      await prisma.socialAccount.deleteMany({
        where: {
          userId: session.user.id,
          providerAccountId,
          provider
        }
      });
      return NextResponse.json({ message: "All accounts for this titular disconnected" });
    }

    if (accountId) {
      const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
      if (!account || account.userId !== session.user.id) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      await prisma.socialAccount.delete({ where: { id: accountId } });
      return NextResponse.json({ message: "Account disconnected" });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/social/accounts error:", error);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}
