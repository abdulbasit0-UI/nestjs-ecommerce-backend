// src/config/mail.config.ts
import { ConfigService } from '@nestjs/config';

export const mailConfig = (configService: ConfigService) => ({
  transport: {
    host:process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  },
  defaults: {
    from: `"No Reply" <${process.env.MAIL_FROM}>`,
  },
  template: {
    dir: process.cwd() + '/src/templates/',
    options: {
      strict: true,
    },
  },
});