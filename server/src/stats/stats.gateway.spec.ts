import { Test, TestingModule } from '@nestjs/testing';
import { StatsGateway } from './stats.gateway';

describe('StatsGateway', () => {
  let gateway: StatsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsGateway],
    }).compile();

    gateway = module.get<StatsGateway>(StatsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
