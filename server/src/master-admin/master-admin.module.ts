import { Module } from '@nestjs/common';
import { MasterAdminService } from './master-admin.service';
import { MasterAdminController } from './master-admin.controller';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MasterAdminController, CustomerController],
  providers: [MasterAdminService, CustomerService],
})
export class MasterAdminModule {}
