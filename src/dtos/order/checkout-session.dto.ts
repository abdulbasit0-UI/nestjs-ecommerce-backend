// src/dtos/order/checkout-session.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionDto {
  @ApiProperty({ example: 'cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3X4y5Z6' })
  sessionId: string;

  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/cs_test_a1...' })
  url: string;
}