import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu tạo tenant Đại Sơn Long...');

  // 1. Tạo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Đại Sơn Long',
      subscriptionPlan: 'ENTERPRISE',
      isActive: true,
      maxQRCodes: 9999,
      maxUsers: 9999,
      maxProjects: 9999,
    },
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // 2. Tạo Role Admin cho tenant
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      tenantId: tenant.id,
      permissions: JSON.stringify([
        'VIEW_SCAN_LOGS',
        'MANAGE_USERS',
        'MANAGE_PROJECTS',
        'MANAGE_QRCODES',
        'MANAGE_ROLES',
        'VIEW_REPORTS',
        'MANAGE_INCIDENTS',
        'MANAGE_TASKS',
        'MANAGE_WORKFLOWS',
      ]),
    },
  });
  console.log(`✅ Role created: ${adminRole.name} (${adminRole.id})`);

  // 3. Hash password
  const hashedPassword = await bcrypt.hash('Phphcm179@', 10);

  // 4. Tạo User Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@daisonlong.com',
      password: hashedPassword,
      fullName: 'Admin Đại Sơn Long',
      isTenantAdmin: true,
      isSuperAdmin: false,
      status: 'active',
      tenantId: tenant.id,
      roleId: adminRole.id,
    },
  });
  console.log(`✅ User created: ${adminUser.fullName} (${adminUser.email})`);

  // 5. Tạo Subscription
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 99); // EXP = không hết hạn

  await prisma.subscription.create({
    data: {
      plan: 'EXP',
      price: 0,
      status: 'ACTIVE',
      startDate: now,
      endDate: endDate,
      autoRenew: true,
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Subscription created: EXP plan`);

  console.log('\n🎉 Seed hoàn tất!');
  console.log('─────────────────────────────────');
  console.log(`📧 Email    : admin@daisonlong.com`);
  console.log(`🔑 Password : Phphcm179@`);
  console.log(`🏢 Tenant   : Đại Sơn Long`);
  console.log(`📦 Plan     : EXP`);
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
