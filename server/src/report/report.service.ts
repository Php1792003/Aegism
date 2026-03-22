import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { AiAnalysisService } from './ai-analysis.service';
import { startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class ReportService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiAnalysisService
    ) { }

    async getDashboardStats(projectId: string, tenantId: string, startDate?: string, endDate?: string) {
        if (!projectId) throw new BadRequestException('Project ID is required');

        const dateRange: any = {};
        if (startDate && endDate) {
            dateRange.gte = startOfDay(new Date(startDate));
            dateRange.lte = endOfDay(new Date(endDate));
        }

        const incidentFilter: any = { projectId, tenantId };
        if (startDate && endDate) incidentFilter.reportedAt = dateRange;

        const taskFilter: any = { projectId, tenantId };
        if (startDate && endDate) taskFilter.createdAt = dateRange;

        const totalIncidents = await this.prisma.incident.count({ where: incidentFilter });
        const totalTasks = await this.prisma.task.count({ where: taskFilter });
        const completedTasks = await this.prisma.task.count({ where: { ...taskFilter, status: 'COMPLETED' } });
        const taskCompletionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        const activeStaff = await this.prisma.projectMember.count({ where: { projectId } });

        const incidents = await this.prisma.incident.findMany({
            where: incidentFilter,
            select: { reportedAt: true },
            orderBy: { reportedAt: 'asc' }
        });

        const incidentMap = new Map<string, number>();
        incidents.forEach(inc => {
            if (inc.reportedAt) {
                const dateStr = format(inc.reportedAt, 'yyyy-MM-dd');
                incidentMap.set(dateStr, (incidentMap.get(dateStr) || 0) + 1);
            }
        });

        const incidentChartData: { labels: string[], actual: number[], plan: number[] } = { labels: [], actual: [], plan: [] };
        if (incidentMap.size > 0) {
            for (const [date, count] of incidentMap.entries()) {
                incidentChartData.labels.push(date);
                incidentChartData.actual.push(count);
                incidentChartData.plan.push(5);
            }
        } else {
            incidentChartData.labels.push(format(new Date(), 'yyyy-MM-dd'));
            incidentChartData.actual.push(0);
            incidentChartData.plan.push(5);
        }

        const incidentsForRole = await this.prisma.incident.findMany({
            where: incidentFilter,
            select: { department: true }
        });

        const roleCountMap = new Map<string, number>();
        incidentsForRole.forEach(inc => {
            const roleName = inc.department || 'Chưa phân công';
            roleCountMap.set(roleName, (roleCountMap.get(roleName) || 0) + 1);
        });

        const incidentByRoleData: { labels: string[], data: number[] } = { labels: [], data: [] };
        roleCountMap.forEach((count, roleName) => {
            incidentByRoleData.labels.push(roleName);
            incidentByRoleData.data.push(count);
        });

        const completedTasksList = await this.prisma.task.findMany({
            where: { projectId, tenantId, status: 'COMPLETED', ...taskFilter, assigneeId: { not: null } },
            include: { assignee: { select: { id: true, fullName: true } } }
        });

        const userStats = new Map<string, { name: string, count: number }>();
        completedTasksList.forEach(task => {
            const uid = task.assigneeId;
            if (!uid) return;
            const uname = task.assignee?.fullName || 'Unknown';
            if (!userStats.has(uid)) userStats.set(uid, { name: uname, count: 0 });
            const stat = userStats.get(uid);
            if (stat) stat.count += 1;
        });

        const topStaff = Array.from(userStats.values())
            .map(u => ({ name: u.name, scans: u.count, score: u.count * 5 }))
            .sort((a, b) => b.score - a.score);

        return {
            stats: { totalPatrols: 0, patrolGrowth: 0, totalIncidents, taskCompletionRate, activeStaff },
            charts: { patrol: incidentChartData, incident: incidentByRoleData },
            topStaff
        };
    }

    async exportExcelReport(projectId: string, tenantId: string, startDate?: string, endDate?: string) {
        const statsData = await this.getDashboardStats(projectId, tenantId, startDate, endDate);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        // ── Lấy toàn bộ ScanLog theo projectId + date range ──
        const scanFilter: any = { tenantId };
        if (startDate && endDate) {
            scanFilter.scannedAt = {
                gte: startOfDay(new Date(startDate)),
                lte: endOfDay(new Date(endDate)),
            };
        }

        const scanLogs = await this.prisma.scanLog.findMany({
            where: {
                ...scanFilter,
                qrCode: { projectId },
            },
            include: {
                qrCode: { select: { name: true, location: true } },
                user: { select: { fullName: true, role: { select: { name: true } } } },
            },
            orderBy: { scannedAt: 'asc' },
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AEGISM';
        workbook.created = new Date();

        // ════════════════════════════════
        // SHEET 1: Thông tin chung
        // ════════════════════════════════
        const summarySheet = workbook.addWorksheet('Tổng quan');

        const titleRow = summarySheet.addRow(['BÁO CÁO DỰ ÁN - ' + project.name.toUpperCase()]);
        titleRow.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
        summarySheet.mergeCells('A1:D1');

        summarySheet.addRow(['Dự án', project.name]);
        summarySheet.addRow(['Thời gian', `${startDate || 'Toàn bộ'} đến ${endDate || 'Toàn bộ'}`]);
        summarySheet.addRow(['Xuất lúc', format(new Date(), 'dd/MM/yyyy HH:mm:ss')]);
        summarySheet.addRow([]);

        const statsTitle = summarySheet.addRow(['THỐNG KÊ CHUNG']);
        statsTitle.font = { bold: true, size: 12 };
        summarySheet.addRow(['Chỉ số', 'Giá trị']);
        summarySheet.addRow(['Tổng số sự cố', statsData.stats.totalIncidents]);
        summarySheet.addRow(['Tỷ lệ hoàn thành Task', statsData.stats.taskCompletionRate + '%']);
        summarySheet.addRow(['Nhân sự trong dự án', statsData.stats.activeStaff]);
        summarySheet.addRow(['Tổng lượt quét QR', scanLogs.length]);
        summarySheet.addRow([
            'Lượt quét hợp lệ',
            scanLogs.filter(l => l.status === 'VALID').length
        ]);
        summarySheet.addRow([
            'Lượt sai vị trí',
            scanLogs.filter(l => l.status === 'INVALID_LOCATION').length
        ]);
        summarySheet.addRow([
            'Lượt báo sự cố',
            scanLogs.filter(l => l.status === 'ISSUE').length
        ]);
        summarySheet.addRow([]);

        const staffTitle = summarySheet.addRow(['BẢNG XẾP HẠNG NHÂN VIÊN']);
        staffTitle.font = { bold: true, size: 12 };
        const staffHeader = summarySheet.addRow(['Xếp hạng', 'Họ tên', 'Task hoàn thành', 'Điểm số']);
        staffHeader.font = { bold: true };
        staffHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
        statsData.topStaff.forEach((staff, idx) => {
            summarySheet.addRow([idx + 1, staff.name, staff.scans, staff.score]);
        });

        summarySheet.getColumn('A').width = 30;
        summarySheet.getColumn('B').width = 30;
        summarySheet.getColumn('C').width = 20;
        summarySheet.getColumn('D').width = 15;

        // ════════════════════════════════
        // SHEET 2: Nhật ký quét mã QR
        // ════════════════════════════════
        const scanSheet = workbook.addWorksheet('Nhật ký quét QR');

        const scanHeader = scanSheet.addRow([
            'STT',
            'Thời gian quét',
            'Điểm quét',
            'Vị trí',
            'Nhân viên',
            'Bộ phận',
            'Trạng thái',
            'Kinh độ',
            'Vĩ độ',
            'Độ chính xác GPS (m)',
            'Điểm nghi ngờ',
            'Ghi chú',
        ]);

        scanHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        scanHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
        scanHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        scanSheet.getRow(1).height = 28;

        scanLogs.forEach((log, idx) => {
            const statusLabel =
                log.status === 'VALID' ? 'Hợp lệ' :
                log.status === 'INVALID_LOCATION' ? 'Sai vị trí' :
                log.status === 'ISSUE' ? 'Sự cố' : log.status;

            const row = scanSheet.addRow([
                idx + 1,
                format(new Date(log.scannedAt), 'dd/MM/yyyy HH:mm:ss'),
                log.qrCode?.name || 'N/A',
                log.qrCode?.location || 'N/A',
                log.user?.fullName || 'N/A',
                log.user?.role?.name || 'N/A',
                statusLabel,
                log.longitude ?? '',
                log.latitude ?? '',
                log.accuracy ?? '',
                (log as any).suspicionScore ?? 0,
                log.notes || '',
            ]);

            // Màu theo trạng thái
            const statusCell = row.getCell(7);
            if (log.status === 'VALID') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
                statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
            } else if (log.status === 'INVALID_LOCATION') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                statusCell.font = { color: { argb: 'FF92400E' }, bold: true };
            } else if (log.status === 'ISSUE') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
            }

            row.alignment = { vertical: 'middle' };
        });

        // Độ rộng cột
        scanSheet.getColumn(1).width = 6;   // STT
        scanSheet.getColumn(2).width = 22;  // Thời gian
        scanSheet.getColumn(3).width = 22;  // Điểm quét
        scanSheet.getColumn(4).width = 22;  // Vị trí
        scanSheet.getColumn(5).width = 22;  // Nhân viên
        scanSheet.getColumn(6).width = 18;  // Bộ phận
        scanSheet.getColumn(7).width = 15;  // Trạng thái
        scanSheet.getColumn(8).width = 15;  // Kinh độ
        scanSheet.getColumn(9).width = 15;  // Vĩ độ
        scanSheet.getColumn(10).width = 22; // Độ chính xác
        scanSheet.getColumn(11).width = 16; // Điểm nghi ngờ
        scanSheet.getColumn(12).width = 30; // Ghi chú

        // Freeze header row
        scanSheet.views = [{ state: 'frozen', ySplit: 1 }];

        return workbook;
    }

    async getAiAnalysis(projectId: string, tenantId: string, startDate?: string, endDate?: string) {
        const statsData = await this.getDashboardStats(projectId, tenantId, startDate, endDate);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');
        return this.aiService.analyzeProjectPerformance({ ...statsData, projectName: project.name });
    }
}
