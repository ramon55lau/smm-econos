import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "Econos SMM";

/**
 * POST /api/auth/mfa/setup
 * Generates a new MFA secret and returns a QR code for Google Authenticator.
 */
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, mfaEnabled: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        if (user.mfaEnabled) {
            return NextResponse.json({ error: "MFA ya está activado. Desactívelo primero para reconfigurar." }, { status: 400 });
        }

        // Generate a new TOTP secret
        const secret = generateSecret();

        // Create the otpauth URI that Google Authenticator will read from the QR
        const otpauthUrl = await generateURI({ secret, label: user.email, issuer: APP_NAME });

        // Generate QR code as data URL (base64 PNG)
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        // Store the secret temporarily (not yet enabled)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { mfaSecret: secret, mfaEnabled: false }
        });

        return NextResponse.json({
            secret,
            qrCode: qrCodeDataUrl,
            message: "Escanee el código QR con Google Authenticator y luego confirme con un código."
        });
    } catch (error: any) {
        console.error("MFA setup error:", error);
        return NextResponse.json({ error: "Error configurando MFA" }, { status: 500 });
    }
}
