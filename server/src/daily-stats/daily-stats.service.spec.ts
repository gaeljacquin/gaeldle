import { Test, TestingModule } from '@nestjs/testing';
import { DailyStatsService } from './daily-stats.service';

describe('DailyStatsService', () => {
  let service: DailyStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyStatsService],
    }).compile();

    service = module.get<DailyStatsService>(DailyStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
