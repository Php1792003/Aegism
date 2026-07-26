import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { IpFilterMiddleware } from './ip-filter.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [SecurityService],
  controllers: [SecurityController],
  exports: [SecurityService],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Áp dụng bộ lọc IP cho toàn bộ tất cả các API route
    consumer.apply(IpFilterMiddleware).forRoutes('*');
  }
}
