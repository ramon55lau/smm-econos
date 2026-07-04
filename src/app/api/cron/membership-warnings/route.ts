import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function GET(req: NextRequest) {
    // Security check: Accept checks if local or if matching CRON_SECRET token
    const authHeader = req.headers.get("authorization");
    const token = req.nextUrl.searchParams.get("token");
    const isLocal = req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";
    const expectedSecret = process.env.CRON_SECRET || "smm-cron-secret-key-9876";

    if (!isLocal && authHeader !== `Bearer ${expectedSecret}` && token !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Generate dates: 5 days from today
        const targetDateStart = new Date();
        targetDateStart.setDate(targetDateStart.getDate() + 5);
        targetDateStart.setHours(0, 0, 0, 0);

        const targetDateEnd = new Date();
        targetDateEnd.setDate(targetDateEnd.getDate() + 5);
        targetDateEnd.setHours(23, 59, 59, 999);

        const users = await prisma.user.findMany({
            where: {
                expiresAt: {
                    gte: targetDateStart,
                    lte: targetDateEnd
                },
                status: "APPROVED",
                role: {
                    notIn: ["SUPER_ADMIN", "ADMIN"]
                }
            }
        });

        let emailsSent = 0;
        for (const user of users) {
            try {
                if (user.expiresAt) {
                    const template = emailTemplates.membershipExpiringSoon(user.name || "Usuario", user.expiresAt);
                    await sendEmail(user.email, template.subject, template.html);
                    emailsSent++;
                }
            } catch (err) {
                console.error(`Failed to send warning email to ${user.email}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Enviados ${emailsSent} correos de advertencia.`,
            emailsSent,
            targetDate: targetDateStart.toLocaleDateString()
        });

    } catch (error: any) {
        console.error("Cron membership warning error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
