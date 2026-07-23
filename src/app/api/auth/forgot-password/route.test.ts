/**
 * Unit Tests for /api/auth/forgot-password
 */
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        passwordResetToken: {
            create: jest.fn(),
        },
    },
}));

jest.mock("@/lib/email", () => ({
    __esModule: true,
    sendEmail: jest.fn(),
    emailTemplates: {
        passwordReset: (name: string, resetUrl: string) => ({
            subject: "Restablece tu contraseña",
            html: "<p>Restablecer contraseña</p>",
        }),
    },
}));

const createMockRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
        headers: {
            get: (name: string) => headers[name] || null,
        },
    } as unknown as NextRequest;
};

describe("POST /api/auth/forgot-password", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 if email is missing", async () => {
        const req = createMockRequest({});
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Email es requerido");
    });

    it("should return 404 if user is not found", async () => {
        const req = createMockRequest({ email: "notfound@example.com" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("No hay usuarios registrados con ese correo.");
    });

    it("should generate a token, save it, and send a reset email", async () => {
        const req = createMockRequest(
            { email: "user@example.com" },
            { host: "localhost:3000", "x-forwarded-proto": "http" }
        );

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            name: "Wilter",
        });

        (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
            id: "token-1",
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe("Si el correo está registrado, recibirás un enlace de recuperación.");
        expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: "user-1",
                    token: expect.any(String),
                    expires: expect.any(Date),
                }),
            })
        );
        expect(sendEmail).toHaveBeenCalledWith("user@example.com", "Restablece tu contraseña", expect.any(String));
    });

    it("should return 500 if database search fails", async () => {
        const req = createMockRequest({ email: "user@example.com" });
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Connection error"));

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal Server Error");
    });
});
