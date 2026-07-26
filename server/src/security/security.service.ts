import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD / QUERY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async getAuditLogs(page = 1, limit = 50, suspiciousOnly = false) {
    const skip = (page - 1) * limit;
    const where = suspiciousOnly ? { isSuspicious: true } : {};

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const userIds = [...new Set(data.filter((d) => d.userId).map((d) => d.userId as string))];
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true, email: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      data.forEach((d) => {
        if (d.userId && userMap.has(d.userId)) {
          (d as any).user = userMap.get(d.userId);
        }
      });
    }

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAuditLogDetail(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async getBlacklistedIPs() {
    return this.prisma.blacklistedIP.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async unblockIP(id: string) {
    return this.prisma.blacklistedIP.update({
      where: { id },
      data: { isBlocked: false },
    });
  }

  async blockIP(ipAddress: string, reason: string) {
    return this.prisma.blacklistedIP.upsert({
      where: { ipAddress },
      update: { isBlocked: true, reason },
      create: { ipAddress, reason, isBlocked: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI SECURITY SCANNER (chạy ngầm, không block request)
  // ─────────────────────────────────────────────────────────────────────────

  async scanPayloadInBackground(
    logId: string,
    ipAddress: string,
    payloadStr: string,
    headerStr: string,
  ) {
    try {
      // ── WHITELIST: Không bao giờ block localhost/dev environment ─────
      const localIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
      if (localIPs.includes(ipAddress) || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
        return; // Bỏ qua hoàn toàn cho môi trường local/nội bộ
      }

      const BLOCK_THRESHOLD = 100;

      type Pattern = { name: string; regex: RegExp; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; score: number; };

      // ── TIER 1: PATTERN SCORING ENGINE (WAF-STYLE) ───────────────────────────────
      const payloadPatterns: Pattern[] = [
        // SQL Injection
        { name: 'SQL Injection (UNION)', regex: /\b(UNION\s+SELECT|UNION\s+ALL\s+SELECT)\b/i, severity: 'CRITICAL', score: 100 },
        { name: 'SQL Injection (Tautology)', regex: /('\s*OR\s*'1'\s*=\s*'1|'\s*OR\s+1=1\s*--|;\s*DROP\s+TABLE)/i, severity: 'CRITICAL', score: 100 },
        // Lỗi cũ: -- dễ dính trong text. Giờ chỉ phạt nhẹ, nếu dính nhiều sẽ cộng đồn.
        { name: 'SQL Injection (Comment)', regex: /(--|\/\*[\s\S]*?\*\/|;--)/, severity: 'LOW', score: 20 },

        // XSS
        { name: 'XSS (Script Tag)', regex: /<script[\s>]/i, severity: 'CRITICAL', score: 100 },
        { name: 'XSS (Event Handler)', regex: /\bon(error|load|click|mouseover)\s*=/i, severity: 'HIGH', score: 60 },
        { name: 'XSS (Javascript URI)', regex: /javascript\s*:/i, severity: 'HIGH', score: 60 },

        // NoSQL
        { name: 'NoSQL Injection ($where)', regex: /\$where\s*:/i, severity: 'CRITICAL', score: 100 },
        // Hạ điểm NoSQL keys cơ bản vì có thể dùng trong filter JSON bình thường
        { name: 'NoSQL Injection (Basic Keys)', regex: /\$(gt|gte|lt|lte|ne|nin|in)\s*:/, severity: 'LOW', score: 30 },

        // Path Traversal
        // Sửa lại: ../.. trở lên hoặc đụng /etc/passwd mới nghiêm trọng
        { name: 'Path Traversal (Critical File)', regex: /\/etc\/(passwd|shadow|hosts)|c:\\windows\\system32/i, severity: 'CRITICAL', score: 100 },
        { name: 'Path Traversal (Basic)', regex: /(\.\.\/){2,}|(\.\.\\){2,}/i, severity: 'HIGH', score: 60 },

        // Command Injection
        { name: 'Command Injection', regex: /([;&|`]\s*(cat|ls|pwd|whoami|id|uname|wget|curl)\b)/i, severity: 'CRITICAL', score: 100 },

        // SSRF
        { name: 'SSRF (Cloud Metadata)', regex: /(169\.254\.169\.254)/i, severity: 'CRITICAL', score: 100 },
        { name: 'SSRF (Internal IP)', regex: /(https?:\/\/(127\.0\.0\.1|localhost|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.))/i, severity: 'HIGH', score: 80 },

        // Prototype Pollution
        { name: 'Prototype Pollution', regex: /(__proto__|constructor\[prototype\])/i, severity: 'HIGH', score: 60 },
      ];

      const headerPatterns: Pattern[] = [
        { name: 'SQL Injection (UNION in Header)', regex: /\b(UNION\s+SELECT|UNION\s+ALL\s+SELECT)\b/i, severity: 'CRITICAL', score: 100 },
        { name: 'Command Injection in Header', regex: /([;&|`]\s*(cat|ls|pwd|whoami|id|uname|wget|curl)\b)/i, severity: 'CRITICAL', score: 100 },
        { name: 'Path Traversal in Header', regex: /(\.\.\/){2,}|(\.\.\\){2,}/i, severity: 'HIGH', score: 60 },
        { name: 'XSS (Script Tag in Header)', regex: /<script[\s>]/i, severity: 'CRITICAL', score: 100 },
        // Không check SSRF trong header để tránh chặn Origin/Referer hợp lệ
      ];

      let totalScore = 0;
      const triggered: Pattern[] = [];

      // Quét Payload
      for (const p of payloadPatterns) {
        if (p.regex.test(payloadStr)) {
          totalScore += p.score;
          triggered.push(p);
        }
      }

      // Quét Headers
      for (const p of headerPatterns) {
        if (p.regex.test(headerStr)) {
          totalScore += p.score;
          triggered.push(p);
        }
      }

      // Không có gì đáng ngờ → thoát sớm
      if (triggered.length === 0) return;

      const severity = totalScore >= 100 ? 'CRITICAL' : totalScore >= 60 ? 'HIGH' : totalScore >= 30 ? 'MEDIUM' : 'LOW';
      const reason = triggered.map((t) => t.name).join(', ');

      // ── TIER 2: GEMINI AI (chỉ phân tích nếu điểm đủ cao để lấy thông tin sâu) ────────────────
      let aiAnalysis: string | null = null;
      if (totalScore >= 60 && process.env.GEMINI_API_KEY) {
        aiAnalysis = await this.analyzeWithGemini(
          payloadStr,
          triggered.map((t) => t.name),
        );
      }

      const analysisText = aiAnalysis
        ? `[${severity}] ${reason}\n\n🤖 Gemini AI: ${aiAnalysis}`
        : `[${severity}] Phát hiện: ${reason} (Score: ${totalScore})`;

      this.logger.warn(`[Security] IP: ${ipAddress} | Score: ${totalScore} | Severity: ${severity} | ${reason}`);

      // ── GHI DB LOG SUSPICIOUS ─────────────────────────────────────────────
      await this.prisma.auditLog.update({
        where: { id: logId },
        data: { isSuspicious: true, aiAnalysis: analysisText },
      });

      // ── CHẶN IP NẾU VƯỢT NGƯỠNG BLOCK ──────────────────────────────────────
      if (totalScore >= BLOCK_THRESHOLD) {
        await this.prisma.blacklistedIP.upsert({
          where: { ipAddress },
          update: { isBlocked: true, reason, evidenceLogId: logId },
          create: { ipAddress, reason, isBlocked: true, evidenceLogId: logId },
        });

        // Chỉ Alert Telegram khi bị chặn
        await this.sendTelegramAlert(ipAddress, reason, payloadStr, 'CRITICAL');
        this.logger.error(`[Security] IP BỊ CHẶN: ${ipAddress} vì vượt ngưỡng rủi ro (${totalScore}/${BLOCK_THRESHOLD})`);
      }

    } catch (error) {
      this.logger.error(`Security Scanner Error: ${(error as any).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private async analyzeWithGemini(
    payload: string,
    detectedPatterns: string[],
  ): Promise<string> {
    const prompt =
      `You are a cybersecurity expert. Analyze this HTTP request payload for security threats.\n` +
      `Already detected by regex: ${detectedPatterns.join(', ')}.\n` +
      `Payload (truncated): ${payload.substring(0, 500)}\n` +
      `Respond in Vietnamese, 1-2 sentences, explain the attack vector and potential damage. Be concise.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Không phân tích được'
      );
    } catch (error) {
      this.logger.error(`Gemini API Error: ${(error as any).message}`);
      return 'Lỗi khi gọi Gemini AI';
    }
  }

  private async sendTelegramAlert(
    ip: string,
    reason: string,
    payload: string,
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'HIGH',
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      this.logger.warn(
        'Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong file .env',
      );
      return;
    }

    const severityEmoji =
      severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡';

    // Cắt ngắn payload để tránh Telegram reject message quá dài
    const payloadPreview =
      payload.length > 200 ? payload.substring(0, 200) + '...' : payload;

    const message =
      `🚨 <b>CẢNH BÁO TẤN CÔNG WEB</b> 🚨\n\n` +
      `${severityEmoji} <b>Mức độ:</b> ${severity}\n` +
      `🌐 <b>IP bị chặn:</b> <code>${ip}</code>\n` +
      `🔍 <b>Loại tấn công:</b> ${reason}\n` +
      `📦 <b>Payload:</b> <code>${payloadPreview}</code>\n\n` +
      `🛡️ <i>Hệ thống đã tự động khóa IP này. Không cần thao tác thêm.</i>`;

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      this.logger.log(`Đã gửi cảnh báo Telegram cho IP ${ip} [${severity}]`);
    } catch (error) {
      this.logger.error('Lỗi khi gửi tin nhắn Telegram', error);
    }
  }
}