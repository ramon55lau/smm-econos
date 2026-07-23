/**
 * Unit Tests for /api/users/me
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { user: { findUnique: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const mockSession = (userId: string) =>
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId } });

describe("GET /api/users/me", () => {
    afterEach(() => jest.clearAllMocks());

    it("should return 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("should return user profile with package", async () => {
        mockSession("u1");
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "u1", name: "Ramon", email: "r@e.com", role: "VIEWER",
            package: { name: "Starter" },
        });
        const res = await GET();
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.name).toBe("Ramon");
        expect(data.package.name).toBe("Starter");
    });

    it("should return 404 if user not found in DB", async () => {
        mockSession("u1");
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(404);
    });

    it("should return 500 on DB error", async () => {
        mockSession("u1");
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB"));
        const res = await GET();
        expect(res.status).toBe(500);
    });
});
