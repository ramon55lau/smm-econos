/**
 * Unit Tests for /api/real-estate/properties (GET + POST + PUT + DELETE)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        property: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
        propertyCatalog: { findFirst: jest.fn(), create: jest.fn() },
        account: { findFirst: jest.fn() },
    },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, POST, PUT, DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

const mkReq = (body: Record<string, unknown>, urlParams = ""): Request =>
({
    json: jest.fn().mockResolvedValue(body),
    url: `http://localhost:3000/api/real-estate/properties${urlParams}`,
} as unknown as Request);

describe("/api/real-estate/properties", () => {
    afterEach(() => jest.clearAllMocks());

    describe("GET", () => {
        it("returns 401 if not authenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await GET(mkReq({}))).status).toBe(401);
        });
        it("returns properties list", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.property.findMany as jest.Mock).mockResolvedValue([{ id: "p1" }]);
            const res = await GET(mkReq({}));
            expect(res.status).toBe(200);
        });
        it("returns single property by id", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.property.findFirst as jest.Mock).mockResolvedValue({ id: "p1" });
            const res = await GET(mkReq({}, "?id=p1"));
            expect(res.status).toBe(200);
        });
        it("returns 404 for unknown property", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.property.findFirst as jest.Mock).mockResolvedValue(null);
            expect((await GET(mkReq({}, "?id=bad"))).status).toBe(404);
        });
    });

    describe("POST", () => {
        it("returns 401", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await POST(mkReq({}))).status).toBe(401);
        });
        it("returns 400 if fields missing", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });
            const res = await POST(mkReq({ catalogId: "c1" }));
            expect(res.status).toBe(400);
        });
        it("creates property (201)", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.propertyCatalog.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });
            (prisma.property.create as jest.Mock).mockResolvedValue({ id: "p1" });
            const res = await POST(mkReq({ catalogId: "c1", name: "Apt", price: "250000", imageUrl: "http://img.jpg", city: "Madrid" }));
            expect(res.status).toBe(201);
        });
    });

    describe("PUT", () => {
        it("returns 401", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await PUT(mkReq({}))).status).toBe(401);
        });
        it("returns 400 if no id", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            expect((await PUT(mkReq({}))).status).toBe(400);
        });
        it("updates property", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.property.findFirst as jest.Mock).mockResolvedValue({ id: "p1" });
            (prisma.property.update as jest.Mock).mockResolvedValue({ id: "p1", name: "Updated" });
            const res = await PUT(mkReq({ id: "p1", name: "Updated" }));
            expect(res.status).toBe(200);
        });
    });

    describe("DELETE", () => {
        it("returns 401", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            expect((await DELETE(mkReq({}))).status).toBe(401);
        });
        it("returns 400 if no id", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            expect((await DELETE(mkReq({}))).status).toBe(400);
        });
        it("deletes property", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
            (prisma.property.findFirst as jest.Mock).mockResolvedValue({ id: "p1" });
            (prisma.property.delete as jest.Mock).mockResolvedValue({});
            expect((await DELETE(mkReq({}, "?id=p1"))).status).toBe(200);
        });
    });
});
