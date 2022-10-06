import { Module } from '@nestjs/common';
import { AvalancheService } from './avalanche.service';
import { AvalancheController } from './avalanche.controller';
import { Token } from '@entities/token.entities';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [MikroOrmModule.forFeature([Token])],
  controllers: [AvalancheController],
  providers: [AvalancheService, ConfigService],
  exports: [AvalancheService]
})
export class AvalancheModule {}
