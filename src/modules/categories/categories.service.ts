// src/modules/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from '../../dtos/category/create-category.dto';
import { generateSlugFromName } from '../../utils/slug.util';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly awsService: AwsService,
  ) {}

  async create(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create(dto);
    const baseSlug = generateSlugFromName(dto.name);
    let slugCandidate = baseSlug;
    let suffix = 2;
    while (
      await this.categoryRepository.count({ where: { slug: slugCandidate } }) > 0
    ) {
      slugCandidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    category.slug = slugCandidate;
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    return await this.categoryRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new Error('Category not found');
    return category;
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new Error('Category not found');
    // If image is being updated, delete old image from S3
    if (dto.image && category.image && dto.image !== category.image) {
      try {
        await this.awsService.deleteFile(category.image);
      } catch (error) {
        console.error('Failed to delete old image:', error);
      }
    }

    Object.assign(category, dto);
    if (dto.name && dto.name !== category.name) {
      const baseSlug = generateSlugFromName(dto.name);
      let slugCandidate = baseSlug;
      let suffix = 2;
      while (
        await this.categoryRepository.count({
          where: { slug: slugCandidate, id: Not(id) },
        }) > 0
      ) {
        slugCandidate = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      category.slug = slugCandidate;
    }
    return await this.categoryRepository.save(category);
  }

  async remove(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new Error('Category not found');

    // Delete image from S3 if exists
    if (category.image) {
      try {
        await this.awsService.deleteFile(category.image);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }

    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) throw new Error('Category not found');
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return this.awsService.uploadFile(file, 'categories');
  }
}