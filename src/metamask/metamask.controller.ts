import { JwtMetaMaskGuard } from '@guards/jwt-meta.guard';
import {
  Controller,
  Get,
  UseGuards,
  Request
} from '@nestjs/common';
import { MetamaskService } from './metamask.service';

@UseGuards(JwtMetaMaskGuard)
@Controller('metamask')
export class MetamaskController {
  constructor(
    private srvc: MetamaskService,
    ) {}

  // @Get('test')
  // async test(@Request() req){
    // const encoded = await this.encryptionSrvc.encrypt('Hello World')
    // const decoded = await this.encryptionSrvc.decrypt(encoded.iv, encoded.encryptedText)   
    // console.log(decoded.toString());
    // return { status: 200, message: 'success'}
  // }

}
