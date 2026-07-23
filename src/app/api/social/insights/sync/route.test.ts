/**
 * Unit Tests for /api/social/insights/sync (GET)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        publication: { findUnique: jest.fn(), update: jest.fn() },
        socialAccount: { findFirst: jest.fn(), update: jest.fn() },
    },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/social/facebook", () => ({
    getFacebookPostInsights: jest.fn(),
    getFacebookAdInsights: jest.fn(),
}));
jest.mock("@/lib/social/youtube", () => ({
    getYouTubeVideoMetrics: jest.fn(),
    refreshYouTubeToken: jest.fn(),
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { getFacebookPostInsights, getFacebookAdInsights } from "@/lib/social/facebook";
import { getYouTubeVideoMetrics, refreshYouTubeToken } from "@/lib/social/youtube";
import { NextRequest } from "next/server";

const mkReq = (pubId?: string): NextRequest => {
    const url = pubId
        ? `http://localhost:3000/api/social/insights/sync?publicationId=${pubId}`
        : "http://localhost:3000/api/social/insights/sync";
    return { url } as unknown as NextRequest;
};

describe("GET /api/social/insights/sync", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if unauthenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await GET(mkReq("p1"))).status).toBe(401);
    });

    it("returns 400 if publicationId missing", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        expect((await GET(mkReq())).status).toBe(400);
    });

    it("returns 404 if publication not found", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.publication.findUnique as jest.Mock).mockResolvedValue(null);
        expect((await GET(mkReq("p1"))).status).toBe(404);
    });

    it("syncs Facebook Organic insights successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.publication.findUnique as jest.Mock).mockResolvedValue({
            id: "p1",
            platform: "facebook",
            destination: "fanpage",
            externalPostId: "fb_post_123",
        });
        (prisma.socialAccount.findFirst as jest.Mock).mockResolvedValue({
            id: "sa1",
            accessToken: "token_abc",
        });
        (getFacebookPostInsights as jest.Mock).mockResolvedValue({
            success: true,
            reach: 100,
            clicks: 5,
            impressions: 200,
            spend: 0,
        });
        (prisma.publication.update as jest.Mock).mockResolvedValue({ id: "p1" });

        const res = await GET(mkReq("p1"));
        expect(res.status).toBe(200);
        expect(getFacebookPostInsights).toHaveBeenCalledWith("fb_post_123", "token_abc");
    });

    it("syncs Facebook Ad insights successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.publication.findUnique as jest.Mock).mockResolvedValue({
            id: "p1",
            platform: "facebook",
            destination: "ads",
            externalPostId: "fb_ad_123",
        });
        (prisma.socialAccount.findFirst as jest.Mock).mockResolvedValue({
            id: "sa1",
            accessToken: "token_abc",
        });
        (getFacebookAdInsights as jest.Mock).mockResolvedValue({
            success: true,
            reach: 500,
            clicks: 25,
            impressions: 1000,
            spend: 50.0,
        });
        (prisma.publication.update as jest.Mock).mockResolvedValue({ id: "p1" });

        const res = await GET(mkReq("p1"));
        expect(res.status).toBe(200);
        expect(getFacebookAdInsights).toHaveBeenCalledWith("fb_ad_123", "token_abc");
    });

    it("syncs YouTube metrics successfully refreshing token if expired", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.publication.findUnique as jest.Mock).mockResolvedValue({
            id: "p1",
            platform: "youtube",
            destination: "organic",
            externalPostId: "yt_video_123",
        });
        (prisma.socialAccount.findFirst as jest.Mock).mockResolvedValue({
            id: "sa1",
            accessToken: "old_token",
            refreshToken: "refresh_123",
            expiresAt: new Date(Date.now() - 5000), // expired
        });
        (refreshYouTubeToken as jest.Mock).mockResolvedValue("new_token");
        (prisma.socialAccount.update as jest.Mock).mockResolvedValue({});
        (getYouTubeVideoMetrics as jest.Mock).mockResolvedValue({
            success: true,
            reach: 300,
            clicks: 12,
            impressions: 400,
            spend: 0,
        });
        (prisma.publication.update as jest.Mock).mockResolvedValue({ id: "p1" });

        const res = await GET(mkReq("p1"));
        expect(res.status).toBe(200);
        expect(refreshYouTubeToken).toHaveBeenCalledWith("refresh_123");
        expect(getYouTubeVideoMetrics).toHaveBeenCalledWith("yt_video_123", "new_token");
    });
});
