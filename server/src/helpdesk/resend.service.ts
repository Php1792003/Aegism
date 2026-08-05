import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    this.resend = new Resend(apiKey);
  }

  async sendReply(to: string, subject: string, htmlContent: string) {
    const result = await this.resend.emails.send({
      from: 'AEGISM Support <contact@aegism.online>',
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    return result;
  }
}
