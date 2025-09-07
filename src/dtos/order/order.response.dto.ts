// src/dtos/order/order.response.dto.ts
import { Expose } from 'class-transformer';
import { Address } from 'src/entities/address.entity';
import { OrderStatus } from 'src/entities/order.entity';
import { User } from 'src/entities/user.entity';

export class OrderResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  total: number;

  @Expose()
  status: OrderStatus;

  @Expose()
  stripeSessionId?: string;

  @Expose()
  paidAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  user: User;

  @Expose()
  address: string;

  @Expose()
  city: string;

  @Expose()
  state: string;

  @Expose()
  zipCode: string;

  @Expose()
  country: string;

  @Expose()
  items: {
    id: string;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
}