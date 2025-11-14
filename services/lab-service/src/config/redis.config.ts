import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RedisConfig {
  constructor(private configService: ConfigService) {}

  getOptions() {
    return {
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB') || 0,
      keyPrefix: 'lab_service:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableReadyCheck: true,
      maxMemoryPolicy: 'allkeys-lru',
      // Enable TLS for production
      tls: this.configService.get<string>('NODE_ENV') === 'production' ? {} : undefined,
    }
  }

  getSessionOptions() {
    return {
      ...this.getOptions(),
      db: this.configService.get<number>('REDIS_SESSION_DB') || 1,
      keyPrefix: 'lab_service_session:',
      ttl: this.configService.get<number>('SESSION_TTL') || 3600, // 1 hour
    }
  }

  getCacheOptions() {
    return {
      ...this.getOptions(),
      db: this.configService.get<number>('REDIS_CACHE_DB') || 2,
      keyPrefix: 'lab_service_cache:',
      ttl: this.configService.get<number>('CACHE_TTL') || 300, // 5 minutes
    }
  }

  getQueueOptions() {
    return {
      ...this.getOptions(),
      db: this.configService.get<number>('REDIS_QUEUE_DB') || 3,
      keyPrefix: 'lab_service_queue:',
      maxRetriesPerRequest: null, // Bull queue requires this
    }
  }
}