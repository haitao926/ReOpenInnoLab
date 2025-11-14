import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { Tenant } from './entities/tenant.entity'
import { Course } from './entities/course.entity'
import { CourseVersion } from './entities/course-version.entity'
import { CourseModule } from './entities/course-module.entity'
import { CourseActivity } from './entities/course-activity.entity'
import { ResourceRef } from './entities/resource-ref.entity'
import { CourseInstance } from './entities/course-instance.entity'
import { Lesson } from './entities/lesson.entity'
import { Section } from './entities/section.entity'
import { LessonActivity } from './entities/lesson-activity.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        ssl: configService.get('DATABASE_SSL'),
        logging: configService.get('DATABASE_LOGGING'),
        synchronize: configService.get('DATABASE_SYNCHRONIZE'),
        migrationsRun: configService.get('DATABASE_MIGRATIONS_RUN'),
        entities: [
          Tenant,
          Course,
          CourseVersion,
          CourseModule,
          CourseActivity,
          ResourceRef,
          CourseInstance,
          Lesson,
          Section,
          LessonActivity
        ],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000
        }
      }),
      inject: [ConfigService]
    }),
    TypeOrmModule.forFeature([
      Tenant,
      Course,
      CourseVersion,
      CourseModule,
      CourseActivity,
      ResourceRef,
      CourseInstance,
      Lesson,
      Section,
      LessonActivity
    ])
  ],
  exports: [
    TypeOrmModule,
    Tenant,
    Course,
    CourseVersion,
    CourseModule,
    CourseActivity,
    ResourceRef,
    CourseInstance,
    Lesson,
    Section,
    LessonActivity
  ]
})
export class DatabaseModule {}