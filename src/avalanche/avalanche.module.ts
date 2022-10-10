import { Module } from '@nestjs/common';
import { AvalancheService } from './avalanche.service';
import { AvalancheController } from './avalanche.controller';
import { Token } from '@entities/token.entities';
import { Metamask } from '@entities/metamask.entities';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    MikroOrmModule.forFeature([Token]),
    MikroOrmModule.forFeature([Metamask]),
  ],
  controllers: [AvalancheController],
  providers: [AvalancheService],
  exports: [AvalancheService]
})
export class AvalancheModule {}
