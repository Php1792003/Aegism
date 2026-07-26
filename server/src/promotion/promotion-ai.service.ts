import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PromotionAiService {
    private readonly logger = new Logger(PromotionAiService.name);
    private genAI: GoogleGenerativeAI;

    constructor(private prisma: PrismaService) {
        // Initialize Gemini API
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Run every Sunday at midnight
    @Cron(CronExpression.EVERY_WEEK)
    async handleCron() {
        this.logger.log('Bắt đầu tiến trình AI phân tích doanh thu và tạo chiến lược...');
        await this.generateAiStrategy();
    }

    async generateAiStrategy() {
        try {
            // 1. Gather revenue and tenant data
            const now = new Date();
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Revenue in the last 7 days
            const recentOrders = await this.prisma.paymentOrder.findMany({
                where: {
                    status: 'PAID',
                    createdAt: { gte: lastWeek }
                }
            });

            const totalRevenueLastWeek = recentOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

            // Active Tenants by plan
            const activeTenants = await this.prisma.tenant.findMany({
                where: { isActive: true },
                select: { subscriptionPlan: true }
            });

            const planCounts = activeTenants.reduce((acc, t) => {
                const plan = t.subscriptionPlan || 'STARTER';
                acc[plan] = (acc[plan] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // 2. Prepare Prompt
            const prompt = `
Bạn là một chuyên gia chiến lược tăng trưởng doanh thu cho nền tảng SaaS.
Dữ liệu hiện tại của hệ thống:
- Doanh thu 7 ngày qua: ${totalRevenueLastWeek} VND
- Số lượng khách hàng đang hoạt động: ${JSON.stringify(planCounts)}

Hãy phân tích dữ liệu trên và tạo RA DUY NHẤT 1 chiến dịch khuyến mãi (PromoCampaign) mới để thu hút khách hàng nâng cấp gói hoặc gia tăng doanh thu.

Trả về kết quả dưới dạng JSON với định dạng chính xác như sau, không kèm theo bất kỳ văn bản nào khác:
{
  "title": "Tên chiến dịch hấp dẫn (VD: Tuần Lễ Vàng Nâng Cấp)",
  "description": "Mô tả ngắn gọn, lôi cuốn",
  "type": "BANNER_TOP", 
  "targetPlanKey": "STARTER",
  "discountPercent": 20, 
  "ctaLabel": "Nâng cấp ngay",
  "aiReasoning": "Giải thích chi tiết cho Super Admin tại sao AI lại chọn chiến lược này dựa trên dữ liệu doanh thu"
}
`;

            // 3. Call Gemini API
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean markdown blocks if any
            const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiCampaign = JSON.parse(jsonString);

            // 4. Save to Database as PENDING_APPROVAL
            const startDate = new Date();
            const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Valid for 1 week

            const newCampaign = await this.prisma.promoCampaign.create({
                data: {
                    title: aiCampaign.title,
                    description: aiCampaign.description,
                    type: aiCampaign.type || 'BANNER_TOP',
                    targetPlanKey: aiCampaign.targetPlanKey,
                    discountPercent: aiCampaign.discountPercent,
                    ctaLabel: aiCampaign.ctaLabel || 'Khám phá ngay',
                    ctaUrl: '/pricing',
                    startDate,
                    endDate,
                    isAiGenerated: true,
                    status: 'PENDING_APPROVAL',
                    isActive: false, // Wait for super admin to approve
                    aiReasoning: aiCampaign.aiReasoning || 'Tự động tạo bởi AI'
                } as any // Cast to any because TS might not be updated yet
            });

            this.logger.log(`Đã tạo chiến dịch AI mới thành công: ${newCampaign.id}`);
            return newCampaign;

        } catch (error) {
            this.logger.error('Lỗi khi AI tạo chiến dịch:', error);
            throw error;
        }
    }
}
