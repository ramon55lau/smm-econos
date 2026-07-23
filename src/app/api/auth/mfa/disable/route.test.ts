/**
 * Unit Tests for /api/auth/mfa/disable
 */
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
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

describe("POST /api/auth/mfa/disable", () => {
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

    it("should deactivate MFA and clear the stored secret", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-abc" },
        });
        (prisma.user.update as jest.Mock).mockResolvedValue({});

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe("MFA desactivado exitosamente.");
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: "user-abc" },
            data: { mfaEnabled: false, mfaSecret: null },
        });
    });

    it("should return 500 on database failure", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-abc" },
        });
        (prisma.user.update as jest.Mock).mockRejectedValue(new Error("Database connection lost"));

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Error desactivando MFA");
    });
});
