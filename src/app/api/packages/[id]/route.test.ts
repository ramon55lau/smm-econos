/**
 * Unit Tests for /api/packages/[id] (PUT + DELETE)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { package: { update: jest.fn(), delete: jest.fn() }, user: { updateMany: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { PUT, DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const mkReq = (body: Record<string, unknown>): Request =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as Request);
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/packages/[id]", () => {
    afterEach(() => jest.clearAllMocks());

    describe("PUT", () => {
        it("returns 401 for non-admin", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "VIEWER" } });
            expect((await PUT(mkReq({}), ctx("p1"))).status).toBe(401);
        });
        it("updates package", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            (prisma.package.update as jest.Mock).mockResolvedValue({ id: "p1" });
            const res = await PUT(mkReq({ name: "Pro", maxFacebook: "3", maxInstagram: "3", maxYouTube: "2" }), ctx("p1"));
            expect(res.status).toBe(200);
        });
        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            (prisma.package.update as jest.Mock).mockRejectedValue(new Error("Not found"));
            expect((await PUT(mkReq({ name: "X", maxFacebook: "1", maxInstagram: "1", maxYouTube: "1" }), ctx("p1"))).status).toBe(500);
        });
    });

    describe("DELETE", () => {
        it("returns 401 for non-SUPER_ADMIN", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
            expect((await DELETE(mkReq({}), ctx("p1"))).status).toBe(401);
        });
        it("deletes package and disassociates users", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.user.updateMany as jest.Mock).mockResolvedValue({});
            (prisma.package.delete as jest.Mock).mockResolvedValue({});
            const res = await DELETE(mkReq({}), ctx("p1"));
            expect(res.status).toBe(200);
            expect(prisma.user.updateMany).toHaveBeenCalled();
        });
        it("returns 500 on error", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
            (prisma.user.updateMany as jest.Mock).mockRejectedValue(new Error("DB"));
            expect((await DELETE(mkReq({}), ctx("p1"))).status).toBe(500);
        });
    });
});
