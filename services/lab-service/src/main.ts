import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import compression from 'compression'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from '@utils/exceptions.filter'
import { ResponseInterceptor } from '@utils/response.interceptor'
import { ThrottlerGuard } from '@nestjs/throttler'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }))

  app.use(compression())

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
      configService.get<string>('TEACHER_URL') || 'http://localhost:3001',
      configService.get<string>('STUDENT_URL') || 'http://localhost:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Accept',
      'Authorization',
      'Content-Type',
      'Cache-Control',
      'X-Tenant-ID',
      'X-User-ID',
    ],
  })

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  )

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalGuards(new ThrottlerGuard())

  // API prefix
  app.setGlobalPrefix('api/v1')

  // Swagger documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Lab Service API')
      .setDescription('ReOpenInnoLab Lab Service - Experiment Management API')
      .setVersion('1.0.0')
      .addTag('labs')
      .addTag('templates')
      .addTag('runs')
      .addTag('artifacts')
      .addTag('previews')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'tenant')
      .addApiKey({ type: 'apiKey', name: 'X-User-ID', in: 'header' }, 'user')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Lab Service API Documentation',
      customCss: `
        .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTAiIGZpbGw9IiM0RjQ2RTUiLz4KPHBhdGggZD0iTTI1IDEwTDM1IDIwTDM1IDMwTDI1IDQwTDE1IDMwTDE1IDIwTDI1IDEwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'); }
        .swagger-ui .topbar { background-color: #4F46E5; }
      `,
    })

    logger.log('Swagger documentation available at /api/docs')
  }

  // Health check endpoint
  const port = configService.get<number>('PORT') || 3005
  const host = configService.get<string>('HOST') || '0.0.0.0'

  await app.listen(port, host)

  logger.log(`🚀 Lab Service is running on: http://${host}:${port}`)
  logger.log(`📚 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`)
  logger.log(`🔧 Debug mode: ${configService.get<boolean>('DEBUG') ? 'enabled' : 'disabled'}`)

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received. Shutting down gracefully...')
    await app.close()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    logger.log('SIGINT received. Shutting down gracefully...')
    await app.close()
    process.exit(0)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})