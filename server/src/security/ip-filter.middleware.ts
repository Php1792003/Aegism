import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IpFilterMiddleware implements NestMiddleware {
  // Bộ đệm in-memory để không phải query DB ở mọi request (Tối ưu tốc độ cực hạn)
  private blockedIpsCache: Set<string> = new Set();
  private lastUpdate: number = 0;

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // Cập nhật Cache mỗi 60 giây để không phải query Database
    const now = Date.now();
    if (now - this.lastUpdate > 60000) {
      const blocked = await this.prisma.blacklistedIP.findMany({
        where: { isBlocked: true },
        select: { ipAddress: true },
      });
      this.blockedIpsCache = new Set(blocked.map(b => b.ipAddress));
      this.lastUpdate = now;
    }

    // Nếu IP nằm trong danh sách cấm
    if (this.blockedIpsCache.has(ip)) {
      // Có thể cập nhật lại query DB trực tiếp để chắc chắn nếu muốn,
      // nhưng cache 1 phút là đủ an toàn.
      throw new ForbiddenException('Your IP has been temporarily blocked due to suspicious activity.');
    }

    next();
  }
}
