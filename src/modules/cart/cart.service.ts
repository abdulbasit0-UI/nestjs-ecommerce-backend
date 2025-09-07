import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CartItem } from '../../entities/cart-item.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async getCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    const whereCondition = userId 
      ? { userId } 
      : { sessionId: sessionId!, userId: IsNull() };

    const items = await this.cartRepository.find({
      where: whereCondition
    });

    const detailed = await Promise.all(
      items.map(async (item) => {
        const product = await this.productsService.findOne(item.productId);
        if (!product) return null;

        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product,
          lineTotal: Number(product.price) * item.quantity,
        };
      }),
    );

    const data = detailed.filter(Boolean) as any[];
    const total = data.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      items: data,
      total,
      itemCount: data.length
    };
  }

  async addItem(productId: string, quantity: number, userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const whereCondition = userId
      ? { userId, productId }
      : { sessionId: sessionId!, userId: IsNull(), productId };

    const existing = await this.cartRepository.findOne({
      where: whereCondition
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) {
        throw new BadRequestException('Insufficient stock');
      }
      existing.quantity = newQty;
      return this.cartRepository.save(existing);
    }

    const item = this.cartRepository.create({
      userId,
      sessionId: userId ? undefined : sessionId,
      productId,
      quantity,
    });

    return this.cartRepository.save(item);
  }

  async updateItem(productId: string, quantity: number, userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    const whereCondition = userId
      ? { userId, productId }
      : { sessionId: sessionId!, userId: IsNull(), productId };

    const item = await this.cartRepository.findOne({
      where: whereCondition
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    item.quantity = quantity;
    return this.cartRepository.save(item);
  }

  async removeItem(productId: string, userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    const whereCondition = userId
      ? { userId, productId }
      : { sessionId: sessionId!, userId: IsNull(), productId };

    const result = await this.cartRepository.delete(whereCondition);
    
    if (result.affected === 0) {
      throw new NotFoundException('Cart item not found');
    }
  }

  async clearCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    const whereCondition = userId
      ? { userId }
      : { sessionId: sessionId!, userId: IsNull() };

    await this.cartRepository.delete(whereCondition);
  }

  // Transfer guest cart to user cart when user logs in
  async mergeGuestCartToUser(sessionId: string, userId: string) {
    const guestItems = await this.cartRepository.find({
      where: { sessionId: sessionId, userId: IsNull() }
    });

    for (const guestItem of guestItems) {
      // Check if user already has this product in cart
      const existingUserItem = await this.cartRepository.findOne({
        where: { userId, productId: guestItem.productId }
      });

      if (existingUserItem) {
        // Merge quantities
        const product = await this.productsService.findOne(guestItem.productId);
        if (product) {
          const newQty = existingUserItem.quantity + guestItem.quantity;
          if (product.stock >= newQty) {
            existingUserItem.quantity = newQty;
            await this.cartRepository.save(existingUserItem);
          }
        }
      } else {
        // Transfer guest item to user
        guestItem.userId = userId;
        guestItem.sessionId = undefined;
        await this.cartRepository.save(guestItem);
      }
    }

    // Clean up remaining guest items
    await this.cartRepository.delete({ sessionId: sessionId, userId: IsNull() });
  }

  async getCartItemCount(userId?: string, sessionId?: string): Promise<number> {
    if (!userId && !sessionId) {
      return 0;
    }

    const whereCondition = userId 
      ? { userId } 
      : { sessionId: sessionId!, userId: IsNull() };

    const items = await this.cartRepository.find({
      where: whereCondition
    });

    return items.reduce((total, item) => total + item.quantity, 0);
  }
}
