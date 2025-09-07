// src/modules/reviews/reviews.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { CreateReviewDto } from '../../dtos/reviews/create-review.dto';
import { UpdateReviewDto } from '../../dtos/reviews/update-review.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    console.log(dto);
    const product = await this.productsService.findOne(dto.productId);
    if (!product) throw new NotFoundException('Product not found');

    const exists = await this.reviewRepository.findOne({ where: { userId, productId: dto.productId } });
    if (exists) throw new ForbiddenException('You have already reviewed this product');

    const review = this.reviewRepository.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
    });
    return this.reviewRepository.save(review);
  }

  async update(userId: string, productId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { userId, productId } });
    if (!review) throw new NotFoundException('Review not found');
    Object.assign(review, dto);
    return this.reviewRepository.save(review);
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return this.reviewRepository.find({ where: { productId }, order: { createdAt: 'DESC' as any } });
  }

  async getMyReview(userId: string, productId: string): Promise<Review | null> {
    return this.reviewRepository.findOne({ where: { userId, productId } });
  }
}


