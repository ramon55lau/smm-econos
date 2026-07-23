/**
 * Unit Tests for /api/webhooks/facebook (GET verify + POST events)
 */
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

const mkGet = (params: Record<string, string>): NextRequest => {
    const sp = new URLSearchParams(params);
    return { url: `http://localhost:3000/api/webhooks/facebook?${sp}` } as unknown as NextRequest;
};
const mkPost = (body: Record<string, unknown>): NextRequest =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest);

describe("/api/webhooks/facebook", () => {
    const OLD_ENV = process.env;
    beforeEach(() => { process.env = { ...OLD_ENV, FACEBOOK_VERIFY_TOKEN: "my_secret" }; });
    afterEach(() => { process.env = OLD_ENV; });

    describe("GET - webhook verification", () => {
        it("returns 400 if no mode/token", async () => {
            expect((await GET(mkGet({}))).status).toBe(400);
        });
        it("returns 403 if token mismatch", async () => {
            const res = await GET(mkGet({ "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "ch1" }));
            expect(res.status).toBe(403);
        });
        it("returns challenge on valid verify", async () => {
            const res = await GET(mkGet({ "hub.mode": "subscribe", "hub.verify_token": "my_secret", "hub.challenge": "ch123" }));
            expect(res.status).toBe(200);
            expect(await res.text()).toBe("ch123");
        });
    });

    describe("POST - webhook events", () => {
        it("accepts page event", async () => {
            const res = await POST(mkPost({ object: "page", entry: [] }));
            expect(res.status).toBe(200);
        });
    });
});
