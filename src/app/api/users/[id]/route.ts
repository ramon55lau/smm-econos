import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, status, maxFacebookAccounts, maxInstagramAccounts, maxYouTubeAccounts } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { package: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.role === "SUPER_ADMIN" && role && role !== "SUPER_ADMIN") {
      const superAdminsCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
      if (superAdminsCount <= 1) {
        return NextResponse.json({ error: "Cannot downgrade the last Super Admin" }, { status: 400 });
      }
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (role) dataToUpdate.role = role;
    if (status) dataToUpdate.status = status;
    if (email) dataToUpdate.email = email.toLowerCase();
    if (password) dataToUpdate.password = await bcrypt.hash(password, 10);
    if (body.packageId !== undefined) dataToUpdate.packageId = body.packageId || null;

    // Handle membership expiry
    const targetRole = role || existingUser.role;
    if (["SUPER_ADMIN", "ADMIN"].includes(targetRole)) {
      dataToUpdate.expiresAt = null; // Admins and Super Admins do not expire
    } else if (status === "APPROVED" && existingUser.status !== "APPROVED") {
      // If approved, set expiration to 30 days from now
      if (!body.expiresAt) {
        dataToUpdate.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    if (body.expiresAt !== undefined) {
      dataToUpdate.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updatedUser = await (prisma.user as any).update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        packageId: true,
        package: true
      }
    });

    // Send notification emails based on status/package changes
    try {
      const { sendEmail, emailTemplates } = require("@/lib/email");

      // If account was approved (from pending or suspended)
      if (status === "APPROVED" && existingUser.status !== "APPROVED") {
        const template = emailTemplates.registrationApproved(
          updatedUser.name || "Usuario",
          updatedUser.email,
          (updatedUser as any).expiresAt
        );
        await sendEmail(updatedUser.email, template.subject, template.html);
      }

      // If account was suspended
      if (status === "SUSPENDED" && existingUser.status !== "SUSPENDED") {
        const template = emailTemplates.accountSuspended(updatedUser.name || "Usuario");
        await sendEmail(updatedUser.email, template.subject, template.html);
      }

      // If package was changed
      if (body.packageId !== undefined && body.packageId !== existingUser.packageId) {
        const pkg = (updatedUser as any).package;
        if (pkg) {
          const template = emailTemplates.packageUpdated(
            updatedUser.name || "Usuario",
            pkg.name,
            { facebook: pkg.maxFacebook, instagram: pkg.maxInstagram, youtube: pkg.maxYouTube }
          );
          await sendEmail(updatedUser.email, template.subject, template.html);
        }
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.role === "SUPER_ADMIN") {
      const superAdminsCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
      if (superAdminsCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last Super Admin" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
