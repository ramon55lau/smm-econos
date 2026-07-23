/**
 * Unit Tests for /api/auth/mfa/setup
 */
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

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
    generateSecret: jest.fn(),
    generateURI: jest.fn(),
}));

jest.mock("qrcode", () => ({
    toDataURL: jest.fn(),
}));

describe("POST /api/auth/mfa/setup", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("No autorizado");
    });

    it("should return 404 if user does not exist in database", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Usuario no encontrado");
    });

    it("should return 400 if MFA is already status enabled", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            email: "test@example.com",
            mfaEnabled: true,
        });

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("MFA ya está activado. Desactívelo primero para reconfigurar.");
    });

    it("should generate a TOTP secret, a QR Code data URL, and save it in state disabled", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            email: "test@example.com",
            mfaEnabled: false,
        });

        (generateSecret as jest.Mock).mockReturnValue("SECRET-12345");
        (generateURI as jest.Mock).mockReturnValue("otpauth://totp/Econos%20SMM:test@example.com?secret=SECRET-12345&issuer=Econos+SMM");
        (QRCode.toDataURL as jest.Mock).mockResolvedValue("data:image/png;base64,mockqrdata...");
        (prisma.user.update as jest.Mock).mockResolvedValue({});

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.secret).toBe("SECRET-12345");
        expect(data.qrCode).toBe("data:image/png;base64,mockqrdata...");
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: "user-1" },
            data: { mfaSecret: "SECRET-12345", mfaEnabled: false },
        });
    });

    it("should return 500 if an error occurs during OTP URI generation or update", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-1" },
        });
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Generic DB crash"));

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Error configurando MFA");
    });
});
