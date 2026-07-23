/**
 * Unit Tests for /api/social/callback/[provider] (GET)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        socialAccount: { upsert: jest.fn() },
        user: { findUnique: jest.fn() },
    },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/social/facebook", () => ({
    exchangeFacebookToken: jest.fn(),
    getFacebookPages: jest.fn(),
    getFacebookAdAccounts: jest.fn(),
}));
jest.mock("@/lib/social/youtube", () => ({
    exchangeYouTubeToken: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from "./route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { exchangeFacebookToken, getFacebookPages, getFacebookAdAccounts } from "@/lib/social/facebook";
import { exchangeYouTubeToken } from "@/lib/social/youtube";
import { NextRequest } from "next/server";

const mkReq = (provider: string, code?: string, state?: string): NextRequest => {
    const sp = new URLSearchParams();
    if (code) sp.append("code", code);
    if (state) sp.append("state", state);
    return {
        nextUrl: new URL(`http://localhost:3000/api/social/callback/${provider}?${sp}`),
        headers: new Headers(),
    } as unknown as NextRequest;
};

const ctx = (provider: string) => ({ params: Promise.resolve({ provider }) });

describe("GET /api/social/callback/[provider]", () => {
    afterEach(() => jest.clearAllMocks());

    it("redirects to login if unauthenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await GET(mkReq("facebook"), ctx("facebook"));
        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects to error if code is missing", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        const res = await GET(mkReq("facebook"), ctx("facebook"));
        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("error=missing_code");
    });

    it("returns error popup if code is missing and state is popup", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        const res = await GET(mkReq("facebook", undefined, "popup"), ctx("facebook"));
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("Error al conectar");
    });

    it("handles Facebook OAuth callback successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (exchangeFacebookToken as jest.Mock).mockResolvedValue({ accessToken: "fb_tok", expiresIn: 3600 });

        // Mock profile /me
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ id: "fb_user_123", name: "FB User" }),
        });

        (getFacebookAdAccounts as jest.Mock).mockResolvedValue([
            { id: "act_1", account_status: 1 },
        ]);
        (getFacebookPages as jest.Mock).mockResolvedValue([
            {
                id: "page_1",
                name: "Test Page",
                access_token: "page_tok",
                instagram_business_account: { id: "ig_1", username: "ig_user" },
            },
        ]);

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "u1",
            package: { maxFacebook: 5, maxInstagram: 5, maxYouTube: 5 },
            socialAccounts: [],
        });

        const res = await GET(mkReq("facebook", "code123"), ctx("facebook"));
        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("success=true");
        expect(prisma.socialAccount.upsert).toHaveBeenCalled();
    });

    it("handles YouTube OAuth callback successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (exchangeYouTubeToken as jest.Mock).mockResolvedValue({ accessToken: "yt_tok", refreshToken: "yt_ref", expiresIn: 3600 });

        // Mock userinfo fetch
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ id: "google_123", name: "Google Acc" }),
        });
        // Mock youtube channels fetch
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                items: [{ id: "yt_channel_1", snippet: { title: "My Channel" } }],
            }),
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "u1",
            package: { maxFacebook: 5, maxInstagram: 5, maxYouTube: 5 },
            socialAccounts: [],
        });

        const res = await GET(mkReq("youtube", "code123", "popup"), ctx("youtube"));
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("¡Conexión exitosa!");
        // Google Ads mirrors registration as well
        expect(prisma.socialAccount.upsert).toHaveBeenCalledTimes(2);
    });
});
