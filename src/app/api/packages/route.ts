import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const packages = await prisma.package.findMany({
            orderBy: { maxFacebook: 'asc' }
        });
        return NextResponse.json(packages);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching packages" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, maxFacebook, maxInstagram, maxYouTube } = body;

        const pkg = await prisma.package.create({
            data: {
                name,
                maxFacebook: parseInt(maxFacebook),
                maxInstagram: parseInt(maxInstagram),
                maxYouTube: parseInt(maxYouTube),
            },
        });

        return NextResponse.json(pkg);
    } catch (error) {
        return NextResponse.json({ error: "Error creating package" }, { status: 500 });
    }
}
