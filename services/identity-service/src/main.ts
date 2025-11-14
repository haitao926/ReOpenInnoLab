import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import compression from 'compression'
import { AppModule } from './app.module'
import { Logger } from './common/logger'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }))
  app.use(compression())

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter())

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor())

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // API prefix
  app.setGlobalPrefix('api/v1')

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Identity Service API')
    .setDescription('身份认证微服务 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('认证')
    .addTag('用户')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  // Health check
  const port = configService.get('PORT', 3002)

  await app.listen(port, '0.0.0.0')

  console.log(`🚀 Identity Service is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
  console.log(`🏥 Health Check: http://localhost:${port}/health`)

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully')
    await app.close()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully')
    await app.close()
    process.exit(0)
  })
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error)
  process.exit(1)
})