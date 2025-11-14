import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'admin@reopenlab.dev',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    description: '用户密码',
    example: 'admin123',
  })
  @IsString()
  @IsNotEmpty()
  password: string

  @ApiPropertyOptional({
    description: '两步验证码',
    example: '123456',
  })
  @IsString()
  @IsOptional()
  twoFactorCode?: string

  @ApiPropertyOptional({
    description: '记住我',
    example: false,
    default: false,
  })
  @IsOptional()
  rememberMe?: boolean
}

export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string

  @ApiProperty({
    description: '用户信息',
  })
  user: {
    id: string
    email: string
    name: string
    roleType: string
    tenantId: string
    permissions: string[]
  }

  @ApiProperty({
    description: '令牌过期时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  expiresIn: Date
}

export class RefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: '刷新令牌（可选，用于撤销所有会话）',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string

  @ApiPropertyOptional({
    description: '是否撤销所有会话',
    example: false,
    default: false,
  })
  @IsOptional()
  revokeAll?: boolean
}