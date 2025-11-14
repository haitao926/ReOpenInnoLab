import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

import { LoginDto, LoginResponseDto, RefreshTokenDto, LogoutDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    const { email, password } = loginDto

    this.logger.log(`Login attempt for email: ${email} from IP: ${ipAddress}`)

    // Mock user validation - in production this would check against database
    if (email === 'admin@reopenlab.dev' && password === 'admin123') {
      const payload = { sub: 'admin-user', email: 'admin@reopenlab.dev', type: 'access' }
      const refreshTokenPayload = { sub: 'admin-user', email: 'admin@reopenlab.dev', type: 'refresh' }

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET') || 'default-secret',
        expiresIn: '1h',
      })

      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: '7d',
      })

      this.logger.log(`User ${email} logged in successfully`)

      return {
        user: {
          id: 'admin-user-id',
          email: 'admin@reopenlab.dev',
          name: 'Admin User',
          roleType: 'admin',
          tenantId: 'default-tenant',
          permissions: ['read', 'write', 'admin'],
        },
        accessToken,
        refreshToken,
        expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
      }
    }

    // Teacher user
    if (email === 'teacher@reopenlab.dev' && password === 'teacher123') {
      const payload = { sub: 'teacher-user', email: 'teacher@reopenlab.dev', type: 'access' }
      const refreshTokenPayload = { sub: 'teacher-user', email: 'teacher@reopenlab.dev', type: 'refresh' }

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET') || 'default-secret',
        expiresIn: '1h',
      })

      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: '7d',
      })

      this.logger.log(`User ${email} logged in successfully`)

      return {
        user: {
          id: 'teacher-user-id',
          email: 'teacher@reopenlab.dev',
          name: '教师用户',
          roleType: 'teacher',
          tenantId: 'default-tenant',
          permissions: ['read', 'write', 'teach'],
        },
        accessToken,
        refreshToken,
        expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
      }
    }

    throw new UnauthorizedException('邮箱或密码错误')
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    const { refreshToken } = refreshTokenDto

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
      })

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type')
      }

      // Generate new tokens
      const accessTokenPayload = { sub: payload.sub, email: payload.email, type: 'access' }
      const refreshTokenPayload = { sub: payload.sub, email: payload.email, type: 'refresh' }

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        secret: this.configService.get('JWT_SECRET') || 'default-secret',
        expiresIn: '1h',
      })

      const newRefreshToken = this.jwtService.sign(refreshTokenPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: '7d',
      })

      return {
        user: {
          id: payload.sub,
          email: payload.email,
          name: 'Admin User',
          roleType: 'admin',
          tenantId: 'default-tenant',
          permissions: ['read', 'write', 'admin'],
        },
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(userId: string, logoutDto: LogoutDto): Promise<void> {
    this.logger.log(`User ${userId} logged out`)
    // In a real implementation, this would invalidate the user's tokens
    console.log('Logout data:', logoutDto) // 暂时记录日志避免未使用变量警告
  }

  async validateUser(payload: any): Promise<any> {
    // Mock user validation - in production this would check against database
    if (payload.email === 'admin@reopenlab.dev') {
      return {
        id: 'admin-user-id',
        email: 'admin@reopenlab.dev',
        name: 'Admin User',
        roleType: 'admin',
      }
    }

    if (payload.email === 'teacher@reopenlab.dev') {
      return {
        id: 'teacher-user-id',
        email: 'teacher@reopenlab.dev',
        name: '教师用户',
        roleType: 'teacher',
      }
    }

    return null
  }
}