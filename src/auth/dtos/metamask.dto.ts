import {  IsString} from 'class-validator';

export class MetamaskSignDto {
    @IsString()
    address: string;
  }
  
  export class MetamaskVerifyDto extends MetamaskSignDto {
    @IsString()
    signature: string;
  }
  