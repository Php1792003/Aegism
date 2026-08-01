import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiIntegrationService } from './api-integration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Controller('api-integration')
@UseGuards(JwtAuthGuard)
export class ApiIntegrationController {
  constructor(private readonly apiIntegrationService: ApiIntegrationService) {}

  // ═══════════════════════════════════════════════════════════════════
  //  API KEYS
  // ═══════════════════════════════════════════════════════════════════

  @Get('api-keys')
  async getApiKeys(@Request() req: RequestWithUser) {
    return this.apiIntegrationService.getApiKeys(req.user.tenantId);
  }

  @Post('api-keys')
  async createApiKey(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Request() req: RequestWithUser,
  ) {
    return this.apiIntegrationService.createApiKey(
      createApiKeyDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Put('api-keys/:id/revoke')
  async revokeApiKey(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    return this.apiIntegrationService.revokeApiKey(
      id,
      req.user.tenantId,
      req.user.userId,
      reason,
    );
  }

  @Delete('api-keys/:id')
  async deleteApiKey(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.apiIntegrationService.deleteApiKey(id, req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WEBHOOKS
  // ═══════════════════════════════════════════════════════════════════

  @Get('webhooks')
  async getWebhooks(@Request() req: RequestWithUser) {
    return this.apiIntegrationService.getWebhooks(req.user.tenantId);
  }

  @Post('webhooks')
  async createWebhook(
    @Body() createWebhookDto: CreateWebhookDto,
    @Request() req: RequestWithUser,
  ) {
    return this.apiIntegrationService.createWebhook(
      createWebhookDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete('webhooks/:id')
  async deleteWebhook(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.apiIntegrationService.deleteWebhook(id, req.user.tenantId);
  }

  @Post('webhooks/:id/test')
  async testWebhook(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.apiIntegrationService.testWebhook(id, req.user.tenantId);
  }

  @Get('webhooks/:id/logs')
  async getWebhookLogs(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.apiIntegrationService.getWebhookLogs(id, req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  STATS
  // ═══════════════════════════════════════════════════════════════════

  @Get('stats')
  async getStats(@Request() req: RequestWithUser) {
    return this.apiIntegrationService.getStats(req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SUPER ADMIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════
  // Cần gọi kiểm tra isSuperAdmin ở guard hoặc code
  
  @Get('superadmin/api-keys')
  async superAdminGetAllKeys(
    @Request() req: RequestWithUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Chỉ Super Admin mới có quyền truy cập');
    }
    return this.apiIntegrationService.superAdminGetAllKeys(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Put('superadmin/api-keys/:id/revoke')
  async superAdminRevokeKey(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Chỉ Super Admin mới có quyền truy cập');
    }
    return this.apiIntegrationService.superAdminRevokeKey(
      id,
      reason,
      req.user.userId,
    );
  }
}
