import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 启用CORS
  app.enableCors({
    origin: configService.get('WS_CORS_ORIGIN', 'http://localhost:5173'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 前缀API路径
  const apiPrefix = 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const port = configService.get<number>('PORT', 3003);
  const wsPort = configService.get<number>('WS_PORT', 3004);

  await app.listen(port);

  logger.log(`🚀 Classroom Service is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🔌 WebSocket server is ready on port: ${wsPort}`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();