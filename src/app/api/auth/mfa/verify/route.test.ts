/**
 * Unit Tests for /api/auth/mfa/verify
 */
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { verify } from "otplib";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
    authOptions: {},
}));

jest.mock("otplib", () => ({
    verify: jest.fn(),
}));

const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
};

describe("POST /api/auth/mfa/verify", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const req = createMockRequest({ code: "123456" });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("No autorizado");
    });

    it("should return 400 if code format is invalid", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        const req = createMockRequest({ code: "12345" }); // length 5 instead of 6

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Código inválido. Debe ser de 6 dígitos.");
    });

    it("should return 400 if user has no MFA setup initiated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        const req = createMockRequest({ code: "123456" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            mfaSecret: null,
            mfaEnabled: false,
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Primero debe iniciar la configuración MFA.");
    });

    it("should return 400 if MFA is already active", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        const req = createMockRequest({ code: "123456" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            mfaSecret: "ANYSECRET",
            mfaEnabled: true,
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("MFA ya está activado.");
    });

    it("should return 400 if verification code fails", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        const req = createMockRequest({ code: "123456" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            mfaSecret: "ANYSECRET",
            mfaEnabled: false,
        });
        (verify as jest.Mock).mockReturnValue({ valid: false });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Código incorrecto. Verifique su app de autenticación e intente de nuevo.");
    });

    it("should verify, generate backup codes, activate MFA, and return success", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        const req = createMockRequest({ code: "123456" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            mfaSecret: "ANYSECRET",
            mfaEnabled: false,
        });
        (verify as jest.Mock).mockReturnValue({ valid: true });
        (prisma.user.update as jest.Mock).mockResolvedValue({});

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe("MFA activado exitosamente.");
        expect(data.backupCodes).toHaveLength(10);
        expect(prisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "user-1" },
                data: expect.objectContaining({
                    mfaEnabled: true,
                    mfaBackupCodes: expect.any(String),
                }),
            })
        );
    });

    it("should return 500 on unexpected errors", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        const req = createMockRequest({ code: "123456" });
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database disconnected"));

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Error verificando código MFA");
    });
});
