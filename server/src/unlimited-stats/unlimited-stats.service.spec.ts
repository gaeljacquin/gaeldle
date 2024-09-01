import { Test, TestingModule } from '@nestjs/testing';
import { UnlimitedStatsService } from './unlimited-stats.service';

describe('UnlimitedStatsService', () => {
  let service: UnlimitedStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnlimitedStatsService],
    }).compile();

    service = module.get<UnlimitedStatsService>(UnlimitedStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
