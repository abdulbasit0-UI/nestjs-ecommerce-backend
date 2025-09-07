// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { typeOrmConfig } from 'ormconfig';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { BrandsModule } from './modules/brands/brands.module';
import { s3Config } from './config/aws.config';
import { OrdersModule } from './modules/orders/order.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CartModule } from './modules/cart/cart.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { StatsModule } from './modules/stats/stats.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      
      useFactory: typeOrmConfig,
    }),

    JwtModule.register({
      global: true, // This makes JwtService available everywhere
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),

    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    BrandsModule,
    WishlistModule,
    CartModule,
    ReviewsModule,
    StatsModule,
  ],
  providers: [
    {
      provide: 's3Client',
      useFactory: (configService: ConfigService) => s3Config(configService),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
