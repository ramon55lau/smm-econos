/**
 * Unit Tests for /api/auth/reset-password
 */
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        passwordResetToken: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
}));

const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
};

describe("POST /api/auth/reset-password", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return 400 if token or password is missing", async () => {
        const req = createMockRequest({ token: "tok-1" }); // missing password
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Datos faltantes");
    });

    it("should return 400 if token is invalid or expired", async () => {
        const req = createMockRequest({ token: "invalid-tok", password: "NewPassword123!" });
        (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Token inválido o expirado");
    });

    it("should update the password and mark the token as used", async () => {
        const req = createMockRequest({ token: "valid-tok", password: "NewPassword123!" });
        const mockResetToken = {
            id: "token-id-123",
            userId: "user-id-456",
            token: "valid-tok",
            used: false,
            expires: new Date(Date.now() + 60000),
            user: { id: "user-id-456" },
        };

        (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockResetToken);
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-password");

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe("Contraseña actualizada con éxito");
        expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 10);
        expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should return 500 if an error occurs during hashing or database transaction", async () => {
        const req = createMockRequest({ token: "valid-tok", password: "NewPassword123!" });
        (prisma.passwordResetToken.findFirst as jest.Mock).mockRejectedValue(new Error("Database offline"));

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal Server Error");
    });
});
