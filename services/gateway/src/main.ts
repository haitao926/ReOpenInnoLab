import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security
  app.use(helmet())
  app.enableCors({
    origin: ['http://localhost:3003', 'http://localhost:5173'], // Admin console and development
    credentials: true
  })

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  // API prefix
  app.setGlobalPrefix('api')

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ReOpenInnoLab API Gateway')
    .setDescription('API Gateway for ReOpenInnoLab educational platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app)

  // Start server
  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`🚀 API Gateway running on port ${port}`)
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`)
}

bootstrap()