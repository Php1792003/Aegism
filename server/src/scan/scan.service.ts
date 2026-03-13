import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(private prisma: PrismaService) { }

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
    // 1. Validate Images
    if (dto.images && dto.images.length > 0) {
      if (dto.images.length > 5) throw new BadRequestException('Tối đa 5 ảnh.');
      const maxSize = 20 * 1024 * 1024;
      for (const img of dto.images) {
        if ((img.length * 3) / 4 > maxSize) throw new BadRequestException('Ảnh > 20MB.');
      }
    }

    // 2. Validate QR Code
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { data: dto.qrCodeData },
      include: { project: true },
    });
    if (!qrCode || qrCode.tenantId !== tenantId)
      throw new ForbiddenException('Lỗi quyền truy cập hoặc QR không tồn tại.');

    // 3. RATE LIMIT 30s — áp dụng cho TẤT CẢ trạng thái kể cả INVALID_LOCATION
    const lastScan = await this.prisma.scanLog.findFirst({
      where: { userId, tenantId },  // không filter status → chặn cả spam INVALID
      orderBy: { scannedAt: 'desc' },
      select: { scannedAt: true },
    });
    if (lastScan) {
      const timeDiff = (new Date().getTime() - new Date(lastScan.scannedAt).getTime()) / 1000;
      if (timeDiff < 30) {
        throw new BadRequestException(`Thao tác quá nhanh! Đợi ${Math.ceil(30 - timeDiff)}s.`);
      }
    }

    // 4. CALIBRATION MODE: QR chưa có tọa độ + user xác nhận lưu vị trí
    if (
      (qrCode.latitude == null || qrCode.longitude == null) &&
      dto.confirmSetLocation === true &&
      dto.latitude != null && dto.longitude != null
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
          latitude: dto.latitude, longitude: dto.longitude,
          accuracy: dto.accuracy, status: 'VALID',
          notes: '[Calibration] Đã lưu tọa độ điểm quét',
        },
        include: {
          qrCode: { select: { name: true, location: true } },
          user: { select: { fullName: true } },
        },
      });
    }

    // 5. PENDING MODE: QR chưa có tọa độ, chưa confirm → hỏi xác nhận
    if (qrCode.latitude == null || qrCode.longitude == null) {
      return {
        __needsCalibration: true,
        qrCodeId: qrCode.id,
        qrCodeName: qrCode.name,
        message: 'QR chưa có tọa độ chuẩn. Bạn có muốn lưu vị trí hiện tại?',
      };
    }

    // 6. GEOFENCING — chỉ check khi QR đã có tọa độ + user gửi tọa độ
    if (dto.latitude != null && dto.longitude != null) {
      // Chỉ tính ngang, BỎ altitude để tránh drift dọc gây false positive
      const dist = this.calculateDistance(
        dto.latitude, dto.longitude,
        qrCode.latitude, qrCode.longitude,
      );

      if (dist > 3) {
        // Ghi log INVALID nhưng KHÔNG throw — trả về flag để frontend xử lý modal
        await this.prisma.scanLog.create({
          data: {
            qrCodeId: qrCode.id, userId, tenantId,
            location: dto.location,
            latitude: dto.latitude, longitude: dto.longitude,
            accuracy: dto.accuracy, status: 'INVALID_LOCATION',
            notes: `Cách điểm QR ${Math.round(dist)}m`,
          },
        });
        // Trả về object thay vì throw → frontend nhận được, không vào catch
        return {
          __invalidLocation: true,
          distance: Math.round(dist),
          message: `Vui lòng di chuyển đến đúng vị trí mã đã được bố trí (cách ${Math.round(dist)}m).`,
        };
      }
    }

    // 7. VALID — Ghi log check-in
    return this.prisma.$transaction(async (tx) => {
      const scanLog = await tx.scanLog.create({
        data: {
          qrCodeId: qrCode.id, userId, tenantId,
          location: dto.location,
          latitude: dto.latitude, longitude: dto.longitude,
          accuracy: dto.accuracy, status: dto.status || 'VALID',
          notes: dto.notes,
        },
        include: {
          qrCode: { select: { name: true, location: true } },
          user: { select: { fullName: true } },
        },
      });

      if (dto.status === 'ISSUE') {
        const incident = await tx.incident.create({
          data: {
            description: dto.issueDescription || dto.notes || 'Reported via Scan',
            status: 'OPEN', tenantId, projectId: qrCode.projectId,
            qrCodeId: qrCode.id, scanLogId: scanLog.id, reporterId: userId,
          },
        });
        if (dto.images?.length) {
          await tx.incidentImage.createMany({
            data: dto.images.map((img) => ({ incidentId: incident.id, url: img })),
          });
        }
      }
      return scanLog;
    });
  }

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
