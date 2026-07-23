/**
 * Unit Tests for /api/real-estate/catalogs (GET + POST)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        propertyCatalog: { findMany: jest.fn(), create: jest.fn() },
        account: { findFirst: jest.fn() },
    },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

const mkReq = (body: Record<string, unknown>): Request =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as Request);

describe("/api/real-estate/catalogs", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET()).status).toBe(401);
        });
        it("returns catalogs", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findMany as jest.Mock).mockResolvedValue([{ id: "c1" }]);
            expect((await GET()).status).toBe(200);
        });
        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await GET()).status).toBe(500);
        });
    });

    describe("POST", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await POST(mkReq({}))).status).toBe(401);
        });
        it("returns 400 if name is empty", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            const res = await POST(mkReq({ name: "" }));
            expect(res.status).toBe(400);
        });
        it("creates catalog (201)", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.create as jest.Mock).mockResolvedValue({ id: "c1", name: "Test" });
            const res = await POST(mkReq({ name: "Test" }));
            expect(res.status).toBe(201);
        });
    });
});
