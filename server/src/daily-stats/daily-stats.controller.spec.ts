import { Test, TestingModule } from '@nestjs/testing';
import { DailyStatsController } from './daily-stats.controller';
import { DailyStatsService } from './daily-stats.service';

describe('DailyStatsController', () => {
  let controller: DailyStatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyStatsController],
      providers: [DailyStatsService],
    }).compile();

    controller = module.get<DailyStatsController>(DailyStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
