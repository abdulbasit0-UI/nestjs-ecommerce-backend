// src/modules/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from '../../entities/cart-item.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductsModule } from '../products/products.module';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem]), ProductsModule],
  controllers: [CartController],
  providers: [CartService, OptionalJwtAuthGuard],
  exports: [CartService],
})
export class CartModule {}


