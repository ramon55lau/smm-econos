/**
 * Unit Tests for /api/social/accounts
 * Tests: GET (list accounts) and DELETE (disconnect account)
 */
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────
// Mock Prisma client before importing the route
jest.mock("@/lib/prisma", () => ({
    prisma: {
        socialAccount: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}));

// Mock NextAuth session
jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
    authOptions: {},
}));

// ── Imports (after mocks) ──────────────────────────────────────────
import { GET, DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ── Helpers ────────────────────────────────────────────────────────
const mockSession = (userId: string) => {
    (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: userId, email: "test@example.com", role: "VIEWER" },
    });
};

const mockNoSession = () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
};

const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
};

// ── Test Suites ────────────────────────────────────────────────────
describe("/api/social/accounts", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ── GET ──────────────────────────────────────────────────────────
    describe("GET - List connected social accounts", () => {
        it("should return 401 if user is not authenticated", async () => {
            mockNoSession();

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
            expect(prisma.socialAccount.findMany).not.toHaveBeenCalled();
        });

        it("should return the user's connected accounts", async () => {
            mockSession("user-123");

            const mockAccounts = [
                {
                    id: "acc-1",
                    provider: "youtube",
                    providerAccountId: "yt-001",
                    accountName: "Mi Canal",
                    pageId: "ch-001",
                    pageName: "Canal de YouTube",
                    adAccountId: null,
                    expiresAt: null,
                },
                {
                    id: "acc-2",
                    provider: "facebook",
                    providerAccountId: "fb-001",
                    accountName: "Mi Página",
                    pageId: "pg-001",
                    pageName: "Fanpage Inmobiliaria",
                    adAccountId: "act_123",
                    expiresAt: new Date("2025-12-31"),
                },
            ];
            (prisma.socialAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data[0].provider).toBe("youtube");
            expect(data[1].provider).toBe("facebook");
            expect(prisma.socialAccount.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: "user-123" },
                })
            );
        });

        it("should return 500 if database query fails", async () => {
            mockSession("user-123");
            (prisma.socialAccount.findMany as jest.Mock).mockRejectedValue(
                new Error("DB connection lost")
            );

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to fetch accounts");
        });
    });

    // ── DELETE ───────────────────────────────────────────────────────
    describe("DELETE - Disconnect a social account", () => {
        it("should return 401 if user is not authenticated", async () => {
            mockNoSession();
            const req = createMockRequest({ accountId: "acc-1" });

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("should bulk disconnect accounts by providerAccountId and provider", async () => {
            mockSession("user-123");
            const req = createMockRequest({
                providerAccountId: "fb-001",
                provider: "facebook",
            });
            (prisma.socialAccount.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("All accounts for this titular disconnected");
            expect(prisma.socialAccount.deleteMany).toHaveBeenCalledWith({
                where: {
                    userId: "user-123",
                    providerAccountId: "fb-001",
                    provider: "facebook",
                },
            });
        });

        it("should disconnect a single account by accountId", async () => {
            mockSession("user-123");
            const req = createMockRequest({ accountId: "acc-1" });

            (prisma.socialAccount.findUnique as jest.Mock).mockResolvedValue({
                id: "acc-1",
                userId: "user-123",
            });
            (prisma.socialAccount.delete as jest.Mock).mockResolvedValue({ id: "acc-1" });

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Account disconnected");
            expect(prisma.socialAccount.delete).toHaveBeenCalledWith({
                where: { id: "acc-1" },
            });
        });

        it("should return 404 if account does not belong to user", async () => {
            mockSession("user-123");
            const req = createMockRequest({ accountId: "acc-999" });

            (prisma.socialAccount.findUnique as jest.Mock).mockResolvedValue({
                id: "acc-999",
                userId: "other-user",
            });

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Account not found");
            expect(prisma.socialAccount.delete).not.toHaveBeenCalled();
        });

        it("should return 400 if neither accountId nor providerAccountId is provided", async () => {
            mockSession("user-123");
            const req = createMockRequest({});

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Missing parameters");
        });
    });
});
