import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AvalancheService } from './avalanche.service';
import { MintAssetUtilDto } from './dtos/request/mint-asset-util.dto';
import { getChainBalanceDto } from './dtos/request/get-chain-balance.dto';
import { Transactions, Token } from '@entities/token.entities';
import { JwtMetaMaskGuard } from '@guards/jwt-meta.guard';

@Controller('Avalanche')
export class AvalancheController {
  constructor(private readonly avalancheService: AvalancheService) {}

  @Get('/blockinfo')
  async blockinfo() {
    return this.avalancheService.getBlockchainData();
  }

  // TODO: test and validate
  @UseGuards(JwtMetaMaskGuard)
  @Get('/getXChainAssets')
  async getXChainAssets(@Request() req) {
    return await this.avalancheService.getXChainAssets(req.user.xchainAddress);
  }

  @Post('/getUserTokens')
  async getUserTokens(
      address: string,
  ) {
    return await this.avalancheService.getUserTokens(address);
  }

  @Post('/getChainBalance')
  async getChainBalance(@Body() chainData: getChainBalanceDto) {
    return await this.avalancheService.getChainBalance(chainData);
  }

  // recieves the destination address for the exported asset
  //TODO: test and validate
  @Get('/importANT')
  async importANT(@Body() avaxAssetID: string) {
    return this.avalancheService.sendAntsFromXtoC(avaxAssetID);
  }

  //TODO: test and validate
  @Get('/exportANT')
  async exportANT(@Body() avaxAssetID: string) {
    return this.avalancheService.receiveAntsFromXtoC(avaxAssetID);
  }

  //TODO: test and validate
  @Get('/importAssetToC')
  async importAssetToC() {
    return this.avalancheService.importAssetToC();
  }

  //TODO: test and validate
  @Get('/exportAssetFromX')
  async exportAssetFromX(@Body() amount: string) {
    return this.avalancheService.exportAssetFromX(Number(amount));
  }

  //TODO: test and validate
  @Get('/canPayFee')
  async canPayFee(@Body() account: {xChainAddress:string, assetID:string}) {
    return this.avalancheService.canPayFee(account.xChainAddress, account.assetID);
  }

  //TODO: test and validate
  @Get('/getChainHexBalance')
  async getChainHexBalance(@Body() chexAddress : string) {
    return this.avalancheService.getChainHexBalance(chexAddress);
  }
  // TODO: test and validate
  @UseGuards(JwtMetaMaskGuard)
  @Get('/createavaxprofile')
  async createavaxprofile(@Request() req) {
    return this.avalancheService.createAvaxProfile(req.user.id);  
  }

  @Post('/createAsset')
  async createAsset(@Body() asset: MintAssetUtilDto) {
    const txid = await this.avalancheService.createAsset(asset);
    const transactions: Transactions = {
      x_chain: txid,
      c_chain: null,
      wallet: null,
    };
    //TODO:cleanup the Token interface
    const token: Partial<Token> = {...asset, transactions};
    const response = await this.avalancheService.createAssetTransaction(token);
    return { txid: txid, status: 200 };
  }

  @Get('/getAvaxAdmins')
  async getAvaxAdmins() {
    return this.avalancheService.getAvaxAdmins();
  }

  @Get('/validateMnemonic')
  async validateMnemonic() {
    return this.avalancheService.validateMnemonic();
  }

  @Get('/listAddresses')
  async listAddresses() {
    return this.avalancheService.listAddresses();
  }

  @Get('/createAddress')
  createAddress() {
    return this.avalancheService.createAddress();
  }
}
