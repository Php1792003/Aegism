import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MobileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the latest app version for a platform.
   */
  async getLatestVersion(platform: string = 'ANDROID') {
    const version = await this.prisma.appVersion.findFirst({
      where: { platform, isLatest: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!version) {
      throw new NotFoundException('No version found for this platform');
    }

    return {
      version: version.version,
      versionCode: version.versionCode,
      downloadUrl: version.downloadUrl,
      size: version.size,
      sha256: version.sha256,
      releaseDate: version.releaseDate,
      changelog: version.changelog,
      minimumAndroidVersion: version.minimumAndroidVersion,
      isMandatory: version.isMandatory,
    };
  }

  /**
   * Register or update a device token for push notifications.
   */
  async registerDeviceToken(data: {
    userId: string;
    tenantId: string;
    token: string;
    platform: string;
    deviceName?: string;
  }) {
    // Upsert: if token already exists, update it; otherwise create
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token: data.token },
    });

    if (existing) {
      return this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: {
          userId: data.userId,
          tenantId: data.tenantId,
          platform: data.platform,
          deviceName: data.deviceName,
          isActive: true,
        },
      });
    }

    return this.prisma.deviceToken.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        token: data.token,
        platform: data.platform,
        deviceName: data.deviceName,
      },
    });
  }

  /**
   * Remove a device token (on logout or uninstall).
   */
  async removeDeviceToken(token: string) {
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token },
    });

    if (!existing) {
      return { message: 'Token not found' };
    }

    await this.prisma.deviceToken.delete({ where: { id: existing.id } });
    return { message: 'Device token removed' };
  }

  /**
   * Get all active device tokens for a user (for sending push notifications).
   */
  async getUserDeviceTokens(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true, platform: true, deviceName: true },
    });
  }

  /**
   * Create a new app version entry (admin only).
   */
  async createAppVersion(data: {
    version: string;
    versionCode: number;
    platform: string;
    downloadUrl: string;
    size?: number;
    sha256?: string;
    changelog?: string;
    minimumAndroidVersion?: string;
    isMandatory?: boolean;
  }) {
    // Mark all previous versions as not latest
    await this.prisma.appVersion.updateMany({
      where: { platform: data.platform, isLatest: true },
      data: { isLatest: false },
    });

    return this.prisma.appVersion.create({
      data: {
        version: data.version,
        versionCode: data.versionCode,
        platform: data.platform,
        downloadUrl: data.downloadUrl,
        size: data.size,
        sha256: data.sha256,
        changelog: data.changelog,
        minimumAndroidVersion: data.minimumAndroidVersion || '8.0',
        isMandatory: data.isMandatory || false,
        isLatest: true,
      },
    });
  }

  /**
   * Get version history for a platform.
   */
  async getVersionHistory(platform: string = 'ANDROID', limit: number = 10) {
    return this.prisma.appVersion.findMany({
      where: { platform },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
