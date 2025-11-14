import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { TerminusModule } from '@nestjs/terminus'

import { DatabaseConfig } from '@config/database.config'
import { RedisConfig } from '@config/redis.config'
import { MinioConfig } from '@config/minio.config'

import { HealthController } from './controllers/health.controller'
import { LabTemplateController } from './controllers/lab-template.controller'
import { LabRunController } from './controllers/lab-run.controller'
import { LabArtifactController } from './controllers/lab-artifact.controller'
import { PreviewController } from './controllers/preview.controller'

import { LabTemplateService } from './services/lab-template.service'
import { LabRunService } from './services/lab-run.service'
import { LabArtifactService } from './services/lab-artifact.service'
import { PreviewService } from './services/preview.service'
import { StorageService } from './services/storage.service'

import { LabTemplate } from './database/entities/lab-template.entity'
import { LabRun } from './database/entities/lab-run.entity'
import { LabArtifact } from './database/entities/lab-artifact.entity'
import { ResourceRef } from './database/entities/resource-ref.entity'
import { LabDeviceAgent } from './database/entities/lab-device-agent.entity'
import { LabAgentSession } from './database/entities/lab-agent-session.entity'
import { LabAgentEvent } from './database/entities/lab-agent-event.entity'
import { LabDevicePolicy } from './database/entities/lab-device-policy.entity'
import { Tenant } from './database/entities/tenant.entity'
import { User } from './database/entities/user.entity'
import { Classroom } from './database/entities/classroom.entity'

import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config) => {
        // Validate required environment variables
        const required = ['DATABASE_URL', 'REDIS_URL', 'MINIO_ENDPOINT']
        const missing = required.filter(key => !config[key])

        if (missing.length > 0) {
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
        }

        return config
      },
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLE_TTL') || 60,
        limit: config.get<number>('THROTTLE_LIMIT') || 100,
      }),
      inject: [ConfigService],
    }),

    // Health checks
    TerminusModule,

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    // Redis
    TypeOrmModule.forFeature([
      LabTemplate, LabRun, LabArtifact, ResourceRef,
      LabDeviceAgent, LabAgentSession, LabAgentEvent,
      LabDevicePolicy, Tenant, User, Classroom
    ]),
  ],
  controllers: [
    HealthController,
    LabTemplateController,
    LabRunController,
    LabArtifactController,
    PreviewController,
  ],
  providers: [
    // Global throttler guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Configuration
    DatabaseConfig,
    RedisConfig,
    MinioConfig,

    // Services
    LabTemplateService,
    LabRunService,
    LabArtifactService,
    PreviewService,
    StorageService,
  ],
  exports: [
    LabTemplateService,
    LabRunService,
    LabArtifactService,
    PreviewService,
    StorageService,
  ],
})
export class AppModule {}