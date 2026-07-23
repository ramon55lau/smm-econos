/**
 * Unit Tests for /api/media/[filename]
 */
jest.mock("fs/promises", () => ({
    stat: jest.fn(),
    readFile: jest.fn(),
}));

import { GET, HEAD, OPTIONS } from "./route";
import fs from "fs";
import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

const mkReq = (): NextRequest => ({ headers: new Headers() } as unknown as NextRequest);
const ctx = (filename: string) => ({ params: Promise.resolve({ filename }) });

describe("/api/media/[filename]", () => {
    afterEach(() => jest.restoreAllMocks());

    describe("OPTIONS", () => {
        it("returns CORS headers with 204", async () => {
            const res = await OPTIONS();
            expect(res.status).toBe(204);
            expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
        });
    });

    describe("HEAD", () => {
        it("returns 404 if file does not exist", async () => {
            const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
            const res = await HEAD(mkReq(), ctx("test.jpg"));
            expect(res.status).toBe(404);
            expect(existsSpy).toHaveBeenCalled();
        });

        it("returns 200 with headers if exists", async () => {
            const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
            (stat as jest.Mock).mockResolvedValue({ size: 1024 });

            const res = await HEAD(mkReq(), ctx("test.jpg"));
            expect(res.status).toBe(200);
            expect(res.headers.get("Content-Type")).toBe("image/jpeg");
            expect(res.headers.get("Content-Length")).toBe("1024");
        });

        it("blocks path traversal attempt", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const resolveSpy = jest.spyOn(path, "resolve").mockImplementation((p) => {
                if (p.includes("secrets.txt")) return "/absolute/outside/secrets.txt";
                return "/absolute/correct/smm-uploads";
            });
            const res = await HEAD(mkReq(), ctx("secrets.txt"));
            expect(res.status).toBe(500);
            resolveSpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    describe("GET", () => {
        it("returns 404 if file does not exist", async () => {
            const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
            const res = await GET(mkReq(), ctx("test.png"));
            expect(res.status).toBe(404);
        });

        it("serves custom file content", async () => {
            const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
            (readFile as jest.Mock).mockResolvedValue(Buffer.from("abc"));

            const res = await GET(mkReq(), ctx("test.png"));
            expect(res.status).toBe(200);
            expect(res.headers.get("Content-Type")).toBe("image/png");
            expect(await res.text()).toBe("abc");
        });
    });
});
