// src/modules/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from '../../dtos/category/create-category.dto';
import { generateSlugFromName } from '../../utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
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
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) throw new Error('Category not found');
  }
}