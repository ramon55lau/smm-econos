/**
 * Unit Tests for /api/real-estate/catalogs/[catalogId] (GET + DELETE)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        propertyCatalog: { findFirst: jest.fn(), delete: jest.fn() },
    },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

const ctx = (id: string) => ({ params: Promise.resolve({ catalogId: id }) });

describe("/api/real-estate/catalogs/[catalogId]", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET({} as any, ctx("c1"))).status).toBe(401);
        });
        it("returns 404 if not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findFirst as jest.Mock).mockResolvedValue(null);
            expect((await GET({} as any, ctx("c1"))).status).toBe(404);
        });
        it("returns catalog", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findFirst as jest.Mock).mockResolvedValue({ id: "c1", properties: [] });
            expect((await GET({} as any, ctx("c1"))).status).toBe(200);
        });
    });

    describe("DELETE", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await DELETE({} as any, ctx("c1"))).status).toBe(401);
        });
        it("returns 404 if not found", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findFirst as jest.Mock).mockResolvedValue(null);
            expect((await DELETE({} as any, ctx("c1"))).status).toBe(404);
        });
        it("deletes catalog", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });
            (prisma.propertyCatalog.delete as jest.Mock).mockResolvedValue({});
            const res = await DELETE({} as any, ctx("c1"));
            expect(res.status).toBe(200);
        });
    });
});
