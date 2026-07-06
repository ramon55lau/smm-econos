import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "otplib";

/**
 * POST /api/auth/mfa/verify
 * Verifies a TOTP code to confirm MFA setup (activation).
 * Body: { code: "123456" }
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { code } = await req.json();

        if (!code || typeof code !== "string" || code.length !== 6) {
            return NextResponse.json({ error: "Código inválido. Debe ser de 6 dígitos." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { mfaSecret: true, mfaEnabled: true }
        });

        if (!user || !(user as any).mfaSecret) {
            return NextResponse.json({ error: "Primero debe iniciar la configuración MFA." }, { status: 400 });
        }

        if ((user as any).mfaEnabled) {
            return NextResponse.json({ error: "MFA ya está activado." }, { status: 400 });
        }

        // Verify the code against the stored secret
        const isValid = await verify({ token: code, secret: (user as any).mfaSecret });

        if (!isValid) {
            return NextResponse.json({ error: "Código incorrecto. Verifique su app de autenticación e intente de nuevo." }, { status: 400 });
        }

        // Generate 10 backup codes (alphanumeric, 8 chars)
        const generatedBackupCodes = Array.from({ length: 10 }, () => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        });

        // Activate MFA & save JSON string of backup codes
        await (prisma.user as any).update({
            where: { id: session.user.id },
            data: {
                mfaEnabled: true,
                mfaBackupCodes: JSON.stringify(generatedBackupCodes)
            }
        });

        return NextResponse.json({
            message: "MFA activado exitosamente.",
            backupCodes: generatedBackupCodes
        });
    } catch (error: any) {
        console.error("MFA verify error:", error);
        return NextResponse.json({ error: "Error verificando código MFA" }, { status: 500 });
    }
}
