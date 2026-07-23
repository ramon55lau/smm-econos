/**
 * Unit Tests for /api/packages (GET + POST)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { package: { findMany: jest.fn(), create: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const mkReq = (body: Record<string, unknown>): Request =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as Request);

describe("/api/packages", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET (public)", () => {
        it("returns packages list", async () => {
            (prisma.package.findMany as jest.Mock).mockResolvedValue([{ id: "p1", name: "Starter" }]);
            const res = await GET();
            expect(res.status).toBe(200);
        });
        it("returns 500 on error", async () => {
            (prisma.package.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await GET()).status).toBe(500);
        });
    });

    describe("POST (admin)", () => {
        it("returns 401 for non-admin", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "VIEWER" } });
            expect((await POST(mkReq({}))).status).toBe(401);
        });
        it("creates package", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            (prisma.package.create as jest.Mock).mockResolvedValue({ id: "p1" });
            const res = await POST(mkReq({ name: "Pro", maxFacebook: "3", maxInstagram: "3", maxYouTube: "2" }));
            expect(res.status).toBe(200);
        });
        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.package.create as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await POST(mkReq({ name: "X", maxFacebook: "1", maxInstagram: "1", maxYouTube: "1" }))).status).toBe(500);
        });
    });
});
