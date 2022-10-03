import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

declare const module: any;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = 5000 || configService.get('PORT');

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('BlockChain Backend')
    .setDescription('see our public functions')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  if(module.hot){
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
  /**
   TODO:create variable to dynamically change the url 
   */
  await app.listen(PORT, () =>
    new Logger().log(`App is available at: http://localhost:${PORT}`),
  );
}
bootstrap();
