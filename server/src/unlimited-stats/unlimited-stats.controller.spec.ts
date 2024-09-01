import { Test, TestingModule } from '@nestjs/testing';
import { UnlimitedStatsController } from './unlimited-stats.controller';
import { UnlimitedStatsService } from './unlimited-stats.service';

describe('StatsController', () => {
  let controller: UnlimitedStatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnlimitedStatsController],
      providers: [UnlimitedStatsService],
    }).compile();

    controller = module.get<UnlimitedStatsController>(UnlimitedStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
