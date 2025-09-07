// src/modules/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProductResponseDto } from 'src/dtos/category/product.response.dto';
import { CreateProductDto } from 'src/dtos/category/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { UploadImageResponseDto } from 'src/dtos/upload-image.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth('access-token')
@UseInterceptors(ClassSerializerInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Body() createDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productsService.create(createDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all products (with pagination)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    type: String,
    description: 'Filter by brand',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    type: Boolean,
    description: 'Filter by stock availability',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field (name, price, createdAt, rating)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order (ASC, DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return await this.productsService.findAll({
      page,
      limit,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,

    });
  }

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured products',
    type: [ProductResponseDto],
  })
  async getFeaturedProducts(@Query('limit') limit: number = 8) {
    return await this.productsService.getFeaturedProducts(limit);
  }

  @Get('trending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trending products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trending products',
    type: [ProductResponseDto],
  })
  async getTrendingProducts(@Query('limit') limit: number = 8) {
    return await this.productsService.getTrendingProducts(limit);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    return await this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    return await this.productsService.update(id, updateDto);
  }

  // Keep your existing upload logic exactly as is
  @Post('upload-image')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @UsePipes(FileValidationPipe)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload product image to S3 (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Image uploaded',
    type: UploadImageResponseDto,
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    const imageUrl = await this.productsService.uploadImage(file);
    return { imageUrl };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.productsService.remove(id);
  }
}