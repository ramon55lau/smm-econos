/**
 * Unit Tests for /api/social/data-deletion (POST)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { socialAccount: { deleteMany: jest.fn() } },
}));
jest.mock("@/lib/social/facebook", () => ({
    verifyAndDecodeSignedRequest: jest.fn(),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { verifyAndDecodeSignedRequest } from "@/lib/social/facebook";
import { NextRequest } from "next/server";

const mkReq = (formEntries: Record<string, string>): NextRequest => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(formEntries)) fd.append(k, v);
    return { formData: jest.fn().mockResolvedValue(fd) } as unknown as NextRequest;
};

describe("POST /api/social/data-deletion", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 400 if signed_request is missing", async () => {
        const res = await POST(mkReq({}));
        expect(res.status).toBe(400);
    });

    it("returns 400 if user_id missing in payload", async () => {
        (verifyAndDecodeSignedRequest as jest.Mock).mockReturnValue({});
        const res = await POST(mkReq({ signed_request: "abc" }));
        expect(res.status).toBe(400);
    });

    it("deletes account and returns confirmation", async () => {
        (verifyAndDecodeSignedRequest as jest.Mock).mockReturnValue({ user_id: "fb123" });
        (prisma.socialAccount.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
        const res = await POST(mkReq({ signed_request: "valid" }));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.confirmation_code).toBeDefined();
        expect(data.url).toContain("data-deletion/status");
    });

    it("returns 500 on error", async () => {
        (verifyAndDecodeSignedRequest as jest.Mock).mockImplementation(() => { throw new Error("Bad sig"); });
        const res = await POST(mkReq({ signed_request: "bad" }));
        expect(res.status).toBe(500);
    });
});
