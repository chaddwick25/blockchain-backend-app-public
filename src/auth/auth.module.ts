import { Metamask } from '@entities/metamask.entities';
import { Token } from '@entities/token.entities';
import { User } from '@entities/user.entities';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MetamaskModule } from 'src/metamask/metamask.module';
import { UtilsModule } from 'src/utils/utils.module';
import { UtilsService } from 'src/utils/utils.service';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtMetaMaskStrategy } from './strategies/jwt-meta.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UtilsModule,
    MetamaskModule,
    UsersModule,
    MikroOrmModule.forFeature([User]),
    MikroOrmModule.forFeature([Metamask]),
    MikroOrmModule.forFeature([Token]),
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
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtMetaMaskStrategy, UtilsService],
  exports: [AuthService, JwtMetaMaskStrategy],
})
export class AuthModule {}
