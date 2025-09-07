// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { LoginDto } from '../../dtos/auth/login.dto';
import { ForgotPasswordDto } from '../../dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '../../dtos/auth/reset-password.dto';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/dtos/auth/regsiter.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { name, email, password, role = 'customer' } = registerDto;

    // Check for existing user
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role as User['role'],
      isActive: false, // Require email verification
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to save user: ${error.message}`);
      throw new InternalServerErrorException('Registration failed. Please try again later.');
    }

    // Generate verification token (JWT)
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('JWT_EMAIL_SECRET'),
        expiresIn: '1h',
      },
    );

    // Send verification email
    try {
      await this.mailerService.sendVerificationEmail(user.email, token);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${user.email}: ${error.message}`);
      // Don't fail registration if email fails — user can request resend
    }

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;
    console.log(email, password);

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(isPasswordValid);

    if (!user.isActive) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d',
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_EMAIL_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification link.');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.isActive) {
      return { message: 'Email already verified.' };
    }

    user.isActive = true;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to activate user ${user.id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to verify email. Please try again.');
    }

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(forgotDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotDto;

    const user = await this.userRepository.findOne({ where: { email } });
    // Always return same message to prevent email enumeration
    if (!user) {
      return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    // Generate reset token
    const token = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
        expiresIn: '30m',
      },
    );

    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        from: this.configService.get<string>('MAIL_FROM') || 'no-reply@yourapp.com',
        subject: 'Password Reset Request',
        html: `
          <p>Hello,</p>
          <p>You requested to reset your password. Click the link below:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p><em>This link expires in 30 minutes.</em></p>
          <p>If you didn’t request this, please ignore this email.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${user.email}: ${error.message}`);
      // Still return success to avoid leaking info
    }

    return { message: 'If your email is registered, you will receive a password reset link.' };
  }

  async resetPassword(resetDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetDto;

    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // Update password (hashing handled by entity)
    user.password = newPassword;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to reset password for user ${user.id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to reset password. Please try again.');
    }

    return { message: 'Password reset successfully. You can now log in.' };
  }

  async getLoggedInUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}