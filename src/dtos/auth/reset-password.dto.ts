// src/dtos/auth/reset-password.dto.ts
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: 'token-from-email' })
  @IsString()
  token: string;
}