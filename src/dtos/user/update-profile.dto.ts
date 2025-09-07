// src/dtos/user/update-profile.dto.ts
import { IsOptional, IsString, IsDate, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsObject()
  preferences?: {
    newsletter?: boolean;
    smsNotifications?: boolean;
    orderUpdates?: boolean;
    promotionalEmails?: boolean;
  };
}