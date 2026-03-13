import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getSummary(tenantId: string) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0);

        // Chạy song song tất cả queries
        const [
            totalProjects,
            totalQrCodes,
            totalUsers,
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            totalIncidents,
            weekScanLogs,
            recentLogs,
            recentIncidents,
            subscription,
        ] = await Promise.all([
            this.prisma.project.count({ where: { tenantId } }),
            this.prisma.qRCode.count({ where: { tenantId } }),
            this.prisma.user.count({ where: { tenantId } }),
            this.prisma.task.count({ where: { tenantId } }),
            this.prisma.task.count({ where: { tenantId, status: 'PENDING' } }),
            this.prisma.task.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
            this.prisma.task.count({ where: { tenantId, status: 'COMPLETED' } }),
            this.prisma.incident.count({ where: { tenantId } }),
            this.prisma.scanLog.findMany({
                where: {
                    tenantId,
                    scannedAt: { gte: startOfWeek },
                },
                select: { scannedAt: true, status: true },
                orderBy: { scannedAt: 'asc' },
            }),
            this.prisma.scanLog.findMany({
                where: { tenantId },
                take: 5,
                orderBy: { scannedAt: 'desc' },
                include: {
                    user: { select: { fullName: true, avatar: true } },
                    qrCode: { select: { name: true, location: true } },
                },
            }),
            this.prisma.incident.findMany({
                where: { tenantId },
                take: 5,
                orderBy: { reportedAt: 'desc' },
                include: {
                    qrCode: { select: { name: true } },
                },
            }),
            this.prisma.subscription.findFirst({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        // Build chart data: 7 ngày gần nhất
        const chartLabels: string[] = [];
        const scanData: number[] = [];
        const incidentData: number[] = [];

        for (let i = 6; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(now.getDate() - i);
            const dayStr = day.toLocaleDateString('vi-VN', { weekday: 'short' });
            chartLabels.push(dayStr);

            const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);

            const scans = weekScanLogs.filter(l => {
                const t = new Date(l.scannedAt);
                return t >= dayStart && t <= dayEnd;
            });
            scanData.push(scans.length);
            incidentData.push(scans.filter(l => l.status === 'ISSUE').length);
        }

        return {
            stats: {
                totalProjects,
                totalQrCodes,
                totalUsers,
                tasks: { total: totalTasks, pending: pendingTasks, inProgress: inProgressTasks, completed: completedTasks },
                totalIncidents,
                scanThisWeek: weekScanLogs.length,
            },
            chart: {
                labels: chartLabels,
                scanData,
                incidentData,
            },
            recentLogs: recentLogs.map(l => ({
                id: l.id,
                scannedAt: l.scannedAt,
                status: l.status,
                qrName: (l as any).qrCode?.name || 'N/A',
                qrLocation: (l as any).qrCode?.location || '',
                userName: (l as any).user?.fullName || 'N/A',
                userAvatar: (l as any).user?.avatar || null,
            })),
            recentIncidents: recentIncidents.map(inc => ({
                id: inc.id,
                createdAt: inc.reportedAt,
                description: inc.description,
                qrName: (inc as any).qrCode?.name || 'N/A',
                status: inc.status,
            })),
            subscription: subscription ? {
                plan: subscription.plan,
                status: subscription.status,
                expiresAt: subscription.endDate,
            } : null,
        };
    }
}	
