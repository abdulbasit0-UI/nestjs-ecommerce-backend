import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerService } from './mail.service';

@Module({
  imports: [
    NestMailerModule.forRoot({
      
      transport: {
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true, // true for 465 (SSL/TLS), false for other ports
        auth: {
          user: process.env.MAIL_USER, // Replace with actual email
          pass: process.env.MAIL_PASS, // Replace with actual password
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.MAIL_FROM}>`, // Replace with actual sender email
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}