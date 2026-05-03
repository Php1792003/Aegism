import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PayOS } = require('@payos/node');

@Injectable()
export class PayosService {
    private payos: any;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.payos = new PayOS(
            this.configService.get<string>('PAYOS_CLIENT_ID')!,
            this.configService.get<string>('PAYOS_API_KEY')!,
            this.configService.get<string>('PAYOS_CHECKSUM_KEY')!,
        );
    }

    readonly PLANS: Record<string, { name: string; price: number; days: number }> = {
        STARTER: { name: 'Gói Starter', price: 499000, days: 30 },
        PROFESSIONAL: { name: 'Gói Professional', price: 999000, days: 30 },
        ENTERPRISE: { name: 'Gói Enterprise', price: 1499000, days: 30 },
    };

    async createPaymentLink(tenantId: string, plan: string, userInfo: { fullName: string; email: string }) {
        const planInfo = this.PLANS[plan.toUpperCase()];
        if (!planInfo) throw new BadRequestException('Gói không hợp lệ');

        const orderCode = Date.now();
        const returnUrl = this.configService.get<string>('PAYOS_RETURN_URL')!;
        const cancelUrl = this.configService.get<string>('PAYOS_CANCEL_URL')!;

        // Lưu order vào DB để webhook xử lý
        await this.prisma.paymentOrder.create({
            data: {
                orderCode: String(orderCode),
                tenantId,
                plan: plan.toUpperCase(),
                amount: planInfo.price,
                status: 'PENDING',
            }
        });

        const paymentData = {
            orderCode,
            amount: planInfo.price,
            description: `AEGISM ${planInfo.name}`,
            buyerName: userInfo.fullName,
            buyerEmail: userInfo.email,
            items: [{ name: planInfo.name, quantity: 1, price: planInfo.price }],
            returnUrl,
            cancelUrl,
        };

        const response = await this.payos.createPaymentLink(paymentData);
        return { checkoutUrl: response.checkoutUrl, orderCode };
    }

    async handleWebhook(webhookData: any) {
        try {
            const data = this.payos.verifyPaymentWebhookData(webhookData);
            if (data.code !== '00') return { success: false };

            const order = await this.prisma.paymentOrder.findUnique({
                where: { orderCode: String(data.orderCode) }
            });
            if (!order || order.status === 'PAID') return { success: true };

            // Gia hạn tenant 30 ngày
            const planInfo = this.PLANS[order.plan];
            const tenant = await this.prisma.tenant.findUnique({ where: { id: order.tenantId } });
            const baseDate = (tenant?.subscriptionExpiresAt && tenant.subscriptionExpiresAt > new Date())
                ? tenant.subscriptionExpiresAt : new Date();
            const newExpiry = new Date(baseDate);
            newExpiry.setDate(newExpiry.getDate() + planInfo.days);

            await this.prisma.tenant.update({
                where: { id: order.tenantId },
                data: {
                    subscriptionPlan: order.plan,
                    subscriptionExpiresAt: newExpiry,
                    isActive: true,
                }
            });

            await this.prisma.paymentOrder.update({
                where: { orderCode: String(data.orderCode) },
                data: { status: 'PAID' }
            });

            return { success: true };
        } catch (e) {
            console.error('Webhook error:', e);
            return { success: false };
        }
    }

    async getPaymentStatus(orderCode: string) {
        return this.prisma.paymentOrder.findUnique({ where: { orderCode } });
    }
}
