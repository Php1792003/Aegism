import { Module } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';
import { AiAnalysisService } from '../report/ai-analysis.service';
import { IncidentModule } from '../incident/incident.module';

@Module({
  imports: [PrismaModule, RoleModule, IncidentModule],
  controllers: [ScanController],
  providers: [ScanService, AiAnalysisService],
})
export class ScanModule {}
