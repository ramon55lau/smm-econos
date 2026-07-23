/**
 * Unit Tests for /api/ads (GET + POST)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/services/ad.service", () => ({
    AdService: { getUserAds: jest.fn(), createAd: jest.fn() },
}));

import { GET, POST } from "./route";
import { getServerSession } from "next-auth";
import { AdService } from "@/services/ad.service";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);

describe("/api/ads", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401 if unauthenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET()).status).toBe(401);
        });
        it("returns ads list", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.getUserAds as jest.Mock).mockResolvedValue([{ id: "a1" }]);
            const res = await GET();
            expect(res.status).toBe(200);
        });
        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.getUserAds as jest.Mock).mockRejectedValue(new Error("fail"));
            expect((await GET()).status).toBe(500);
        });
    });

    describe("POST", () => {
        it("returns 401 if unauthenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await POST(mkReq({}))).status).toBe(401);
        });
        it("creates ad (201)", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.createAd as jest.Mock).mockResolvedValue({ id: "a1" });
            expect((await POST(mkReq({ title: "Ad" }))).status).toBe(201);
        });
        it("returns 404 for campaign-not-found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.createAd as jest.Mock).mockRejectedValue(new Error("Campaign not found or unauthorized"));
            expect((await POST(mkReq({}))).status).toBe(404);
        });
    });
});
