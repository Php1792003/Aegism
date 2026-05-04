import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, RenewPlanDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Controller('master-admin/customers')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll() { return this.customerService.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.customerService.findOne(id); }

  @Post()
  create(@Body() dto: CreateCustomerDto) { return this.customerService.create(dto); }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.customerService.remove(id); }

  @Post(':id/renew')
  renewPlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RenewPlanDto) {
    return this.customerService.renewPlan(id, dto);
  }
}
