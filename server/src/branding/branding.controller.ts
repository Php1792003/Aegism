import { Controller, Get, Put, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { BrandingService } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('branding')
@UseGuards(JwtAuthGuard)
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  async getBranding(@Request() req) {
    return this.brandingService.getBranding(req.user.tenantId);
  }

  @Put()
  async updateBranding(@Request() req, @Body() dto: UpdateBrandingDto) {
    if (!req.user.isTenantAdmin && !req.user.isSuperAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới được phép tùy chỉnh thương hiệu.');
    }
    return this.brandingService.updateBranding(req.user.tenantId, dto);
  }
}
