import { Test, TestingModule } from '@nestjs/testing';
import { AblyService } from './ably.service';

describe('AblyService', () => {
  let service: AblyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AblyService],
    }).compile();

    service = module.get<AblyService>(AblyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
