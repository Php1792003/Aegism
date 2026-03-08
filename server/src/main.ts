import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'https://aegism.online',
      'http://aegism.online',
      'https://api.aegism.online',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:4000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }));

  const port = 3000;
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  console.log(`
  🚀 Server đang chạy tại: ${url}
  🏢 API Prefix: ${url}/api
  📂 Static Assets: ${url}/uploads
  `);
}
bootstrap();