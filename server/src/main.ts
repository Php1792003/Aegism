import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- SỬA LẠI ĐOẠN NÀY ---
  // Dùng process.cwd() để luôn lấy đúng thư mục gốc của dự án
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  // -----------------------

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }));

  app.listen(3000, '0.0.0.0')
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();