/**
 * Unit Tests for /api/campaigns (GET + POST)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/services/campaign.service", () => ({
    CampaignService: {
        getUserCampaigns: jest.fn(),
        createCampaign: jest.fn(),
    },
}));

import { GET, POST } from "./route";
import { getServerSession } from "next-auth";
import { CampaignService } from "@/services/campaign.service";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);

describe("/api/campaigns", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET()).status).toBe(401);
        });

        it("returns campaigns list", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.getUserCampaigns as jest.Mock).mockResolvedValue([{ id: "c1" }]);
            const res = await GET();
            expect(res.status).toBe(200);
            expect(await res.json()).toHaveLength(1);
        });

        it("returns 500 on service error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.getUserCampaigns as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await GET()).status).toBe(500);
        });
    });

    describe("POST", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await POST(mkReq({}))).status).toBe(401);
        });

        it("creates campaign successfully", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.createCampaign as jest.Mock).mockResolvedValue({ id: "c1", name: "Test" });
            const res = await POST(mkReq({ name: "Test" }));
            expect(res.status).toBe(200);
        });

        it("returns 400 for validation error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.createCampaign as jest.Mock).mockRejectedValue(new Error("Name is required"));
            const res = await POST(mkReq({}));
            expect(res.status).toBe(400);
        });
    });
});
