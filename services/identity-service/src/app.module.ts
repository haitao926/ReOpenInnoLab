import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { SecureAuthModule } from './auth/auth.module.secure'
import { SubjectsModule } from './subjects/subjects.module'
import { AuditModule } from './audit/audit.module'
import { TenantModule } from './tenant/tenant.module'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),

    // Rate limiting - more conservative settings
    ThrottlerModule.forRoot([
      {
        // General API rate limiting
        name: 'general',
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute
      },
      {
        // More restrictive for auth endpoints
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 10, // 10 auth attempts per 15 minutes
      },
    ]),

    // Auth module with database integration
    SecureAuthModule,

    // Subjects module
    SubjectsModule,

    // Audit module
    AuditModule,

    // Tenant module
    TenantModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}