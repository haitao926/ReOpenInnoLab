import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { TerminusModule } from '@nestjs/terminus'

import configuration from './config/configuration'
import { validationSchema } from './config/validation.schema'
// TODO: Implement these modules
// import { HealthModule } from './health/health.module'
// import { AuthModule } from './auth/auth.module'
// import { UsersModule } from './users/users.module'
// import { RolesModule } from './roles/roles.module'
// import { PermissionsModule } from './permissions/permissions.module'
// import { OauthModule } from './oauth/oauth.module'
// import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module'
import { DatabaseModule } from './database/database.module'
// import { LoggerModule } from './common/logger/logger.module'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),

    // Database
    DatabaseModule,

    // Security
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),

    // TODO: Implement these modules when ready
    // Health Check
    // HealthModule,

    // Business Modules
    // AuthModule,
    // UsersModule,
    // RolesModule,
    // PermissionsModule,
    // OauthModule,
    // TwoFactorAuthModule,

    // Common
    // LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static port: number | string = process.env.PORT || 3002
}