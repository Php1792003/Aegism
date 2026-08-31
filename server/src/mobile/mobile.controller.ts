import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MobileService } from './mobile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  /**
   * GET /api/mobile/version
   * Public endpoint — no auth required. Used by download page and mobile app update check.
   */
  @Get('version')
  async getLatestVersion(@Query('platform') platform?: string) {
    return this.mobileService.getLatestVersion(platform || 'ANDROID');
  }

  /**
   * GET /api/mobile/version/history
   * Public endpoint — version history for changelog display.
   */
  @Get('version/history')
  async getVersionHistory(
    @Query('platform') platform?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mobileService.getVersionHistory(
      platform || 'ANDROID',
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * POST /api/mobile/device
   * Register or update a device token for push notifications.
   * Requires authentication.
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('device')
  async registerDevice(
    @Body() body: { token: string; platform?: string; deviceName?: string },
    @Request() req: RequestWithUser,
  ) {
    return this.mobileService.registerDeviceToken({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      token: body.token,
      platform: body.platform || 'ANDROID',
      deviceName: body.deviceName,
    });
  }

  /**
   * DELETE /api/mobile/device
   * Remove a device token (logout / uninstall).
   * Requires authentication.
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('device')
  async removeDevice(@Body() body: { token: string }) {
    return this.mobileService.removeDeviceToken(body.token);
  }

  /**
   * POST /api/mobile/version
   * Create a new app version. Admin only (super admin).
   * TODO: Add SuperAdmin guard when ready
   */
  @UseGuards(JwtAuthGuard)
  @Post('version')
  async createVersion(
    @Body() body: {
      version: string;
      versionCode: number;
      platform?: string;
      downloadUrl: string;
      size?: number;
      sha256?: string;
      changelog?: string;
      minimumAndroidVersion?: string;
      isMandatory?: boolean;
    },
  ) {
    return this.mobileService.createAppVersion({
      ...body,
      platform: body.platform || 'ANDROID',
    });
  }
}
