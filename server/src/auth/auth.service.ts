import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult } from '../types/prisma.types';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  private readonly refreshTokenExpiryDays: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private mailerService: MailerService,
  ) {
    this.refreshTokenExpiryDays = parseInt(
      this.configService.get('REFRESH_TOKEN_EXPIRES_DAYS') || '30',
      10,
    );
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    // 1. Kiểm tra Email trùng
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 2. Dùng Transaction để đảm bảo toàn vẹn dữ liệu
    // Nếu tạo User lỗi, Tenant sẽ tự động bị xóa
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // A. Tạo Tenant
        const defaultPlan = await tx.planConfig.findUnique({
          where: { planKey: 'STARTER' }
        });
        const newTenant = await tx.tenant.create({
          data: {
            name: dto.companyName,
            subscriptionPlan: 'STARTER',
            maxUsers: defaultPlan ? defaultPlan.maxUsers : 10,
            maxProjects: defaultPlan ? defaultPlan.maxProjects : 3,
            maxQRCodes: defaultPlan ? defaultPlan.maxQRCodes : 100,
          },
        });

        // B. Tạo Role Admin cho Tenant
        const adminRole = await tx.role.create({
          data: {
            name: 'Tenant Admin',
            permissions: '["ALL"]',
            tenantId: newTenant.id,
          },
        });

        // C. Tạo User
        const newUser = await tx.user.create({
          data: {
            email: dto.email,
            fullName: dto.fullName,
            password: hashedPassword,
            tenantId: newTenant.id,
            roleId: adminRole.id,
            isTenantAdmin: true,
            status: 'active',
          },
        });

        return { user: newUser, tenant: newTenant, role: adminRole };
      });
    } catch (error) {
      console.error("Lỗi Transaction Database:", error);
      throw new InternalServerErrorException('Lỗi khi tạo dữ liệu. Vui lòng thử lại.');
    }

    // 3. Gửi Email (Bọc trong Try-Catch riêng để không ảnh hưởng luồng chính)
    try {
      await this.mailerService.sendRegistrationConfirmation(
        result.user.email,
        result.user.fullName
      );
      console.log(`✅ Email đã gửi tới ${result.user.email}`);
    } catch (emailError) {
      console.error("⚠️ Lỗi gửi email (User vẫn được tạo):", emailError.message);
      // Không throw error ở đây để Frontend vẫn nhận được kết quả thành công
    }

    // 4. Log Activity
    try {
      await this.auditService.logActivity(
        result.user.id,
        result.tenant.id,
        'USER_REGISTER',
        { email: result.user.email, tenantName: result.tenant.name },
        'USER',
        result.user.id,
      );
    } catch (e) { console.log('Audit log error ignored'); }

    // 5. Trả về kết quả đăng nhập luôn
    return this.signTokens(
      result.user.id,
      result.tenant.id,
      result.user.isTenantAdmin,
      result.user.isSuperAdmin,
      result.user.email,
      result.user.fullName,
      result.role,
    );
  }

  // ... (Giữ nguyên các hàm login và signToken cũ của bạn) ...
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password.trim()))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if the user is suspended or inactive
    if (user.status === 'suspended' || user.status === 'inactive') {
      throw new ForbiddenException('USER_SUSPENDED');
    }

    // Check if tenant is suspended (only for non-superadmins)
    if (!user.isSuperAdmin && user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });
      if (tenant && !tenant.isActive) {
        throw new ForbiddenException('TENANT_SUSPENDED');
      }
    }

    // ... audit log ...
    return this.signTokens(user.id, user.tenantId, user.isTenantAdmin, user.isSuperAdmin, user.email, user.fullName, user.role);
  }

  /**
   * Issue both accessToken (short-lived JWT) and refreshToken (long-lived, stored in DB).
   * Replaces the old signToken method.
   */
  public async signTokens(
    userId: string,
    tenantId: string,
    isTenantAdmin: boolean,
    isSuperAdmin: boolean,
    email?: string,
    fullName?: string,
    role?: any,
    deviceInfo?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user?: any }> {
    const payload = { sub: userId, tenantId, isSuperAdmin, roleId: role?.id };
    const accessToken = await this.jwtService.signAsync(payload);

    // Generate refresh token
    const refreshToken = await this.createRefreshToken(userId, deviceInfo);

    // Lấy lại info tenant để trả về frontend
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { subscriptionPlan: true, name: true } });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId, email, fullName, tenantId, isTenantAdmin, isSuperAdmin, tenant,
        role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
      },
    };
  }

  /**
   * Creates a refresh token, stores a SHA-256 hash in the database, returns the raw token.
   */
  private async createRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
    const rawToken = crypto.randomUUID() + '-' + crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        deviceInfo: deviceInfo || null,
      },
    });

    return rawToken;
  }

  /**
   * POST /api/auth/refresh
   * Accepts a refresh token, validates it, revokes it (rotation), and issues new token pair.
   */
  async refreshAccessToken(refreshTokenRaw: string, deviceInfo?: string): Promise<AuthResult> {
    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      // Potential token reuse attack — revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token has been revoked. Please login again.');
    }

    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token has expired. Please login again.');
    }

    const user = storedToken.user;

    // Check user status
    if (user.status === 'suspended' || user.status === 'inactive') {
      throw new ForbiddenException('USER_SUSPENDED');
    }

    // Revoke the used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new token pair
    return this.signTokens(
      user.id,
      user.tenantId,
      user.isTenantAdmin,
      user.isSuperAdmin,
      user.email,
      user.fullName,
      user.role,
      deviceInfo,
    );
  }

  /**
   * Revoke all refresh tokens for a user (used on logout).
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Clean up expired refresh tokens (called by cron or manually).
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    return result.count;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Vui lòng kiểm tra lại email.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 15 minutes from now
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);

    // Save to DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordOtpExpiry: expiry,
      },
    });

    // Send Email
    try {
      await this.mailerService.sendResetPasswordOtp(user.email, user.fullName, otp);
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw new InternalServerErrorException('Lỗi gửi email. Vui lòng thử lại sau.');
    }

    return { message: 'Mã OTP đã được gửi đến email của bạn.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Email hoặc mã OTP không hợp lệ.');
    }

    // Check if OTP matches and is not expired
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw new BadRequestException('Mã OTP không chính xác.');
    }

    if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP fields
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpiry: null,
      },
    });

    // Revoke all refresh tokens when password changes
    await this.revokeAllRefreshTokens(user.id);

    return { message: 'Đặt lại mật khẩu thành công.' };
  }
}