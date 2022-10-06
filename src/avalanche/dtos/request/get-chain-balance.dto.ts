import { IsString } from 'class-validator';

export class getChainBalanceDto {
  @IsString()
  address: string;

  @IsString()
  assetID: string;

  chainType: "X" | "C" | "P";
}
