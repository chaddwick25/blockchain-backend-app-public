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

}
