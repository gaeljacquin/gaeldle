import { Test, TestingModule } from '@nestjs/testing';
import { TimelineVer2Gateway } from './timeline2.gateway';

describe('Timeline2Gateway', () => {
  let gateway: TimelineVer2Gateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimelineVer2Gateway],
    }).compile();

    gateway = module.get<TimelineVer2Gateway>(TimelineVer2Gateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
