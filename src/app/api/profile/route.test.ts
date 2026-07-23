/**
 * Unit Tests for /api/profile (PUT — change password / disable 2FA)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: { user: { findUnique: jest.fn(), update: jest.fn() } },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("bcrypt", () => ({ compare: jest.fn(), hash: jest.fn() }));

import { PUT } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";

const mkReq = (body: Record<string, unknown>): Request =>
    ({ json: jest.fn().mockResolvedValue(body) } as unknown as Request);

describe("PUT /api/profile", () => {
    afterEach(() => jest.clearAllMocks());

    it("should return 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await PUT(mkReq({}));
        expect(res.status).toBe(401);
    });

    it("should return 404 if user not found", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue(null);
        const res = await PUT(mkReq({ newPassword: "12345678" }));
        expect(res.status).toBe(404);
    });

    it("should return 400 if currentPassword not provided for password change", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
        const res = await PUT(mkReq({ newPassword: "newpass12" }));
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe("Debe proporcionar la contraseña actual");
    });

    it("should return 400 if current password is wrong", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        const res = await PUT(mkReq({ currentPassword: "wrong", newPassword: "newpass12" }));
        expect(res.status).toBe(400);
    });

    it("should return 400 if new password too short", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const res = await PUT(mkReq({ currentPassword: "correct", newPassword: "short" }));
        expect(res.status).toBe(400);
    });

    it("should change password successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue("newhash");
        (prisma.user as any).update.mockResolvedValue({});
        const res = await PUT(mkReq({ currentPassword: "correct", newPassword: "newpass12" }));
        expect(res.status).toBe(200);
        expect((await res.json()).message).toBe("Contraseña actualizada correctamente");
    });

    it("should disable 2FA successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "u1", password: "hashed", mfaEnabled: true });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prisma.user as any).update.mockResolvedValue({});
        const res = await PUT(mkReq({ disableMfa: true, currentPassword: "correct" }));
        expect(res.status).toBe(200);
        expect((await res.json()).message).toBe("Autenticación 2FA desactivada correctamente");
    });

    it("should return 400 if no action specified", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
        const res = await PUT(mkReq({}));
        expect(res.status).toBe(400);
    });

    it("should return 500 on server error", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        (prisma.user as any).findUnique.mockRejectedValue(new Error("DB"));
        const res = await PUT(mkReq({ newPassword: "12345678" }));
        expect(res.status).toBe(500);
    });
});
