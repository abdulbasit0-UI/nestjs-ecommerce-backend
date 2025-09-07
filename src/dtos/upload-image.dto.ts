// src/modules/products/dtos/upload-image.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({ example: 'https://your-bucket.s3.amazonaws.com/products/123.jpg' })
  imageUrl: string;
}