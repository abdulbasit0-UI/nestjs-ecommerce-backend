// src/modules/brands/brands.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Brand } from '../../entities/brand.entity';
import { CreateBrandDto } from '../../dtos/category/create-brand.dto';
import { AwsService } from '../aws/aws.service';
import { generateSlugFromName } from '../../utils/slug.util';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly awsService: AwsService,
  ) {}

  async create(dto: CreateBrandDto): Promise<Brand> {
    const brand = this.brandRepository.create(dto);
    // Generate unique slug from name
    const baseSlug = generateSlugFromName(dto.name);
    let slugCandidate = baseSlug;
    let suffix = 2;
    while (
      await this.brandRepository.count({ where: { slug: slugCandidate } }) > 0
    ) {
      slugCandidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    brand.slug = slugCandidate;
    return await this.brandRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }l

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new Error(`Brand with ID ${id} not found`);
    return brand;
  }

  async update(id: string, dto: Partial<CreateBrandDto>): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new Error(`Brand with ID ${id} not found`);
    
    // If logo is being updated, delete old logo from S3
    if (dto.logo && brand.logo && dto.logo !== brand.logo) {
      try {
        await this.awsService.deleteFile(brand.logo);
      } catch (error) {
        console.error('Failed to delete old logo:', error);
      }
    }
    
    Object.assign(brand, dto);

    // If name changed, refresh slug uniquely
    if (dto.name && dto.name !== brand.name) {
      const baseSlug = generateSlugFromName(dto.name);
      let slugCandidate = baseSlug;
      let suffix = 2;
      while (
        await this.brandRepository.count({
          where: { slug: slugCandidate, id: Not(id) },
        }) > 0
      ) {
        slugCandidate = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      brand.slug = slugCandidate;
    }
    return await this.brandRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new Error(`Brand with ID ${id} not found`);
    
    // Delete logo from S3 if exists
    if (brand.logo) {
      try {
        await this.awsService.deleteFile(brand.logo);
      } catch (error) {
        console.error('Failed to delete logo:', error);
      }
    }
    
    const result = await this.brandRepository.delete(id);
    if (result.affected === 0) throw new Error(`Brand with ID ${id} not found`);
  }

  async uploadLogo(file: Express.Multer.File): Promise<string> {
    return this.awsService.uploadFile(file, 'brands');
  }
}