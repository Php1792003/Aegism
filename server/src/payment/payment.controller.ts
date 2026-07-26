import { Controller, Post, Body, Req, Get, Query, UseGuards, Request as NestRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PayosService } from './payos.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PLANS = [
    { planKey: 'NONE', displayName: 'Miễn phí', monthlyPrice: 0, yearlyPrice: 0, maxUsers: 2, maxProjects: 0, maxQRCodes: 0, features: [], sortOrder: 0 },
    { planKey: 'STARTER', displayName: 'Starter', monthlyPrice: 499000, yearlyPrice: 399000, maxUsers: 10, maxProjects: 3, maxQRCodes: 100, features: ['Tối đa 10 người dùng', 'Tối đa 3 dự án', '100 mã QR', 'Quản lý công việc cơ bản', 'Báo cáo tiêu chuẩn', 'Hỗ trợ email'], sortOrder: 1 },
    { planKey: 'BUSINESS', displayName: 'Business', monthlyPrice: 999000, yearlyPrice: 799000, maxUsers: 50, maxProjects: 20, maxQRCodes: 500, features: ['Tối đa 50 người dùng', 'Dự án không giới hạn', '500 mã QR', 'Quản lý công việc nâng cao', 'Báo cáo chi tiết', 'Chat nhóm & File sharing', 'Hỗ trợ ưu tiên 24/7', 'API Integration'], sortOrder: 2 },
    { planKey: 'ENTERPRISE', displayName: 'Enterprise', monthlyPrice: 0, yearlyPrice: 0, maxUsers: 999, maxProjects: 999, maxQRCodes: 9999, features: ['Người dùng không giới hạn', 'Dự án không giới hạn', 'QR Code không giới hạn', 'Tính năng tùy chỉnh theo yêu cầu', 'SLA đảm bảo 99.9%', 'Dedicated support'], sortOrder: 3 },
];

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly payosService: PayosService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('vnpay')
    createVnpayPayment(@Body() createPaymentDto: CreatePaymentDto, @Req() req: Request) {
        const ipAddr = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1') as string;
        const paymentUrl = this.paymentService.createVnpayUrl(createPaymentDto, ipAddr.split(',')[0].trim());
        return { success: true, paymentUrl };
    }

    @Get('vnpay-return')
    vnpayReturn(@Query() query: any) {
        const result = this.paymentService.verifyReturnUrl(query);
        return {
            success: result.isValid,
            message: result.message,
            data: {
                orderId: query.vnp_TxnRef,
                amount: query.vnp_Amount,
                orderInfo: query.vnp_OrderInfo,
                responseCode: query.vnp_ResponseCode,
                transactionNo: query.vnp_TransactionNo,
                bankCode: query.vnp_BankCode,
                payDate: query.vnp_PayDate,
            }
        };
    }

    @Post('vnpay-ipn')
    vnpayIPN(@Body() body: any) {
        const result = this.paymentService.verifyReturnUrl(body);
        if (result.isValid && body.vnp_ResponseCode === '00') {
            return { RspCode: '00', Message: 'Confirm Success' };
        }
        return { RspCode: '97', Message: 'Invalid Signature' };
    }

    @Post('payos/create')
    @UseGuards(JwtAuthGuard)
    async createPayosPayment(@Body() body: { plan: string }, @NestRequest() req: any) {
        return this.payosService.createPaymentLink(
            req.user.tenantId,
            body.plan,
            { fullName: req.user.fullName || 'Khách hàng', email: req.user.email || '' }
        );
    }

    @Post('payos/webhook')
    async payosWebhook(@Body() body: any) {
        return this.payosService.handleWebhook(body);
    }

    @Get('payos/status')
    @UseGuards(JwtAuthGuard)
    async getPayosStatus(@Query('orderCode') orderCode: string) {
        return this.payosService.getPaymentStatus(orderCode);
    }

    // Public endpoint — no auth required (for PricingPage)
    @Get('plan-config')
    async getPublicPlanConfig() {
        try {
            const configs = await this.prisma.planConfig.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
            });
            if (configs.length === 0) return DEFAULT_PLANS;
            return configs.map(c => ({
                ...c,
                features: (() => { try { return JSON.parse(c.features); } catch { return []; } })(),
            }));
        } catch {
            return DEFAULT_PLANS;
        }
    }
}
