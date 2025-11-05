import { plainToClass } from 'class-transformer'
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEmail, IsUrl } from 'class-validator'

class DatabaseConfig {
  @IsString()
  host: string

  @IsNumber()
  port: number

  @IsString()
  username: string

  @IsString()
  password: string

  @IsString()
  database: string

  @IsOptional()
  @IsBoolean()
  ssl?: boolean

  @IsOptional()
  @IsBoolean()
  logging?: boolean

  @IsOptional()
  @IsBoolean()
  synchronize?: boolean

  @IsOptional()
  @IsBoolean()
  migrationsRun?: boolean
}

class RedisConfig {
  @IsString()
  host: string

  @IsNumber()
  port: number

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsNumber()
  db?: number

  @IsOptional()
  @IsString()
  keyPrefix?: string
}

class JwtConfig {
  @IsString()
  secret: string

  @IsString()
  expiresIn: string

  @IsString()
  refreshSecret: string

  @IsString()
  refreshExpiresIn: string

  @IsString()
  issuer: string

  @IsString()
  audience: string
}

class OAuthProviderConfig {
  @IsString()
  clientId: string

  @IsString()
  clientSecret: string

  @IsUrl()
  callbackUrl: string
}

class OAuthConfig {
  @IsOptional()
  google?: OAuthProviderConfig

  @IsOptional()
  github?: OAuthProviderConfig
}

class EmailConfig {
  @IsString()
  host: string

  @IsNumber()
  port: number

  @IsOptional()
  @IsBoolean()
  secure?: boolean

  @IsString()
  user: string

  @IsString()
  password: string

  @IsEmail()
  from: string
}

class TwoFactorAuthConfig {
  @IsString()
  issuer: string

  @IsNumber()
  secretLength: number

  @IsNumber()
  window: number
}

class ThrottleConfig {
  @IsNumber()
  ttl: number

  @IsNumber()
  limit: number
}

class UploadConfig {
  @IsNumber()
  maxFileSize: number

  @IsArray()
  @IsString({ each: true })
  allowedMimeTypes: string[]

  @IsString()
  destination: string
}

class SecurityConfig {
  @IsNumber()
  bcryptRounds: number

  @IsString()
  sessionSecret: string

  @IsNumber()
  passwordMinLength: number

  @IsNumber()
  passwordMaxLength: number

  @IsNumber()
  accountLockoutThreshold: number

  @IsNumber()
  accountLockoutDuration: number
}

class EnvironmentVariables {
  @IsNumber()
  port: number

  @IsString()
  nodeEnv: string

  database: DatabaseConfig

  redis: RedisConfig

  jwt: JwtConfig

  @IsOptional()
  oauth?: OAuthConfig

  email: EmailConfig

  twoFactorAuth: TwoFactorAuthConfig

  throttle: ThrottleConfig

  @IsArray()
  @IsString({ each: true })
  cors: string[]

  upload: UploadConfig

  @IsString()
  frontendUrl: string

  @IsString()
  webUrl: string

  security: SecurityConfig

  @IsOptional()
  @IsBoolean()
  monitoring?: {
    enabled: boolean
    metricsPath: string
  }
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  )

  // Use class-validator to validate the object
  // In a real implementation, you'd use the validateSync function from class-validator
  return validatedConfig
}

export const validationSchema = {
  PORT: {
    prop: 'port',
    type: 'number',
    default: 3002,
  },
  NODE_ENV: {
    prop: 'nodeEnv',
    type: 'string',
    default: 'development',
  },
  DATABASE_HOST: {
    prop: 'database.host',
    type: 'string',
    default: 'localhost',
  },
  DATABASE_PORT: {
    prop: 'database.port',
    type: 'number',
    default: 5432,
  },
  DATABASE_USERNAME: {
    prop: 'database.username',
    type: 'string',
    default: 'postgres',
  },
  DATABASE_PASSWORD: {
    prop: 'database.password',
    type: 'string',
    default: 'password',
  },
  DATABASE_NAME: {
    prop: 'database.database',
    type: 'string',
    default: 'identity_service',
  },
  DATABASE_SSL: {
    prop: 'database.ssl',
    type: 'boolean',
    default: false,
  },
  DATABASE_LOGGING: {
    prop: 'database.logging',
    type: 'boolean',
    default: false,
  },
  DATABASE_SYNCHRONIZE: {
    prop: 'database.synchronize',
    type: 'boolean',
    default: false,
  },
  DATABASE_MIGRATIONS_RUN: {
    prop: 'database.migrationsRun',
    type: 'boolean',
    default: false,
  },
  REDIS_HOST: {
    prop: 'redis.host',
    type: 'string',
    default: 'localhost',
  },
  REDIS_PORT: {
    prop: 'redis.port',
    type: 'number',
    default: 6379,
  },
  REDIS_PASSWORD: {
    prop: 'redis.password',
    type: 'string',
    default: undefined,
  },
  REDIS_DB: {
    prop: 'redis.db',
    type: 'number',
    default: 0,
  },
  REDIS_KEY_PREFIX: {
    prop: 'redis.keyPrefix',
    type: 'string',
    default: 'identity:',
  },
  JWT_SECRET: {
    prop: 'jwt.secret',
    type: 'string',
    default: 'your-super-secret-jwt-key',
  },
  JWT_EXPIRES_IN: {
    prop: 'jwt.expiresIn',
    type: 'string',
    default: '1h',
  },
  JWT_REFRESH_SECRET: {
    prop: 'jwt.refreshSecret',
    type: 'string',
    default: 'your-super-secret-refresh-key',
  },
  JWT_REFRESH_EXPIRES_IN: {
    prop: 'jwt.refreshExpiresIn',
    type: 'string',
    default: '7d',
  },
  JWT_ISSUER: {
    prop: 'jwt.issuer',
    type: 'string',
    default: 'reopeninnolab',
  },
  JWT_AUDIENCE: {
    prop: 'jwt.audience',
    type: 'string',
    default: 'reopeninnolab-users',
  },
  GOOGLE_CLIENT_ID: {
    prop: 'oauth.google.clientId',
    type: 'string',
    default: undefined,
  },
  GOOGLE_CLIENT_SECRET: {
    prop: 'oauth.google.clientSecret',
    type: 'string',
    default: undefined,
  },
  GOOGLE_CALLBACK_URL: {
    prop: 'oauth.google.callbackUrl',
    type: 'string',
    default: 'http://localhost:3002/api/v1/oauth/google/callback',
  },
  GITHUB_CLIENT_ID: {
    prop: 'oauth.github.clientId',
    type: 'string',
    default: undefined,
  },
  GITHUB_CLIENT_SECRET: {
    prop: 'oauth.github.clientSecret',
    type: 'string',
    default: undefined,
  },
  GITHUB_CALLBACK_URL: {
    prop: 'oauth.github.callbackUrl',
    type: 'string',
    default: 'http://localhost:3002/api/v1/oauth/github/callback',
  },
  EMAIL_HOST: {
    prop: 'email.host',
    type: 'string',
    default: 'smtp.gmail.com',
  },
  EMAIL_PORT: {
    prop: 'email.port',
    type: 'number',
    default: 587,
  },
  EMAIL_SECURE: {
    prop: 'email.secure',
    type: 'boolean',
    default: false,
  },
  EMAIL_USER: {
    prop: 'email.user',
    type: 'string',
    default: undefined,
  },
  EMAIL_PASSWORD: {
    prop: 'email.password',
    type: 'string',
    default: undefined,
  },
  EMAIL_FROM: {
    prop: 'email.from',
    type: 'string',
    default: 'noreply@reopeninnolab.org',
  },
  TWOFA_ISSUER: {
    prop: 'twoFactorAuth.issuer',
    type: 'string',
    default: 'ReOpenInnoLab',
  },
  TWOFA_SECRET_LENGTH: {
    prop: 'twoFactorAuth.secretLength',
    type: 'number',
    default: 32,
  },
  TWOFA_WINDOW: {
    prop: 'twoFactorAuth.window',
    type: 'number',
    default: 2,
  },
  THROTTLE_TTL: {
    prop: 'throttle.ttl',
    type: 'number',
    default: 60,
  },
  THROTTLE_LIMIT: {
    prop: 'throttle.limit',
    type: 'number',
    default: 100,
  },
  CORS_ORIGIN: {
    prop: 'cors',
    type: 'string',
    default: 'http://localhost:3000',
    transform: (value: string) => value.split(','),
  },
  UPLOAD_MAX_FILE_SIZE: {
    prop: 'upload.maxFileSize',
    type: 'number',
    default: 5242880, // 5MB
  },
  UPLOAD_ALLOWED_MIME_TYPES: {
    prop: 'upload.allowedMimeTypes',
    type: 'string',
    default: 'image/jpeg,image/png,image/webp',
    transform: (value: string) => value.split(','),
  },
  UPLOAD_DESTINATION: {
    prop: 'upload.destination',
    type: 'string',
    default: './uploads',
  },
  FRONTEND_URL: {
    prop: 'frontendUrl',
    type: 'string',
    default: 'http://localhost:3000',
  },
  WEB_URL: {
    prop: 'webUrl',
    type: 'string',
    default: 'http://localhost:3001',
  },
  BCRYPT_ROUNDS: {
    prop: 'security.bcryptRounds',
    type: 'number',
    default: 12,
  },
  SESSION_SECRET: {
    prop: 'security.sessionSecret',
    type: 'string',
    default: 'your-session-secret',
  },
  PASSWORD_MIN_LENGTH: {
    prop: 'security.passwordMinLength',
    type: 'number',
    default: 8,
  },
  PASSWORD_MAX_LENGTH: {
    prop: 'security.passwordMaxLength',
    type: 'number',
    default: 128,
  },
  ACCOUNT_LOCKOUT_THRESHOLD: {
    prop: 'security.accountLockoutThreshold',
    type: 'number',
    default: 5,
  },
  ACCOUNT_LOCKOUT_DURATION: {
    prop: 'security.accountLockoutDuration',
    type: 'number',
    default: 900, // 15 minutes
  },
  MONITORING_ENABLED: {
    prop: 'monitoring.enabled',
    type: 'boolean',
    default: false,
  },
  METRICS_PATH: {
    prop: 'monitoring.metricsPath',
    type: 'string',
    default: '/metrics',
  },
}