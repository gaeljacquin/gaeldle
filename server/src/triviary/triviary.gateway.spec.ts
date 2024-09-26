import { Test, TestingModule } from '@nestjs/testing';
import { TriviaryGateway } from './triviary.gateway';

describe('TriviaryGateway', () => {
  let gateway: TriviaryGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriviaryGateway],
    }).compile();

    gateway = module.get<TriviaryGateway>(TriviaryGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
