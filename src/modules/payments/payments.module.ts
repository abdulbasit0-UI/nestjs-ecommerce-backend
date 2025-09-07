// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from '../orders/order.module';

@Module({
  imports: [OrdersModule],
  controllers: [WebhooksController],
})
export class PaymentsModule {}