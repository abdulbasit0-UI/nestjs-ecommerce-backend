import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateCartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class RemoveFromCartDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
