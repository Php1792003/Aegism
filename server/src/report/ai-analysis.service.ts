import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiAnalysisService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("❌ MISSING GOOGLE_API_KEY in .env file");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || 'AIzaSy_DUMMY');
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async analyzeProjectPerformance(data: any): Promise<string> {
        if (!process.env.GOOGLE_API_KEY) {
            return "<p style='color:red'>Chưa cấu hình API Key cho AI.</p>";
        }

        const prompt = `
          Đóng vai một chuyên gia quản lý vận hành tòa nhà. Hãy phân tích ngắn gọn dữ liệu sau:
          - Dự án: ${data.projectName}
          - Số lượt tuần tra: ${data.stats.totalPatrols}
          - Tăng trưởng tuần tra: ${data.stats.patrolGrowth}%
          - Số sự cố phát sinh: ${data.stats.totalIncidents}
          - Tỷ lệ hoàn thành công việc: ${data.stats.taskCompletionRate}%
          - Số nhân sự: ${data.stats.activeStaff}

          Yêu cầu trả lời bằng tiếng Việt, định dạng HTML đơn giản (dùng thẻ <p>, <ul>, <li>, <b>), không dùng Markdown.
          Nội dung cần: Nhận xét chung, Rủi ro tiềm ẩn, và Đề xuất cải thiện.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Google Gemini Error:", error);
            return `<p style='color: red'>Lỗi khi gọi Google AI: ${error.message}</p>`;
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Phân loại sự cố và tự động phân công bộ phận bằng Gemini
    // ══════════════════════════════════════════════════════════════════════
    async classifyIncident(
        description: string,
        location: string,
        departments: string[], // Danh sách bộ phận thực tế trong dự án
    ): Promise<{ department: string; reason: string; confidence: number }> {
        if (!process.env.GOOGLE_API_KEY) {
            return { department: departments[0] || 'Chưa phân công', reason: 'Chưa cấu hình AI', confidence: 0 };
        }

        const departmentList = departments.length > 0
            ? departments.join(', ')
            : 'Bảo trì, An ninh, Vệ sinh, Kỹ thuật điện, Kỹ thuật nước';

        const prompt = `
Bạn là hệ thống phân loại sự cố thông minh của tòa nhà.

Thông tin sự cố:
- Mô tả: "${description}"
- Vị trí: "${location}"

Danh sách bộ phận có thể xử lý: ${departmentList}

Nhiệm vụ: Phân tích mô tả sự cố và chọn BỘ PHẬN PHÙ HỢP NHẤT từ danh sách trên để xử lý.

Quy tắc:
- Chỉ được chọn đúng một bộ phận trong danh sách đã cho
- Nếu không có bộ phận phù hợp, chọn bộ phận gần nhất
- Độ tin cậy từ 0 đến 100

Trả về JSON hợp lệ, không có markdown, không có giải thích thêm:
{
  "department": "tên bộ phận",
  "reason": "lý do ngắn gọn bằng tiếng Việt (tối đa 20 từ)",
  "confidence": 85
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Parse JSON từ response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Gemini không trả về JSON hợp lệ');

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate department có trong danh sách không
            const validDept = departments.find(d =>
                d.toLowerCase() === parsed.department?.toLowerCase()
            );

            return {
                department: validDept || parsed.department || departments[0] || 'Chưa phân công',
                reason: parsed.reason || 'Phân loại tự động bởi AI',
                confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence) || 70)),
            };
        } catch (error) {
            console.error('classifyIncident Gemini Error:', error);
            // Fallback: trả về bộ phận đầu tiên
            return {
                department: departments[0] || 'Chưa phân công',
                reason: 'Lỗi AI, phân công mặc định',
                confidence: 0,
            };
        }
    }
}
