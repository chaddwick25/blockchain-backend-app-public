import { User } from '@entities/user.entities';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpException, HttpStatus
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dtos/user-login.dto';
import { UserResponse } from '../users/dtos/user-response.dto';
import { Metamask } from '@entities/metamask.entities';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: EntityRepository<User>,
    
    @InjectRepository(Metamask)
    private metamaskRepo: EntityRepository<Metamask>,
    
    private readonly jwtService: JwtService,

    private configService: ConfigService
  ) {}

  async validateUser(loginData: LoginUserDto) {
    const user = await this.userRepo.findOneOrFail({ email: loginData.email });
    const errors = await validate(user);
    if (errors.length > 0) {
      throw new HttpException({
        message: 'Input data validation failed',
        errors: { username: 'Userinput is not valid.' },
      }, HttpStatus.BAD_REQUEST);
    } else {
      if (!(await user.verifyPassword(loginData.password))) {
        throw new HttpException({
          message: 'Input data validation failed',
          errors: { username: 'user credentials incorrect' },
        }, HttpStatus.BAD_REQUEST);
      }
      return user;
    }
  }

  async login(credentials: UserResponse){
    const payload = { email: credentials.email, sub: credentials.id };
    const user = await this.userRepo.findOneOrFail({ email: credentials.email});
    const errors = await validate(user);
    if (errors.length > 0) {
      throw new HttpException({
        message: 'Input data validation failed',
        errors: { username: 'Userinput is not valid.' },
      }, HttpStatus.BAD_REQUEST);
    }
    return {user:user, access_token: this.jwtService.sign(payload)};
  }

  async addUser(dto: Partial<User>) {
    const { email, password } = dto;
    const exists = await this.userRepo.count({ $or: [{ email }] });
    if (exists > 0) {
      throw new HttpException({
        message: 'Input data validation failed',
        errors: { username: 'Email must be unique.' },
      }, HttpStatus.BAD_REQUEST);
    }
    const user = await this.userRepo.create(dto);
    const errors = await validate(user);  
    if (errors.length > 0) {
      throw new HttpException({
        message: 'Input data validation failed',
        errors: { username: 'Userinput is not valid.' },
      }, HttpStatus.BAD_REQUEST);
    } else {
      await this.userRepo.persistAndFlush(user);
      return new UserResponse(user);
    }
  }

  async getNonceToSign(address: string){
    // Get the user document for that address
    const user = await this.metamaskRepo.findOne({address});
    if (user) {
      return { nonce: user.nonce };
    }
    // The user document does not exist, create it first
    const nonce = Math.floor(Math.random() * 1000000).toString();
    await this.metamaskRepo.persistAndFlush(this.metamaskRepo.create({ address, nonce }));
  }   

  async verifySignedMsg(address:string, signature:string){
    // Get the nonce for this address
    const user = await this.metamaskRepo.findOne({address});
    if (!user) {
      throw new ForbiddenException();
    }

    // Recover the address of the account used to create the given Ethereum signature.
    const { nonce } = user;
      const recoveredAddress = recoverPersonalSignature({
        data: `0x${this.toHex(nonce)}`,
        signature,
      });

    // See if that matches the address the user is claiming the signature is from
    if (recoveredAddress !== address) {
      throw new HttpException({
        message: 'Input data validation failed',
        errors: { address: 'Failed to recover signed signature'},
      }, HttpStatus.BAD_REQUEST);
    }

    // update nonce
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await this.metamaskRepo.persistAndFlush(user);
    
    const { id } = user;

    // generate metamask jwt
    const metamask_token:string = await this.jwtService.sign({id, address});
    return { metamask_token };
  }

  private toHex(stringToConvert: string) {
    return Buffer.from(stringToConvert, 'utf8').toString('hex');
  }
}
