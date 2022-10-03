import { Entity, Property, PrimaryKey, Index} from '@mikro-orm/core';
import { CustomBaseEntity } from './base.entities';

export interface Transactions {
  x_chain: string | null;
  c_chain: string | null;
  wallet: string | null;
}

@Entity()
export class Token extends CustomBaseEntity<Token> {

  //TODO: consider adding address from the metamask entities as foriegn key
  @Property()
  address: string;

  @Index()
  @Property()
  name: string;

  @Property()
  symbol: string;

  @Property()
  memo: string;

  @Property()
  denomination: number;

  @Property()
  initialSupply: number;

  @Property({ nullable: true })
  transactions?: Transactions;
}
