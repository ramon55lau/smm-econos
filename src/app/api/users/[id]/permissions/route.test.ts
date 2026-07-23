/**
 * Unit Tests for /api/users/[id]/permissions (GET + POST)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        userPermission: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
    },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/users/[id]/permissions", () => {
    afterEach(() => jest.clearAllMocks());

    // ── GET ──
    describe("GET - list user permissions", () => {
        it("should return 401 for non-admin", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "VIEWER" } });
            const res = await GET(mkReq({}) as any, ctx("u1"));
            expect(res.status).toBe(401);
        });

        it("should return permissions for admin", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            (prisma.userPermission.findMany as jest.Mock).mockResolvedValue([
                { permission: { id: "p1", name: "manage_ads" } },
            ]);
            const res = await GET(mkReq({}) as any, ctx("u1"));
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data[0].name).toBe("manage_ads");
        });

        it("should return 500 on DB error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            (prisma.userPermission.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
            const res = await GET(mkReq({}) as any, ctx("u1"));
            expect(res.status).toBe(500);
        });
    });

    // ── POST ──
    describe("POST - update user permissions", () => {
        it("should return 401 for non-SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            const res = await POST(mkReq({ permissionIds: [] }), ctx("u1"));
            expect(res.status).toBe(401);
        });

        it("should return 400 if permissionIds is not an array", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            const res = await POST(mkReq({ permissionIds: "invalid" }), ctx("u1"));
            expect(res.status).toBe(400);
        });

        it("should delete old and insert new permissions", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.userPermission.deleteMany as jest.Mock).mockResolvedValue({});
            (prisma.userPermission.create as jest.Mock).mockResolvedValue({});
            const res = await POST(mkReq({ permissionIds: ["p1", "p2"] }), ctx("u1"));
            expect(res.status).toBe(200);
            expect(prisma.userPermission.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
            expect(prisma.userPermission.create).toHaveBeenCalledTimes(2);
        });

        it("should return 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.userPermission.deleteMany as jest.Mock).mockRejectedValue(new Error("DB"));
            const res = await POST(mkReq({ permissionIds: ["p1"] }), ctx("u1"));
            expect(res.status).toBe(500);
        });
    });
});
