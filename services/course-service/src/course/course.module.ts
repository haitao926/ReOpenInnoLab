import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { PassportModule } from '@nestjs/passport'

import { CourseController } from './course.controller'
import { CourseService } from './course.service'
import { DatabaseModule } from '../database/database.module'
import { JwtStrategy } from '../auth/strategies/jwt.strategy'

@Module({
  imports: [
    DatabaseModule,
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
        limit: 20 // 最多20次请求
      }
    ])
  ],
  controllers: [CourseController],
  providers: [CourseService, JwtStrategy],
  exports: [CourseService]
})
export class CourseModule {}