import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendEmail, emailTemplates, ADMIN_EMAIL } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, password } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                name,
                password: hashedPassword,
                status: "PENDING",
                role: "VIEWER", // Default role
            },
        });

        // Send email to user informing about the review process
        const template = emailTemplates.registrationPending(name);
        await sendEmail(email, template.subject, template.html);

        // Send notification to admin about new registration
        try {
            const adminTemplate = emailTemplates.adminNewRegistration(name, email);
            await sendEmail(ADMIN_EMAIL, adminTemplate.subject, adminTemplate.html);
        } catch (adminEmailError) {
            console.error("Error sending admin notification:", adminEmailError);
        }

        return NextResponse.json(
            { message: "Usuario registrado con éxito. Tu cuenta está en revisión." },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Error en el servidor al registrar usuario" }, { status: 500 });
    }
}
