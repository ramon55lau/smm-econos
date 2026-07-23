/**
 * Unit Tests for /api/permissions (GET)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { permission: { findMany: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

describe("GET /api/permissions", () => {
    afterEach(() => jest.clearAllMocks());

    it("should return 401 for non-admin", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "VIEWER" } });
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("should return permissions for ADMIN role", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
        (prisma.permission.findMany as jest.Mock).mockResolvedValue([
            { id: "p1", name: "manage_users" },
            { id: "p2", name: "view_reports" },
        ]);
        const res = await GET();
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data).toHaveLength(2);
    });

    it("should return 500 on DB failure", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
        (prisma.permission.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
        const res = await GET();
        expect(res.status).toBe(500);
    });
});
