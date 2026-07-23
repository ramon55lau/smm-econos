/**
 * Unit Tests for /api/ads/[id] (GET + PUT + DELETE)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/services/ad.service", () => ({
    AdService: { getAdById: jest.fn(), updateAd: jest.fn(), deleteAd: jest.fn() },
}));

import { GET, PUT, DELETE } from "./route";
import { getServerSession } from "next-auth";
import { AdService } from "@/services/ad.service";
import { NextRequest } from "next/server";

const mkReq = (body?: Record<string, unknown>): NextRequest =>
    (body ? { json: jest.fn().mockResolvedValue(body) } : {}) as unknown as NextRequest;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/ads/[id]", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET(mkReq(), ctx("a1"))).status).toBe(401);
        });
        it("returns 404 if not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.getAdById as jest.Mock).mockResolvedValue(null);
            expect((await GET(mkReq(), ctx("a1"))).status).toBe(404);
        });
        it("returns ad", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.getAdById as jest.Mock).mockResolvedValue({ id: "a1" });
            expect((await GET(mkReq(), ctx("a1"))).status).toBe(200);
        });
        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.getAdById as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await GET(mkReq(), ctx("a1"))).status).toBe(500);
        });
    });

    describe("PUT", () => {
        it("returns 401", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await PUT(mkReq({ title: "X" }), ctx("a1"))).status).toBe(401);
        });
        it("updates ad", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.updateAd as jest.Mock).mockResolvedValue({ id: "a1" });
            expect((await PUT(mkReq({ title: "X" }), ctx("a1"))).status).toBe(200);
        });
        it("returns 404 for unauthorized ad", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.updateAd as jest.Mock).mockRejectedValue(new Error("Ad not found or unauthorized"));
            expect((await PUT(mkReq({ title: "X" }), ctx("a1"))).status).toBe(404);
        });
    });

    describe("DELETE", () => {
        it("returns 401", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await DELETE(mkReq(), ctx("a1"))).status).toBe(401);
        });
        it("deletes ad", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.deleteAd as jest.Mock).mockResolvedValue(undefined);
            expect((await DELETE(mkReq(), ctx("a1"))).status).toBe(200);
        });
        it("returns 404 for unauthorized", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (AdService.deleteAd as jest.Mock).mockRejectedValue(new Error("Ad not found or unauthorized"));
            expect((await DELETE(mkReq(), ctx("a1"))).status).toBe(404);
        });
    });
});
