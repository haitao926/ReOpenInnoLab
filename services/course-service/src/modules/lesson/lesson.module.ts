import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { PassportModule } from '@nestjs/passport'

import { LessonController } from './lesson.controller'
import { LessonService } from './lesson.service'
import { Lesson } from '../../database/entities/lesson.entity'
import { CourseInstance } from '../../database/entities/course-instance.entity'
import { Section } from '../../database/entities/section.entity'
import { LessonActivity } from '../../database/entities/lesson-activity.entity'
import { JwtStrategy } from '../../auth/strategies/jwt.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, CourseInstance, Section, LessonActivity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        signOptions: {
          expiresIn: '24h'
        }
      })
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1分钟
        limit: 50 // 最多50次请求
      }
    ])
  ],
  controllers: [LessonController],
  providers: [LessonService, JwtStrategy],
  exports: [LessonService]
})
export class LessonModule {}