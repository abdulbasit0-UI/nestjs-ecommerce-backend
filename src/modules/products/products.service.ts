// src/modules/products/products.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In, MoreThan, LessThan, Between } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductResponseDto } from 'src/dtos/category/product.response.dto';
import { CreateProductDto } from 'src/dtos/category/create-product.dto';
import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject('S3_CLIENT')
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) { }

  // Keep your uploadImage method exactly as is
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const key = `products/${uuid()}-${Date.now()}.${file.originalname.split('.').pop()}`;

    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      return `${this.configService.get<string>('AWS_S3_URL')}/${key}`;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  // Keep your removeImage method exactly as is
  async removeImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new Error('Failed to delete image from S3');
    }
  }

  async create(createDto: CreateProductDto): Promise<ProductResponseDto> {
    // Check if product with same name exists
    const existingProduct = await this.productRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingProduct) {
      throw new Error('Product with this name already exists');
    }

    const product = this.productRepository.create(createDto);
    const saved = await this.productRepository.save(product);
    return this.mapToResponseDto(saved);
  }

  // Enhanced findAll with robust filtering
  async findAll(
    options: FindAllOptions,
  ): Promise<{ data: ProductResponseDto[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.isActive = :isActive', { isActive: true });

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Category
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Brand
    if (brandId) {
      queryBuilder.andWhere('product.brandId = :brandId', { brandId });
    }

    // Price range
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Stock
    if (inStock) {
      queryBuilder.andWhere('product.stock > 0');
    }

    // Sorting
    const validSortFields = ['name', 'price', 'createdAt', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    // Pagination
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: items.map((item) => this.mapToResponseDto(item)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        perPage: limit,
      },
    };
  }


  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.mapToResponseDto(product);
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'brand'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.mapToResponseDto(product);
  }

  // New method for featured products
  async getFeaturedProducts(limit: number = 8): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: ['category', 'brand'],
      order: { rating: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return products.map(p => this.mapToResponseDto(p));
  }

  // New method for trending products
  async getTrendingProducts(limit: number = 8): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: {
        isActive: true,
        rating: MoreThan(4),
      },
      relations: ['category', 'brand'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return products.map(p => this.mapToResponseDto(p));
  }

  async update(
    id: string,
    updateDto: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // If name is being updated, check for duplicates
    if (updateDto.name && updateDto.name !== product.name) {
      const existingProduct = await this.productRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new Error('Product with this name already exists');
      }
    }

    Object.assign(product, updateDto);
    const saved = await this.productRepository.save(product);
    return this.mapToResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // Handle image cleanup if needed
    if (product.images && product.images.length > 0) {
      // You can add image deletion logic here if needed
      // For now, we'll just remove the product record
    }

    await this.productRepository.delete(id);
  }

  // Enhanced mapping with slug and new fields
  private mapToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images || [],
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      brandId: product.brandId,
      brandName: product.brand?.name,
      isActive: product.isActive,
      rating: product.rating,
      reviewCount: product.reviewCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}