/**
 * Unit Tests for /api/cron/membership-warnings (GET)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { user: { findMany: jest.fn() } },
}));
jest.mock("@/lib/email", () => ({
    __esModule: true,
    sendEmail: jest.fn(),
    emailTemplates: {
        membershipExpiringSoon: (name: string, expiresAt: Date) => ({
            subject: "Tu membresía expira pronto",
            html: "<p>Expira</p>",
        }),
    },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { NextRequest } from "next/server";

const mkReq = (token?: string, isLocal = true): NextRequest => {
    const url = token
        ? `http://localhost:3000/api/cron/membership-warnings?token=${token}`
        : "http://localhost:3000/api/cron/membership-warnings";
    return {
        headers: { get: () => null } as any,
        nextUrl: new URL(url),
    } as unknown as NextRequest;
};

describe("GET /api/cron/membership-warnings", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 for unauthorized remote request", async () => {
        const req = {
            headers: { get: () => null } as any,
            nextUrl: new URL("https://smm.econos.io/api/cron/membership-warnings"),
        } as unknown as NextRequest;
        expect((await GET(req)).status).toBe(401);
    });

    it("sends warning emails to expiring users", async () => {
        (prisma.user as any).findMany.mockResolvedValue([
            { name: "User1", email: "u1@e.com", expiresAt: new Date() },
            { name: "User2", email: "u2@e.com", expiresAt: new Date() },
        ]);
        (sendEmail as jest.Mock).mockResolvedValue(undefined);
        const res = await GET(mkReq());
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.emailsSent).toBe(2);
    });

    it("returns 500 on error", async () => {
        (prisma.user as any).findMany.mockRejectedValue(new Error("DB"));
        expect((await GET(mkReq())).status).toBe(500);
    });
});
