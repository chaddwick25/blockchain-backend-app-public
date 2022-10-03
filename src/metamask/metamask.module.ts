import { Metamask } from '@entities/metamask.entities';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MetamaskController } from './metamask.controller';
import { MetamaskService } from './metamask.service';


@Module({
  imports: [
    MikroOrmModule.forFeature([Metamask]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MetamaskController],
  providers: [MetamaskService],
})
export class MetamaskModule {}
