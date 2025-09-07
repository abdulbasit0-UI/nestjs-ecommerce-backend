// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFile,
  Req,
  ClassSerializerInterceptor,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { UserResponseDto } from './dtos/user.response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from '../../dtos/user/update-profile.dto';
import { CreateAddressDto } from '../../dtos/user/create-address.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Admins only.' })
  async findAll(): Promise<UserResponseDto[]> {
    return await this.usersService.findAll();
  }

  
  @Get('customers')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all customers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of customers', type: [UserResponseDto] })
  async getCustomers(): Promise<UserResponseDto[]> {
    return await this.usersService.getCustomers();
  }


  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.usersService.findOne(id);
  }

  // ==================== USER PROFILE ENDPOINTS ====================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return await this.usersService.getUserProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateUserProfile(user.id, updateDto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @UsePipes(FileValidationPipe)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded',
    type: Object,
  })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const avatarUrl = await this.usersService.uploadAvatar(user.id, file);
    return { url: avatarUrl };
  }

  // ==================== ADDRESS MANAGEMENT ENDPOINTS ====================

  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user addresses' })
  @ApiResponse({
    status: 200,
    description: 'List of user addresses',
    type: [Object], // You'll create AddressResponseDto
  })
  async getMyAddresses(@CurrentUser() user: User) {
    return await this.usersService.getUserAddresses(user.id);
  }

  @Post('me/addresses')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user address' })
  @ApiResponse({
    status: 201,
    description: 'Address created',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createMyAddress(
    @CurrentUser() user: User,
    @Body() addressDto: CreateAddressDto,
  ) {
    return await this.usersService.createUserAddress(user.id, addressDto);
  }

  @Patch('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user address' })
  @ApiResponse({
    status: 200,
    description: 'Address updated',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateMyAddress(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() addressDto: Partial<CreateAddressDto>,
  ) {
    return await this.usersService.updateUserAddress(user.id, id, addressDto);
  }

  @Delete('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user address' })
  @ApiResponse({ status: 204, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteMyAddress(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.usersService.deleteUserAddress(user.id, id);
  }

  @Patch('me/addresses/:id/default')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set default address' })
  @ApiResponse({
    status: 200,
    description: 'Default address set',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setMyDefaultAddress(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return await this.usersService.setDefaultAddress(user.id, id);
  }

  // ==================== USER ORDERS ENDPOINTS ====================

  @Get('me/orders')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user orders with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'User orders',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        meta: { type: 'object' },
      },
    },
  })
  async getMyOrders(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {

const orders = await this.usersService.getUserOrders(user.id, {
      status: status as any,
      page,
      limit,
    });

    return orders;
  }

  @Get('me/orders/stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user order statistics' })
  @ApiResponse({
    status: 200,
    description: 'User order statistics',
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number' },
        totalSpent: { type: 'number' },
        pendingOrders: { type: 'number' },
        completedOrders: { type: 'number' },
        recentOrder: { type: 'object' },
      },
    },
  })
  async getMyOrderStats(@CurrentUser() user: User) {
    return await this.usersService.getUserOrderStats(user.id);
  }

  @Get('me/orders/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific order by ID (owned by user)' })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getMyOrder(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return await this.usersService.getUserOrder(user.id, id);
  }

  // ==================== USER WISHLIST ENDPOINTS ====================

  @Get('me/wishlist')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({
    status: 200,
    description: 'User wishlist',
    type: [Object], // You'll create ProductResponseDto
  })
  async getMyWishlist(@CurrentUser() user: User) {
    return await this.usersService.getUserWishlist(user.id);
  }

  @Post('me/wishlist/:productId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToWishlist(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    return await this.usersService.addToWishlist(user.id, productId);
  }

  @Delete('me/wishlist/:productId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiResponse({ status: 204, description: 'Product removed from wishlist' })
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<void> {
    await this.usersService.removeFromWishlist(user.id, productId);
  }

  // ==================== USER NOTIFICATIONS ENDPOINTS ====================

  @Get('me/notifications')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unread', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'User notifications',
    type: [Object], // You'll create NotificationResponseDto
  })
  async getMyNotifications(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('unread') unread?: boolean,
  ) {
    return await this.usersService.getUserNotifications(user.id, {
      page,
      limit,
      unread,
    });
  }

  @Patch('me/notifications/:id/read')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markNotificationAsRead(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return await this.usersService.markNotificationAsRead(user.id, id);
  }

  @Patch('me/notifications/mark-all-read')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllNotificationsAsRead(@CurrentUser() user: User) {
    return await this.usersService.markAllNotificationsAsRead(user.id);
  }
}