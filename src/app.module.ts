import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { UtilsModule } from './utils/utils.module';
import { MetamaskModule } from './metamask/metamask.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        entities: ['./dist/entities'],
        entitiesTs: ['./src/entities'],
        dbName: 'crypto',
        clientUrl: configService.get<string>('MONGODB_URI'),
        type: 'mongo',
        ensureIndexes: true,
      }),
      inject: [ConfigService],
    }),
    UtilsModule,
    UsersModule,
    AuthModule,
    MetamaskModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [AppService],
})
export class AppModule {}
