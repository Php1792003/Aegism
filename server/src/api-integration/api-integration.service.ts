import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiIntegrationService {
  // Giới hạn
  private readonly MAX_KEYS_PER_USER = 3;
  private readonly MAX_KEYS_PER_TENANT = 10;
  private readonly MAX_WEBHOOKS_PER_TENANT = 20;

  constructor(private prisma: PrismaService) {}

  // ─── GUARD: Kiểm tra tenant Enterprise ──────────────────────────────
  private async ensureEnterprise(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.subscriptionPlan.toUpperCase() !== 'ENTERPRISE') {
      throw new ForbiddenException('Tính năng này chỉ dành cho gói Enterprise.');
    }
    return tenant;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  API KEYS
  // ═══════════════════════════════════════════════════════════════════

  async getApiKeys(tenantId: string) {
    await this.ensureEnterprise(tenantId);
    return this.prisma.tenantApiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async createApiKey(dto: CreateApiKeyDto, tenantId: string, userId: string) {
    await this.ensureEnterprise(tenantId);

    // Kiểm tra giới hạn per user (chỉ đếm key active)
    const userKeyCount = await this.prisma.tenantApiKey.count({
      where: { tenantId, createdById: userId, isActive: true },
    });
    if (userKeyCount >= this.MAX_KEYS_PER_USER) {
      throw new BadRequestException(
        `Mỗi người dùng chỉ được tạo tối đa ${this.MAX_KEYS_PER_USER} API Key đang hoạt động.`,
      );
    }

    // Kiểm tra giới hạn per tenant
    const tenantKeyCount = await this.prisma.tenantApiKey.count({
      where: { tenantId, isActive: true },
    });
    if (tenantKeyCount >= this.MAX_KEYS_PER_TENANT) {
      throw new BadRequestException(
        `Tổ chức đã đạt giới hạn ${this.MAX_KEYS_PER_TENANT} API Key đang hoạt động.`,
      );
    }

    // Generate key: aegis_live_ + 32 bytes hex
    const rawKey = crypto.randomBytes(32).toString('hex');
    const fullKey = `aegis_live_${rawKey}`;
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    const prefix = 'aegis_live_';
    const suffix = rawKey.slice(-4);

    const apiKey = await this.prisma.tenantApiKey.create({
      data: {
        name: dto.name,
        keyHash,
        prefix,
        suffix,
        policyAccepted: true,
        tenantId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, fullName: true, email: true } } },
    });

    // Trả fullKey MỘT LẦN DUY NHẤT — sau này không thể lấy lại
    return { ...apiKey, fullKey };
  }

  async revokeApiKey(keyId: string, tenantId: string, userId: string, reason?: string) {
    await this.ensureEnterprise(tenantId);

    const key = await this.prisma.tenantApiKey.findFirst({
      where: { id: keyId, tenantId },
    });
    if (!key) throw new NotFoundException('Không tìm thấy API Key.');
    if (!key.isActive) throw new BadRequestException('API Key đã bị thu hồi trước đó.');

    return this.prisma.tenantApiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: userId,
        revokeReason: reason || 'Thu hồi bởi người dùng',
      },
    });
  }

  async deleteApiKey(keyId: string, tenantId: string) {
    await this.ensureEnterprise(tenantId);

    const key = await this.prisma.tenantApiKey.findFirst({
      where: { id: keyId, tenantId },
    });
    if (!key) throw new NotFoundException('Không tìm thấy API Key.');

    return this.prisma.tenantApiKey.delete({ where: { id: keyId } });
  }

  // ─── SUPER ADMIN: Thu hồi key bất kỳ ───────────────────────────────
  async superAdminRevokeKey(keyId: string, reason: string, superAdminId: string) {
    const key = await this.prisma.tenantApiKey.findUnique({ where: { id: keyId } });
    if (!key) throw new NotFoundException('Không tìm thấy API Key.');

    return this.prisma.tenantApiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: superAdminId,
        revokeReason: reason || 'Thu hồi bởi Super Admin — Vi phạm chính sách',
      },
    });
  }

  // ─── SUPER ADMIN: Lấy tất cả API Keys ─────────────────────────────
  async superAdminGetAllKeys(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tenant: { name: { contains: search, mode: 'insensitive' } } },
        { createdBy: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [keys, total] = await Promise.all([
      this.prisma.tenantApiKey.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, subscriptionPlan: true } },
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.tenantApiKey.count({ where }),
    ]);

    return { keys, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WEBHOOKS
  // ═══════════════════════════════════════════════════════════════════

  async getWebhooks(tenantId: string) {
    await this.ensureEnterprise(tenantId);
    return this.prisma.tenantWebhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }

  async createWebhook(dto: CreateWebhookDto, tenantId: string, userId: string) {
    await this.ensureEnterprise(tenantId);

    const count = await this.prisma.tenantWebhook.count({ where: { tenantId } });
    if (count >= this.MAX_WEBHOOKS_PER_TENANT) {
      throw new BadRequestException(
        `Đã đạt giới hạn ${this.MAX_WEBHOOKS_PER_TENANT} webhooks cho tổ chức.`,
      );
    }

    // Tạo HMAC secret
    const secret = crypto.randomBytes(32).toString('hex');

    return this.prisma.tenantWebhook.create({
      data: {
        event: dto.event,
        url: dto.url,
        secret,
        tenantId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }

  async deleteWebhook(webhookId: string, tenantId: string) {
    await this.ensureEnterprise(tenantId);

    const webhook = await this.prisma.tenantWebhook.findFirst({
      where: { id: webhookId, tenantId },
    });
    if (!webhook) throw new NotFoundException('Không tìm thấy Webhook.');

    return this.prisma.tenantWebhook.delete({ where: { id: webhookId } });
  }

  async testWebhook(webhookId: string, tenantId: string) {
    await this.ensureEnterprise(tenantId);

    const webhook = await this.prisma.tenantWebhook.findFirst({
      where: { id: webhookId, tenantId },
    });
    if (!webhook) throw new NotFoundException('Không tìm thấy Webhook.');

    const testPayload = JSON.stringify({
      event: webhook.event,
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Đây là sự kiện test từ Aegism Platform',
        webhookId: webhook.id,
      },
    });

    // Tạo HMAC signature
    let signature = '';
    if (webhook.secret) {
      signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(testPayload)
        .digest('hex');
    }

    // Gửi HTTP POST với retry tối đa 3 lần
    let lastError = '';
    let lastStatusCode = 0;
    let lastResponse = '';
    let success = false;
    let duration = 0;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Aegism-Signature': signature ? `sha256=${signature}` : '',
            'X-Aegism-Event': webhook.event,
            'User-Agent': 'Aegism-Webhook/1.0',
          },
          body: testPayload,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        duration = Date.now() - start;
        lastStatusCode = res.status;

        try {
          lastResponse = await res.text();
          if (lastResponse.length > 1000) lastResponse = lastResponse.substring(0, 1000) + '...';
        } catch {
          lastResponse = '';
        }

        if (res.ok) {
          success = true;

          // Log success
          await this.prisma.webhookLog.create({
            data: {
              webhookId: webhook.id,
              event: webhook.event,
              payload: testPayload,
              statusCode: lastStatusCode,
              response: lastResponse,
              success: true,
              duration,
              attempt,
            },
          });
          break;
        }

        lastError = `HTTP ${res.status}: ${lastResponse}`;
      } catch (err: any) {
        duration = Date.now() - start;
        lastError = err.message || 'Không thể kết nối';
        lastStatusCode = 0;
      }

      // Log attempt
      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: webhook.event,
          payload: testPayload,
          statusCode: lastStatusCode || null,
          response: lastResponse || null,
          success: false,
          duration,
          error: lastError,
          attempt,
        },
      });

      // Chờ trước khi retry (exponential backoff)
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    return {
      success,
      statusCode: lastStatusCode,
      response: lastResponse,
      error: success ? null : lastError,
      duration,
    };
  }

  async getWebhookLogs(webhookId: string, tenantId: string) {
    await this.ensureEnterprise(tenantId);

    const webhook = await this.prisma.tenantWebhook.findFirst({
      where: { id: webhookId, tenantId },
    });
    if (!webhook) throw new NotFoundException('Không tìm thấy Webhook.');

    return this.prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  STATS
  // ═══════════════════════════════════════════════════════════════════

  async getStats(tenantId: string) {
    await this.ensureEnterprise(tenantId);

    const [activeKeys, totalKeys, activeWebhooks, totalWebhooks, recentLogs] =
      await Promise.all([
        this.prisma.tenantApiKey.count({ where: { tenantId, isActive: true } }),
        this.prisma.tenantApiKey.count({ where: { tenantId } }),
        this.prisma.tenantWebhook.count({ where: { tenantId, isActive: true } }),
        this.prisma.tenantWebhook.count({ where: { tenantId } }),
        this.prisma.webhookLog.count({
          where: {
            webhook: { tenantId },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

    return {
      activeKeys,
      totalKeys,
      activeWebhooks,
      totalWebhooks,
      recentDeliveries: recentLogs,
      limits: {
        maxKeysPerUser: this.MAX_KEYS_PER_USER,
        maxKeysPerTenant: this.MAX_KEYS_PER_TENANT,
        maxWebhooksPerTenant: this.MAX_WEBHOOKS_PER_TENANT,
        rateLimit: '10,000 req/phút',
      },
    };
  }
}
