import { Test, TestingModule } from '@nestjs/testing';
import { CoverGateway } from './cover.gateway';

describe('CoverGateway', () => {
  let gateway: CoverGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoverGateway],
    }).compile();

    gateway = module.get<CoverGateway>(CoverGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
