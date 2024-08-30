import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  create(data) {
    return this.prisma.stats.create({ data });
  }

  async findAll() {
    const key = 'stats';
    let stats = await this.redisService.getData(key);

    if (!stats) {
      try {
        stats = await this.prisma.stats.findMany();

        await this.redisService.setData(key, stats);
      } catch (error) {
        console.error('Failed to fetch stats: ', error);
      }
    }

    return stats ?? null;
  }

  findOne(id: number) {
    return `This action returns a #${id} stat`;
  }

  update(id: number, data) {
    console.log(data);
    return `This action updates a #${id} stat`;
  }

  remove(id: number) {
    return `This action removes a #${id} stat`;
  }
}
