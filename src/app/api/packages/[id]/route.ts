import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { name, maxFacebook, maxInstagram, maxYouTube } = body;

        const pkg = await prisma.package.update({
            where: { id },
            data: {
                name,
                maxFacebook: parseInt(maxFacebook),
                maxInstagram: parseInt(maxInstagram),
                maxYouTube: parseInt(maxYouTube),
            },
        });

        return NextResponse.json(pkg);
    } catch (error: any) {
        console.error("Error updating package:", error?.message);
        return NextResponse.json({ error: "Error updating package", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Disassociate users from this package first to avoid foreign key violations
        await prisma.user.updateMany({
            where: { packageId: id },
            data: { packageId: null }
        });

        await prisma.package.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Package deleted" });
    } catch (error: any) {
        console.error("Error deleting package:", error?.message);
        return NextResponse.json({ error: "Error deleting package", details: error?.message }, { status: 500 });
    }
}
