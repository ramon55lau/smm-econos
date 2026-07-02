import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/mfa/status
 * Returns the current MFA status for the authenticated user.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { mfaEnabled: true }
        });

        return NextResponse.json({ mfaEnabled: user?.mfaEnabled || false });
    } catch (error: any) {
        return NextResponse.json({ error: "Error obteniendo estado MFA" }, { status: 500 });
    }
}
