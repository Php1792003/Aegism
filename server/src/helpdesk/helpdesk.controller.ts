import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { Permission } from '../role/constants/permissions.constant';
import { HelpdeskService } from './helpdesk.service';
import { SendReplyDto } from './dto/send-reply.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ResendWebhookPayload } from './interfaces/resend-webhook.interface';
import { simpleParser } from 'mailparser';

@Controller()
export class HelpdeskController {
  private readonly logger = new Logger(HelpdeskController.name);

  constructor(private readonly helpdeskService: HelpdeskService) { }

  /**
   * Webhook endpoint — Resend gọi khi có email mới
   * Không cần JWT, nhưng có thể verify webhook secret trong phase 2
   */
  @Post('emails/webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    this.logger.log(`[HelpdeskController] Received webhook from Cloudflare: ${JSON.stringify(body)}`);

    const { from, to, subject, raw } = body;

    let parsedText = raw;
    let parsedHtml: any = null;

    if (raw) {
      try {
        const parsed = await simpleParser(raw);
        parsedText = parsed.text || raw;
        parsedHtml = parsed.html || null;
      } catch (e) {
        this.logger.error('Failed to parse raw email MIME', e);
      }
    }

    await this.helpdeskService.handleInboundEmail({
      from: from || 'unknown@example.com',
      to: to || 'contact@aegism.online',
      subject: subject || 'No Subject',
      html: parsedHtml,
      text: parsedText,
      emailId: null,
      headers: null,
    });

    return { status: 'success' };
  }

  /**
   * Lấy danh sách tickets
   */
  @Get('helpdesk/tickets')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.TICKET_VIEW)
  async getTickets(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.helpdeskService.getTickets(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      priority,
      search,
    );
  }

  /**
   * Chi tiết ticket + messages
   */
  @Get('helpdesk/tickets/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.TICKET_VIEW)
  async getTicketDetail(@Param('id') id: string) {
    return this.helpdeskService.getTicketDetail(id);
  }

  /**
   * Cập nhật ticket (status, priority, assign, tags)
   */
  @Patch('helpdesk/tickets/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.TICKET_VIEW)
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.helpdeskService.updateTicket(id, dto);
  }

  /**
   * Gửi trả lời email cho khách hàng
   */
  @Post('helpdesk/tickets/:id/reply')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.TICKET_REPLY)
  async sendReply(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: SendReplyDto,
  ) {
    return this.helpdeskService.sendReply(
      id,
      req.user.userId,
      dto.content,
      dto.subject,
    );
  }

  /**
   * Thống kê tickets
   */
  @Get('helpdesk/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.TICKET_VIEW)
  async getStats(@Req() req: any) {
    return this.helpdeskService.getStats(req.user.tenantId);
  }
}
