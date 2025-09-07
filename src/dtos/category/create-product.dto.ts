// src/dtos/product/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsOptional()
  @IsNumber()
  stock?: number;



  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsUUID()
  categoryId: string;

  @IsUUID()
  brandId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}