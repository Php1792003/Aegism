import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('security')
@UseGuards(JwtAuthGuard) // Chỉ Admin/SuperAdmin được vào, có thể dùng role guard thêm sau
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('suspicious') suspicious = 'false',
  ) {
    return this.securityService.getAuditLogs(Number(page), Number(limit), suspicious === 'true');
  }

  @Get('audit-logs/:id')
  async getAuditLogDetail(@Param('id') id: string) {
    return this.securityService.getAuditLogDetail(id);
  }

  @Get('blacklisted-ips')
  async getBlacklistedIPs() {
    return this.securityService.getBlacklistedIPs();
  }

  @Post('unblock-ip/:id')
  async unblockIP(@Param('id') id: string) {
    return this.securityService.unblockIP(id);
  }

  @Post('block-ip')
  async blockIP(@Body() body: { ipAddress: string; reason: string }) {
    return this.securityService.blockIP(body.ipAddress, body.reason);
  }
}
