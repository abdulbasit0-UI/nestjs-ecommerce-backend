import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerService } from './mail.service';

@Module({
  imports: [
    NestMailerModule.forRoot({
      transport: {
        host: 'mail.nexondigital.co.za',
        port: 465,
        secure: true, // true for 465 (SSL/TLS), false for other ports
        auth: {
          user: 'info@nexondigital.co.za',
          pass: 'Lion@081!', // Replace with actual password
        },
      },
      defaults: {
        from: '"Nexon Digital" <info@nexondigital.co.za>',
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}