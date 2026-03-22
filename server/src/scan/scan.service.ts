import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { AiAnalysisService } from '../report/ai-analysis.service';
import { IncidentService } from '../incident/incident.service';

@Injectable()
export class ScanService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiAnalysisService,
    private incidentService: IncidentService,
  ) { }

  // ── Tính khoảng cách ngang Haversine (2D) ──────────────────────────────────
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (val: number) => (val * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async create(dto: CreateScanDto, userId: string, tenantId: string) {

    // ── 1. Validate Images ─────────────────────────────────────────────────────
    if (dto.images && dto.images.length > 0) {
      if (dto.images.length > 5) throw new BadRequestException('Tối đa 5 ảnh.');
      const maxSize = 20 * 1024 * 1024;
      for (const img of dto.images) {
        if ((img.length * 3) / 4 > maxSize) throw new BadRequestException('Ảnh > 20MB.');
      }
    }

    // ── 2. Validate QR Code ────────────────────────────────────────────────────
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { data: dto.qrCodeData },
      include: { project: true },
    });
    if (!qrCode || qrCode.tenantId !== tenantId)
      throw new ForbiddenException('Lỗi quyền truy cập hoặc QR không tồn tại.');

    // ── 3. Rate Limit 30s — áp dụng cho TẤT CẢ trạng thái ────────────────────
    const lastScan = await this.prisma.scanLog.findFirst({
      where: { userId, tenantId },
      orderBy: { scannedAt: 'desc' },
      select: { scannedAt: true },
    });
    if (lastScan) {
      const timeDiff = (new Date().getTime() - new Date(lastScan.scannedAt).getTime()) / 1000;
      if (timeDiff < 30) {
        throw new BadRequestException(`Thao tác quá nhanh! Đợi ${Math.ceil(30 - timeDiff)}s.`);
      }
    }

    // ── 4. Calibration Mode ────────────────────────────────────────────────────
    if (
      (qrCode.latitude == null || qrCode.longitude == null) &&
      dto.confirmSetLocation === true &&
      dto.latitude != null &&
      dto.longitude != null
    ) {
      await this.prisma.qRCode.update({
        where: { id: qrCode.id },
        data: {
          latitude: dto.latitude,
          longitude: dto.longitude,
          altitude: dto.altitude ?? null,
        },
      });
      return this.prisma.scanLog.create({
        data: {
          qrCodeId: qrCode.id, userId, tenantId,
          location: dto.location,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy,
          status: 'VALID',
          notes: '[Calibration] Đã lưu tọa độ điểm quét',
        },
        include: {
          qrCode: { select: { name: true, location: true } },
          user: { select: { fullName: true } },
        },
      });
    }

    // ── 5. Pending Mode: QR chưa có tọa độ ───────────────────────────────────
    if (qrCode.latitude == null || qrCode.longitude == null) {
      return {
        __needsCalibration: true,
        qrCodeId: qrCode.id,
        qrCodeName: qrCode.name,
        message: 'QR chưa có tọa độ chuẩn. Bạn có muốn lưu vị trí hiện tại?',
      };
    }

    // ── 6. Geofencing 3m ──────────────────────────────────────────────────────
    if (dto.latitude != null && dto.longitude != null) {
      const dist = this.calculateDistance(
        dto.latitude, dto.longitude,
        qrCode.latitude, qrCode.longitude,
      );
      if (dist > 3) {
        await this.prisma.scanLog.create({
          data: {
            qrCodeId: qrCode.id, userId, tenantId,
            location: dto.location,
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracy: dto.accuracy,
            status: 'INVALID_LOCATION',
            notes: `Cách điểm QR ${Math.round(dist)}m`,
          },
        });
        return {
          __invalidLocation: true,
          distance: Math.round(dist),
          message: `Vui lòng di chuyển đến đúng vị trí mã đã được bố trí (cách ${Math.round(dist)}m).`,
        };
      }
    }

    // ── 7. Xử lý ISSUE: AI phân loại → tạo Incident → tạo Task → thông báo ───
    if (dto.status === 'ISSUE') {

      // 7a. Ghi ScanLog ISSUE trước
      const scanLog = await this.prisma.scanLog.create({
        data: {
          qrCodeId: qrCode.id, userId, tenantId,
          location: dto.location,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy,
          status: 'ISSUE',
          notes: dto.notes,
        },
        include: {
          qrCode: { select: { name: true, location: true } },
          user: { select: { fullName: true } },
        },
      });

      // 7b. Gọi AI phân loại sự cố (ngoài transaction để tránh timeout rollback)
      let assignedDepartment: string | null = null;
      try {
        const projectRoles = await this.prisma.role.findMany({
          where: { tenantId },
          select: { name: true },
        });
        const departments = projectRoles.map(r => r.name).filter(Boolean);

        if (departments.length > 0) {
          const classification = await this.aiService.classifyIncident(
            dto.issueDescription || dto.notes || '',
            qrCode.location || '',
            departments,
          );
          assignedDepartment = classification.department;
          console.log(
            `[AI] Sự cố tại "${qrCode.name}" → phân công "${assignedDepartment}" (${classification.confidence}%)`
          );
        }
      } catch (e) {
        console.error('AI classify error (bỏ qua, dùng mặc định):', e?.message);
      }

      // 7c. Tạo Incident qua IncidentService (lưu ảnh đúng cách)
      const incidentResult = await this.incidentService.create(
        {
          projectId: qrCode.projectId,
          qrCode: dto.qrCodeData,
          description: dto.issueDescription || dto.notes || 'Reported via Scan',
          images: dto.images || [],
        },
        tenantId,
        userId,
      );

      // 7d. Nếu AI phân loại được bộ phận → gọi assignIncident:
      //     tạo Task, copy ảnh sang Task, cập nhật Incident.department,
      //     gửi thông báo đến toàn bộ user có role tương ứng
      if (assignedDepartment && incidentResult.incidentId) {
        try {
          await this.incidentService.assignIncident(
            incidentResult.incidentId,
            assignedDepartment,
            tenantId,
            userId,
          );
          console.log(
            `[AI] Đã tạo Task và thông báo bộ phận "${assignedDepartment}" cho sự cố ${incidentResult.incidentId}`
          );
        } catch (e) {
          // Không throw — sự cố đã được lưu, chỉ phân công thất bại
          console.error('assignIncident error (sự cố đã lưu):', e?.message);
        }
      }

      return scanLog;
    }

    // ── 8. VALID: Ghi ScanLog bình thường ────────────────────────────────────
    return this.prisma.scanLog.create({
      data: {
        qrCodeId: qrCode.id, userId, tenantId,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        status: dto.status || 'VALID',
        notes: dto.notes,
      },
      include: {
        qrCode: { select: { name: true, location: true } },
        user: { select: { fullName: true } },
      },
    });
  }

  // ── findAll ────────────────────────────────────────────────────────────────
  async findAll(tenantId: string, limit: number = 50, offset: number = 0) {
    const logs = await this.prisma.scanLog.findMany({
      where: { tenantId },
      include: {
        qrCode: { select: { id: true, name: true, location: true, projectId: true } },
        user: { select: { id: true, fullName: true, role: { select: { name: true } } } },
        incidents: { include: { images: true } },
      },
      orderBy: { scannedAt: 'desc' },
      take: limit,
      skip: offset,
    });
    const total = await this.prisma.scanLog.count({ where: { tenantId } });
    return { logs, total };
  }

  // ── findByQrCode ───────────────────────────────────────────────────────────
  async findByQrCode(qrCodeId: string, tenantId: string) {
    const qrCode = await this.prisma.qRCode.findFirst({ where: { id: qrCodeId, tenantId } });
    if (!qrCode) throw new NotFoundException('QR code not found or access denied.');
    return this.prisma.scanLog.findMany({
      where: { qrCodeId, tenantId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        incidents: { include: { images: true } },
      },
      orderBy: { scannedAt: 'desc' },
      take: 100,
    });
  }

  // ── findMyScans ────────────────────────────────────────────────────────────
  async findMyScans(userId: string, tenantId: string) {
    return this.prisma.scanLog.findMany({
      where: { userId, tenantId },
      include: {
        qrCode: { select: { id: true, name: true, location: true } },
        incidents: { include: { images: true } },
      },
      orderBy: { scannedAt: 'desc' },
      take: 50,
    });
  }
}
