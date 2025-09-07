// src/dtos/order/create-order.dto.ts
import { IsArray, IsNumber, IsString, ValidateNested, IsOptional, IsEmail, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

// This DTO represents ONE PRODUCT in the order
class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  // @MinLength(1) // or @Min(1) if you want numeric validation
  quantity: number;
}

// This DTO represents the ENTIRE ORDER
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  // 👇 SHIPPING ADDRESS FIELDS BELONG HERE — at ORDER level
  @IsOptional()
  @IsString()
  @MinLength(1)
  shippingFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  shippingLastName?: string;

  @IsOptional()
  @IsEmail()
  shippingEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  shippingPhone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  shippingCity?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  shippingState?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  shippingZipCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  shippingCountry?: string;
}