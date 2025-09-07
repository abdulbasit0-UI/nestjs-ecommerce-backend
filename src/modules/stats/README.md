# Stats Module

This module provides analytics and statistics for the ecommerce platform. It includes optimized queries for fetching various metrics without requiring separate entities.

## Features

- **Overall Statistics**: Total products, customers, orders, and revenue
- **Revenue Analytics**: Total, monthly, daily revenue and average order value
- **Order Statistics**: Order counts by status (pending, completed, cancelled)
- **Product Statistics**: Product counts including active, out of stock, and low stock
- **Customer Statistics**: Total customers, new customers this month, active customers
- **Revenue Trends**: Revenue trends over time
- **Top Selling Products**: Best performing products by quantity sold and revenue

## API Endpoints

All endpoints require admin authentication (`JWT + Admin role`).

### Overview
- `GET /stats/overview` - Get overall statistics

### Revenue
- `GET /stats/revenue` - Get detailed revenue statistics
- `GET /stats/revenue/trend?days=30` - Get revenue trends (default 30 days)

### Orders
- `GET /stats/orders` - Get order statistics by status

### Products
- `GET /stats/products` - Get product statistics
- `GET /stats/products/top-selling?limit=10` - Get top selling products

### Customers
- `GET /stats/customers` - Get customer statistics

## Response Examples

### Overall Stats
```json
{
  "totalProducts": 150,
  "totalCustomers": 1250,
  "totalOrders": 3200,
  "totalRevenue": 125000.50,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### Revenue Stats
```json
{
  "totalRevenue": 125000.50,
  "monthlyRevenue": 15000.25,
  "dailyRevenue": 500.75,
  "averageOrderValue": 39.06
}
```

## Performance Optimizations

- Uses `Promise.all()` for parallel query execution
- Optimized TypeORM queries with proper indexing
- Minimal data fetching with specific field selection
- Efficient aggregation queries for revenue calculations
- Proper date range filtering for time-based statistics

## Security

- All endpoints are protected with JWT authentication
- Admin role required for access
- No sensitive customer data exposed in responses
