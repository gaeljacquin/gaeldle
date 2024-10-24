import { Test, TestingModule } from '@nestjs/testing';
import { HiloGateway } from './hilo.gateway';

describe('HiloGateway', () => {
  let gateway: HiloGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HiloGateway],
    }).compile();

    gateway = module.get<HiloGateway>(HiloGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
