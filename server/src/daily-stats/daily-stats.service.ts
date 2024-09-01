import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { CreateDailyStatsDto } from './dto/create-daily-stats.dto';

@Injectable()
export class DailyStatsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateDailyStatsDto) {
    return this.prisma.daily_stats.create({ data });
  }

  async findAll() {
    return `This action returns all daily_stats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} daily_stat`;
  }

  update(id: number, data) {
    console.log(data);
    return `This action updates a #${id} daily_stat`;
  }

  remove(id: number) {
    return `This action removes a #${id} daily_stat`;
  }
}
