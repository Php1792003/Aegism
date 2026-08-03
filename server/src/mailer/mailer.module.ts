import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get('MAIL_HOST'),
                    port: Number(config.get('MAIL_PORT', 587)),
                    secure: false, // STARTTLS on port 587 (Mailcow)
                    auth: {
                        user: config.get('MAIL_USER'),
                        pass: config.get('MAIL_PASS'),
                    },
                    tls: {
                        rejectUnauthorized: false, // Chấp nhận self-signed cert trên LAN
                    },
                    debug: true,
                    logger: true,
                },
                defaults: {
                    from: config.get('MAIL_FROM', '"AEGISM System" <noreply@aegism.online>'),
                },
                template: {
                    dir: join(process.cwd(), 'src/mailer/templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailerService],
    exports: [MailerService],
})
export class AppMailerModule { }