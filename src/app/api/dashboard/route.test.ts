/**
 * Unit Tests for /api/dashboard (GET)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        campaign: { count: jest.fn(), groupBy: jest.fn() },
        ad: { count: jest.fn(), findMany: jest.fn() },
        publication: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
        socialAccount: { findMany: jest.fn() },
        adBudget: { aggregate: jest.fn() },
    },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

describe("GET /api/dashboard", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await GET()).status).toBe(401);
    });

    it("returns dashboard data successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });

        // Mock all 15 parallel queries
        (prisma.campaign.count as jest.Mock).mockResolvedValue(5);
        (prisma.ad.count as jest.Mock).mockResolvedValue(10);
        (prisma.publication.count as jest.Mock).mockResolvedValue(20);
        (prisma.campaign.groupBy as jest.Mock).mockResolvedValue([{ status: "ACTIVE", _count: { status: 3 } }]);
        (prisma.publication.groupBy as jest.Mock).mockResolvedValue([{ status: "published", _count: { status: 15 } }]);
        (prisma.ad.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.socialAccount.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.publication.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.adBudget.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalBudget: 1000, dailyBudget: 50 } });
        (prisma.publication.aggregate as jest.Mock).mockResolvedValue({
            _sum: { clicks: 100, impressions: 5000, reach: 3000, spend: 250 },
        });

        const res = await GET();
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.counts).toBeDefined();
        expect(data.chartData).toBeDefined();
        expect(data.budget).toBeDefined();
    });

    it("returns 500 on error", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.campaign.count as jest.Mock).mockRejectedValue(new Error("DB"));
        expect((await GET()).status).toBe(500);
    });
});
