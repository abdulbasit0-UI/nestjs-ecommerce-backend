// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { RolesGuard } from './common/guards/roles.guard';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Enable CORS
  app.enableCors();

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));



  // Swagger
  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Fully featured NestJS E-Commerce Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port, '0.0.0.0', () => {
    Logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
    Logger.log(`📘 Swagger: http://localhost:${port}/api-docs`, 'Bootstrap');
  });
  Logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📘 Swagger: http://localhost:${port}/api-docs`, 'Bootstrap');
}

bootstrap();