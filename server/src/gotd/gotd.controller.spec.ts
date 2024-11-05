import { Test, TestingModule } from '@nestjs/testing';
import { GotdController } from './gotd.controller';
import { GotdService } from './gotd.service';

describe('GotdController', () => {
  let controller: GotdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GotdController],
      providers: [GotdService],
    }).compile();

    controller = module.get<GotdController>(GotdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
