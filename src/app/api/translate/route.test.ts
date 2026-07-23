/**
 * Unit Tests for /api/translate (POST)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

// Mock global fetch for Google Translate API
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { POST } from "./route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const mkReq = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);

describe("POST /api/translate", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await POST(mkReq({}))).status).toBe(401);
    });

    it("returns 400 if no target language", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        const res = await POST(mkReq({ title: "Hola" }));
        expect(res.status).toBe(400);
    });

    it("translates fields successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([[["Hello", "Hola"]]]),
        });
        const res = await POST(mkReq({ title: "Hola", description: "Mundo", firstComment: "", hashtags: "", targetLanguage: "en" }));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.title).toBeDefined();
    });
});
