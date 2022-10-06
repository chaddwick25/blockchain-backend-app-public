import { Test, TestingModule } from '@nestjs/testing';
import { AvalancheController } from './avalanche.controller';
import { AvalancheService } from './avalanche.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);
jest.mock('./avalanche.service');

describe('AvalancheController', () => {
  let controller: AvalancheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvalancheController],
      providers: [AvalancheService],
    }).useMocker((token) => {
      if (token === AvalancheService) {
        return {
        };
      }
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(
          token,
        ) as MockFunctionMetadata<any, any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();

    controller = module.get<AvalancheController>(AvalancheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
