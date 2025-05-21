import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import * as bodyParser from 'body-parser';

const maxPostSize = process.env.MAX_REQUEST_SIZE || '10mb';

export async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({ origin: '*'});  app.use(bodyParser.json({ limit: maxPostSize }));
  app.use(bodyParser.urlencoded({ limit: maxPostSize, extended: true }));
  app.useGlobalPipes(new ValidationPipe({ stopAtFirstError: true }));

  await app.listen(3000, '0.0.0.0');
}

// Execute bootstrap if this file is run directly
if (require.main === module) {
  bootstrap();
}
