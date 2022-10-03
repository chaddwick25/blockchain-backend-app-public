import { Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { UtilsController } from './utils.controller';
import { Token } from '@entities/token.entities';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [MikroOrmModule.forFeature([Token])],
  controllers: [UtilsController],
  providers: [UtilsService],
  exports: [UtilsService]
})
export class UtilsModule {}
