import { MikroOrmModuleOptions as Options } from '@mikro-orm/nestjs';
import { LoadStrategy } from '@mikro-orm/core';

const config: Options = {
  clientUrl: process.env.MONGODB_URI,
  dbName: 'crypto',
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
  debug: true,
  loadStrategy: LoadStrategy.JOINED,
  registerRequestContext: false,
};

export default config;