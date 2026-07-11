import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword, disableMfa } = body;

        const user = await (prisma.user as any).findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Change password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Debe proporcionar la contraseña actual" }, { status: 400 });
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
            }

            if (newPassword.length < 8) {
                return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await (prisma.user as any).update({
                where: { id: session.user.id },
                data: { password: hashedPassword },
            });

            return NextResponse.json({ message: "Contraseña actualizada correctamente" });
        }

        // Disable 2FA
        if (disableMfa) {
            if (!user.mfaEnabled) {
                return NextResponse.json({ error: "El 2FA ya está desactivado" }, { status: 400 });
            }

            if (!currentPassword) {
                return NextResponse.json({ error: "Debe proporcionar la contraseña actual para desactivar el 2FA" }, { status: 400 });
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
            }

            await (prisma.user as any).update({
                where: { id: session.user.id },
                data: {
                    mfaEnabled: false,
                    mfaSecret: null,
                    mfaBackupCodes: null,
                },
            });

            return NextResponse.json({ message: "Autenticación 2FA desactivada correctamente" });
        }

        return NextResponse.json({ error: "No se especificó ninguna acción" }, { status: 400 });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
