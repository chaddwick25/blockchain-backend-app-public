import { Entity, Index, Property } from '@mikro-orm/core';
import { CustomBaseEntity } from './base.entities';

@Entity()
export class Metamask extends CustomBaseEntity<Metamask> {
  @Index()
  @Property()
  address: string;
  
  @Property()
  nonce: string;

  @Property({ nullable: true })
  iv?: string;

  @Property({ nullable: true })
  encryptedPassword?: string;

  @Property({ nullable: true })
  xchainAddress?: string;
}
