// src/modules/orders/orders.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../dtos/order/create-order.dto';
import { OrderResponseDto } from '../../dtos/order/order.response.dto';
import { CheckoutSessionDto } from '../../dtos/order/checkout-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User, UserRole } from '../../entities/user.entity';
import { Order, OrderStatus } from 'src/entities/order.entity';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order (customer)' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  async create(
    @Body() createDto: CreateOrderDto,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.createOrder(user, createDto);
  }

  @Post(':id/checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Checkout Session' })
  @ApiQuery({ name: 'successUrl', required: false, type: String })
  @ApiQuery({ name: 'cancelUrl', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Checkout session created', type: CheckoutSessionDto })
  async createCheckoutSession(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('successUrl') successUrl?: string,
    @Query('cancelUrl') cancelUrl?: string,
  ): Promise<CheckoutSessionDto> {
    const order = await this.ordersService.findOne(id, user.id);
    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order is not pending');
    }

    const session = await this.ordersService.createCheckoutSession(
      {
        id: order.id,
        userId: order.userId,
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          product: { id: i.productId, name: i.productName } as any,
          quantity: i.quantity,
          price: i.price,
        })),
        total: order.total,
        status: OrderStatus.PENDING,
      } as any,
      successUrl || process.env.STRIPE_SUCCESS_URL || '',
      cancelUrl || process.env.STRIPE_CANCEL_URL || '',
    );

    return session;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiResponse({ status: 200, description: 'List of orders', type: [OrderResponseDto] })
  async findAll(@CurrentUser() user: User): Promise<OrderResponseDto[]> {
    return await this.ordersService.findByUser(user.id);
  }

  // get orders for admin
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all orders for admin' })
  @ApiResponse({ status: 200, description: 'List of orders', type: [OrderResponseDto] })
  async findAllForAdmin(): Promise<Order[]> {
    return await this.ordersService.findAllForAdmin();
  }

  // get order by id for admin
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order by ID for admin' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
  async findOneForAdmin(@Param('id') id: string): Promise<OrderResponseDto> {
    return await this.ordersService.findOneForAdmin(id);
  } 

  @Get('user/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user orders with filters' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User orders', type: [OrderResponseDto] })
  async getMyOrders(
    @CurrentUser() user: User,
    @Query('status') status?: OrderStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.ordersService.findByUserWithFilters(user.id, {
      status,
      page,
      limit,
    });
  }

  @Get('user/me/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user order statistics' })
  @ApiResponse({ status: 200, description: 'User order statistics' })
  async getMyOrderStats(@CurrentUser() user: User) {
    return await this.ordersService.getUserOrderStats(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order by ID (owned by user)' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.findOne(id, user.id);
  }
}