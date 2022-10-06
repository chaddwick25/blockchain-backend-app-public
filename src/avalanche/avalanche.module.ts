import { Module } from '@nestjs/common';
import { AvalancheService } from './avalanche.service';
import { AvalancheController } from './avalanche.controller';
import { Token } from '@entities/token.entities';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [MikroOrmModule.forFeature([Token])],
  controllers: [AvalancheController],
  providers: [AvalancheService],
  exports: [AvalancheService]
})
export class AvalancheModule {}
