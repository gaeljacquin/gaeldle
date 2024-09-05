import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { CreateUnlimitedStatsDto } from './dto/create-unlimited-stats.dto';

@Injectable()
export class UnlimitedStatsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUnlimitedStatsDto) {
    return this.prisma.unlimited_stats.create({ data });
  }

  async findAll() {
    return `This action returns all unlimited_stats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} unlimited_stat`;
  }

  update(id: number, data) {
    console.info(data);
    return `This action updates a #${id} unlimited_stat`;
  }

  remove(id: number) {
    return `This action removes a #${id} unlimited_stat`;
  }
}
