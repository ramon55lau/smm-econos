import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Datos faltantes" }, { status: 400 });
        }

        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                token,
                used: false,
                expires: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user and mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        return NextResponse.json({ message: "Contraseña actualizada con éxito" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
