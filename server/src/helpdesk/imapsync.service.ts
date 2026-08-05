import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

@Injectable()
export class ImapSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImapSyncService.name);
  private client: ImapFlow;
  private isShuttingDown = false;

  constructor(private readonly helpdeskService: HelpdeskService) {}

  async onModuleInit() {
    this.logger.log('Initializing IMAP Sync Service...');
    
    if (!process.env.IMAP_HOST || !process.env.IMAP_USER || !process.env.IMAP_PASS) {
      this.logger.warn('IMAP credentials not found in environment variables. IMAP Sync disabled.');
      return;
    }

    try {
      await this.connectAndListen();
    } catch (error) {
      this.logger.error('Failed to initialize IMAP listener', error);
      // reconnect will be handled inside connectAndListen or its error handler
    }
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    if (this.client) {
      this.logger.log('Closing IMAP connection...');
      await this.client.logout().catch(() => {});
    }
  }

  private async connectAndListen() {
    if (this.isShuttingDown) return;

    this.client = new ImapFlow({
      host: process.env.IMAP_HOST || '',
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      secure: process.env.IMAP_PORT === '993', // Assume secure if port is 993
      auth: {
        user: process.env.IMAP_USER || '',
        pass: process.env.IMAP_PASS || '',
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: false,
    });

    try {
      await this.client.connect();
      this.logger.log('IMAP connected successfully.');
    } catch (err) {
      this.logger.error('Failed to connect to IMAP server', err);
      this.reconnect();
      return;
    }

    // Chọn hộp thư INBOX
    const mailbox = await this.client.mailboxOpen('INBOX');
    this.logger.log(`Opened INBOX with ${mailbox.exists} messages.`);

    // Lắng nghe sự kiện có mail mới
    this.client.on('exists', (data) => {
      this.logger.log(`New email event received. Total messages: ${data.count}`);
      this.fetchNewEmails(data.prevCount, data.count);
    });

    // Handle connection errors
    this.client.on('error', (err) => {
      this.logger.error('IMAP client error:', err);
      this.reconnect();
    });

    this.client.on('close', () => {
      this.logger.log('IMAP connection closed.');
      this.reconnect();
    });

    // Start IDLE state to receive updates in real-time
    // We don't await this because IDLE blocks until an event or timeout
    this.startIdle();
  }

  private async startIdle() {
    try {
      await this.client.idle();
    } catch (error) {
      this.logger.error('Error starting IDLE:', error);
      this.reconnect();
    }
  }

  private async fetchNewEmails(prevCount: number, currentCount: number) {
    if (currentCount <= prevCount) return;
    
    const seqRange = `${prevCount + 1}:*`;
    this.logger.log(`Fetching new emails in sequence range: ${seqRange}`);

    try {
      // Dừng IDLE để có thể fetch
      // wait, imapflow automatically handles exiting IDLE when commands are run, but it's safe to fetch
      for await (const message of this.client.fetch(seqRange, { source: true, uid: true })) {
        if (!message.source) continue;

        try {
          const parsed = await simpleParser(message.source);
          
          const from = parsed.from?.text || 'unknown';
          const to = parsed.to?.text || process.env.IMAP_USER || 'unknown';
          const subject = parsed.subject || 'Không có tiêu đề';
          const html = parsed.html || null;
          const text = parsed.text || null;
          const messageId = parsed.messageId || null;
          
          await this.helpdeskService.handleInboundEmail({
            from,
            to,
            subject,
            html,
            text,
            emailId: messageId,
            headers: parsed.headers ? Object.fromEntries(parsed.headers) : null,
          });

          this.logger.log(`Processed email UID ${message.uid} from ${from}`);
        } catch (parseError) {
          this.logger.error(`Error parsing or saving email UID ${message.uid}:`, parseError);
        }
      }
    } catch (error) {
      this.logger.error('Error fetching new emails:', error);
    }
  }

  private reconnect() {
    if (this.isShuttingDown) return;

    this.logger.log('Attempting to reconnect in 5 seconds...');
    setTimeout(async () => {
      try {
        if (this.client) {
          await this.client.logout().catch(() => {});
        }
        await this.connectAndListen();
      } catch (err) {
        this.logger.error('Reconnect failed', err);
        this.reconnect();
      }
    }, 5000);
  }
}
