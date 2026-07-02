import { describe, it, expect, vi, beforeEach } from "vitest";
import { CampaignService } from "../campaign.service";
import { prisma } from "@/lib/prisma";

import { AuthorizationService } from "../auth.service";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        campaign: {
            findMany: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock("../auth.service", () => ({
    AuthorizationService: {
        canAccessCampaign: vi.fn().mockResolvedValue(true),
    },
}));

describe("CampaignService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getUserCampaigns", () => {
        it("should return campaigns for a user", async () => {
            const mockCampaigns = [{ id: "1", name: "Test" }];
            (prisma.campaign.findMany as any).mockResolvedValue(mockCampaigns);

            const result = await CampaignService.getUserCampaigns("user123");

            expect(prisma.campaign.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: "user123" }
            }));
            expect(result).toEqual(mockCampaigns);
        });
    });

    describe("createCampaign", () => {
        it("should create a new campaign", async () => {
            const mockCampaign = { id: "1", name: "New Campaign", userId: "user123" };
            (prisma.campaign.create as any).mockResolvedValue(mockCampaign);

            const result = await CampaignService.createCampaign("user123", { name: "New Campaign" });

            expect(prisma.campaign.create).toHaveBeenCalled();
            expect(result).toEqual(mockCampaign);
        });

        it("should throw if name is missing", async () => {
            await expect(CampaignService.createCampaign("user123", { name: "" }))
                .rejects.toThrow("Name is required");
        });
    });

    describe("getCampaignById", () => {
        it("should return campaign if user owns it", async () => {
            const mockCampaign = { id: "1", name: "Test", userId: "user123" };
            (prisma.campaign.findUnique as any).mockResolvedValue(mockCampaign);

            const result = await CampaignService.getCampaignById("user123", "1");

            expect(result).toEqual(mockCampaign);
        });

        it("should return null if user does not own campaign", async () => {
            vi.mocked(AuthorizationService.canAccessCampaign).mockRejectedValueOnce(new Error("Unauthorized"));

            await expect(CampaignService.getCampaignById("user123", "1")).rejects.toThrow("Unauthorized");
        });
    });

    describe("deleteCampaign", () => {
        it("should delete campaign if user owns it", async () => {
            (prisma.campaign.delete as any).mockResolvedValue({ id: "1" });

            await CampaignService.deleteCampaign("user123", "1");

            expect(prisma.campaign.delete).toHaveBeenCalledWith({ where: { id: "1" } });
        });

        it("should throw if campaign not found or not owned", async () => {
            vi.mocked(AuthorizationService.canAccessCampaign).mockRejectedValueOnce(new Error("Campaign not found or unauthorized"));

            await expect(CampaignService.deleteCampaign("user123", "1"))
                .rejects.toThrow("Campaign not found or unauthorized");
        });
    });
});
