import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
  Post,
  Delete,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { MasterAdminService } from './master-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('master-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class MasterAdminController {
  constructor(private readonly masterAdminService: MasterAdminService) {}

  // ─── TENANTS ─────────────────────────────────────────────────────────────────

  @Get('tenants')
  findAllTenants() {
    return this.masterAdminService.findAllTenants();
  }

  @Get('tenants/:id')
  findOneTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.masterAdminService.findOneTenant(id);
  }

  @Put('tenants/:id')
  updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.masterAdminService.updateTenant(id, updateTenantDto);
  }

  // ─── SYSTEM ──────────────────────────────────────────────────────────────────

  @Get('system-stats')
  getSystemStats() {
    return this.masterAdminService.getSystemStats();
  }

  // ─── USERS ───────────────────────────────────────────────────────────────────

  @Get('users')
  findAllUsers() {
    return this.masterAdminService.findAllUsers();
  }

  @Post('users')
  createUser(@Body() dto: any) {
    return this.masterAdminService.createUser(dto);
  }

  @Put('users/:id/status')
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.masterAdminService.updateUserStatus(id, status);
  }

  @Put('users/:id')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    return this.masterAdminService.updateUser(id, dto);
  }

  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string) {
    return this.masterAdminService.impersonateUser(userId);
  }

  // ─── REVENUE ─────────────────────────────────────────────────────────────────

  @Get('revenue')
  getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('plan') plan?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('groupBy') groupBy?: 'day' | 'month' | 'year',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.masterAdminService.getRevenue({
      startDate,
      endDate,
      plan,
      tenantId,
      status,
      groupBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
    });
  }

  @Get('revenue/export')
  async exportRevenue(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('plan') plan?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.masterAdminService.getRevenueExportData({
      startDate,
      endDate,
      plan,
      tenantId,
      status,
    });

    // Build CSV
    const headers = ['Mã giao dịch', 'Tenant', 'Gói', 'Số tiền gốc (VND)', 'Số tiền giảm (VND)', 'Mã Voucher', 'Số tiền thực tế (VND)', 'Trạng thái', 'Ngày tạo'];
    const rows = data.map((o: any) => [
      o.orderCode,
      o.tenant?.name || '',
      o.plan,
      o.originalAmount || o.amount,
      o.discountAmount || 0,
      o.voucherCode || '',
      o.amount,
      o.status,
      new Date(o.createdAt).toLocaleString('vi-VN'),
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom = '\uFEFF'; // BOM for Excel UTF-8
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="doanh-thu-${Date.now()}.csv"`);
    res.send(bom + csvContent);
  }

  // ─── VOUCHER MANAGEMENT ──────────────────────────────────────────────────────

  @Get('vouchers')
  getVouchers() {
    return this.masterAdminService.getVouchers();
  }

  @Post('vouchers')
  createVoucher(@Body() dto: any) {
    return this.masterAdminService.createVoucher(dto);
  }

  @Put('vouchers/:code')
  updateVoucher(@Param('code') code: string, @Body() dto: any) {
    return this.masterAdminService.updateVoucher(code, dto);
  }

  @Delete('vouchers/:code')
  deleteVoucher(@Param('code') code: string) {
    return this.masterAdminService.deleteVoucher(code);
  }

  // ─── PLAN CONFIG ─────────────────────────────────────────────────────────────

  @Get('plan-config')
  getPlanConfigs() {
    return this.masterAdminService.getPlanConfigs();
  }

  @Post('plan-config')
  createPlanConfig(@Body() dto: any) {
    return this.masterAdminService.createPlanConfig(dto);
  }

  @Put('plan-config/:planKey')
  updatePlanConfig(
    @Param('planKey') planKey: string,
    @Body() dto: any,
  ) {
    return this.masterAdminService.updatePlanConfig(planKey, dto);
  }

  @Delete('plan-config/:planKey')
  deletePlanConfig(@Param('planKey') planKey: string) {
    return this.masterAdminService.deletePlanConfig(planKey);
  }

  @Post('plan-config/seed-defaults')
  seedDefaultPlans() {
    return this.masterAdminService.seedDefaultPlans();
  }

  // ─── PLAN STATS ──────────────────────────────────────────────────────────────

  @Get('plan-stats')
  getPlanStats() {
    return this.masterAdminService.getPlanStats();
  }

  @Get('tenant-payments/:tenantId')
  getTenantPaymentHistory(@Param('tenantId') tenantId: string) {
    return this.masterAdminService.getTenantPaymentHistory(tenantId);
  }
}
