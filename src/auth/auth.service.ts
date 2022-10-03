import { User } from '@entities/user.entities';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dtos/user-login.dto';
import { UserResponse } from '../users/dtos/user-response.dto';
import { Metamask } from '@entities/metamask.entities';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { createCipheriv, randomBytes, scrypt, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: EntityRepository<User>,
    
    @InjectRepository(Metamask)
    private metamaskRepo: EntityRepository<Metamask>,
    
    private readonly jwtService: JwtService,

    private readonly avaxService: UtilsService,

  ) {}

  async validateUser(loginData: LoginUserDto) {
    const user = await this.userRepo.findOneOrFail({ email: loginData.email });
    if (!(await user.verifyPassword(loginData.password))) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async login(credentials: UserResponse){
    const payload = { email: credentials.email, sub: credentials.id };
    const user = await this.userRepo.findOneOrFail({ email: credentials.email});
    return {user:user, access_token: this.jwtService.sign(payload)};
  }

  async addUser(user: Partial<User>) {
    try {
      const newUser = this.userRepo.create(user);
      await newUser.updatePassword(user.password);
      await this.userRepo.persistAndFlush(newUser);
      return new UserResponse(newUser);
    } catch (_err) {
      throw new BadRequestException();
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
    // Create an Auth user
    await this.metamaskRepo.persistAndFlush(this.metamaskRepo.create({ address, nonce }));
    return { nonce };
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
      throw new UnauthorizedException();
    }

    // update nonce
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await this.metamaskRepo.persistAndFlush(user);
    
    const { id } = user;
    // create Avalanche profile
    const avaxProfile = await this.createAvaxProfile(id)
    // generate metamask jwt
    const metamask_token:string = await this.jwtService.sign({id, address});
    return { metamask_token };
  }

  private async createAvaxProfile(id:string){
    const profile = await this.metamaskRepo.findOne({id});
    if (!profile.avaxUserName) {
      const { address } = profile
      const encrypted: { encryptedText: string, iv: string} = await this.encrypt(address)
      try {
          // TODO: Refactor the solution below this is not SAFE 
          // there is no "Update" function available on Avax's endpoint
          // add another layer of encryption
          const isUserCreated = await this.avaxService.createAvaxUser(encrypted.encryptedText, encrypted.encryptedText)
          // https://docs.avax.network/apis/avalanchego/apis/keystore#keystorecreateuser
          // the endpoint returns a empty object because why not ?
          if(typeof isUserCreated !== 'object'){
            throw new BadRequestException();
          }
          profile.iv = encrypted.iv
          profile.avaxUserName = encrypted.encryptedText
          await this.metamaskRepo.persistAndFlush(profile);
      } catch (error){
        throw new BadRequestException();
      }
    }
  }

  private toHex(stringToConvert: string) {
    return Buffer.from(stringToConvert, 'utf8').toString('hex');
  }

  private async encrypt(textToEncrypt: string) {
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(
      String(process.env.ENCRYPTION_PASSWORD),
      String(process.env.ENCRYPTION_SALT),
      32,
    )) as Buffer;

    const cipher = createCipheriv('aes-256-ctr', key, iv);    
    const encryptedText = Buffer.concat([
      cipher.update(textToEncrypt),
      cipher.final(),
    ]);
    // convert Buffer to hex for database storage    
    return {
      encryptedText: encryptedText.toString('hex'),
      iv: iv.toString('hex'),
    };
}

private async decrypt(encryptedText: string, iv: string) {
    const key = (await promisify(scrypt)(
      String(process.env.ENCRYPTION_PASSWORD),
      String(process.env.ENCRYPTION_SALT),
      32,
    )) as Buffer;

    // convert the encryptedText and iv back to Buffer
    const ivBuffer = Buffer.from(iv, 'hex');
    const encryptedTextBuffer = Buffer.from(encryptedText, 'hex');

    const decipher = createDecipheriv('aes-256-ctr', key, ivBuffer);
    const decryptedText = Buffer.concat([
      decipher.update(encryptedTextBuffer),
      decipher.final(),
    ]);
    return decryptedText.toString();
  }

}
