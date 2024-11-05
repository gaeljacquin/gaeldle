import { Test, TestingModule } from '@nestjs/testing';
import { TimelineGateway } from './timeline.gateway';

describe('TimelineGateway', () => {
  let gateway: TimelineGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimelineGateway],
    }).compile();

    gateway = module.get<TimelineGateway>(TimelineGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
