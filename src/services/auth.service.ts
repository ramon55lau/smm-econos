import { prisma } from "@/lib/prisma";

export class AuthorizationService {
    /**
     * Verifies if a user owns a specific entity.
     */
    static async checkOwnership(userId: string, table: 'campaign' | 'ad' | 'property', entityId: string) {
        let entity: any;

        if (table === 'campaign') {
            entity = await prisma.campaign.findUnique({
                where: { id: entityId },
                select: { userId: true }
            });
        } else if (table === 'ad') {
            entity = await prisma.ad.findUnique({
                where: { id: entityId },
                include: { campaign: { select: { userId: true } } }
            });
            // Flatten userId for ad
            entity = entity ? { userId: entity.campaign.userId } : null;
        } else if (table === 'property') {
            entity = await prisma.property.findUnique({
                where: { id: entityId },
                include: { catalog: { select: { userId: true } } }
            });
            // Flatten userId for property
            entity = entity ? { userId: entity.catalog.userId } : null;
        }

        if (!entity || entity.userId !== userId) {
            throw new Error(`Unauthorized access to ${table}`);
        }

        return true;
    }

    /**
     * Shorthand for campaign ownership
     */
    static async canAccessCampaign(userId: string, campaignId: string) {
        return this.checkOwnership(userId, 'campaign', campaignId);
    }

    /**
     * Shorthand for ad ownership
     */
    static async canAccessAd(userId: string, adId: string) {
        return this.checkOwnership(userId, 'ad', adId);
    }
}
