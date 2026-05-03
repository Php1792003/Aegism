import { Controller, Post, Body, Req, Get, Query, UseGuards, Request as NestRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PayosService } from './payos.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly payosService: PayosService,
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
}
