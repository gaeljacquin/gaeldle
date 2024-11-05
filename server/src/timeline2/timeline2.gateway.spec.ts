import { Test, TestingModule } from '@nestjs/testing';
import { Timeline2Gateway } from './timeline2.gateway';

describe('Timeline2Gateway', () => {
  let gateway: Timeline2Gateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Timeline2Gateway],
    }).compile();

    gateway = module.get<Timeline2Gateway>(Timeline2Gateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
