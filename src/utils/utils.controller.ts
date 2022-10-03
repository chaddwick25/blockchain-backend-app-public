import { Controller, Get, Post, Body } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { MintAssetUtilDto } from './dtos/request/mint-asset-util.dto';
import { CreateAvaxUser } from './dtos/request/create-avax-user.dto';
import { getChainBalanceDto } from './dtos/request/get-chain-balance.dto';
import { Transactions, Token } from '@entities/token.entities';

@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Get('/blockinfo')
  async blockinfo() {
    return this.utilsService.getBlockchainData();
  }

  // TODO: test and validate
  @Get('/getXChainAssets')
  async getXChainAssets( @Body() address: string) {
    return await this.utilsService.getXChainAssets(address);
  }

  @Post('/getUserTokens')
  async getUserTokens(
      address: string,
  ) {
    return await this.utilsService.getUserTokens(address);
  }

  @Post('/getChainBalance')
  async getChainBalance(@Body() chainData: getChainBalanceDto) {
    return await this.utilsService.getChainBalance(chainData);
  }

  // recieves the destination address for the exported asset
  //TODO: test and validate
  @Get('/importANT')
  async importANT(@Body() avaxAssetID: string) {
    return this.utilsService.sendAntsFromXtoC(avaxAssetID);
  }

  //TODO: test and validate
  @Get('/exportANT')
  async exportANT(@Body() avaxAssetID: string) {
    return this.utilsService.receiveAntsFromXtoC(avaxAssetID);
  }

  //TODO: test and validate
  @Get('/importAssetToC')
  async importAssetToC() {
    return this.utilsService.importAssetToC();
  }

  //TODO: test and validate
  @Get('/exportAssetFromX')
  async exportAssetFromX(@Body() amount: string) {
    return this.utilsService.exportAssetFromX(Number(amount));
  }

  //TODO: test and validate
  @Get('/canPayFee')
  async canPayFee(@Body() account: {xChainAddress:string, assetID:string}) {
    return this.utilsService.canPayFee(account.xChainAddress, account.assetID);
  }

  //TODO: test and validate
  @Get('/getChainHexBalance')
  async getChainHexBalance(@Body() chexAddress : string) {
    return this.utilsService.getChainHexBalance(chexAddress);
  }

  @Post('/createAsset')
  async createAsset(@Body() asset: MintAssetUtilDto) {
    const txid = await this.utilsService.createAsset(asset);
    const transactions: Transactions = {
      x_chain: txid,
      c_chain: null,
      wallet: null,
    };
    //TODO:cleanup the Token interface
    const token: Partial<Token> = {...asset, transactions};
    const response = await this.utilsService.createAssetTransaction(token);
    return { txid: txid, status: 200 };
  }

  @Get('/getAvaxAdmins')
  async getAvaxAdmins() {
    return this.utilsService.getAvaxAdmins();
  }

  @Get('/validateMnemonic')
  async validateMnemonic() {
    return this.utilsService.validateMnemonic();
  }

  @Get('/listAddresses')
  async listAddresses() {
    return this.utilsService.listAddresses();
  }

  @Get('/createAddress')
  createAddress() {
    return this.utilsService.createAddress();
  }
}
