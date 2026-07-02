import { prisma } from "@/lib/prisma";
import { AuthorizationService } from "./auth.service";

export class AdService {
    static async getUserAds(userId: string) {
        const ads = await prisma.ad.findMany({
            include: {
                campaign: { select: { name: true, userId: true } },
                publications: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Filter to only show ads belonging to the user's campaigns
        return ads.filter(ad => ad.campaign.userId === userId);
    }

    static async createAd(userId: string, data: any) {
        let { campaignId, title, description, mediaType, mediaUrl, thumbnailUrl, hashtags, firstComment, linkUrl } = data;

        let targetCampaignId = campaignId;

        if (!targetCampaignId || targetCampaignId === "default") {
            let generalCampaign = await prisma.campaign.findFirst({
                where: { userId, name: "General" }
            });
            if (!generalCampaign) {
                generalCampaign = await prisma.campaign.create({
                    data: { name: "General", userId }
                });
            }
            targetCampaignId = generalCampaign.id;
        } else {
            // Verify ownership of campaign
            await AuthorizationService.canAccessCampaign(userId, targetCampaignId);
        }

        // Update campaign with the new hashtags and firstComment if provided
        if (hashtags !== undefined || firstComment !== undefined) {
            await prisma.campaign.update({
                where: { id: targetCampaignId },
                data: {
                    hashtags: hashtags !== undefined ? hashtags : undefined,
                    firstComment: firstComment !== undefined ? firstComment : undefined,
                }
            });
        }

        return prisma.ad.create({
            data: {
                campaignId: targetCampaignId,
                title: title || "Sin título",
                description: description || "",
                mediaType: mediaType || "image",
                mediaUrl: mediaUrl || null,
                thumbnailUrl: thumbnailUrl || null,
                linkUrl: linkUrl || null,
            },
        });
    }

    static async getAdById(userId: string, adId: string) {
        await AuthorizationService.canAccessAd(userId, adId);

        return prisma.ad.findUnique({
            where: { id: adId },
            include: {
                campaign: { select: { id: true, name: true, userId: true, hashtags: true, firstComment: true } },
                publications: {
                    where: { type: "paid" },
                    orderBy: { publishedAt: "desc" },
                    take: 1,
                    include: { adBudget: true }
                }
            },
        });
    }

    static async updateAd(userId: string, adId: string, updates: any) {
        await AuthorizationService.canAccessAd(userId, adId);

        const ad = await prisma.ad.findUnique({
            where: { id: adId },
            include: { campaign: true }
        });

        if (!ad) throw new Error("Ad not found");

        const {
            title,
            description,
            mediaType,
            mediaUrl,
            thumbnailUrl,
            hashtags,
            firstComment,
            linkUrl
        } = updates;

        // Update the ad
        const updatedAd = await prisma.ad.update({
            where: { id: adId },
            data: {
                title,
                description: description ?? ad.description,
                mediaType: mediaType ?? ad.mediaType,
                mediaUrl: mediaUrl ?? ad.mediaUrl,
                thumbnailUrl: thumbnailUrl ?? ad.thumbnailUrl,
                linkUrl: linkUrl !== undefined ? linkUrl : ad.linkUrl,
            },
        });

        // Update campaign metadata if provided
        if (hashtags !== undefined || firstComment !== undefined) {
            await prisma.campaign.update({
                where: { id: ad.campaignId },
                data: {
                    hashtags: hashtags !== undefined ? hashtags : ad.campaign.hashtags,
                    firstComment: firstComment !== undefined ? firstComment : ad.campaign.firstComment,
                }
            });
        }

        return updatedAd;
    }

    static async deleteAd(userId: string, adId: string) {
        await AuthorizationService.canAccessAd(userId, adId);

        return prisma.ad.delete({
            where: { id: adId }
        });
    }
}
