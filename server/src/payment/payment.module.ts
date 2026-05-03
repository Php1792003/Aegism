import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PayosService } from './payos.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [PaymentController],
    providers: [PaymentService, PayosService],
})
export class PaymentModule { }