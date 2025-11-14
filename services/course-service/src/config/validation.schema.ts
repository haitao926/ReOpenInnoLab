import { plainToClass } from 'class-transformer'
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray } from 'class-validator'
import { EnvironmentVariables } from './env.variables'

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true
  })

  // You can add validation logic here if needed
  return validatedConfig
}

export const validationSchema = {
  NODE_ENV: {
    enum: ['development', 'production', 'test'],
    default: 'development'
  },
  PORT: {
    type: 'number',
    default: 3003
  },
  DATABASE_HOST: {
    type: 'string',
    default: 'localhost'
  },
  DATABASE_PORT: {
    type: 'number',
    default: 5432
  },
  DATABASE_USER: {
    type: 'string',
    default: 'reopenlab'
  },
  DATABASE_PASSWORD: {
    type: 'string',
    default: 'reopenlab_dev_password'
  },
  DATABASE_NAME: {
    type: 'string',
    default: 'reopenlab_dev'
  },
  JWT_SECRET: {
    type: 'string',
    default: 'your-super-secret-jwt-key-change-in-production'
  },
  REDIS_HOST: {
    type: 'string',
    default: 'localhost'
  },
  REDIS_PORT: {
    type: 'number',
    default: 6379
  },
  THROTTLE_TTL: {
    type: 'number',
    default: 60
  },
  THROTTLE_LIMIT: {
    type: 'number',
    default: 100
  }
}