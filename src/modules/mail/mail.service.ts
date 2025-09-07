import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private nestMailerService: NestMailerService) {}

  async sendMail(mailOptions: {
    to: string;
    from: string;
    subject: string;
    template?: string;
    context?: any;
    html?: string;
    text?: string;
  }): Promise<void> {
    try {
      await this.nestMailerService.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendMail({
      to: email,
      from: 'info@nexondigital.co.za',
      subject: 'Welcome to Our Platform!',
      html: `<p>Hi ${name},</p>
      <p>Thank you for registering with our platform!</p>
      <p>Best regards,<br>Nexon Digital</p>`,
      context: {
        name,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await this.sendMail({
      to: email,
      from: 'info@nexondigital.co.za',
      subject: 'Verify Your Email Address',
      html: `<p>Click the link below to verify your email address:</p>
      <p><a href="${verificationUrl}">Verify Email</a></p>`,
      context: {
        verificationUrl,
        email,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await this.sendMail({
      to: email,
      from: 'info@nexondigital.co.za',
      subject: 'Reset Your Password',
      html: `<p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>`,
      context: {
        resetUrl,
        email,
      },
    });
  }
}