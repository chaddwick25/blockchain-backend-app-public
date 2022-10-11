import { Test, TestingModule } from '@nestjs/testing';
import { AvalancheService } from './avalanche.service';
import { EntityRepository } from '@mikro-orm/mongodb';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Token } from '@entities/token.entities';
import { Metamask } from '@entities/metamask.entities';
import { ConfigService } from '@nestjs/config';

describe('AvalancheService', () => {
  let service: AvalancheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvalancheService,
        {
          provide: getRepositoryToken(Token),
          useValue: EntityRepository,
        },
        {
          provide: getRepositoryToken(Metamask),
          useValue: EntityRepository,
        },
        ConfigService
      ],
    }).compile();
    service = module.get<AvalancheService>(AvalancheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
