// src/dtos/brand/create-brand.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}