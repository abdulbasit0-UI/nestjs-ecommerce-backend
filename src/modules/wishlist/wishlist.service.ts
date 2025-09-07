// src/modules/wishlist/wishlist.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from '../../entities/wishlist.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    private readonly productsService: ProductsService,
  ) {}

  async getUserWishlist(userId: string) {
    const items = await this.wishlistRepository.find({ where: { userId } });
    const productIds = items.map(i => i.productId);
    // This assumes ProductsService has a method to fetch by IDs; fallback to per-ID fetch
    const products = await Promise.all(productIds.map(id => this.productsService.findOne(id)));
    return products.filter(Boolean);
  }

  async addToWishlist(userId: string, productId: string): Promise<void> {
    const product = await this.productsService.findOne(productId);
    if (!product) throw new NotFoundException('Product not found');

    const exists = await this.wishlistRepository.findOne({ where: { userId, productId } });
    if (exists) return;

    const item = this.wishlistRepository.create({ userId, productId });
    await this.wishlistRepository.save(item);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await this.wishlistRepository.delete({ userId, productId });
  }
}


