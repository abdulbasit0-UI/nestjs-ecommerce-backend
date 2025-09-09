// src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, MoreThan } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Address } from '../../entities/address.entity';
import { Order } from '../../entities/order.entity';
import { Product } from '../../entities/product.entity';
import { UpdateProfileDto } from '../../dtos/user/update-profile.dto';
import { CreateAddressDto } from '../../dtos/user/create-address.dto';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { OrderStatus } from '../../entities/order.entity';
import { OrderResponseDto } from 'src/dtos/order/order.response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject('S3_CLIENT')
    private s3Client: S3Client,
    private configService: ConfigService,
  ) {}

  // ==================== BASIC USER OPERATIONS ====================

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['addresses'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ==================== USER PROFILE OPERATIONS ====================

  async getUserProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ==================== GET CUSTOMERS ====================
  async getCustomers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['addresses'],
    });
  }

  async updateUserProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.getUserProfile(userId);

    if (updateDto.name) user.name = updateDto.name;
    if (updateDto.phone) user.phone = updateDto.phone;
    if (updateDto.dateOfBirth) user.dateOfBirth = updateDto.dateOfBirth;
    if (updateDto.bio) user.bio = updateDto.bio;

    if (updateDto.preferences) {
      user.preferences = { ...user.getPreferences(), ...updateDto.preferences };
    }

    return this.userRepository.save(user);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const user = await this.getUserProfile(userId);

    // Delete old avatar if exists
    if (user.avatar) {
      try {
        const key = user.avatar.split('/').pop();
        if (key) {
          await this.deleteAvatar(key);
        }
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
      }
    }

    // Upload new avatar
    const key = `avatars/${userId}/${uuid()}-${Date.now()}.${file.originalname.split('.').pop()}`;

    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const avatarUrl = `${this.configService.get<string>('AWS_S3_URL')}/${key}`;
    user.avatar = avatarUrl;

    await this.userRepository.save(user);

    return avatarUrl;
  }

  private async deleteAvatar(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Failed to delete avatar from S3:', error);
    }
  }

  // ==================== ADDRESS OPERATIONS ====================

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createUserAddress(
    userId: string,
    addressDto: CreateAddressDto,
  ): Promise<Address> {
    const user = await this.getUserProfile(userId);

    // If this is the first address, make it default
    const addressCount = await this.addressRepository.count({
      where: { userId },
    });
    const isDefault = addressCount === 0 ? true : addressDto.isDefault || false;

    // If making this default, unset other defaults of the same type
    if (isDefault) {
      await this.addressRepository.update(
        { userId, type: addressDto.type },
        { isDefault: false },
      );
    }

    const address = this.addressRepository.create({
      ...addressDto,
      userId,
      isDefault,
    });

    return this.addressRepository.save(address);
  }

  async updateUserAddress(
    userId: string,
    addressId: string,
    addressDto: Partial<CreateAddressDto>,
  ): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    Object.assign(address, addressDto);
    return this.addressRepository.save(address);
  }

  async deleteUserAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressRepository.remove(address);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Unset other defaults of the same type
    await this.addressRepository.update(
      { userId, type: address.type, id: Not(addressId) },
      { isDefault: false },
    );

    address.isDefault = true;
    return this.addressRepository.save(address);
  }

  // ==================== USER ORDERS OPERATIONS ====================
  async getMyOrders(
    userId: string,
    filters: { page?: number; limit?: number },
  ): Promise<{ data: OrderResponseDto[]; meta: any }> {
    const { page = 1, limit = 10 } = filters;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders.map((order) => this.mapOrderToResponse(order)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        perPage: limit,
      },
    };
  }

  // Order-related operations moved to OrdersService

  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    completedOrders: number;
    recentOrder?: any;
  }> {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    const pendingOrders = orders.filter(  
      (o) => o.status === OrderStatus.PENDING,
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === OrderStatus.SHIPPED,
    ).length;
    const recentOrder = orders[0];

    console.log(totalOrders, totalSpent, pendingOrders, completedOrders, recentOrder);
    console.log(orders);

    return {
      totalOrders,
      totalSpent,
      pendingOrders,
      completedOrders,
      recentOrder: recentOrder
        ? this.mapOrderToResponse(recentOrder)
        : undefined,
    };
  }

  private mapOrderToResponse(order: Order): any {
    return {
      id: order.id,
      userId: order.userId,
      total: order.total,
      status: order.status,
      stripeSessionId: order.stripeSessionId,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
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

  // ==================== USER NOTIFICATIONS OPERATIONS ====================

  async getUserNotifications(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      unread?: boolean;
    },
  ): Promise<{ data: any[]; meta: any }> {
    const { page = 1, limit = 20, unread } = filters;

    // This is a placeholder - implement based on your notification system
    // For now, return empty data
    return {
      data: [],
      meta: {
        total: 0,
        page,
        lastPage: 0,
        perPage: limit,
      },
    };
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    // Implement notification marking logic
    console.log(
      `Marked notification ${notificationId} as read for user ${userId}`,
    );
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    // Implement mark all as read logic
    console.log(`Marked all notifications as read for user ${userId}`);
  }
}
