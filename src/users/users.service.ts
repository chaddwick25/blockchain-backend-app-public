import { EntityRepository, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, UnauthorizedException, HttpException, HttpStatus} from '@nestjs/common';
import { User } from '@entities/user.entities';
import { UserResponse } from './dtos/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: EntityRepository<User>,
  ) {}

  //TODO: rename to update 
  async updateUser(id: string, dto: Partial<User>) {
    const user = await this.usersRepository.findOneOrFail({ id });
    wrap(user).assign(dto);
    await this.usersRepository.persistAndFlush(user);
    return this.buildUserRO(user);
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.usersRepository.findOneOrFail({ email });
      if (!(await user.verifyPassword(password))) {
        throw Error;
      }
      return new UserResponse(user);
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async getUserById(id: string) {
    try {
      return this.usersRepository.findOneOrFail({ id });
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async getCoinbaseAuth(userId: string) {
    const { coinbaseAuth } = await this.getUserById(userId);
    return coinbaseAuth;
  }

  private buildUserRO(user: Partial<User>) {
    const userRO = {
      firstName: user.firstName,
      lastName: user.lastName
    };
    return { user: userRO };
  }
}
