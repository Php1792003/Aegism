import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsPath = [
    join(__dirname, '..', '..', 'uploads'),
    join(__dirname, '..', 'uploads'),
    join(process.cwd(), 'server', 'uploads'),
    join(process.cwd(), 'uploads'),
  ].find(p => fs.existsSync(p)) || join(process.cwd(), 'uploads');

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api');

  // Cấu hình CORS đã được sửa đổi
  app.enableCors({
    origin: [
      'https://aegism.online',
      'https://www.aegism.online',
      'http://localhost:3001',
      // Mobile development origins
      'http://localhost:8081',
      'http://localhost:19000',
      'http://localhost:19006',
      // Desktop development origin
      'http://localhost:5173',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

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
  📁 Static Assets: ${url}/uploads
  `);
}
bootstrap();
