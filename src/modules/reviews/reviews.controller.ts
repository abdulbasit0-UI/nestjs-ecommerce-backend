// src/modules/reviews/reviews.controller.ts
import { Controller, Post, Patch, Get, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../../entities/user.entity';
import { CreateReviewDto } from '../../dtos/reviews/create-review.dto';
import { UpdateReviewDto } from '../../dtos/reviews/update-review.dto';

@ApiTags('Reviews')
@ApiBearerAuth('access-token')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product review (one per user per product)' })
  @ApiResponse({ status: 201, description: 'Review created' })
  async create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    console.log(dto);
    return this.reviewsService.create(user.id, dto);
  }

  @Patch(':productId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update your review for a product' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  async update(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user.id, productId, dto);
  }

  @Get('product/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get reviews for a product' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async listForProduct(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Get('me/:productId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get your review for a product' })
  @ApiResponse({ status: 200, description: 'Your review or null' })
  async getMine(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.reviewsService.getMyReview(user.id, productId);
  }
}


