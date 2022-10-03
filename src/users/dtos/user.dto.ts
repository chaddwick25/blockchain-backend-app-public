import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UserDto {

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  walletAddress?: string;
}
