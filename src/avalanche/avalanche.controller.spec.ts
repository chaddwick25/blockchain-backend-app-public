import { Test, TestingModule } from '@nestjs/testing';
import { AvalancheController } from './avalanche.controller';
import { AvalancheService } from './avalanche.service';

describe('AvalancheController', () => {
  let controller: AvalancheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvalancheController],
      providers: [AvalancheService],
    }).compile();

    controller = module.get<AvalancheController>(AvalancheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
