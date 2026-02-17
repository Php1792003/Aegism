import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // 1. Tạo Tenant (Công ty) mẫu
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Aegism Corp',
            subscriptionPlan: 'ENTERPRISE',
            isActive: true,
        },
    });

    // 2. Mã hóa mật khẩu (pass: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 3. Tạo User Super Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@aegism.com',
            password: hashedPassword,
            fullName: 'Super Admin',
            isSuperAdmin: true,
            isTenantAdmin: true,
            tenantId: tenant.id,
            status: 'active',
        },
    });

    console.log('🎉 Seed thành công!');
    console.log('👉 Email: admin@aegism.com');
    console.log('👉 Pass:  admin123');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());