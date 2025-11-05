import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { User } from './entities/user.entity'
import { Role } from './entities/role.entity'
import { Permission } from './entities/permission.entity'
import { UserRole } from './entities/user-role.entity'
import { RolePermission } from './entities/role-permission.entity'
import { RefreshToken } from './entities/refresh-token.entity'
import { EmailVerification } from './entities/email-verification.entity'
import { PasswordReset } from './entities/password-reset.entity'
import { LoginAttempt } from './entities/login-attempt.entity'
import { UserSession } from './entities/user-session.entity'
import { OauthAccount } from './entities/oauth-account.entity'
import { TwoFactorAuth } from './entities/two-factor-auth.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        ssl: configService.get('database.ssl'),
        logging: configService.get('database.logging'),
        synchronize: configService.get('database.synchronize'),
        migrationsRun: configService.get('database.migrationsRun'),
        entities: [
          User,
          Role,
          Permission,
          UserRole,
          RolePermission,
          RefreshToken,
          EmailVerification,
          PasswordReset,
          LoginAttempt,
          UserSession,
          OauthAccount,
          TwoFactorAuth,
        ],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      UserRole,
      RolePermission,
      RefreshToken,
      EmailVerification,
      PasswordReset,
      LoginAttempt,
      UserSession,
      OauthAccount,
      TwoFactorAuth,
    ]),
  ],
  exports: [
    TypeOrmModule,
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    RefreshToken,
    EmailVerification,
      PasswordReset,
      LoginAttempt,
      UserSession,
      OauthAccount,
      TwoFactorAuth,
  ],
})
export class DatabaseModule {}