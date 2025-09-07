import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class StatsResponseDto {
  @IsNumber()
  totalProducts: number;

  @IsNumber()
  totalCustomers: number;

  @IsNumber()
  totalOrders: number;

  @IsNumber()
  totalRevenue: number;

  @IsOptional()
  @IsDateString()
  lastUpdated?: string;
}

export class RevenueStatsDto {
  @IsNumber()
  totalRevenue: number;

  @IsNumber()
  monthlyRevenue: number;

  @IsNumber()
  dailyRevenue: number;

  @IsNumber()
  averageOrderValue: number;
}

export class OrderStatsDto {
  @IsNumber()
  totalOrders: number;

  @IsNumber()
  pendingOrders: number;

  @IsNumber()
  completedOrders: number;

  @IsNumber()
  cancelledOrders: number;
}

export class ProductStatsDto {
  @IsNumber()
  totalProducts: number;

  @IsNumber()
  activeProducts: number;

  @IsNumber()
  outOfStockProducts: number;

  @IsNumber()
  lowStockProducts: number;
}

export class CustomerStatsDto {
  @IsNumber()
  totalCustomers: number;

  @IsNumber()
  newCustomersThisMonth: number;

  @IsNumber()
  activeCustomers: number;
}
