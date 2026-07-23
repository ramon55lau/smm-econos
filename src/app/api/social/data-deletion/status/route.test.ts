/**
 * Unit Tests for /api/social/data-deletion/status (GET)
 */
import { GET } from "./route";
import { NextRequest } from "next/server";

const mkReq = (id?: string): NextRequest => {
    const url = id
        ? `http://localhost:3000/api/social/data-deletion/status?id=${id}`
        : "http://localhost:3000/api/social/data-deletion/status";
    return { url } as unknown as NextRequest;
};

describe("GET /api/social/data-deletion/status", () => {
    it("returns 400 if id is missing", async () => {
        expect((await GET(mkReq())).status).toBe(400);
    });

    it("returns confirmation with valid id", async () => {
        const res = await GET(mkReq("del_123_abc"));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.status).toBe("completed");
        expect(data.confirmation_code).toBe("del_123_abc");
    });
});
