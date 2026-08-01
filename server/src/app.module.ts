import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Core Modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppMailerModule } from './mailer/mailer.module'; // Dùng module này, xóa cấu hình inline

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { RoleModule } from './role/role.module';
import { MemberModule } from './member/member.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { TaskModule } from './task/task.module';
import { ScanModule } from './scan/scan.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { MasterAdminModule } from './master-admin/master-admin.module';
import { ViewModule } from './view/view.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';
import { IncidentModule } from './incident/incident.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';
import { SecurityModule } from './security/security.module';
import { PromotionModule } from './promotion/promotion.module';
import { ApiIntegrationModule } from './api-integration/api-integration.module';
import { BrandingModule } from './branding/branding.module';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AuditInterceptor } from './security/audit.interceptor';

import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    PrismaModule,

    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: join(__dirname, '..', 'public'),
      }
    ),

    AppMailerModule,

    AuthModule,
    ProjectModule,
    RoleModule,
    MemberModule,
    QrcodeModule,
    TaskModule,
    ScanModule,
    AuditModule,
    NotificationModule,
    MasterAdminModule,
    ViewModule,
    DashboardModule,
    ReportModule,
    IncidentModule,
    ChatModule,
    UsersModule,
    PaymentModule,
    SecurityModule,
    PromotionModule,
    ApiIntegrationModule,
    BrandingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }