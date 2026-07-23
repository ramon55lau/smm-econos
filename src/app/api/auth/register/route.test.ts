/**
 * Unit Tests for /api/auth/register
 */
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendEmail } from "@/lib/email";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
}));

jest.mock("@/lib/email", () => ({
    __esModule: true,
    sendEmail: jest.fn(),
    ADMIN_EMAIL: "admin@example.com",
    emailTemplates: {
        registrationPending: (name: string) => ({
            subject: `Hola ${name}, registro en revisión`,
            html: "<p>Registro pendiente</p>",
        }),
        adminNewRegistration: (name: string, email: string) => ({
            subject: `Nueva cuenta: ${name}`,
            html: `<p>Aprobar ${email}</p>`,
        }),
    },
}));

const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
};

describe("POST /api/auth/register", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 if compulsory fields are missing", async () => {
        const req = createMockRequest({ email: "new@example.com", name: "Ramon" }); // missing password
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Faltan campos obligatorios");
    });

    it("should return 400 if the user already exists", async () => {
        const req = createMockRequest({ email: "existing@example.com", name: "Ramon", password: "Secure123Password" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-123", email: "existing@example.com" });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("El usuario ya existe");
    });

    it("should register a user successfully, send email notification to registration user and admin", async () => {
        const req = createMockRequest({ email: "newuser@example.com", name: "Ramon", password: "Secure123Password" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-token-password");
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-99933" });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.message).toBe("Usuario registrado con éxito. Tu cuenta está en revisión.");
        expect(prisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    email: "newuser@example.com",
                    name: "Ramon",
                    password: "hashed-token-password",
                    status: "PENDING",
                    role: "VIEWER",
                }),
            })
        );
        expect(sendEmail).toHaveBeenCalledWith("newuser@example.com", "Hola Ramon, registro en revisión", expect.any(String));
        expect(sendEmail).toHaveBeenCalledWith("admin@example.com", "Nueva cuenta: Ramon", expect.any(String));
    });

    it("should handle error in admin notification silently but succeed user generation", async () => {
        const req = createMockRequest({ email: "newuser2@example.com", name: "Ramon", password: "Secure123Password" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-pass");
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-99934" });
        (sendEmail as jest.Mock)
            .mockResolvedValueOnce(true) // user notification succeeds
            .mockRejectedValueOnce(new Error("Admin Email Server Down")); // admin notification throws

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.message).toBe("Usuario registrado con éxito. Tu cuenta está en revisión.");
    });

    it("should return 500 if server throws unexpected exception", async () => {
        const req = createMockRequest({ email: "newuser@example.com", name: "Ramon", password: "Secure123Password" });
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database disconnected"));

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Error en el servidor al registrar usuario");
    });
});
