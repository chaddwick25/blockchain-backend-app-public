import { IsString } from 'class-validator';

export class CreateAvaxUser {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
