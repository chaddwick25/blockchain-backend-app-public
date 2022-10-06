import { IsString, IsNumber } from 'class-validator';

export class MintAssetUtilDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsString()
  memo: string;

  @IsNumber()
  denomination: number;

  @IsNumber()
  initialSupply: number;

  @IsString()
  address: string;
}
