import { Test, TestingModule } from '@nestjs/testing';
import { DailyGateway } from './daily.gateway';

describe('DailyGateway', () => {
  let gateway: DailyGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyGateway],
    }).compile();

    gateway = module.get<DailyGateway>(DailyGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
