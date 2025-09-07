import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery 
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { 
  StatsResponseDto, 
  RevenueStatsDto, 
  OrderStatsDto, 
  ProductStatsDto, 
  CustomerStatsDto 
} from '../../dtos/stats/stats.response.dto';

@ApiTags('Statistics')
@Controller('stats')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get overall statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Overall statistics retrieved successfully',
    type: StatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getOverallStats(): Promise<StatsResponseDto> {
    return this.statsService.getOverallStats();
  }

  @Get('revenue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed revenue statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Revenue statistics retrieved successfully',
    type: RevenueStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getRevenueStats(): Promise<RevenueStatsDto> {
    return this.statsService.getRevenueStats();
  }

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed order statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
    type: OrderStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getOrderStats(): Promise<OrderStatsDto> {
    return this.statsService.getOrderStats();
  }

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed product statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product statistics retrieved successfully',
    type: ProductStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getProductStats(): Promise<ProductStatsDto> {
    return this.statsService.getProductStats();
  }

  @Get('customers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed customer statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Customer statistics retrieved successfully',
    type: CustomerStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getCustomerStats(): Promise<CustomerStatsDto> {
    return this.statsService.getCustomerStats();
  }

  @Get('revenue/trend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get revenue trends for the last N days (Admin only)' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue trends retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          revenue: { type: 'number', format: 'float' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getRevenueTrend(
    @Query('days') days?: string,
  ): Promise<Array<{ date: string; revenue: number }>> {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.statsService.getRevenueTrend(daysNumber);
  }

  @Get('products/top-selling')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get top selling products (Admin only)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Top selling products retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          totalSold: { type: 'number', format: 'integer' },
          revenue: { type: 'number', format: 'float' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getTopSellingProducts(
    @Query('limit') limit?: string,
  ): Promise<Array<{ productId: string; name: string; totalSold: number; revenue: number }>> {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.statsService.getTopSellingProducts(limitNumber);
  }
}
