import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { 
  StatsResponseDto, 
  RevenueStatsDto, 
  OrderStatsDto, 
  ProductStatsDto, 
  CustomerStatsDto 
} from '../../dtos/stats/stats.response.dto';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * Get comprehensive stats with optimized single query
   */
  async getOverallStats(): Promise<StatsResponseDto> {
    const [productStats, customerStats, orderStats, revenueStats] = await Promise.all([
      this.getProductCount(),
      this.getCustomerCount(),
      this.getOrderCount(),
      this.getTotalRevenue(),
    ]);

    return {
      totalProducts: productStats,
      totalCustomers: customerStats,
      totalOrders: orderStats,
      totalRevenue: revenueStats,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get detailed revenue statistics with optimized queries
   */
  async getRevenueStats(): Promise<RevenueStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalRevenue, monthlyRevenue, dailyRevenue, avgOrderValue] = await Promise.all([
      this.getTotalRevenue(),
      this.getRevenueByDateRange(startOfMonth, now),
      this.getRevenueByDateRange(startOfDay, now),
      this.getAverageOrderValue(),
    ]);

    return {
      totalRevenue,
      monthlyRevenue,
      dailyRevenue,
      averageOrderValue: avgOrderValue,
    };
  }

  /**
   * Get detailed order statistics
   */
  async getOrderStats(): Promise<OrderStatsDto> {
    const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
      this.getOrderCount(),
      this.getOrderCountByStatus(OrderStatus.PENDING),
      this.getOrderCountByStatus(OrderStatus.DELIVERED),
      this.getOrderCountByStatus(OrderStatus.CANCELLED),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    };
  }

  /**
   * Get detailed product statistics
   */
  async getProductStats(): Promise<ProductStatsDto> {
    const [totalProducts, activeProducts, outOfStockProducts, lowStockProducts] = await Promise.all([
      this.getProductCount(),
      this.getActiveProductCount(),
      this.getOutOfStockProductCount(),
      this.getLowStockProductCount(),
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
    };
  }

  /**
   * Get detailed customer statistics
   */
  async getCustomerStats(): Promise<CustomerStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, newCustomersThisMonth, activeCustomers] = await Promise.all([
      this.getCustomerCount(),
      this.getNewCustomersCount(startOfMonth, now),
      this.getActiveCustomersCount(),
    ]);

    return {
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
    };
  }

  // Optimized individual query methods

  private async getProductCount(): Promise<number> {
    return this.productRepository.count();
  }

  private async getActiveProductCount(): Promise<number> {
    return this.productRepository.count({ where: { isActive: true } });
  }

  private async getOutOfStockProductCount(): Promise<number> {
    return this.productRepository.count({ where: { stock: 0 } });
  }

  private async getLowStockProductCount(): Promise<number> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.stock <= :lowStockThreshold', { lowStockThreshold: 5 })
      .andWhere('product.stock > 0')
      .getCount();
  }

  private async getCustomerCount(): Promise<number> {
    return this.userRepository.count({ where: { role: UserRole.CUSTOMER } });
  }

  private async getNewCustomersCount(startDate: Date, endDate: Date): Promise<number> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('user.createdAt >= :startDate', { startDate })
      .andWhere('user.createdAt <= :endDate', { endDate })
      .getCount();
  }

  private async getActiveCustomersCount(): Promise<number> {
    // Active customers are those who have made at least one order
    const result = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.orders', 'order')
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .getCount();
    
    return result;
  }

  private async getOrderCount(): Promise<number> {
    return this.orderRepository.count();
  }

  private async getOrderCountByStatus(status: OrderStatus): Promise<number> {
    return this.orderRepository.count({ where: { status } });
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getAverageOrderValue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(order.total)', 'average')
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .getRawOne();

    return parseFloat(result?.average || '0');
  }

  /**
   * Get revenue trends for the last N days
   */
  async getRevenueTrend(days: number = 30): Promise<Array<{ date: string; revenue: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.total)', 'revenue')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue || '0'),
    }));
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10): Promise<Array<{ productId: string; name: string; totalSold: number; revenue: number }>> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.quantity * item.price)', 'revenue')
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .groupBy('product.id, product.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(row => ({
      productId: row.productId,
      name: row.name,
      totalSold: parseInt(row.totalSold || '0'),
      revenue: parseFloat(row.revenue || '0'),
    }));
  }
}
