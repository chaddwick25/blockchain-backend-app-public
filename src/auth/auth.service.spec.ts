import { User } from '@entities/user.entities';
import { Metamask } from '@entities/metamask.entities';
import { EntityRepository } from '@mikro-orm/mongodb';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

import { AuthService } from './auth.service';

const moduleMocker = new ModuleMocker(global);
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: EntityRepository,
        },
        {
          provide: getRepositoryToken(Metamask),
          useValue: EntityRepository,
        },
        JwtService,
      ],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return {
            validateUser: jest.fn(),
            login: jest.fn(),
            addUser: jest.fn(),
          };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
