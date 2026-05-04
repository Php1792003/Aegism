import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, RenewPlanDto } from './dto/create-customer.dto';

const PLAN_LIMITS: Record<string, { maxUsers: number; maxProjects: number; maxQRCodes: number; price: number }> = {
  FREE:       { maxUsers: 3,   maxProjects: 1,  maxQRCodes: 20,   price: 0 },
  STARTER:    { maxUsers: 5,   maxProjects: 1,  maxQRCodes: 100,  price: 200000 },
  PRO:        { maxUsers: 20,  maxProjects: 5,  maxQRCodes: 500,  price: 500000 },
  ENTERPRISE: { maxUsers: 100, maxProjects: 20, maxQRCodes: 9999, price: 1000000 },
};

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: { select: { users: true, projects: true, qrcodes: true } },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 10 },
        paymentOrders: { where: { status: 'PAID' }, select: { amount: true, createdAt: true, plan: true } },
        users: {
          where: { isTenantAdmin: true },
          select: { id: true, email: true, fullName: true, avatar: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return tenants.map(t => this.format(t));
  }

  async findOne(id: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, projects: true, qrcodes: true } },
        subscriptions: { orderBy: { createdAt: 'desc' } },
        paymentOrders: { orderBy: { createdAt: 'desc' } },
        users: {
          where: { isTenantAdmin: true },
          select: { id: true, email: true, fullName: true, avatar: true },
        },
      },
    });
    if (!t) throw new NotFoundException(`Tenant ${id} not found`);
    return this.format(t);
  }

  async create(dto: CreateCustomerDto) {
    const plan = (dto.subscriptionPlan || 'STARTER').toUpperCase();
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.STARTER;
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        subscriptionPlan: plan,
        isActive: dto.isActive ?? true,
        maxUsers: dto.maxUsers ?? limits.maxUsers,
        maxProjects: dto.maxProjects ?? limits.maxProjects,
        maxQRCodes: dto.maxQRCodes ?? limits.maxQRCodes,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async update(id: string, dto: Partial<CreateCustomerDto>) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.subscriptionPlan && { subscriptionPlan: dto.subscriptionPlan.toUpperCase() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.maxUsers && { maxUsers: dto.maxUsers }),
        ...(dto.maxProjects && { maxProjects: dto.maxProjects }),
        ...(dto.maxQRCodes && { maxQRCodes: dto.maxQRCodes }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tenant.delete({ where: { id } });
    return { message: 'Deleted successfully' };
  }

  async renewPlan(id: string, dto: RenewPlanDto) {
    const tenant = await this.findOne(id);
    const plan = dto.plan.toUpperCase();
    const limits = PLAN_LIMITS[plan];
    if (!limits) throw new BadRequestException(`Invalid plan: ${plan}`);

    const current = tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : new Date();
    const base = current > new Date() ? current : new Date();
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + dto.months);
    const amount = limits.price * dto.months;

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        subscriptionPlan: plan,
        subscriptionExpiresAt: newExpiry,
        isActive: true,
        maxUsers: limits.maxUsers,
        maxProjects: limits.maxProjects,
        maxQRCodes: limits.maxQRCodes,
      },
    });

    await this.prisma.subscription.create({
      data: {
        tenantId: id, plan, price: amount, status: 'ACTIVE',
        startDate: new Date(), endDate: newExpiry, paymentMethod: 'MANUAL',
        lastPaymentDate: new Date(),
      },
    });

    if (amount > 0) {
      await this.prisma.paymentOrder.create({
        data: {
          orderCode: `MANUAL-${Date.now()}`,
          tenantId: id, plan, amount, status: 'PAID',
        },
      });
    }

    return { ...updated, newExpiry, amount };
  }

  private format(t: any) {
    const totalSpent = (t.paymentOrders || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const admin = t.users?.[0];
    const isExpired = t.subscriptionExpiresAt && new Date(t.subscriptionExpiresAt) < new Date();
    return {
      id: t.id,
      name: t.name,
      plan: t.subscriptionPlan,
      status: t.isActive ? (isExpired ? 'expired' : 'active') : 'suspended',
      isActive: t.isActive,
      subscriptionExpiresAt: t.subscriptionExpiresAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      maxUsers: t.maxUsers,
      maxProjects: t.maxProjects,
      maxQRCodes: t.maxQRCodes,
      adminEmail: admin?.email || null,
      adminName: admin?.fullName || null,
      adminAvatar: admin?.avatar || null,
      totalSpent,
      renewalCount: (t.subscriptions || []).length,
      userCount: t._count?.users || 0,
      projectCount: t._count?.projects || 0,
      qrcodeCount: t._count?.qrcodes || 0,
      subscriptions: t.subscriptions || [],
      paymentOrders: t.paymentOrders || [],
    };
  }
}
