/**
 * Unit Tests for /api/users/[id] (PUT update + DELETE)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
        package: { findUnique: jest.fn() },
    },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("bcrypt", () => ({ hash: jest.fn() }));
jest.mock("@/lib/email", () => ({
    __esModule: true,
    sendEmail: jest.fn(),
    emailTemplates: {
        registrationApproved: (n: string, e: string, exp: any) => ({ subject: "Aprobado", html: "<p/>" }),
        accountSuspended: (n: string) => ({ subject: "Suspendido", html: "<p/>" }),
        packageUpdated: (n: string, pkg: string, l: any) => ({ subject: "Plan", html: "<p/>" }),
        membershipRenewed: (n: string, exp: any, pkg: string, l: any) => ({ subject: "Renovado", html: "<p/>" }),
    },
}));

import { PUT, DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/users/[id]", () => {
    afterEach(() => jest.clearAllMocks());

    // ── PUT ──
    describe("PUT - update user", () => {
        it("should return 401 for non-SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            const res = await PUT(mkReq({ name: "X" }), ctx("u1"));
            expect(res.status).toBe(401);
        });

        it("should return 404 if user not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            const res = await PUT(mkReq({ name: "X" }), ctx("u1"));
            expect(res.status).toBe(404);
        });

        it("should update user name successfully", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "VIEWER", status: "APPROVED" });
            (prisma.user as any).update.mockResolvedValue({ id: "u1", name: "New", email: "a@b.c", role: "VIEWER", status: "APPROVED" });
            const res = await PUT(mkReq({ name: "New" }), ctx("u1"));
            expect(res.status).toBe(200);
            expect((await res.json()).name).toBe("New");
        });

        it("should block downgrading the last SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "sa", role: "SUPER_ADMIN" });
            (prisma.user.count as jest.Mock).mockResolvedValue(1);
            const res = await PUT(mkReq({ role: "ADMIN" }), ctx("sa"));
            expect(res.status).toBe(400);
        });

        it("should return 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB"));
            const res = await PUT(mkReq({ name: "X" }), ctx("u1"));
            expect(res.status).toBe(500);
        });
    });

    // ── DELETE ──
    describe("DELETE - remove user", () => {
        it("should return 401 for non-SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            const res = await DELETE(mkReq({}), ctx("u1"));
            expect(res.status).toBe(401);
        });

        it("should return 400 if trying to delete yourself", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            const res = await DELETE(mkReq({}), ctx("sa"));
            expect(res.status).toBe(400);
        });

        it("should return 404 if user not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            const res = await DELETE(mkReq({}), ctx("u1"));
            expect(res.status).toBe(404);
        });

        it("should block deleting the last SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "other-sa", role: "SUPER_ADMIN" });
            (prisma.user.count as jest.Mock).mockResolvedValue(1);
            const res = await DELETE(mkReq({}), ctx("other-sa"));
            expect(res.status).toBe(400);
        });

        it("should delete user successfully", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "VIEWER" });
            (prisma.user.delete as jest.Mock).mockResolvedValue({});
            const res = await DELETE(mkReq({}), ctx("u1"));
            expect(res.status).toBe(200);
            expect((await res.json()).message).toBe("User deleted successfully");
        });

        it("should return 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB"));
            const res = await DELETE(mkReq({}), ctx("u1"));
            expect(res.status).toBe(500);
        });
    });
});
