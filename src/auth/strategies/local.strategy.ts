import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserResponse } from 'src/users/dtos/user-response.dto';
import { LoginUserDto } from 'src/users/dtos/user-login.dto';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({ usernameField: 'email' });
  }
  
  //TODO:implement readonly DTO(there is a bug that prevents this)
  async validate(email: string, password :string): Promise<UserResponse> {
    return this.usersService.validateUser(email, password);
  }
}
