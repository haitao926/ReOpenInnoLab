import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

import { SecureAuthController } from './auth.controller.secure'
import { SecureAuthService } from './auth.service.secure'
import { SecureJwtStrategy, RefreshJwtStrategy } from './strategies/jwt.strategy.secure'
import { DatabaseModule } from '../database/database.module'
import { User } from '../database/entities/user.entity'
import { RefreshToken } from '../database/entities/refresh-token.entity'
import { LoginAttempt } from '../database/entities/login-attempt.entity'
import { UserRole } from '../database/entities/user-role.entity'
import { RolePermission } from '../database/entities/role-permission.entity'

@Module({
  imports: [
    // Database integration
    DatabaseModule,

    // Passport configuration
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
    }),

    // JWT configuration with environment-specific secrets
    JwtModule.registerAsync({
      useFactory: () => ({
        // Access token configuration
        secret: process.env.JWT_ACCESS_SECRET || 'development-change-this-access-secret-in-production',
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
          algorithm: 'HS256',
          audience: 'reopenlab-web',
          issuer: 'reopenlab-identity',
        },
        // Verify options for incoming tokens
        verifyOptions: {
          algorithms: ['HS256'],
          audience: 'reopenlab-web',
          issuer: 'reopenlab-identity',
        },
      }),
    }),

    // Additional JWT module for refresh tokens (different secret)
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_REFRESH_SECRET || 'development-change-this-refresh-secret-in-production',
        signOptions: {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          algorithm: 'HS256',
          audience: 'reopenlab-web',
          issuer: 'reopenlab-identity',
        },
        verifyOptions: {
          algorithms: ['HS256'],
          audience: 'reopenlab-web',
          issuer: 'reopenlab-identity',
        },
      }),
    }),
  ],

  controllers: [SecureAuthController],

  providers: [
    // Main auth service
    SecureAuthService,

    // JWT strategies
    SecureJwtStrategy,
    RefreshJwtStrategy,

    // Rate limiting guard for all endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],

  exports: [SecureAuthService],
})
export class SecureAuthModule {}