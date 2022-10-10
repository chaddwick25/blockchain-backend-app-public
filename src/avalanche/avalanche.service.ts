import {
  AVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  InitialStates,
  SECPMintOutput,
  SECPTransferOutput,
} from 'avalanche/dist/apis/avm';
import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Avalanche, Buffer, BN } from 'avalanche';
import { KeystoreAPI } from 'avalanche/dist/apis/keystore';
import {
  GetUTXOsResponse,
  GetBalanceResponse,
} from 'avalanche/dist/apis/avm/interfaces';
import HDNode from 'avalanche/dist/utils/hdnode';
import Mnemonic from 'avalanche/dist/utils/mnemonic';
import {
  Tx as EVMTx,
  KeyChain as EVMKeyChain,
  UnsignedTx as EVMUnsignedTx,
  UTXOSet as EVMUTXOSet,
  EVMAPI,
  UTXO as EVMUTXO,
} from 'avalanche/dist/apis/evm';
import { Defaults, UnixNow, costImportTx } from 'avalanche/dist/utils';
import { PlatformVMAPI } from "avalanche/dist/apis/platformvm"
const Web3 = require('web3');
import { getChainBalanceDto } from './dtos/request/get-chain-balance.dto';
import { EntityRepository } from '@mikro-orm/core';
import { Token } from '@entities/token.entities';
import { Metamask } from '@entities/metamask.entities';
import { InjectRepository } from '@mikro-orm/nestjs';
import { validate } from 'class-validator';
//TODO:clean this up
export interface Transactions {
  x_chain: string | null;
  c_chain: string | null;
  wallet: string | null;
}
import { HttpException, HttpStatus } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, randomBytes, scrypt, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import configuration from './config/configuration';

@Injectable()
export class AvalancheService implements OnModuleInit {
   constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: EntityRepository<Token>,

    @InjectRepository(Metamask)
    private readonly metamaskRepo: EntityRepository<Metamask>,

    private configService: ConfigService
  ) {}

  // chain config variables
  private avalancheAPI: Avalanche;
  private xchain: AVMAPI;
  private cchain: EVMAPI;
  private pchain: PlatformVMAPI;
  private cAddressStrings: string[];
  private xAddressStrings: string[];
  private xChainBlockchainID: string;
  private cChainBlockchainID: string;
  private xKeychain: KeyChain;
  private cKeychain: EVMKeyChain;
  private avaxAssetID: string;
  private cHexAddress: string;

  async onModuleInit(): Promise<void> {
    // Using the config Service within the onModuleInit creates weird errors 
    // Importing the avalanche api config works better within the Nestjs framework
    const config = await configuration();
    const ip = config.avalanche.ip
    const port = config.avalanche.port
    const protocol = config.avalanche.protocol
    const networkID = config.avalanche.networkID
    this.avalancheAPI = await new Avalanche(
        ip, 
        port,
        protocol,
        networkID
    );
    this.xchain = this.avalancheAPI.XChain();
    this.cchain = this.avalancheAPI.CChain();
    this.pchain = this.avalancheAPI.PChain();
    this.xKeychain = this.xchain.keyChain();
    this.cKeychain = this.cchain.keyChain();
    const privKey: string = this.getPrivateKeyFromMnemonic();
    this.xKeychain.importKey(privKey);
    this.cKeychain.importKey(privKey);
    this.cAddressStrings = this.cKeychain.getAddressStrings();
    this.xAddressStrings = this.xKeychain.getAddressStrings();
    this.avaxAssetID = Defaults.network[config.avalanche.networkID].X.avaxAssetID;
    this.xChainBlockchainID = Defaults.network[config.avalanche.networkID].X.blockchainID;
    this.cChainBlockchainID = Defaults.network[config.avalanche.networkID].C.blockchainID;
    this.cHexAddress = config.avalanche.cHexAddress
  }

  async getAvaxAdmins() {
    const keystore: KeystoreAPI = this.avalancheAPI.NodeKeys();
    const users: string[] = await keystore.listUsers();
    return users;
  }

  //TODO: implement and test
  async createAvaxProfile(id: string) {
    const profile = await this.metamaskRepo.findOne({ id });
    if(profile?.encryptedPassword == null) {
      try {
        // TODO: change to constant after creating seperate ENV files 
        let { address } = profile
        //TODO:implement a more robust password generator
        const password = Math.floor(Math.random() * 1000000).toString();
        const encryptedProfile: { encryptedPassword: string, iv: string } = await this.encrypt(password)
        await this.verifyEncryption(encryptedProfile.encryptedPassword, password, encryptedProfile.iv)
        // TODO: remove after creating seperate ENV files         
        if(this.configService.get<boolean>('IS_STAGING')){
          address = address + password
        }
        const hashedPassword = await argon2.hash(password);
        await this.avalancheAPI.NodeKeys().createUser(address, hashedPassword)
        //TODO: rethink creating a address after creating user login
        await this.xchain.createAddress(address, hashedPassword)
        const xchainAddress = await this.xchain.listAddresses(address, hashedPassword)
        profile.encryptedPassword = encryptedProfile.encryptedPassword;
        profile.iv = encryptedProfile.iv
        profile.xchainAddress = xchainAddress[0]
        await this.metamaskRepo.persistAndFlush(profile);
      } catch (error) {
        console.log(error);
        throw new HttpException({
          message: 'Avax Profile creation failed',
          errors: error,
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      } 
    }
  }

  private async verifyEncryption(encryptedPassword: string, password: string, iv: string) {
    const decryptedPassword = await this.decrypt(encryptedPassword, iv)
    if (decryptedPassword !== password) {
      throw new HttpException({
        message: 'Authentication failed',
        errors: 'Password verification failed',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return true;
  }

  private async encrypt(textToEncrypt: string) {
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(
      this.configService.get<string>('ENCRYPTION_PASSWORD'),
      this.configService.get<string>('ENCRYPTION_SALT'),
      32,
    )) as Buffer;
    try {
      const cipher = createCipheriv('aes-256-ctr', key, iv);
      const encryptedText = Buffer.concat([
        cipher.update(textToEncrypt),
        cipher.final(),
      ]);
      // convert Buffer to hex for database storage    
      return {
        encryptedPassword: encryptedText.toString('hex'),
        iv: iv.toString('hex'),
      };
    } catch (err) {
      throw new HttpException({
        message: 'Authentication failed',
        errors: err,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async decrypt(encryptedText: string, iv: string) {
    const key = (await promisify(scrypt)(
      this.configService.get<string>('ENCRYPTION_PASSWORD'),
      this.configService.get<string>('ENCRYPTION_SALT'),
      32,
    )) as Buffer;
    // convert the encryptedText and iv back to Buffer
    const ivBuffer = Buffer.from(iv, 'hex');
    const encryptedTextBuffer = Buffer.from(encryptedText, 'hex');
    try {
      const decipher = createDecipheriv('aes-256-ctr', key, ivBuffer);
      const decryptedText = Buffer.concat([
        decipher.update(encryptedTextBuffer),
        decipher.final(),
      ]);
      return decryptedText.toString();
    } catch (err) {
      throw new HttpException({
        message: 'Authentication failed',
        errors: err,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChainBalance(chain: getChainBalanceDto) {
    switch (chain.chainType) {
      case 'X':
        const getXChainResponse: any = await this.xchain.getBalance(
          chain.address,
          chain.assetID,
        );
        return new BN(getXChainResponse.balance).toNumber()
        break;
      case 'P':
        const getPChainResponse: any = await this.pchain.getBalance(
          chain.address,
        );
        return new BN(getPChainResponse.balance).toNumber()
        break;
      case 'C':
        const getHexResponse: any = await this.getChainHexBalance(
          this.cHexAddress
        );
        return getHexResponse.toNumber()
        break;
      // TODO: write an appropriate response
      default:
        break;
    }
  }

  async getChainHexBalance(cHexAddress: string) {
    const path: string = '/ext/bc/C/rpc';
    const web3: any = new Web3(
      new Web3.providers.HttpProvider(
        `${this.configService.get<string>('PROTOCOL')}://${this.configService.get<string>('HOST')}:${this.configService.get<string>('AVAX_API_PORT')}${path}`,
      ),
    );
    let balance: BN = await web3.eth.getBalance(cHexAddress);
    return balance;
  }

  async getXChainAssets(address) {
    const balances: object[] = await this.xchain.getAllBalances(address);
    let allAssets = [];

    for await (let balance of balances) {
      let description = await this.xchain.getAssetDescription(
        String(balance['asset']),
      );
      delete description.assetID;
      Object.assign(balance, description);
      allAssets.push(balance);
    }
    return allAssets;
  }

  // TODO:implement into swagger
  async getBlockchainData() {
    const protocol = this.avalancheAPI.getProtocol();
    const host = this.avalancheAPI.getHost();
    const ip = this.avalancheAPI.getIP();
    const port = this.avalancheAPI.getPort();
    const baseEndpoint = this.avalancheAPI.getBaseEndpoint();
    const axiosConfig = this.avalancheAPI.getRequestConfig();
    const headers = this.avalancheAPI.getHeaders();
    const blockchainURL = this.avalancheAPI.getURL();
    const networkID = this.avalancheAPI.getNetworkID();

    return {
      protocol,
      host,
      ip,
      port,
      baseEndpoint,
      axiosConfig,
      headers,
      blockchainURL,
      networkID,
    };
  }

  // Build transactions to export AVAX from the X-Chain to the C-Chain 
  async exportAssetFromX(quantity: number = 100) {
    const locktime: BN = new BN(0);
    const asOf: BN = UnixNow();
    const memo: Buffer = Buffer.from(
      'AVM utility method buildExportTx to export AVAX to the C-Chain from the X-Chain',
    );
    const fee: BN = this.xchain.getDefaultTxFee();
    const avmUTXOResponse: GetUTXOsResponse = await this.xchain.getUTXOs(
      this.xAddressStrings,
    );

    const utxoSet: UTXOSet = avmUTXOResponse.utxos;
    const getBalanceResponse: GetBalanceResponse = await this.xchain.getBalance(
      this.xAddressStrings[0],
      this.avaxAssetID,
    );

    const amount = new BN(quantity);
    // No fee is paid because assets are simply 'indexed/tagged' for export
    const unsignedTx: UnsignedTx = await this.xchain.buildExportTx(
      utxoSet,
      amount,
      this.cChainBlockchainID,
      this.cAddressStrings,
      this.xAddressStrings,
      this.xAddressStrings,
      memo,
      asOf,
      locktime,
    );

    const tx: Tx = unsignedTx.sign(this.xKeychain);
    const txid: string = await this.xchain.issueTx(tx);
    console.log(`Success! TXID: ${txid}`);
  }

  // Import Avax to C-Chain from X-Chain
  async importAssetToC() {
    const baseFeeResponse: string = await this.cchain.getBaseFee();
    const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9);
    let fee: BN = baseFee;
    const evmUTXOResponse: any = await this.cchain.getUTXOs(
      this.cAddressStrings,
      this.xChainBlockchainID,
    );
    const utxoSet: EVMUTXOSet = evmUTXOResponse.utxos;
    // Fee is paid to transfer the assets in the UTXOset
    let unsignedTx: EVMUnsignedTx = await this.cchain.buildImportTx(
      utxoSet,
      this.cHexAddress,
      this.cAddressStrings,
      this.xChainBlockchainID,
      this.cAddressStrings,
      fee,
    );

    const importCost: number = costImportTx(unsignedTx);
    fee = baseFee.mul(new BN(importCost));
    // amount is not given because all Transactions(utxoset) are imported
    unsignedTx = await this.cchain.buildImportTx(
      utxoSet,
      this.cHexAddress,
      this.cAddressStrings,
      this.xChainBlockchainID,
      this.cAddressStrings,
      fee,
    );

    const tx: EVMTx = unsignedTx.sign(this.cKeychain);
    const txid: string = await this.cchain.issueTx(tx);
    console.log(`Success! TXID: ${txid}`);
  }

  // TODO: add functional to for the other Chains (P,C)
  async canPayFee(xChainAddress, AssetID) {

    const baseFeeResponse: string = await this.cchain.getBaseFee();
    const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9);
    let fee: BN = baseFee;
    const getBalanceResponse: any = await this.xchain.getBalance(
      xChainAddress,
      AssetID,
    );
    const balance: BN = new BN(getBalanceResponse.balance);
    if (balance.toNumber() > fee.toNumber()) {
      return true;
    } else {
      return false;
      // try add send avax to the wallet address to cover the fee
      // TODO: write a function to achieve this
    }
  }

  // https://github.com/ava-labs/avalanchejs/blob/cba408fadf52c4a36a13f378e3a3c89f5778aa51/examples/evm/buildImportTx-xchain.ts
  async receiveAntsFromXtoC(assetID) {
    const cHexAddress = this.configService.get<string>('HEX_ADDRESS');
    const baseFeeResponse: string = await this.cchain.getBaseFee();
    const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9);
    let fee: BN = baseFee;

    // TODO:check if avax balance can pay the TransactionFee
    // Implement canPayFee to check wallet balance before attempting a transaction

    const evmUTXOResponse: any = await this.cchain.getUTXOs(
      this.cAddressStrings,
      this.xChainBlockchainID,
    );
    const utxoSet: EVMUTXOSet = evmUTXOResponse.utxos;
    let unsignedTx: EVMUnsignedTx = await this.cchain.buildImportTx(
      utxoSet,
      cHexAddress,
      this.cAddressStrings,
      this.xChainBlockchainID,
      this.cAddressStrings,
      fee,
    );
    const importCost: number = costImportTx(unsignedTx);
    fee = baseFee.mul(new BN(importCost));
    // import cost is payed by the chain signing for the  ANT import
    unsignedTx = await this.cchain.buildImportTx(
      utxoSet,
      cHexAddress,
      this.cAddressStrings,
      this.xChainBlockchainID,
      this.cAddressStrings,
      fee,
    );
    const tx: EVMTx = unsignedTx.sign(this.cKeychain);
    return await this.cchain.issueTx(tx);
  }

  // https://github.com/ava-labs/avalanchejs/blob/cba408fadf52c4a36a13f378e3a3c89f5778aa51/examples/avm/buildExportTx-cchain-ant.ts
  async sendAntsFromXtoC(assetID) {
    const locktime: BN = new BN(0);
    const asOf: BN = UnixNow();
    //TODO: dynamically assign memo
    const memo: Buffer = Buffer.from(
      'AVM utility method buildExportTx to export ANT to the C-Chain from the X-Chain',
    );
    const avmUTXOResponse: GetUTXOsResponse = await this.xchain.getUTXOs(
      this.xAddressStrings,
    );
    const utxoSet: UTXOSet = avmUTXOResponse.utxos;
    const amount: BN = new BN(500);

    const threshold: number = 1;
    const unsignedTx: UnsignedTx = await this.xchain.buildExportTx(
      utxoSet,
      amount,
      this.cChainBlockchainID,
      this.cAddressStrings,
      this.xAddressStrings,
      this.xAddressStrings,
      memo,
      asOf,
      locktime,
      threshold,
      assetID,
    );

    const tx: Tx = unsignedTx.sign(this.xKeychain);
    return await this.xchain.issueTx(tx);
  }

  async createAsset(asset) {
    if (this.validateMnemonic()) {
      const xAddresses: Buffer[] = this.xchain.keyChain().getAddresses();
      const outputs: SECPMintOutput[] = [];
      const threshold = 1;
      const locktime: BN = new BN(0);
      const memo: Buffer = Buffer.from(asset.memo);
      const name: string = asset.name;
      const symbol: string = asset.symbol;
      const denomination: number = asset.denomination;

      const avmUTXOResponse: GetUTXOsResponse = await this.xchain.getUTXOs(
        this.xAddressStrings,
      );
      const utxoSet: UTXOSet = avmUTXOResponse.utxos;

      const amount: BN = new BN(asset.initialSupply);
      const vcapSecpOutput = new SECPTransferOutput(
        amount,
        xAddresses,
        locktime,
        threshold,
      );
      const initialStates: InitialStates = new InitialStates();
      initialStates.addOutput(vcapSecpOutput);

      const secpMintOutput: SECPMintOutput = new SECPMintOutput(
        xAddresses,
        locktime,
        threshold,
      );
      outputs.push(secpMintOutput);

      const unsignedTx: UnsignedTx = await this.xchain.buildCreateAssetTx(
        utxoSet,
        this.xAddressStrings,
        this.xAddressStrings,
        initialStates,
        name,
        symbol,
        denomination,
        outputs,
        memo,
      );
      const tx: Tx = unsignedTx.sign(this.xKeychain);
      const txid: string = await this.xchain.issueTx(tx);
      return txid;
    } else {
      throw new ServiceUnavailableException(
        'Service Unavailble: Private key not valid',
      );
    }
  }

  // TODO:finish later 
  //adds a transaction_id to the relative transaction(x_chain, c_chain and wallet)
  async updateAssetTransaction(dto: Partial<Token>) {
    // const user = await this.usersRepository.findOneOrFail({ id });
    // wrap(user).assign(dto);
    // await this.usersRepository.persistAndFlush(user);
    // return this.buildUserRO(user);
  }

  async getUserTokens(address: string) {
    return await this.tokenRepository.find({ address: address });
  }

  async createAssetTransaction(tokenDto: Partial<Token>) {
    const createdToken = this.tokenRepository.create(tokenDto);
    const errors = await validate(createdToken);
    if (errors.length > 0) {
      console.log(errors);
      throw new HttpException({
        message: 'Input data validation failed',
        errors: { token: 'Token Transaction was not created is not valid.' },
      }, HttpStatus.BAD_REQUEST);
    } else {
      await this.tokenRepository.persistAndFlush(createdToken);
      return true;
    }
  }

  async validateMnemonic(language: string = 'english'): Promise<boolean> {
    const mnemonic: Mnemonic = Mnemonic.getInstance();
    const m = String(this.configService.get<string>('MNEMONIC'));
    const wordlist = (await mnemonic.getWordlists(language)) as string[];
    const validateMnemonic: string = String(
      mnemonic.validateMnemonic(m, wordlist),
    ).toLowerCase();
    if (validateMnemonic === 'true') {
      return true;
    } else {
      return false;
    }
  }

  private getPrivateKeyFromMnemonic(activeIndex = 0): string {
    const mnemonic: Mnemonic = Mnemonic.getInstance();
    const mnemonicToSeedSync: Buffer = mnemonic.mnemonicToSeedSync(
      this.configService.get<string>('MNEMONIC')
    );
    const hdNode = new HDNode(mnemonicToSeedSync);
    const avaPath = `m/44'/9000'/0'/0/${activeIndex}`;
    const privKey = hdNode.derive(avaPath).privateKeyCB58;
    return privKey;
  }

  async listAddresses(): Promise<string[]> {
    const addresses: string[] = await this.xchain.listAddresses(
      this.configService.get<string>('AVAX_USERNAME'),
      this.configService.get<string>('AVAX_USER_PASSWORD'),
    );
    return addresses;
  }

  async createAvaxUser(username: string, password: string) {
    return await this.avalancheAPI
      .NodeKeys()
      .createUser(username, await argon2.hash(password));
  }

  //TODO: refactor to recieve variables
  async createAddress() {
    const address: string = await this.xchain.createAddress(
      this.configService.get<string>('AVAX_USERNAME'),
      this.configService.get<string>('AVAX_USER_PASSWORD'),
    );
    return address;
  }

}
