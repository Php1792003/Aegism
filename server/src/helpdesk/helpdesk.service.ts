import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { ResendService } from './resend.service';
import { ResendWebhookPayload } from './interfaces/resend-webhook.interface';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class HelpdeskService {
  private readonly logger = new Logger(HelpdeskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Parse "Tên Khách <email@example.com>" → { email, name }
   */
  private parseFromField(from: string): { email: string; name: string | null } {
    const match = from.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: from.trim(), name: null };
  }

  /**
   * Xử lý webhook inbound email từ Resend
   */
  async handleInboundWebhook(payload: ResendWebhookPayload) {
    const { data } = payload;
    const { email: fromEmail, name: fromName } = this.parseFromField(data.from);

    this.logger.log(`Inbound email from: ${fromEmail} | Subject: ${data.subject}`);

    // 1. Tìm Ticket OPEN/IN_PROGRESS gần nhất của khách hàng này
    let ticket = await this.prisma.emailTicket.findFirst({
      where: {
        customerEmail: fromEmail,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Nếu chưa có → Tạo Ticket mới
    if (!ticket) {
      // Lấy tenant mặc định (tenant đầu tiên active)
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!defaultTenant) {
        this.logger.error('No active tenant found for inbound email');
        return { success: false, reason: 'No active tenant' };
      }

      ticket = await this.prisma.emailTicket.create({
        data: {
          subject: data.subject || 'Không có tiêu đề',
          customerEmail: fromEmail,
          customerName: fromName,
          tenantId: defaultTenant.id,
          status: 'OPEN',
          priority: 'NORMAL',
        },
      });

      this.logger.log(`Created new ticket: ${ticket.id}`);
    } else {
      // Cập nhật updatedAt cho ticket hiện tại
      await this.prisma.emailTicket.update({
        where: { id: ticket.id },
        data: { updatedAt: new Date() },
      });
    }

    // 3. Lưu EmailMessage INBOUND
    const message = await this.prisma.emailMessage.create({
      data: {
        ticketId: ticket.id,
        direction: 'INBOUND',
        fromEmail: fromEmail,
        fromName: fromName,
        toEmail: data.to[0] || 'contact@aegism.online',
        subject: data.subject,
        bodyHtml: data.html || null,
        bodyText: data.text || null,
        resendEmailId: data.email_id || null,
        headers: data.headers ? JSON.stringify(data.headers) : null,
      },
    });

    // 4. Gửi notification realtime cho nhân viên trong tenant
    this.notificationGateway.sendNotification(null, ticket.tenantId, {
      type: 'NEW_TICKET_MESSAGE',
      ticketId: ticket.id,
      messageId: message.id,
      customerEmail: fromEmail,
      customerName: fromName,
      subject: data.subject,
    });

    return { success: true, ticketId: ticket.id, messageId: message.id };
  }

  /**
   * Gửi trả lời email cho khách hàng
   */
  async sendReply(ticketId: string, userId: string, content: string, subjectOverride?: string) {
    const ticket = await this.prisma.emailTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const subject = subjectOverride || `Re: ${ticket.subject}`;
    const htmlContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${content}</div>`;

    // Gửi email qua Resend
    const result = await this.resendService.sendReply(
      ticket.customerEmail,
      subject,
      htmlContent,
    );

    // Lấy thông tin user gửi reply
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    // Lưu EmailMessage OUTBOUND
    const message = await this.prisma.emailMessage.create({
      data: {
        ticketId: ticket.id,
        direction: 'OUTBOUND',
        fromEmail: 'contact@aegism.online',
        fromName: user?.fullName || 'AEGISM Support',
        toEmail: ticket.customerEmail,
        subject: subject,
        bodyHtml: htmlContent,
        bodyText: content.replace(/<[^>]*>/g, ''),
        resendEmailId: result?.data?.id || null,
      },
    });

    // Cập nhật status ticket nếu đang OPEN → IN_PROGRESS
    if (ticket.status === 'OPEN') {
      await this.prisma.emailTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS', assignedToId: userId },
      });
    }

    return message;
  }

  /**
   * Lấy danh sách tickets (phân trang + filter)
   */
  async getTickets(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    priority?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.emailTicket.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, fullName: true, avatar: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, direction: true, bodyText: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailTicket.count({ where }),
    ]);

    return {
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Chi tiết ticket + toàn bộ messages
   */
  async getTicketDetail(ticketId: string) {
    const ticket = await this.prisma.emailTicket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: { select: { id: true, fullName: true, avatar: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Cập nhật ticket (status, priority, assignedTo, tags)
   */
  async updateTicket(ticketId: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.emailTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.priority) updateData.priority = dto.priority;
    if (dto.assignedToId !== undefined) updateData.assignedToId = dto.assignedToId;
    if (dto.tags) updateData.tags = JSON.stringify(dto.tags);

    return this.prisma.emailTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, fullName: true, avatar: true } },
      },
    });
  }

  /**
   * Thống kê tickets
   */
  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, open, inProgress, resolved, closed, todayCount] = await Promise.all([
      this.prisma.emailTicket.count({ where: { tenantId } }),
      this.prisma.emailTicket.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.emailTicket.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      this.prisma.emailTicket.count({ where: { tenantId, status: 'RESOLVED' } }),
      this.prisma.emailTicket.count({ where: { tenantId, status: 'CLOSED' } }),
      this.prisma.emailTicket.count({ where: { tenantId, createdAt: { gte: today } } }),
    ]);

    return { total, open, inProgress, resolved, closed, todayCount };
  }
}
