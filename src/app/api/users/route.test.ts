/**
 * Unit Tests for /api/users (GET list + POST create)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { user: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("bcrypt", () => ({ hash: jest.fn() }));

import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);

describe("/api/users", () => {
    afterEach(() => jest.clearAllMocks());

    // ── GET ──
    describe("GET - list users (admin only)", () => {
        it("should return 401 for non-admin", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "VIEWER" } });
            const res = await GET();
            expect(res.status).toBe(401);
        });

        it("should return users for ADMIN role", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            (prisma.user as any).findMany.mockResolvedValue([{ id: "u1" }]);
            const res = await GET();
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data).toHaveLength(1);
        });

        it("should return 500 on DB failure", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.user as any).findMany.mockRejectedValue(new Error("fail"));
            const res = await GET();
            expect(res.status).toBe(500);
        });
    });

    // ── POST ──
    describe("POST - create user (SUPER_ADMIN only)", () => {
        it("should return 401 for non-SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            const res = await POST(mkReq({ email: "a@b.c", name: "A", password: "12345678" }));
            expect(res.status).toBe(401);
        });

        it("should return 400 if fields are missing", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            const res = await POST(mkReq({ email: "a@b.c" }));
            expect(res.status).toBe(400);
        });

        it("should return 400 if user already exists", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "x" });
            const res = await POST(mkReq({ email: "a@b.c", name: "A", password: "12345678" }));
            expect(res.status).toBe(400);
        });

        it("should create user successfully", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
            (prisma.user as any).create.mockResolvedValue({ id: "new", name: "A", email: "a@b.c", role: "VIEWER" });
            const res = await POST(mkReq({ email: "a@b.c", name: "A", password: "12345678" }));
            const data = await res.json();
            expect(res.status).toBe(201);
            expect(data.id).toBe("new");
        });

        it("should return 500 on server error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("boom"));
            const res = await POST(mkReq({ email: "a@b.c", name: "A", password: "12345678" }));
            expect(res.status).toBe(500);
        });
    });
});
