/**
 * Unit Tests for /api/upload
 */
jest.mock("@/lib/upload-limiter", () => ({
    checkAndRecordUpload: jest.fn(),
}));
jest.mock("@/lib/magic-bytes", () => ({
    detectFileTypeFromBuffer: jest.fn(),
}));
jest.mock("fs/promises", () => ({
    writeFile: jest.fn(),
    mkdir: jest.fn(),
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { POST } from "./route";
import { getServerSession } from "next-auth";
import { checkAndRecordUpload } from "@/lib/upload-limiter";
import { detectFileTypeFromBuffer } from "@/lib/magic-bytes";
import { NextRequest } from "next/server";

const mkReq = (fileData?: { name: string; size: number; content: string }): NextRequest => {
    const fd = new FormData();
    if (fileData) {
        const file = new Blob([fileData.content], { type: "text/plain" });
        (file as any).name = fileData.name;
        // Mock File constructor compatibility
        fd.append("file", file, fileData.name);
    }
    return {
        formData: jest.fn().mockResolvedValue(fd),
        headers: new Headers({ host: "localhost:3000" }),
    } as unknown as NextRequest;
};

describe("POST /api/upload", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if unauthenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await POST(mkReq())).status).toBe(401);
    });

    it("returns 429 if rate limit exceeded", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "u1@e.com" } });
        (checkAndRecordUpload as jest.Mock).mockReturnValue({ allowed: false, resetTimeMs: Date.now() + 60000 });
        const res = await POST(mkReq());
        expect(res.status).toBe(429);
    });

    it("returns 400 if no file provided", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "u1@e.com" } });
        (checkAndRecordUpload as jest.Mock).mockReturnValue({ allowed: true });
        const res = await POST(mkReq());
        expect(res.status).toBe(400);
    });

    it("returns 400 if file exceeds allowed size", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "u1@e.com" } });
        (checkAndRecordUpload as jest.Mock).mockReturnValue({ allowed: true });
        const request = mkReq({ name: "large.mp4", size: 60 * 1024 * 1024, content: "a" });
        // Override size
        const fd = await request.formData();
        const fileObj = fd.get("file") as any;
        Object.defineProperty(fileObj, "size", { value: 60 * 1024 * 1024 });

        const res = await POST(request);
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "El archivo supera el límite de 50MB" });
    });

    it("returns 400 if file signature/magic-bytes are invalid", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "u1@e.com" } });
        (checkAndRecordUpload as jest.Mock).mockReturnValue({ allowed: true });
        (detectFileTypeFromBuffer as jest.Mock).mockReturnValue(null);

        const request = mkReq({ name: "fake.png", size: 100, content: "invalid sig bytes" });
        const res = await POST(request);
        expect(res.status).toBe(400);
    });

    it("returns 400 if file type not whitelist", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "u1@e.com" } });
        (checkAndRecordUpload as jest.Mock).mockReturnValue({ allowed: true });
        (detectFileTypeFromBuffer as jest.Mock).mockReturnValue({ ext: "exe", mime: "application/x-msdownload" });

        const request = mkReq({ name: "virus.exe", size: 100, content: "exe content" });
        const res = await POST(request);
        expect(res.status).toBe(400);
    });

    it("saves file to disk and returns media URL", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "u1@e.com" } });
        (checkAndRecordUpload as jest.Mock).mockReturnValue({ allowed: true });
        (detectFileTypeFromBuffer as jest.Mock).mockReturnValue({ ext: "jpg", mime: "image/jpeg" });

        const request = mkReq({ name: "photo.jpg", size: 100, content: "jpg content" });
        const res = await POST(request);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.url).toContain("/api/media/");
    });
});
