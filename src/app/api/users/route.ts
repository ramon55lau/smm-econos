import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await (prisma.user as any).findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageId: true,
        package: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "SUPER_ADMIN") {
    // Only SUPER_ADMIN can create users in this simple RBAC
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, name, password, role, packageId } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const targetRole = role || "VIEWER";
    const expiresAt = body.expiresAt
      ? new Date(body.expiresAt)
      : (["SUPER_ADMIN", "ADMIN"].includes(targetRole)
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const newUser = await (prisma.user as any).create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: targetRole,
        packageId: packageId || null,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        expiresAt: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
