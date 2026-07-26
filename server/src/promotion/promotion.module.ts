import { Module } from '@nestjs/common';
import { PromotionService } from 'src/promotion/promotion.service';
import { PromotionController, AdminPromotionController } from 'src/promotion/promotion.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PromotionAiService } from 'src/promotion/promotion-ai.service';

@Module({
    imports: [PrismaModule],
    providers: [PromotionService, PromotionAiService],
    controllers: [PromotionController, AdminPromotionController],
    exports: [PromotionService],
})
export class PromotionModule { }
