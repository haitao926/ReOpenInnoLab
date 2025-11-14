import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'

import { LabTemplate } from '../database/entities/lab-template.entity'
import { LabRun } from '../database/entities/lab-run.entity'
import { LabArtifact } from '../database/entities/lab-artifact.entity'
import { ResourceRef } from '../database/entities/resource-ref.entity'

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production'

    return {
      type: 'postgres',
      url: this.configService.get<string>('DATABASE_URL'),
      host: this.configService.get<string>('DB_HOST') || 'localhost',
      port: this.configService.get<number>('DB_PORT') || 5432,
      username: this.configService.get<string>('DB_USERNAME') || 'postgres',
      password: this.configService.get<string>('DB_PASSWORD') || 'postgres',
      database: this.configService.get<string>('DB_DATABASE') || 'reopeninno_labs',

      // Entities
      entities: [LabTemplate, LabRun, LabArtifact, ResourceRef],

      // Auto-loading and synchronization
      autoLoadEntities: true,
      synchronize: isDevelopment && this.configService.get<boolean>('DB_SYNC') === true,

      // Migrations
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: !isDevelopment,

      // Logging
      logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
      logger: 'advanced-console',

      // Connection pooling
      pool: {
        min: this.configService.get<number>('DB_POOL_MIN') || 2,
        max: this.configService.get<number>('DB_POOL_MAX') || 10,
        acquireTimeoutMillis: this.configService.get<number>('DB_POOL_ACQUIRE_TIMEOUT') || 30000,
        createTimeoutMillis: this.configService.get<number>('DB_POOL_CREATE_TIMEOUT') || 30000,
        destroyTimeoutMillis: this.configService.get<number>('DB_POOL_DESTROY_TIMEOUT') || 5000,
        idleTimeoutMillis: this.configService.get<number>('DB_POOL_IDLE_TIMEOUT') || 30000,
        reapIntervalMillis: this.configService.get<number>('DB_POOL_REAP_INTERVAL') || 1000,
        createRetryIntervalMillis: this.configService.get<number>('DB_POOL_RETRY_INTERVAL') || 200,
      },

      // Performance
      extra: {
        // PostgreSQL specific settings
        max: this.configService.get<number>('DB_POOL_MAX') || 10,
        connectionTimeoutMillis: this.configService.get<number>('DB_CONNECTION_TIMEOUT') || 10000,
        idleTimeoutMillis: this.configService.get<number>('DB_IDLE_TIMEOUT') || 30000,

        // Row-level security
        defaultTransactionIsolation: 'READ_COMMITTED',

        // Performance optimizations
        statement_timeout: this.configService.get<number>('DB_STATEMENT_TIMEOUT') || 30000,
        query_timeout: this.configService.get<number>('DB_QUERY_TIMEOUT') || 30000,

        // Enable statement cache for prepared statements
        prepareThreshold: 5,

        // SSL for production
        ssl: !isDevelopment ? {
          rejectUnauthorized: true,
          ca: this.configService.get<string>('DB_SSL_CA'),
          key: this.configService.get<string>('DB_SSL_KEY'),
          cert: this.configService.get<string>('DB_SSL_CERT'),
        } : false,
      },

      // Retry configuration
      retryAttempts: this.configService.get<number>('DB_RETRY_ATTEMPTS') || 3,
      retryDelay: this.configService.get<number>('DB_RETRY_DELAY') || 3000,

      // Cache
      cache: {
        type: 'redis',
        options: {
          host: this.configService.get<string>('REDIS_HOST') || 'localhost',
          port: this.configService.get<number>('REDIS_PORT') || 6379,
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB') || 1,
          keyPrefix: 'lab_service_cache:',
          ttl: this.configService.get<number>('REDIS_CACHE_TTL') || 300,
        },
      },
    }
  }
}