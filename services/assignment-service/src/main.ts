import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  // CORS配置
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  })

  // Swagger API文档
  const config = new DocumentBuilder()
    .setTitle('Assignment Service API')
    .setDescription('ReOpenInnoLab Assignment Management Service')
    .setVersion('1.0')
    .addTag('assignments')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  const port = configService.get<number>('PORT') || 3005
  await app.listen(port)

  console.log(`Assignment Service is running on port ${port}`)
  console.log(`API documentation available at http://localhost:${port}/api`)
}

bootstrap()