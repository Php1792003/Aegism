import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class BrandingService {
  constructor(private prisma: PrismaService) { }

  private async ensureEnterprise(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tổ chức không tồn tại');
    if (tenant.subscriptionPlan.toUpperCase() !== 'ENTERPRISE') {
      throw new ForbiddenException('Tính năng Tuỳ chỉnh Thương hiệu chỉ dành cho gói Enterprise.');
    }
    return tenant;
  }

  async getBranding(tenantId: string) {
    const tenant = await this.ensureEnterprise(tenantId);
    let logoHeight = 40;
    try {
        const rawTenant: any[] = await this.prisma.$queryRaw`SELECT "logoHeight" FROM "Tenant" WHERE id = ${tenantId}`;
        if (rawTenant && rawTenant.length > 0 && rawTenant[0].logoHeight) {
            logoHeight = rawTenant[0].logoHeight;
        }
    } catch (e) {
        // Ignore if column doesn't exist yet
    }

    return {
      appName: tenant.appName || 'AEGISM',
      primaryColor: tenant.primaryColor || '#2563EB',
      logo: tenant.logoUrl || null,
      logoHeight: logoHeight,
      domain: tenant.customDomain || '',
    };
  }

  async updateBranding(tenantId: string, dto: UpdateBrandingDto) {
    const tenant = await this.ensureEnterprise(tenantId);
    const updateData: any = {};

    if (dto.appName !== undefined) updateData.appName = dto.appName;
    if (dto.primaryColor !== undefined) updateData.primaryColor = dto.primaryColor;
    if (dto.domain !== undefined) updateData.customDomain = dto.domain;

    if (dto.logoHeight !== undefined) {
      try {
        await this.prisma.$executeRaw`UPDATE "Tenant" SET "logoHeight" = ${dto.logoHeight} WHERE id = ${tenantId}`;
      } catch (e) {
        // Ignore
      }
    }

    if (dto.logo) {
      if (dto.logo.startsWith('data:image')) {
        // Handle base64 upload
        const matches = dto.logo.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new BadRequestException('Định dạng hình ảnh không hợp lệ');
        }

        const ext = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // 2MB limit
        if (buffer.length > 2 * 1024 * 1024) {
          throw new BadRequestException('Kích thước ảnh tối đa là 2MB');
        }

        const uploadDir = path.join(process.cwd(), 'uploads', 'branding');
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }

        const fileName = `tenant_${tenantId}_logo_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, buffer);

        updateData.logoUrl = `http://localhost:3000/uploads/branding/${fileName}`; // Need to use full URL for frontend local dev. The best way is to let frontend prepend API_URL if it starts with /uploads. But for simplicity, we return relative URL here and fix in frontend.
        updateData.logoUrl = `/uploads/branding/${fileName}`;
      } else {
        updateData.logoUrl = dto.logo;
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    let logoHeight = 40;
    try {
        const rawTenant: any[] = await this.prisma.$queryRaw`SELECT "logoHeight" FROM "Tenant" WHERE id = ${tenantId}`;
        if (rawTenant && rawTenant.length > 0 && rawTenant[0].logoHeight) {
            logoHeight = rawTenant[0].logoHeight;
        }
    } catch (e) {
        // Ignore
    }

    return {
      appName: updated.appName || 'OPSERA',
      primaryColor: updated.primaryColor || '#2563EB',
      logo: updated.logoUrl || null,
      logoHeight: logoHeight,
      domain: updated.customDomain || '',
    };
  }
}
