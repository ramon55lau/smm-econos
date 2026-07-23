/**
 * Unit Tests for /api/auth/mfa/status
 */
import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
    authOptions: {},
}));

describe("GET /api/auth/mfa/status", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return 401 if user is not logged in", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("No autorizado");
    });

    it("should return the MFA status of the logged-in user", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-abc" },
        });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            mfaEnabled: true,
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.mfaEnabled).toBe(true);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: "user-abc" },
            select: { mfaEnabled: true },
        });
    });

    it("should return 500 on database failure", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: "user-abc" },
        });
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Timeout"));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Error obteniendo estado MFA");
    });
});
