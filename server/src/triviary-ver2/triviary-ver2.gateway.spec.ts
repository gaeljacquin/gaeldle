import { Test, TestingModule } from '@nestjs/testing';
import { TriviaryVer2Gateway } from './triviary-ver2.gateway';

describe('Triviary2Gateway', () => {
  let gateway: TriviaryVer2Gateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriviaryVer2Gateway],
    }).compile();

    gateway = module.get<TriviaryVer2Gateway>(TriviaryVer2Gateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
