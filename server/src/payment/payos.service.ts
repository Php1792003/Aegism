import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const { PayOS } = require('@payos/node');

@Injectable()
export class PayosService {
    private payos: any;

    constructor(private configService: ConfigService, private prisma: PrismaService) {
        this.payos = new PayOS(
            this.configService.get<string>('PAYOS_CLIENT_ID'),
            this.configService.get<string>('PAYOS_API_KEY'),
            this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
        );
    }

    private createSignature(data: Record<string, any>): string {
        const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY')!;
        const sortedKeys = Object.keys(data).sort();
        const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
        return crypto.createHmac('sha256', checksumKey).update(signStr).digest('hex');
    }

    async createPaymentLink(tenantId: string, plan: string, userInfo: { fullName: string; email: string }) {
        const rawPlan = plan.toUpperCase();
        const planKey = rawPlan === 'PROFESSIONAL' ? 'BUSINESS' : rawPlan;
        const planConfig = await this.prisma.planConfig.findUnique({
            where: { planKey }
        });
        if (!planConfig || !planConfig.isActive) throw new BadRequestException('Gói không hợp lệ');

        const orderCode = Math.floor(Date.now() / 1000);
        const returnUrl = this.configService.get<string>('PAYOS_RETURN_URL')!;
        const cancelUrl = this.configService.get<string>('PAYOS_CANCEL_URL')!;
        const description = `AEGISM ${planKey}`;

        // Tạo signature
        const signData = {
            amount: planConfig.monthlyPrice,
            cancelUrl,
            description,
            orderCode,
            returnUrl,
        };
        const signature = this.createSignature(signData);

        // Lưu order
        await this.prisma.paymentOrder.create({
            data: {
                orderCode: String(orderCode),
                tenantId,
                plan: planKey,
                amount: planConfig.monthlyPrice,
                status: 'PENDING',
            }
        });

        // Gọi PayOS API
        const response = await this.payos.paymentRequests.create({
            orderCode,
            amount: planConfig.monthlyPrice,
            description,
            buyerName: userInfo.fullName,
            buyerEmail: userInfo.email,
            items: [{ name: planConfig.displayName, quantity: 1, price: planConfig.monthlyPrice }],
            returnUrl,
            cancelUrl,
            signature,
        });

        return {
            checkoutUrl: response.checkoutUrl,
            qrCode: response.qrCode,
            orderCode: String(orderCode),
        };
    }

    async handleWebhook(webhookData: any) {
        try {
            const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY')!;
            const { signature, ...data } = webhookData.data || webhookData;
            const sortedKeys = Object.keys(data).sort();
            const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
            const expectedSig = crypto.createHmac('sha256', checksumKey).update(signStr).digest('hex');

            if (expectedSig !== (webhookData.signature || signature)) {
                return { success: false, message: 'Invalid signature' };
            }

            const orderCode = String(data.orderCode);
            const order = await this.prisma.paymentOrder.findUnique({ where: { orderCode } });
            if (!order || order.status === 'PAID') return { success: true };

            if (data.code === '00' || webhookData.code === '00') {
                await this.processPayment(order);
            }

            return { success: true };
        } catch (e) {
            console.error('Webhook error:', e);
            return { success: false };
        }
    }

    private async processPayment(order: any) {
        const rawPlan = order.plan.toUpperCase();
        const planKey = rawPlan === 'PROFESSIONAL' ? 'BUSINESS' : rawPlan;
        const planConfig = await this.prisma.planConfig.findUnique({
            where: { planKey }
        });
        if (!planConfig) throw new BadRequestException('Không tìm thấy cấu hình gói');

        const tenant = await this.prisma.tenant.findUnique({ where: { id: order.tenantId } });
        const baseDate = (tenant?.subscriptionExpiresAt && tenant.subscriptionExpiresAt > new Date())
            ? tenant.subscriptionExpiresAt : new Date();
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + 30);

        await this.prisma.tenant.update({
            where: { id: order.tenantId },
            data: { 
                subscriptionPlan: planKey, 
                subscriptionExpiresAt: newExpiry, 
                isActive: true,
                maxUsers: planConfig.maxUsers,
                maxProjects: planConfig.maxProjects,
                maxQRCodes: planConfig.maxQRCodes
            }
        });

        await this.prisma.paymentOrder.update({
            where: { orderCode: order.orderCode },
            data: { status: 'PAID' }
        });
    }

    async getPaymentStatus(orderCode: string) {
        return this.prisma.paymentOrder.findUnique({ where: { orderCode } });
    }
}
