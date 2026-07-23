/**
 * Unit Tests for /api/publish (POST)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        ad: { findUnique: jest.fn() },
        socialAccount: { findMany: jest.fn() },
        publication: { create: jest.fn(), update: jest.fn() },
        adBudget: { create: jest.fn() },
    },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

// Mock social media publishing functions
jest.mock("@/lib/social/facebook", () => ({
    publishToFacebook: jest.fn(),
    publishVideoToFacebook: jest.fn(),
    publishToFacebookFeed: jest.fn(),
    publishMultiPhotoToFacebook: jest.fn(),
    createFacebookAdCampaign: jest.fn(),
    createFacebookAdSet: jest.fn(),
    uploadFacebookAdImage: jest.fn(),
    uploadFacebookAdVideo: jest.fn(),
    createFacebookAdCreative: jest.fn(),
    createFacebookAdCarouselCreative: jest.fn(),
    createFacebookAd: jest.fn(),
    getFacebookAdAccountDetails: jest.fn(),
}));

jest.mock("@/lib/social/instagram", () => ({
    publishToInstagram: jest.fn(),
    publishToInstagramReels: jest.fn(),
    publishToInstagramStories: jest.fn(),
    publishCarouselToInstagram: jest.fn(),
}));

// Mock global fetch for download proxy and sharp for image overlays
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("sharp", () => {
    const mSharpObj = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        composite: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from("processed-image")),
    };
    return jest.fn(() => mSharpObj);
});

jest.mock("fs/promises", () => ({
    writeFile: jest.fn(),
    mkdir: jest.fn(),
}));

import { POST } from "./route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { publishToFacebook } from "@/lib/social/facebook";

const mkReq = (body: Record<string, unknown>): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
        headers: new Headers({ host: "localhost:3000" }),
    } as unknown as NextRequest;
};

describe("POST /api/publish", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if unauthenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await POST(mkReq({ adId: "a1", destinations: [] }))).status).toBe(401);
    });

    it("returns 400 if adId or destinations missing", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        expect((await POST(mkReq({}))).status).toBe(400);
    });

    it("returns 404 if ad not found", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.ad.findUnique as jest.Mock).mockResolvedValue(null);
        expect((await POST(mkReq({ adId: "bad", destinations: ["fb"] }))).status).toBe(404);
    });

    it("publishes successfully to Facebook organic", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.ad.findUnique as jest.Mock).mockResolvedValue({
            id: "ad123",
            title: "Nice House",
            description: "Beautiful villa",
            mediaUrl: "http://example.com/image.jpg",
            campaign: { hashtags: "lux,villa" },
        });

        // Mock download proxy fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
            headers: new Headers({ "content-type": "image/jpeg" }),
        });

        (prisma.socialAccount.findMany as jest.Mock).mockResolvedValue([
            { id: "sa1", provider: "facebook", accessToken: "fb_tok", pageId: "p123" },
        ]);

        (prisma.publication.create as jest.Mock).mockResolvedValue({ id: "pub123" });
        (publishToFacebook as jest.Mock).mockResolvedValue({ success: true, postId: "fb_post_id" });

        const res = await POST(mkReq({ adId: "ad123", destinations: [{ platform: "facebook", destination: "fanpage" }] }));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.results).toHaveLength(1);
        expect(data.results[0].status).toBe("published");
    });
});
