import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'

import configuration from './config/configuration'
import { validationSchema } from './config/validation.schema'
import { CourseModule } from './course/course.module'
import { LessonModule } from './modules/lesson/lesson.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true
      }
    }),

    // Database
    DatabaseModule,

    // Business Modules
    CourseModule,
    LessonModule,

    // Security
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100)
        }
      ],
      inject: [ConfigService]
    })
  ],
  controllers: [],
  providers: []
})
export class AppModule {
  static port: number | string = process.env.PORT || 3003
}