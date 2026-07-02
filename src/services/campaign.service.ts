import { prisma } from "@/lib/prisma";
import { AuthorizationService } from "./auth.service";

export class CampaignService {
    static async getUserCampaigns(userId: string) {
        return prisma.campaign.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { ads: true } },
                ads: { select: { id: true, title: true } }
            }
        });
    }

    static async createCampaign(userId: string, data: { name: string; hashtags?: string; firstComment?: string }) {
        if (!data.name) {
            throw new Error("Name is required");
        }

        return prisma.campaign.create({
            data: {
                ...data,
                userId,
            },
        });
    }

    static async getCampaignById(userId: string, campaignId: string) {
        await AuthorizationService.canAccessCampaign(userId, campaignId);

        return prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                ads: {
                    include: {
                        publications: {
                            include: { adBudget: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });
    }

    static async deleteCampaign(userId: string, campaignId: string) {
        await AuthorizationService.canAccessCampaign(userId, campaignId);

        return prisma.campaign.delete({ where: { id: campaignId } });
    }
}
