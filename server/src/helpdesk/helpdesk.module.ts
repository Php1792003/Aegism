import { Module } from '@nestjs/common';
import { HelpdeskController } from './helpdesk.controller';
import { HelpdeskService } from './helpdesk.service';
import { ResendService } from './resend.service';
import { ImapSyncService } from './imapsync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, NotificationModule, RoleModule],
  controllers: [HelpdeskController],
  providers: [HelpdeskService, ResendService, ImapSyncService],
  exports: [HelpdeskService],
})
export class HelpdeskModule {}
