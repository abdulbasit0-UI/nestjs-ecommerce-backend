import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  // host: configService.get<string>('DATABASE_HOST'),
  // port: configService.get<number>('DATABASE_PORT'),
  url: configService.get<string>('DATABASE_URL'),
  // username: configService.get<string>('DATABASE_USERNAME'),
  // password: configService.get<string>('DATABASE_PASSWORD'),
  // database: configService.get<string>('DATABASE_NAME'),
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  synchronize: configService.get<string>('NODE_ENV') === 'development', // Never use in prod
  // logging: configService.get<string>('NODE_ENV') === 'development',
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});