/**
 * Unit Tests for /api/debug/auth-check (GET)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { socialAccount: { findMany: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

describe("GET /api/debug/auth-check", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns error if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const data = await (await GET()).json();
        expect(data.error).toBe("Unauthorized");
    });

    it("returns accounts info", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1", email: "r@e.com" } });
        (prisma.socialAccount.findMany as jest.Mock).mockResolvedValue([
            { id: "s1", provider: "facebook", accountName: "Test", pageName: "Page", adAccountId: "act_123", pageId: "p1" },
        ]);
        const res = await GET();
        const data = await res.json();
        expect(data.user).toBe("r@e.com");
        expect(data.accountsFound).toBe(1);
    });
});
