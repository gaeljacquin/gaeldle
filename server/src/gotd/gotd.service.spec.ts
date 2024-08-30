import { Test, TestingModule } from '@nestjs/testing';
import { GotdService } from './gotd.service';

describe('GotdService', () => {
  let service: GotdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GotdService],
    }).compile();

    service = module.get<GotdService>(GotdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
