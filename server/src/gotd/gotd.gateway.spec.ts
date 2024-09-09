import { Test, TestingModule } from '@nestjs/testing';
import { GotdGateway } from './gotd.gateway';

describe('GotdGateway', () => {
  let gateway: GotdGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GotdGateway],
    }).compile();

    gateway = module.get<GotdGateway>(GotdGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
