/**
 * Unit Tests for /api/campaigns/[id] (GET + DELETE)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/services/campaign.service", () => ({
    CampaignService: {
        getCampaignById: jest.fn(),
        deleteCampaign: jest.fn(),
    },
}));

import { GET, DELETE } from "./route";
import { getServerSession } from "next-auth";
import { CampaignService } from "@/services/campaign.service";
import { NextRequest } from "next/server";

const mkReq = (): NextRequest => ({} as unknown as NextRequest);
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/campaigns/[id]", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET(mkReq(), ctx("c1"))).status).toBe(401);
        });

        it("returns 404 if campaign not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.getCampaignById as jest.Mock).mockResolvedValue(null);
            expect((await GET(mkReq(), ctx("c1"))).status).toBe(404);
        });

        it("returns campaign", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.getCampaignById as jest.Mock).mockResolvedValue({ id: "c1" });
            const res = await GET(mkReq(), ctx("c1"));
            expect(res.status).toBe(200);
        });

        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.getCampaignById as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await GET(mkReq(), ctx("c1"))).status).toBe(500);
        });
    });

    describe("DELETE", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await DELETE(mkReq(), ctx("c1"))).status).toBe(401);
        });

        it("deletes campaign", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.deleteCampaign as jest.Mock).mockResolvedValue(undefined);
            const res = await DELETE(mkReq(), ctx("c1"));
            expect(res.status).toBe(200);
        });

        it("returns 404 if campaign not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (CampaignService.deleteCampaign as jest.Mock).mockRejectedValue(new Error("Campaign not found or unauthorized"));
            expect((await DELETE(mkReq(), ctx("c1"))).status).toBe(404);
        });
    });
});
