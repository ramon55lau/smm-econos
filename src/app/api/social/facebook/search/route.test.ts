/**
 * Unit Tests for /api/social/facebook/search (GET)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from "./route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const mkReq = (params: Record<string, string>): NextRequest => {
    const sp = new URLSearchParams(params);
    return { url: `http://localhost:3000/api/social/facebook/search?${sp}` } as unknown as NextRequest;
};

describe("GET /api/social/facebook/search", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await GET(mkReq({}))).status).toBe(401);
    });

    it("returns 400 if params missing", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        expect((await GET(mkReq({ type: "adinterest" }))).status).toBe(400);
    });

    it("returns search results", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        mockFetch.mockResolvedValue({ json: () => Promise.resolve({ data: [{ id: "1", name: "Real Estate" }] }) });
        const res = await GET(mkReq({ type: "adinterest", q: "real estate", accessToken: "tok" }));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data).toHaveLength(1);
    });

    it("returns 400 on API error", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        mockFetch.mockResolvedValue({ json: () => Promise.resolve({ error: { message: "Invalid token" } }) });
        expect((await GET(mkReq({ type: "adinterest", q: "test", accessToken: "bad" }))).status).toBe(400);
    });
});
