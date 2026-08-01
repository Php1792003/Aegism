import { Module } from '@nestjs/common';
import { ApiIntegrationController } from './api-integration.controller';
import { ApiIntegrationService } from './api-integration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ApiIntegrationController],
  providers: [ApiIntegrationService],
  exports: [ApiIntegrationService],
})
export class ApiIntegrationModule {}
