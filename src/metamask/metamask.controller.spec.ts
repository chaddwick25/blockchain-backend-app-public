import { Metamask } from '@entities/metamask.entities';
import { EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { MetamaskController } from './metamask.controller';
import { MetamaskService } from './metamask.service';

describe('MetamaskController', () => {
  let controller: MetamaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetamaskController],
      providers: [
        MetamaskService,
        {
          provide: getRepositoryToken(Metamask),
          useValue: EntityRepository,
        },
        JwtService,
      ],
    }).compile();

    controller = module.get<MetamaskController>(MetamaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
