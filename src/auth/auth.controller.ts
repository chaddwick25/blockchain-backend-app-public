import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserResponse } from 'src/users/dtos/user-response.dto';
import { UserDto } from '../users/dtos/user.dto';
import { AuthService } from './auth.service';
import { MetamaskVerifyDto, MetamaskSignDto } from './dtos/metamask.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() { user }: { user: UserResponse }) {
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() user: UserDto) {
    return this.authService.login(await this.authService.addUser(user));
  }

  @Post('sign')
  async getNonceToSign(@Body() { address }: MetamaskSignDto){
    return this.authService.getNonceToSign(address)
  }

  @Post('verify')
  async verifySignedMsg(@Body() { address, signature }: MetamaskVerifyDto) {
    return this.authService.verifySignedMsg(address, signature)
  }
}
