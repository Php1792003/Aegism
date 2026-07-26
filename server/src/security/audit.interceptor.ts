import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from './security.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    // Tối ưu tốc độ: Ta bỏ qua các thao tác GET đọc thông tin hệ thống liên tục (polling) để tránh spam log
    // Bỏ qua query params khi check
    const endpointPath = req.url.split('?')[0];
    const ignoredEndpoints = ['/api/security/audit-logs', '/api/security/blacklisted-ips', '/api/master-admin/plan-stats', '/api/master-admin/tenants'];
    
    if (!ignoredEndpoints.includes(endpointPath)) {
      const payloadStr = JSON.stringify(req.body || {});
      const headerStr = JSON.stringify(req.headers || {});
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const userId = req.user?.userId || req.user?.id || null;
      const tenantId = req.user?.tenantId || null;
      const endpoint = req.url;
      const method = req.method;

      // Không block request. Đẩy việc ghi log và quét bảo mật chạy dưới nền.
      setImmediate(async () => {
        try {
          // Ghi lại Log
          const log = await this.prisma.auditLog.create({
            data: {
              userId,
              tenantId,
              action: `Thao tác ${method} dữ liệu`,
              endpoint,
              method,
              ipAddress,
              userAgent,
              payload: payloadStr,
              headers: headerStr,
            },
          });

          // Gọi AI quét ngầm
          await this.securityService.scanPayloadInBackground(
            log.id,
            ipAddress,
            payloadStr,
            headerStr,
          );
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      });
    }

    return next.handle();
  }
}
