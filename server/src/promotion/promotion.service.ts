import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PromotionService {
    constructor(private prisma: PrismaService) { }

    // ─── ADMIN CRUD ───────────────────────────────────────────────────────────────

    async findAll() {
        return this.prisma.promoCampaign.findMany({
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            include: { _count: { select: { dismissals: true } } },
        });
    }

    async create(dto: any) {
        return this.prisma.promoCampaign.create({
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type || 'BANNER_TOP',
                benefits: dto.benefits || null,
                targetPlanKey: dto.targetPlanKey || null,
                discountPercent: dto.discountPercent || null,
                voucherCode: dto.voucherCode || null,
                ctaLabel: dto.ctaLabel || 'Nâng cấp ngay',
                ctaUrl: dto.ctaUrl || '/pricing',
                targetAudience: typeof dto.targetAudience === 'string' ? dto.targetAudience : JSON.stringify(dto.targetAudience || {}),
                triggerEvent: dto.triggerEvent || 'APP_OPEN',
                isActive: dto.isActive ?? true,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                priority: dto.priority || 0,
            },
        });
    }

    async update(id: string, dto: any) {
        const existing = await this.prisma.promoCampaign.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Chiến dịch không tồn tại.');

        const data: any = {};
        if (dto.title !== undefined) data.title = dto.title;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.type !== undefined) data.type = dto.type;
        if (dto.benefits !== undefined) data.benefits = dto.benefits;
        if (dto.targetPlanKey !== undefined) data.targetPlanKey = dto.targetPlanKey;
        if (dto.discountPercent !== undefined) data.discountPercent = dto.discountPercent;
        if (dto.voucherCode !== undefined) data.voucherCode = dto.voucherCode;
        if (dto.ctaLabel !== undefined) data.ctaLabel = dto.ctaLabel;
        if (dto.ctaUrl !== undefined) data.ctaUrl = dto.ctaUrl;
        if (dto.targetAudience !== undefined) data.targetAudience = typeof dto.targetAudience === 'string' ? dto.targetAudience : JSON.stringify(dto.targetAudience);
        if (dto.triggerEvent !== undefined) data.triggerEvent = dto.triggerEvent;
        if (dto.isActive !== undefined) data.isActive = dto.isActive;
        if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
        if (dto.priority !== undefined) data.priority = dto.priority;

        return this.prisma.promoCampaign.update({ where: { id }, data });
    }

    async toggleActive(id: string) {
        const campaign = await this.prisma.promoCampaign.findUnique({ where: { id } });
        if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại.');
        return this.prisma.promoCampaign.update({
            where: { id },
            data: { isActive: !campaign.isActive },
        });
    }

    async delete(id: string) {
        await this.prisma.promoCampaign.delete({ where: { id } });
        return { message: 'Đã xoá chiến dịch.' };
    }

    // ─── USER-FACING ──────────────────────────────────────────────────────────────

    async getActiveCampaigns(userId: string, userPlan: string, trigger?: string) {
        const now = new Date();

        // 1. Get all active campaigns within date range
        const campaigns = await this.prisma.promoCampaign.findMany({
            where: {
                isActive: true,
                status: 'ACTIVE',
                startDate: { lte: now },
                endDate: { gte: now },
                ...(trigger ? { triggerEvent: trigger } : {}),
            },
            orderBy: { priority: 'desc' },
        });

        // 2. Get user's dismissals
        const dismissals = await this.prisma.promoDismissal.findMany({
            where: {
                userId,
                campaignId: { in: campaigns.map(c => c.id) },
            },
        });

        const dismissMap = new Map(dismissals.map(d => [d.campaignId, d]));

        // 3. Filter by audience + dismissal rules
        const filtered = campaigns.filter(campaign => {
            // Check dismissal rules
            const dismissal = dismissMap.get(campaign.id);
            if (dismissal) {
                if (dismissal.dismissType === 'NEVER_SHOW') return false;
                if (dismissal.dismissType === 'CLOSED') {
                    const hoursSinceDismiss = (now.getTime() - dismissal.dismissedAt.getTime()) / (1000 * 60 * 60);
                    if (hoursSinceDismiss < 24) return false;
                }
            }

            // Check target audience
            try {
                const audience = JSON.parse(campaign.targetAudience || '{}');
                if (audience.plans && audience.plans.length > 0) {
                    if (!audience.plans.includes(userPlan.toUpperCase())) return false;
                }
            } catch {
                // Invalid JSON, show to all
            }

            return true;
        });

        return filtered;
    }

    async trackImpression(id: string) {
        return this.prisma.promoCampaign.update({
            where: { id },
            data: { impressions: { increment: 1 } },
        });
    }

    async trackClick(id: string) {
        return this.prisma.promoCampaign.update({
            where: { id },
            data: { clicks: { increment: 1 } },
        });
    }

    async trackConversion(id: string) {
        return this.prisma.promoCampaign.update({
            where: { id },
            data: { conversions: { increment: 1 } },
        });
    }

    async dismissCampaign(campaignId: string, userId: string, dismissType: string) {
        return this.prisma.promoDismissal.upsert({
            where: { campaignId_userId: { campaignId, userId } },
            update: { dismissType, dismissedAt: new Date() },
            create: { campaignId, userId, dismissType },
        });
    }
}
