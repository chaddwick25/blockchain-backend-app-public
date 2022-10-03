import {
  BaseEntity,
  Entity,
  PrimaryKey,
  Property,
  SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

interface PrimaryKey {
  id: string;
}

@Entity()
export class CustomBaseEntity<T extends PrimaryKey = any> extends BaseEntity<
  T,
  'id'
> {
  @PrimaryKey()
  _id: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(entity: T) {
    super();
    this.assign(entity);
  }
}
