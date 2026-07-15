import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check authorization:
    // Either the currently logged-in user is SUPER_ADMIN
    // OR the session carries an impersonator object indicating the original admin was a SUPER_ADMIN
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const originalAdminIsSuper = session.user.impersonator?.role === "SUPER_ADMIN";

    if (!isSuperAdmin && !originalAdminIsSuper) {
        return NextResponse.json({ error: "Solo los roles SUPER_ADMIN pueden impersonar", status: 403 }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { targetUserId, action } = body;

        if (action === "restore") {
            return NextResponse.json({ success: true, message: "Sesión restaurada listada" });
        }

        if (!targetUserId) {
            return NextResponse.json({ error: "Falta el ID del usuario objetivo" }, { status: 400 });
        }

        // Fetch the target user details from database
        const targetUser = await (prisma.user as any).findUnique({
            where: { id: targetUserId },
            include: { package: true }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Safety: prevent impersonating other super admins, if necessary
        // (though SUPER_ADMINs can usually impersonate user profiles for help purposes, they shouldn't run commands as other SUPER_ADMINs)
        if (targetUser.role === "SUPER_ADMIN" && targetUser.id !== session.user.impersonator?.id) {
            return NextResponse.json({ error: "No es posible impersonar a otros SUPER_ADMIN" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            targetUser: {
                id: targetUser.id,
                name: targetUser.name || "",
                email: targetUser.email,
                role: targetUser.role,
                packageName: targetUser.package?.name || "Sin Plan",
                expiresAt: targetUser.expiresAt ? targetUser.expiresAt.toISOString() : null,
                createdAt: targetUser.createdAt ? targetUser.createdAt.toISOString() : null,
                mfaEnabled: targetUser.mfaEnabled ?? false
            }
        });

    } catch (err: any) {
        console.error("Error setting up impersonate session:", err.message);
        return NextResponse.json({ error: `Error interno de servidor: ${err.message}` }, { status: 500 });
    }
}
