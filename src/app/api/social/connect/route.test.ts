/**
 * Unit Tests for /api/social/connect (GET)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/social/facebook", () => ({ getFacebookOAuthUrl: jest.fn() }));
jest.mock("@/lib/social/youtube", () => ({ getYouTubeOAuthUrl: jest.fn() }));

import { GET } from "./route";
import { getServerSession } from "next-auth";
import { getFacebookOAuthUrl } from "@/lib/social/facebook";
import { getYouTubeOAuthUrl } from "@/lib/social/youtube";
import { NextRequest } from "next/server";

const mkReq = (provider: string, popup?: boolean): NextRequest => {
    const url = new URL(`http://localhost:3000/api/social/connect?provider=${provider}${popup ? "&popup=true" : ""}`);
    return { nextUrl: url, headers: new Headers() } as unknown as NextRequest;
};

describe("GET /api/social/connect", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await GET(mkReq("facebook"))).status).toBe(401);
    });

    it("returns 400 for invalid provider", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        expect((await GET(mkReq("tiktok"))).status).toBe(400);
    });

    it("returns Facebook OAuth URL", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (getFacebookOAuthUrl as jest.Mock).mockReturnValue("https://facebook.com/oauth");
        const res = await GET(mkReq("facebook"));
        expect(res.status).toBe(200);
        expect((await res.json()).url).toBe("https://facebook.com/oauth");
    });

    it("returns YouTube OAuth URL", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (getYouTubeOAuthUrl as jest.Mock).mockReturnValue("https://accounts.google.com/oauth");
        const res = await GET(mkReq("youtube"));
        expect(res.status).toBe(200);
        expect((await res.json()).url).toBe("https://accounts.google.com/oauth");
    });
});
