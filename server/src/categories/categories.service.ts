import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '~/src/prisma/prisma.service';
import { upstashRedisInit } from '~/utils/upstash-redis';
import { genKey } from '~/utils/env-checks';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private key = genKey('categories');

  create(createCategoryDto: CreateCategoryDto) {
    return 'This action adds a new category';
  }

  async findAll() {
    let categories;

    try {
      categories = await this.prisma.categories.findMany({
        where: {
          active: true,
        },
        omit: {
          description: true,
          createdAt: true,
          updatedAt: true,
        },
        include: {
          _count: {
            select: {
              modes: {
                where: {
                  active: true,
                  hidden: false,
                },
              },
            },
          },
        },
        orderBy: [{ id: 'asc' }],
      });

      this.setCachedCategories(categories);
    } catch (error) {
      console.error('Failed to fetch categories: ', error);
    }

    return categories ?? null;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }

  async setCachedCategories(data) {
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${this.key}`, {
      method: 'POST',
      ...upstashRedisInit,
      body: JSON.stringify(data),
    });
  }
}
