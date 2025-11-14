import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

interface JWTPayload {
  sub: string
  email: string
  tenantId: string
  roleType: string
  type: 'access' | 'refresh'
  permissions?: string[]
  iat?: number
  exp?: number
}

@Injectable()
export class SecureJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getAccessTokenSecret(configService),
      // Add additional validation for JWT claims
      algorithms: ['HS256'],
      audience: 'reopenlab-web',
      issuer: 'reopenlab-identity',
    })
  }

  async validate(payload: JWTPayload) {
    // Validate token type - only access tokens should be used for API calls
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type - access token required')
    }

    // Validate required claims
    if (!payload.sub || !payload.email || !payload.tenantId || !payload.roleType) {
      throw new UnauthorizedException('Invalid token payload - missing required claims')
    }

    // Validate tenant ID format
    if (!isValidUUID(payload.tenantId) && payload.tenantId !== 'default-tenant') {
      throw new UnauthorizedException('Invalid tenant ID format')
    }

    // Validate user ID format
    if (!isValidUUID(payload.sub)) {
      throw new UnauthorizedException('Invalid user ID format')
    }

    // Validate role type
    const validRoles = ['student', 'teacher', 'admin', 'parent', 'researcher']
    if (!validRoles.includes(payload.roleType)) {
      throw new UnauthorizedException('Invalid role type')
    }

    // Return validated user data
    return {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roleType: payload.roleType,
      permissions: payload.permissions || [],
    }
  }
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: getRefreshTokenSecret(configService),
      algorithms: ['HS256'],
      audience: 'reopenlab-web',
      issuer: 'reopenlab-identity',
    })
  }

  async validate(payload: JWTPayload) {
    // Validate token type - only refresh tokens should be used for refresh
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type - refresh token required')
    }

    // Validate required claims
    if (!payload.sub || !payload.email || !payload.tenantId || !payload.roleType) {
      throw new UnauthorizedException('Invalid refresh token payload')
    }

    return {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roleType: payload.roleType,
      permissions: payload.permissions || [],
    }
  }
}

function getAccessTokenSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_ACCESS_SECRET')
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long')
  }
  return secret
}

function getRefreshTokenSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_REFRESH_SECRET')
  if (!secret || secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long')
  }
  return secret
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}