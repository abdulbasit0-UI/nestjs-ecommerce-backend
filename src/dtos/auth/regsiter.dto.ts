// src/dtos/auth/register.dto.ts
import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role?: UserRole;
}