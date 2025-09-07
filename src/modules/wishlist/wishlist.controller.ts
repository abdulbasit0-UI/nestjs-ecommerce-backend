// src/modules/wishlist/wishlist.controller.ts
import { Controller, Get, Post, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Wishlist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiResponse({ status: 200, description: 'User wishlist', type: [Object] })
  async getMyWishlist(@CurrentUser() user: User) {
    return await this.wishlistService.getUserWishlist(user.id);
  }

  @Post('me/:productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist' })
  async addToWishlist(@CurrentUser() user: User, @Param('productId') productId: string) {
    await this.wishlistService.addToWishlist(user.id, productId);
    return { success: true };
  }

  @Delete('me/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiResponse({ status: 204, description: 'Product removed from wishlist' })
  async removeFromWishlist(@CurrentUser() user: User, @Param('productId') productId: string) {
    await this.wishlistService.removeFromWishlist(user.id, productId);
  }
}


