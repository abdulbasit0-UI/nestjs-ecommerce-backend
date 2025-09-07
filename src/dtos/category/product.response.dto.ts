// src/dtos/product/product-response.dto.ts
export class ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  categoryName?: string;
  brandId: string;
  brandName?: string;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(product: any) {
    this.id = product.id;
    this.name = product.name;
    this.slug = product.slug;
    this.description = product.description;
    this.price = parseFloat(product.price);
    this.stock = product.stock;
    this.images = product.images || [];
    this.categoryId = product.categoryId;
    this.categoryName = product.category?.name;
    this.brandId = product.brandId;
    this.brandName = product.brand?.name;
    this.isActive = product.isActive;
    this.rating = product.rating || 0;
    this.reviewCount = product.reviewCount || 0;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}