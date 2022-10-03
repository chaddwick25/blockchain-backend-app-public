import { Metamask } from '@entities/metamask.entities';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MetamaskService {
  constructor(
    @InjectRepository(Metamask)
    private repo: EntityRepository<Metamask>,
    private readonly jwtService: JwtService,
  ) {}

  findByAddress(address: string) {
    return this.repo.findOne({ address });
  }

  createUser(user: Partial<Metamask>) {
    return this.repo.persistAndFlush(this.repo.create(user));
  }

  update(user: Metamask) {
    return this.repo.persistAndFlush(user);
  }

  getToken(sub: string, address: string) {
    return this.jwtService.sign({ sub, address });
  }

  getAvaxProfile(id:string) {
     const user = this.repo.findOne({id});
    //TODO: look into a custom implementation
  }
}
