import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray } from 'class-validator'

export class EnvironmentVariables {
  @IsString()
  @IsOptional()
    NODE_ENV?: string

  @IsNumber()
  @IsOptional()
    PORT?: number

  @IsString()
  @IsOptional()
    DATABASE_HOST?: string

  @IsNumber()
  @IsOptional()
    DATABASE_PORT?: number

  @IsString()
  @IsOptional()
    DATABASE_USER?: string

  @IsString()
  @IsOptional()
    DATABASE_PASSWORD?: string

  @IsString()
  @IsOptional()
    DATABASE_NAME?: string

  @IsBoolean()
  @IsOptional()
    DATABASE_SSL?: boolean

  @IsBoolean()
  @IsOptional()
    DATABASE_LOGGING?: boolean

  @IsString()
  @IsOptional()
    JWT_SECRET?: string

  @IsString()
  @IsOptional()
    REDIS_HOST?: string

  @IsNumber()
  @IsOptional()
    REDIS_PORT?: number

  @IsString()
  @IsOptional()
    REDIS_PASSWORD?: string

  @IsNumber()
  @IsOptional()
    THROTTLE_TTL?: number

  @IsNumber()
  @IsOptional()
    THROTTLE_LIMIT?: number

  @IsString()
  @IsOptional()
    CORS_ORIGIN?: string

  @IsNumber()
  @IsOptional()
    COURSE_MAX_FILE_SIZE?: number

  @IsString()
  @IsOptional()
    COURSE_ALLOWED_FILE_TYPES?: string

  @IsString()
  @IsOptional()
    LOG_LEVEL?: string
}