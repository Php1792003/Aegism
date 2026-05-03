import * as os from 'os';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthService } from '../auth/auth.service';


function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

@Injectable()
export class MasterAdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) { }

  async findAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, projects: true, qrcodes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isTenantAdmin: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found.`);
    }
    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    await this.findOneTenant(tenantId);
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ...dto },
    });
  }

  async impersonateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }, // QUAN TRỌNG: Phải include role để lấy dữ liệu
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // SỬA LỖI Ở ĐÂY: Truyền đủ 7 tham số cho signToken
    return this.authService.signToken(
      user.id,
      user.tenantId,
      user.isTenantAdmin, // Tham số 3: isTenantAdmin
      user.isSuperAdmin,  // Tham số 4: isSuperAdmin (thường là false khi mạo danh user thường)
      user.email,         // Tham số 5: email
      user.fullName,      // Tham số 6: fullName
      user.role           // Tham số 7: role object
    );
  }

  async getSystemStats() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    // CPU usage (average across cores)
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return Math.round((1 - idle / total) * 100);
    });
    const avgCpu = Math.round(cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length);

    // Disk usage via /proc/mounts (Linux)
    let diskTotal = 0, diskUsed = 0;
    try {
      const { execSync } = require('child_process');
      const dfOutput = execSync("df / --output=size,used --block-size=1 | tail -1").toString().trim();
      const [size, used] = dfOutput.split(/\s+/).map(Number);
      diskTotal = size;
      diskUsed = used;
    } catch {}

    // Tenant stats
    const tenantCount = await this.prisma.tenant.count();
    const userCount = await this.prisma.user.count();
    const incidentCount = await this.prisma.incident.count();

    return {
      cpu: { usage: avgCpu, cores: cpus.length, model: cpus[0]?.model || 'Unknown' },
      memory: { total: totalMem, used: usedMem, free: freeMem, percent: Math.round((usedMem / totalMem) * 100) },
      disk: { total: diskTotal, used: diskUsed, free: diskTotal - diskUsed, percent: diskTotal ? Math.round((diskUsed / diskTotal) * 100) : 0 },
      uptime: { seconds: uptime, formatted: formatUptime(uptime) },
      os: { platform: os.platform(), hostname: os.hostname(), arch: os.arch() },
      stats: { tenants: tenantCount, users: userCount, incidents: incidentCount }
    };
  }

}