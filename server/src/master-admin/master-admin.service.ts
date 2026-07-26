import * as os from 'os';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

// Default plan configs (seed data)
const DEFAULT_PLANS = [
  {
    planKey: 'NONE',
    displayName: 'Miễn phí',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 2,
    maxProjects: 0,
    maxQRCodes: 0,
    features: JSON.stringify(['Xem Dashboard cơ bản', 'Đăng ký tài khoản miễn phí']),
    isActive: true,
    sortOrder: 0,
  },
  {
    planKey: 'STARTER',
    displayName: 'Starter',
    monthlyPrice: 499000,
    yearlyPrice: 399000,
    maxUsers: 10,
    maxProjects: 3,
    maxQRCodes: 100,
    features: JSON.stringify([
      'Tối đa 10 người dùng',
      'Tối đa 3 dự án',
      '100 mã QR',
      'Quản lý công việc cơ bản',
      'Báo cáo tiêu chuẩn',
      'Hỗ trợ email',
    ]),
    isActive: true,
    sortOrder: 1,
  },
  {
    planKey: 'BUSINESS',
    displayName: 'Business',
    monthlyPrice: 999000,
    yearlyPrice: 799000,
    maxUsers: 50,
    maxProjects: 20,
    maxQRCodes: 500,
    features: JSON.stringify([
      'Tối đa 50 người dùng',
      'Dự án không giới hạn',
      '500 mã QR',
      'Quản lý công việc nâng cao',
      'Báo cáo chi tiết',
      'Chat nhóm & File sharing',
      'Hỗ trợ ưu tiên 24/7',
      'API Integration',
    ]),
    isActive: true,
    sortOrder: 2,
  },
  {
    planKey: 'ENTERPRISE',
    displayName: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 999,
    maxProjects: 999,
    maxQRCodes: 9999,
    features: JSON.stringify([
      'Người dùng không giới hạn',
      'Dự án không giới hạn',
      'QR Code không giới hạn',
      'Tính năng tùy chỉnh theo yêu cầu',
      'SLA đảm bảo 99.9%',
      'Dedicated support',
      'On-premise deployment',
    ]),
    isActive: true,
    sortOrder: 3,
  },
];

@Injectable()
export class MasterAdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async findAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, projects: true, qrcodes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isTenantAdmin: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found.`);
    }
    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    await this.findOneTenant(tenantId);
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ...dto },
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      include: {
        tenant: { select: { name: true } },
        role: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserStatus(userId: string, status: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  private saveAvatar(base64String: string): string | null {
    if (!base64String || !base64String.startsWith('data:image')) return null;

    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const fileName = `avatar_${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/avatars/${fileName}`; // Trả về đường dẫn relative
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
    return null;
  }

  async createUser(dto: any) {
    const { email, password, fullName, isTenantAdmin, isSuperAdmin, tenantId, status, avatar } = dto;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarPath = this.saveAvatar(avatar || '');

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || email.split('@')[0],
        isTenantAdmin: isTenantAdmin || false,
        isSuperAdmin: isSuperAdmin || false,
        tenantId,
        status: status || 'active',
        avatar: avatarPath,
      },
    });
  }

  async updateUser(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete data.password;
    }

    if (dto.avatar && dto.avatar.startsWith('data:image')) {
      const newPath = this.saveAvatar(dto.avatar);
      if (newPath) data.avatar = newPath;
    } else if (dto.avatar?.startsWith('http')) {
      delete data.avatar;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async impersonateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.authService.signToken(
      user.id,
      user.tenantId,
      user.isTenantAdmin,
      user.isSuperAdmin,
      user.email,
      user.fullName,
      user.role,
    );
  }

  async getSystemStats() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    const cpuUsage = cpus.map((cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return Math.round((1 - idle / total) * 100);
    });
    const avgCpu = Math.round(
      cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length,
    );

    let diskTotal = 0,
      diskUsed = 0;
    try {
      const { execSync } = require('child_process');
      const dfOutput = execSync(
        "df / --output=size,used --block-size=1 | tail -1",
      )
        .toString()
        .trim();
      const [size, used] = dfOutput.split(/\s+/).map(Number);
      diskTotal = size;
      diskUsed = used;
    } catch {}

    const tenantCount = await this.prisma.tenant.count();
    const userCount = await this.prisma.user.count();
    const incidentCount = await this.prisma.incident.count();

    return {
      cpu: {
        usage: avgCpu,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: Math.round((usedMem / totalMem) * 100),
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        free: diskTotal - diskUsed,
        percent: diskTotal
          ? Math.round((diskUsed / diskTotal) * 100)
          : 0,
      },
      uptime: { seconds: uptime, formatted: formatUptime(uptime) },
      os: {
        platform: os.platform(),
        hostname: os.hostname(),
        arch: os.arch(),
      },
      stats: { tenants: tenantCount, users: userCount, incidents: incidentCount },
    };
  }

  // ─── REVENUE ─────────────────────────────────────────────────────────────────

  async getRevenue(filters: {
    startDate?: string;
    endDate?: string;
    plan?: string;
    tenantId?: string;
    status?: string;
    groupBy?: 'day' | 'month' | 'year';
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const {
      startDate,
      endDate,
      plan,
      tenantId,
      status = 'PAID',
      groupBy = 'month',
      page = 1,
      limit = 20,
      search,
    } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan.toUpperCase();
    if (tenantId) where.tenantId = tenantId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { tenant: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Total stats
    const [totalCount, allPaid] = await Promise.all([
      this.prisma.paymentOrder.count({ where }),
      this.prisma.paymentOrder.findMany({
        where: { ...where, status: 'PAID' },
        select: { amount: true, createdAt: true, plan: true },
      }),
    ]);

    const totalRevenue = allPaid.reduce((s, o) => s + o.amount, 0);

    // Paginated transactions
    const transactions = await this.prisma.paymentOrder.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, subscriptionPlan: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Chart data grouped by time
    const chartData = this.groupRevenueByTime(allPaid, groupBy);

    // Revenue by plan
    const byPlan: Record<string, number> = {};
    allPaid.forEach((o) => {
      byPlan[o.plan] = (byPlan[o.plan] || 0) + o.amount;
    });

    // Summary cards: this month vs last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonth, lastMonth] = await Promise.all([
      this.prisma.paymentOrder.aggregate({
        where: { status: 'PAID', createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.paymentOrder.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const thisMonthRevenue = thisMonth._sum.amount || 0;
    const lastMonthRevenue = lastMonth._sum.amount || 0;
    const growth =
      lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 100;

    return {
      summary: {
        totalRevenue,
        totalTransactions: totalCount,
        thisMonthRevenue,
        lastMonthRevenue,
        thisMonthCount: thisMonth._count,
        growth,
      },
      chartData,
      byPlan,
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  private groupRevenueByTime(
    orders: { amount: number; createdAt: Date; plan: string }[],
    groupBy: 'day' | 'month' | 'year',
  ) {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      let key: string;
      if (groupBy === 'day') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (groupBy === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = `${d.getFullYear()}`;
      }
      map[key] = (map[key] || 0) + o.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }

  async getRevenueExportData(filters: any) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.plan) where.plan = filters.plan.toUpperCase();
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.paymentOrder.findMany({
      where,
      include: {
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── VOUCHER MANAGEMENT ──────────────────────────────────────────────────────

  async getVouchers() {
    return this.prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createVoucher(dto: any) {
    const existing = await this.prisma.voucher.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new Error(`Voucher ${dto.code} already exists`);

    return this.prisma.voucher.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: Number(dto.value),
        maxUses: dto.maxUses ? Number(dto.maxUses) : null,
        isActive: dto.isActive ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async updateVoucher(code: string, dto: any) {
    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = Number(dto.value);
    if (dto.maxUses !== undefined) data.maxUses = dto.maxUses ? Number(dto.maxUses) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    return this.prisma.voucher.update({
      where: { code: code.toUpperCase() },
      data,
    });
  }

  async deleteVoucher(code: string) {
    return this.prisma.voucher.delete({
      where: { code: code.toUpperCase() },
    });
  }

  // ─── PLAN CONFIG ──────────────────────────────────────────────────────────────

  async getPlanConfigs() {
    let configs = await this.prisma.planConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Seed defaults if empty
    if (configs.length === 0) {
      await this.prisma.planConfig.createMany({ data: DEFAULT_PLANS });
      configs = await this.prisma.planConfig.findMany({
        orderBy: { sortOrder: 'asc' },
      });
    }

    return configs.map((c) => ({
      ...c,
      features: this.parseFeatures(c.features),
    }));
  }

  async updatePlanConfig(planKey: string, dto: any) {
    const existing = await this.prisma.planConfig.findUnique({
      where: { planKey: planKey.toUpperCase() },
    });

    const data: any = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.monthlyPrice !== undefined) data.monthlyPrice = Number(dto.monthlyPrice);
    if (dto.yearlyPrice !== undefined) data.yearlyPrice = Number(dto.yearlyPrice);
    if (dto.maxUsers !== undefined) data.maxUsers = Number(dto.maxUsers);
    if (dto.maxProjects !== undefined) data.maxProjects = Number(dto.maxProjects);
    if (dto.maxQRCodes !== undefined) data.maxQRCodes = Number(dto.maxQRCodes);
    if (dto.features !== undefined) {
      data.features = Array.isArray(dto.features)
        ? JSON.stringify(dto.features)
        : dto.features;
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (existing) {
      const updated = await this.prisma.planConfig.update({
        where: { planKey: planKey.toUpperCase() },
        data,
      });

      // Propagate updated limits to all tenants currently on this plan immediately
      await this.prisma.tenant.updateMany({
        where: { subscriptionPlan: planKey.toUpperCase() },
        data: {
          maxUsers: updated.maxUsers,
          maxProjects: updated.maxProjects,
          maxQRCodes: updated.maxQRCodes,
        }
      });

      return { ...updated, features: this.parseFeatures(updated.features) };
    } else {
      // Create if not exists
      const plan = DEFAULT_PLANS.find(
        (p) => p.planKey === planKey.toUpperCase(),
      );
      const created = await this.prisma.planConfig.create({
        data: {
          planKey: planKey.toUpperCase(),
          displayName: dto.displayName || planKey,
          monthlyPrice: Number(dto.monthlyPrice || 0),
          yearlyPrice: Number(dto.yearlyPrice || 0),
          maxUsers: Number(dto.maxUsers || 5),
          maxProjects: Number(dto.maxProjects || 1),
          maxQRCodes: Number(dto.maxQRCodes || 100),
          features: data.features || (plan ? plan.features : '[]'),
          sortOrder: plan?.sortOrder ?? 99,
        },
      });
      return { ...created, features: this.parseFeatures(created.features) };
    }
  }

  private parseFeatures(features: string): string[] {
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  }

  // ─── PLAN STATS ───────────────────────────────────────────────────────────────

  async getPlanStats() {
    // Auto-seed if empty
    await this.getPlanConfigs();

    const [tenants, planConfigs] = await Promise.all([
      this.prisma.tenant.groupBy({
        by: ['subscriptionPlan'],
        _count: { subscriptionPlan: true },
      }),
      this.prisma.planConfig.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const revenueByPlan = await this.prisma.paymentOrder.groupBy({
      by: ['plan'],
      where: { status: 'PAID' },
      _sum: { amount: true },
      _count: true,
    });

    const planMap = Object.fromEntries(
      tenants.map((t) => [t.subscriptionPlan, t._count.subscriptionPlan]),
    );
    const revenueMap = Object.fromEntries(
      revenueByPlan.map((r) => [r.plan, { revenue: r._sum.amount || 0, count: r._count }]),
    );

    return planConfigs.map((p) => ({
      ...p,
      features: this.parseFeatures(p.features),
      tenantCount: planMap[p.planKey] || 0,
      revenue: revenueMap[p.planKey]?.revenue || 0,
      transactionCount: revenueMap[p.planKey]?.count || 0,
    }));
  }

  async getTenantPaymentHistory(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subscriptionPlan: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const payments = await this.prisma.paymentOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const total = payments
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);

    return { tenant, payments, totalSpent: total };
  }

  async createPlanConfig(dto: any) {
    const existing = await this.prisma.planConfig.findUnique({
      where: { planKey: dto.planKey.toUpperCase() },
    });
    if (existing) throw new Error(`Plan ${dto.planKey} already exists`);

    const maxOrder = await this.prisma.planConfig.aggregate({ _max: { sortOrder: true } });
    const created = await this.prisma.planConfig.create({
      data: {
        planKey: dto.planKey.toUpperCase(),
        displayName: dto.displayName || dto.planKey,
        monthlyPrice: Number(dto.monthlyPrice || 0),
        yearlyPrice: Number(dto.yearlyPrice || 0),
        maxUsers: Number(dto.maxUsers || 5),
        maxProjects: Number(dto.maxProjects || 1),
        maxQRCodes: Number(dto.maxQRCodes || 100),
        features: Array.isArray(dto.features) ? JSON.stringify(dto.features) : (dto.features || '[]'),
        isActive: dto.isActive ?? true,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return { ...created, features: this.parseFeatures(created.features) };
  }

  async deletePlanConfig(planKey: string) {
    const existing = await this.prisma.planConfig.findUnique({
      where: { planKey: planKey.toUpperCase() },
    });
    if (!existing) throw new NotFoundException(`Plan ${planKey} not found`);
    await this.prisma.planConfig.delete({ where: { planKey: planKey.toUpperCase() } });
    return { success: true, planKey };
  }

  async seedDefaultPlans() {
    for (const plan of DEFAULT_PLANS) {
      await this.prisma.planConfig.upsert({
        where: { planKey: plan.planKey },
        update: {},
        create: plan,
      });
    }
    return this.getPlanConfigs();
  }
}