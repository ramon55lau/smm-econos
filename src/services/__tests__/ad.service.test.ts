/**
 * Unit Tests for AdService (Jest version)
 */
jest.mock("@/lib/prisma", () => ({
    prisma: {
        ad: {
            findMany: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        campaign: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock("../auth.service", () => ({
    AuthorizationService: {
        canAccessCampaign: jest.fn().mockResolvedValue(true),
        canAccessAd: jest.fn().mockResolvedValue(true),
    },
}));

import { AdService } from "../ad.service";
import { prisma } from "@/lib/prisma";
import { AuthorizationService } from "../auth.service";

describe("AdService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserAds", () => {
        it("should return filtered ads for user", async () => {
            const mockAds = [
                { id: "1", campaign: { userId: "user123" } },
                { id: "2", campaign: { userId: "other" } },
            ];
            (prisma.ad.findMany as any).mockResolvedValue(mockAds);

            const result = await AdService.getUserAds("user123");

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("1");
        });
    });

    describe("createAd", () => {
        it("should create ad in existing campaign", async () => {
            const mockAd = { id: "ad1", title: "Test Ad" };
            (prisma.ad.create as any).mockResolvedValue(mockAd);

            const result = await AdService.createAd("user123", {
                campaignId: "camp1",
                title: "Test Ad"
            });

            expect(AuthorizationService.canAccessCampaign).toHaveBeenCalledWith("user123", "camp1");
            expect(prisma.ad.create).toHaveBeenCalled();
            expect(result).toEqual(mockAd);
        });

        it("should create General campaign if default is requested and missing", async () => {
            (prisma.campaign.findFirst as any).mockResolvedValue(null);
            (prisma.campaign.create as any).mockResolvedValue({ id: "gen1", name: "General" });
            (prisma.ad.create as any).mockResolvedValue({ id: "ad1" });

            await AdService.createAd("user123", { campaignId: "default", title: "Test" });

            expect(prisma.campaign.create).toHaveBeenCalledWith(expect.objectContaining({
                data: { name: "General", userId: "user123" }
            }));
        });
    });

    describe("updateAd", () => {
        it("should update ad if authorized", async () => {
            const mockAd = { id: "ad1", campaignId: "c1" };
            (prisma.ad.findUnique as any).mockResolvedValue(mockAd);
            (prisma.ad.update as any).mockResolvedValue({ ...mockAd, title: "Updated" });

            const result = await AdService.updateAd("user123", "ad1", { title: "Updated" });

            expect(AuthorizationService.canAccessAd).toHaveBeenCalledWith("user123", "ad1");
            expect(prisma.ad.update).toHaveBeenCalled();
            expect(result.title).toBe("Updated");
        });
    });
});
