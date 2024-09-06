import { Injectable } from '@nestjs/common';
import { DrizzleService } from '~/src/drizzle/service';
import { dailyStats } from '~/src/drizzle/schema';
import { CreateDailyStatsDto } from './dto/create-daily-stats.dto';

@Injectable()
export class DailyStatsService {
  constructor(private readonly drizzle: DrizzleService) {}

  create(data: CreateDailyStatsDto) {
    return this.drizzle.db.insert(dailyStats).values(data);
  }

  async findAll() {
    return `This action returns all daily_stats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} daily_stat`;
  }

  update(id: number, data) {
    console.info(data);
    return `This action updates a #${id} daily_stat`;
  }

  remove(id: number) {
    return `This action removes a #${id} daily_stat`;
  }
}
