import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  BadRequestException
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AddToCartDto } from 'src/dtos/cart/add-to-cart.dto';
import { UpdateCartItemDto } from 'src/dtos/cart/update-cart-item.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private getSessionId(headers: any): string {
    const sessionId = headers['x-session-id'] || headers['session-id'];
    if (!sessionId) {
      throw new BadRequestException('Session ID is required for guest users');
    }
    return sessionId;
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCart(@Request() req, @Headers() headers) {
    const userId = req.user?.userId;
    const sessionId = userId ? undefined : this.getSessionId(headers);
    
    return this.cartService.getCart(userId, sessionId);
  }

  @Post('add')
  @UseGuards(OptionalJwtAuthGuard)
  async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req, @Headers() headers) {
    const userId = req.user?.userId;
    const sessionId = userId ? undefined : this.getSessionId(headers);

    return this.cartService.addItem(
      addToCartDto.productId,
      addToCartDto.quantity,
      userId,
      sessionId
    );
  }

  @Put('update')
  @UseGuards(OptionalJwtAuthGuard)
  async updateCartItem(@Body() updateCartItemDto: UpdateCartItemDto, @Request() req, @Headers() headers) {
    const userId = req.user?.userId;
    const sessionId = userId ? undefined : this.getSessionId(headers);

    return this.cartService.updateItem(
      updateCartItemDto.productId,
      updateCartItemDto.quantity,
      userId,
      sessionId
    );
  }

  @Delete('remove/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async removeFromCart(@Param('productId') productId: string, @Request() req, @Headers() headers) {
    const userId = req.user?.userId;
    const sessionId = userId ? undefined : this.getSessionId(headers);

    return this.cartService.removeItem(productId, userId, sessionId);
  }

  @Delete('clear')
  @UseGuards(OptionalJwtAuthGuard)
  async clearCart(@Request() req, @Headers() headers) {
    const userId = req.user?.userId;
    const sessionId = userId ? undefined : this.getSessionId(headers);

    return this.cartService.clearCart(userId, sessionId);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async mergeGuestCart(@Request() req, @Headers() headers) {
    const userId = req.user.userId;
    const sessionId = this.getSessionId(headers);

    await this.cartService.mergeGuestCartToUser(sessionId, userId);
    return { message: 'Guest cart merged successfully' };
  }

  @Get('count')
  @UseGuards(OptionalJwtAuthGuard)
  async getCartCount(@Request() req, @Headers() headers) {
    const userId = req.user?.userId;
    const sessionId = userId ? undefined : this.getSessionId(headers);
    
    const count = await this.cartService.getCartItemCount(userId, sessionId);
    return { count };
  }
}

