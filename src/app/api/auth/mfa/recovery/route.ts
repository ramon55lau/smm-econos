import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, emailTemplates } from "@/lib/email";

/**
 * POST /api/auth/mfa/recovery
 * Requests a secure 2FA disable token by email
 */
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "El correo electrónico es requerido." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Keep error generic for security, but help user if precise is needed
            return NextResponse.json({ error: "No se encontró ningún usuario con ese correo." }, { status: 404 });
        }

        if (!user.mfaEnabled) {
            return NextResponse.json({ error: "La Autenticación 2FA no está habilitada en esta cuenta." }, { status: 400 });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

        // Save token (reusing PasswordResetToken model)
        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expires,
            },
        });

        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const host = req.headers.get("host");
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}` || "https://smm.econos.io";

        const recoveryUrl = `${baseUrl}/api/auth/mfa/recovery?token=${token}`;

        const template = emailTemplates.mfaRecovery(user.name || "Usuario", recoveryUrl);
        await sendEmail(user.email, template.subject, template.html);

        return NextResponse.json({ message: "Se ha enviado un enlace de desactivación a tu correo." });
    } catch (error) {
        console.error("MFA recovery error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

/**
 * GET /api/auth/mfa/recovery
 * Validates token, disables 2FA for the user, and redirects to login with success flag
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(new URL("/login?disableMfa=error&msg=missing_token", req.url));
        }

        // Find token and check if valid/active
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
            return NextResponse.redirect(new URL("/login?disableMfa=error&msg=invalid_or_expired", req.url));
        }

        // Mark token as used
        await prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true }
        });

        // Disable 2FA for the user
        await (prisma.user as any).update({
            where: { id: resetToken.userId },
            data: {
                mfaEnabled: false,
                mfaSecret: null,
                mfaBackupCodes: null
            }
        });

        return NextResponse.redirect(new URL("/login?disableMfa=success", req.url));
    } catch (error) {
        console.error("MFA recovery verify error:", error);
        return NextResponse.redirect(new URL("/login?disableMfa=error&msg=internal_error", req.url));
    }
}
