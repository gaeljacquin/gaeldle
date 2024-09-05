import { Test, TestingModule } from '@nestjs/testing';
import { AblyController } from './ably.controller';

describe('AblyController', () => {
  let controller: AblyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AblyController],
    }).compile();

    controller = module.get<AblyController>(AblyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
