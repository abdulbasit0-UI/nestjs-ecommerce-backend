// src/dtos/user/create-address.dto.ts
import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { AddressType } from '../../entities/address.entity';

export class CreateAddressDto {
  @IsEnum(AddressType)
  type: AddressType;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}