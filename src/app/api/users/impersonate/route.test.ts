/**
 * Unit Tests for /api/users/impersonate (POST)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { user: { findUnique: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);

describe("POST /api/users/impersonate", () => {
    afterEach(() => jest.clearAllMocks());

    it("should return 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await POST(mkReq({}));
        expect(res.status).toBe(401);
    });

    it("should return 403 for non-SUPER_ADMIN without impersonator", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
        const res = await POST(mkReq({ targetUserId: "u1" }));
        expect(res.status).toBe(403);
    });

    it("should handle restore action", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
        const res = await POST(mkReq({ action: "restore" }));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it("should return 400 if targetUserId is missing", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
        const res = await POST(mkReq({}));
        expect(res.status).toBe(400);
    });

    it("should return 404 if target user not found", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
        (prisma.user as any).findUnique.mockResolvedValue(null);
        const res = await POST(mkReq({ targetUserId: "u99" }));
        expect(res.status).toBe(404);
    });

    it("should return 400 if trying to impersonate another SUPER_ADMIN", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa1", role: "SUPER_ADMIN" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "sa2", role: "SUPER_ADMIN", name: "Other", email: "o@e.com" });
        const res = await POST(mkReq({ targetUserId: "sa2" }));
        expect(res.status).toBe(400);
    });

    it("should impersonate a VIEWER successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "sa1", role: "SUPER_ADMIN" } });
        (prisma.user as any).findUnique.mockResolvedValue({
            id: "u1", role: "VIEWER", name: "Ramon", email: "r@e.com",
            package: { name: "Starter" }, expiresAt: new Date("2026-12-31"),
            createdAt: new Date("2026-01-01"), mfaEnabled: false,
        });
        const res = await POST(mkReq({ targetUserId: "u1" }));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.targetUser.name).toBe("Ramon");
    });

    it("should return 500 on server error", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
        (prisma.user as any).findUnique.mockRejectedValue(new Error("DB"));
        const res = await POST(mkReq({ targetUserId: "u1" }));
        expect(res.status).toBe(500);
    });
});
