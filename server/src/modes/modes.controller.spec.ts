import { Test, TestingModule } from '@nestjs/testing';
import { ModesController } from './modes.controller';

describe('ModesController', () => {
  let controller: ModesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModesController],
    }).compile();

    controller = module.get<ModesController>(ModesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
