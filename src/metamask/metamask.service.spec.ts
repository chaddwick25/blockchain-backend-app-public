import { Metamask } from '@entities/metamask.entities';
import { EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { MetamaskService } from './metamask.service';

describe('MetamaskService', () => {
  let service: MetamaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetamaskService,
        {
          provide: getRepositoryToken(Metamask),
          useValue: EntityRepository,
        },
        JwtService,
      ],
    }).compile();

    service = module.get<MetamaskService>(MetamaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
