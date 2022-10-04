import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/profile')
  async getUser(@Request() req) {
    return this.usersService.getUserById(req.user.id);
  }

  @Put('/update')
  async update(@Request() req, @Body() userData: UpdateUserDto) {
    return this.usersService.updateUser(req.user.id, userData);
  }
}
