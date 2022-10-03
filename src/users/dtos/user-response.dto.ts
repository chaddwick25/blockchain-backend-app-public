import { CoinbaseAuth, User } from '@entities/user.entities';

export class UserResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  coinbaseAuth?: CoinbaseAuth;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.role = user.role;
    this.coinbaseAuth = user.coinbaseAuth;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
