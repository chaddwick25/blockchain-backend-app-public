import { Entity, Property, Unique } from '@mikro-orm/core';
import * as argon2 from 'argon2';

import { CustomBaseEntity } from './base.entities';

export interface CoinbaseAuth {
  accessToken: string;
  refreshToken: string;
  expires: Date;
}

@Entity()
export class User extends CustomBaseEntity<User> {
  @Property({ nullable: true })
  firstName?: string;

  @Property({ nullable: true })
  lastName?: string;

  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  password: string;

  @Property({ nullable: true })
  role?: string;

  @Property({ nullable: true })
  coinbaseAuth?: CoinbaseAuth;

  async updatePassword(password: string) {
    this.password = await this.hashPassword(password);
  }

  private hashPassword(pass: string) {
    return argon2.hash(pass);
  }

  verifyPassword(pass: string) {
    return argon2.verify(this.password, pass);
  }
}
