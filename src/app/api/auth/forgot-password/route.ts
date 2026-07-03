import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // For security reasons, don't reveal if user exists or not
            return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace de recuperación." });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Save token
        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expires,
            },
        });

        // Send email
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const host = req.headers.get("host");
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}` || "https://smm.econos.io";
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        const template = emailTemplates.passwordReset(user.name || "Usuario", resetUrl);
        await sendEmail(user.email, template.subject, template.html);

        return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace de recuperación." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
