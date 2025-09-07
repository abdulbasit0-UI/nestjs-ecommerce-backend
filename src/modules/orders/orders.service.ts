// src/modules/orders/orders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { User } from '../../entities/user.entity';
import { Product } from '../../entities/product.entity';
import { CreateOrderDto } from '../../dtos/order/create-order.dto';
import { OrderResponseDto } from '../../dtos/order/order.response.dto';
import { ProductsService } from '../products/products.service';
import { Stripe } from 'stripe';

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createOrder(
    user: User,
    createDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const productIds = createDto.items.map((item) => item.productId);
    const products = await this.productRepository.findBy({
      id: In(productIds),
    });


    console.log(products);
    console.log(createDto);

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    let total = 0;
    const orderItems: OrderItem[] = [];

    for (const item of createDto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      // Deduct stock
      product.stock -= item.quantity;
      await this.productRepository.save(product);

      const price = Number(product.price).toFixed(2);
      total += Number(price) * item.quantity;

      orderItems.push(
        this.orderItemRepository.create({
          product,
          productId: product.id,
          quantity: item.quantity,
          price: Number(price),
        }),
      );
    }

    const order = this.orderRepository.create({
      user,
      userId: user.id,
      items: orderItems,
      total,
      status: OrderStatus.PENDING,
      shippingFirstName: createDto.shippingFirstName,
      shippingLastName: createDto.shippingLastName,
      shippingEmail: createDto.shippingEmail,
      shippingPhone: createDto.shippingPhone,
      shippingAddress: createDto.shippingAddress,
      shippingCity: createDto.shippingCity,
      shippingState: createDto.shippingState,
      shippingZipCode: createDto.shippingZipCode,
      shippingCountry: createDto.shippingCountry,
    });

    const savedOrder = await this.orderRepository.save(order);
    return this.mapToResponseDto(savedOrder);
  }


  // src/modules/orders/orders.service.ts (Add these methods)
  async findByUserWithFilters(
    userId: string,
    filters: { status?: OrderStatus; page?: number; limit?: number },
  ): Promise<{ data: OrderResponseDto[]; meta: any }> {
    const { status, page = 1, limit = 10 } = filters;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders.map((order) => this.mapToResponseDto(order)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        perPage: limit,
      },
    };
  }

  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    completedOrders: number;
    recentOrder?: OrderResponseDto;
  }> {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.SHIPPED).length;
    const recentOrder = orders[0];

    return {
      totalOrders,
      totalSpent,
      pendingOrders,
      completedOrders,
      recentOrder: recentOrder ? this.mapToResponseDto(recentOrder) : undefined,
    };
  }

  async findByUser(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => this.mapToResponseDto(order));
  }

  async findAllForAdmin(): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
    return orders;
  }


  async findOneForAdmin(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
      select: {
        user: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.mapToResponseDto(order);
  }

  async findOne(id: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.product'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return this.mapToResponseDto(order);
  }

  async createCheckoutSession(
    order: Order,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: item.product.images?.length ? [item.product.images[0]] : [],
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      client_reference_id: order.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    order.stripeSessionId = session.id;
    await this.orderRepository.save(order);

    return {
      sessionId: session.id,
      url: session.url ?? '',
    };
  }

  async markAsPaid(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) return;

    order.status = OrderStatus.PROCESSING;
    order.paidAt = new Date() as any;
    await this.orderRepository.save(order);
  }

  private mapToResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      total: order.total,
      status: order.status,
      stripeSessionId: order.stripeSessionId,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      address: order.shippingAddress || '',
      city: order.shippingCity || '',
      state: order.shippingState || '',
      zipCode: order.shippingZipCode || '',
      country: order.shippingCountry || '',
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        price: item.price,
        quantity: item.quantity,
        image: item.product.images?.[0],
      })),
    };
  }
}
