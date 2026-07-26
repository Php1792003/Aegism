import {
    Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
    UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { PromotionAiService } from './promotion-ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../master-admin/guards/super-admin.guard';


@Controller('master-admin/promotions')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminPromotionController {
    constructor(
        private readonly promoService: PromotionService,
        private readonly promoAiService: PromotionAiService
    ) { }

    @Get()
    findAll() {
        return this.promoService.findAll();
    }

    @Post()
    create(@Body() dto: any) {
        return this.promoService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.promoService.update(id, dto);
    }

    @Patch(':id/toggle')
    toggleActive(@Param('id') id: string) {
        return this.promoService.toggleActive(id);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.promoService.delete(id);
    }

    // ─── AI ENDPOINTS ───

    @Post('ai/generate')
    async generateAi() {
        const campaign = await this.promoAiService.generateAiStrategy();
        return { message: 'Đã tạo chiến lược AI thành công', campaign };
    }

    @Patch(':id/approve')
    async approveAi(@Param('id') id: string) {
        return this.promoService.update(id, { status: 'ACTIVE', isActive: true });
    }

    @Patch(':id/reject')
    async rejectAi(@Param('id') id: string) {
        return this.promoService.update(id, { status: 'REJECTED', isActive: false });
    }
}

// ─── USER CONTROLLER ──────────────────────────────────────────────────────────

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionController {
    constructor(private readonly promoService: PromotionService) { }

    @Get('active')
    async getActive(@Request() req: any, @Query('trigger') trigger?: string) {
        const userId = req.user?.sub || req.user?.id || req.user?.userId;
        const tenantId = req.user.tenantId;

        // Get user's current plan from tenant
        const { PrismaClient } = require('@prisma/client');
        // We need the plan from the request context. A simpler approach:
        // The frontend will send the plan as a query param.
        const plan = (req.query.plan || 'STARTER').toUpperCase();

        return this.promoService.getActiveCampaigns(userId, plan, trigger);
    }

    @Post(':id/track')
    @HttpCode(HttpStatus.OK)
    async track(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { action: 'impression' | 'click' | 'conversion' | 'dismiss'; dismissType?: string },
    ) {
        const userId = req.user?.sub || req.user?.id || req.user?.userId;

        switch (body.action) {
            case 'impression':
                await this.promoService.trackImpression(id);
                return { ok: true };
            case 'click':
                await this.promoService.trackClick(id);
                return { ok: true };
            case 'conversion':
                await this.promoService.trackConversion(id);
                return { ok: true };
            case 'dismiss':
                await this.promoService.dismissCampaign(id, userId, body.dismissType || 'CLOSED');
                return { ok: true };
            default:
                return { ok: false, message: 'Invalid action' };
        }
    }
}
