/**
 * Unit Tests for /api/auth/mfa/recovery
 */
import { POST, GET } from "./route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        passwordResetToken: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock("@/lib/email", () => ({
    __esModule: true,
    sendEmail: jest.fn(),
    emailTemplates: {
        mfaRecovery: (name: string, recoveryUrl: string) => ({
            subject: "Desactiva tu verificación 2FA",
            html: "<p>Desactivación 2FA</p>",
        }),
    },
}));

const createMockPostRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
        headers: {
            get: (name: string) => headers[name] || null,
        },
    } as unknown as NextRequest;
};

const createMockGetRequest = (url: string): NextRequest => {
    return {
        url,
    } as unknown as Request as NextRequest;
};

// Next/navigation mock or general NextResponse.redirect verification
const mockRedirect = jest.spyOn(Response, "redirect");

describe("MFA Recovery Endpoints", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ── POST ─────────────────────────────────────────────────────────
    describe("POST - Request secure 2FA recovery link", () => {
        it("should return 400 if email is missing", async () => {
            const req = createMockPostRequest({});
            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("El correo electrónico es requerido.");
        });

        it("should return 404 if user does not exist", async () => {
            const req = createMockPostRequest({ email: "notfound@example.com" });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("No se encontró ningún usuario con ese correo.");
        });

        it("should return 400 if MFA is not enabled on the user account", async () => {
            const req = createMockPostRequest({ email: "disabled@example.com" });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "user-abc",
                email: "disabled@example.com",
                mfaEnabled: false,
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("La Autenticación 2FA no está habilitada en esta cuenta.");
        });

        it("should create reset token and send recovery link by mail", async () => {
            const req = createMockPostRequest(
                { email: "user@example.com" },
                { host: "localhost:3000", "x-forwarded-proto": "http" }
            );
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "user-abc",
                email: "user@example.com",
                name: "Ramon",
                mfaEnabled: true,
            });
            (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Se ha enviado un enlace de desactivación a tu correo.");
            expect(prisma.passwordResetToken.create).toHaveBeenCalled();
            expect(sendEmail).toHaveBeenCalledWith("user@example.com", "Desactiva tu verificación 2FA", expect.any(String));
        });

        it("should return 500 on server error", async () => {
            const req = createMockPostRequest({ email: "user@example.com" });
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database disconnected"));

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Error interno del servidor");
        });
    });

    // ── GET ──────────────────────────────────────────────────────────
    describe("GET - Process recovery link to disable 2FA", () => {
        it("should redirect to login with missing_token error flag if token is missing", async () => {
            const req = createMockGetRequest("http://localhost:3000/api/auth/mfa/recovery");
            const response = await GET(req);

            expect(response.headers.get("location")).toBe("http://localhost:3000/login?disableMfa=error&msg=missing_token");
        });

        it("should redirect to login with invalid_or_expired flag if token is invalid", async () => {
            const req = createMockGetRequest("http://localhost:3000/api/auth/mfa/recovery?token=invalidtok");
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);
            const response = await GET(req);

            expect(response.headers.get("location")).toBe("http://localhost:3000/login?disableMfa=error&msg=invalid_or_expired");
        });

        it("should disable MFA and redirect with success if token is valid", async () => {
            const req = createMockGetRequest("http://localhost:3000/api/auth/mfa/recovery?token=validtok");
            const mockToken = {
                id: "tok-abc",
                used: false,
                expires: new Date(Date.now() + 60000),
                userId: "user-123",
            };
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken);
            (prisma.passwordResetToken.update as jest.Mock).mockResolvedValue({});
            (prisma.user.update as jest.Mock).mockResolvedValue({});

            const response = await GET(req);

            expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
                where: { id: "tok-abc" },
                data: { used: true },
            });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: "user-123" },
                data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: null },
            });
            expect(response.headers.get("location")).toBe("http://localhost:3000/login?disableMfa=success");
        });

        it("should redirect to login with internal_error on exception", async () => {
            const req = createMockGetRequest("http://localhost:3000/api/auth/mfa/recovery?token=validtok");
            (prisma.passwordResetToken.findUnique as jest.Mock).mockRejectedValue(new Error("Timeout"));

            const response = await GET(req);

            expect(response.headers.get("location")).toBe("http://localhost:3000/login?disableMfa=error&msg=internal_error");
        });
    });
});
