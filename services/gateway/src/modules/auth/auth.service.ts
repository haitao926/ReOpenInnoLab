import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { LoginDto, SsoCallbackDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService
  ) {}

  async login(loginDto: LoginDto) {
    try {
      // Forward login request to identity service
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/login`, loginDto, {
          headers: { 'X-Admin-Login': 'true' }
        })
      )

      const { user, token, refreshToken, permissions } = response.data

      return {
        user,
        token,
        refreshToken,
        permissions,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    } catch (error: any) {
      this.logger.error(`Login failed for user ${loginDto.username}: ${error.message}`)
      throw new UnauthorizedException(error.response?.data?.message || 'Invalid credentials')
    }
  }

  async logout(user: any) {
    try {
      // Notify identity service of logout
      await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/logout`, {}, {
          headers: {
            'X-User-Id': user.sub,
            'X-Admin-Logout': 'true'
          }
        })
      )
    } catch (error) {
      this.logger.warn('Failed to notify identity service of logout:', error.message)
    }

    return { message: 'Logout successful' }
  }

  async getCurrentUser(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.IDENTITY_SERVICE_URL}/users/${userId}`, {
          headers: { 'X-Admin-Request': 'true' }
        })
      )

      return {
        user: response.data,
        permissions: response.data.permissions || []
      }
    } catch (error: any) {
      this.logger.error(`Failed to get user ${userId}: ${error.message}`)
      throw new UnauthorizedException('User not found')
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/refresh`, {
          refreshToken
        }, {
          headers: { 'X-Admin-Refresh': 'true' }
        })
      )

      return response.data
    } catch (error: any) {
      this.logger.error('Token refresh failed:', error.message)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async changePassword(changePasswordDto: any, user: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/change-password`, {
          ...changePasswordDto,
          userId: user.sub
        }, {
          headers: { 'X-Admin-Password-Change': 'true' }
        })
      )

      return { message: 'Password changed successfully' }
    } catch (error: any) {
      this.logger.error(`Password change failed for user ${user.sub}: ${error.message}`)
      throw new UnauthorizedException(error.response?.data?.message || 'Password change failed')
    }
  }

  async getSsoConfig() {
    return {
      enabled: process.env.SSO_ENABLED === 'true',
      providers: [
        {
          id: 'google',
          name: 'google',
          displayName: 'Google',
          icon: 'google',
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          clientId: process.env.GOOGLE_CLIENT_ID,
          redirectUri: `${process.env.FRONTEND_URL}/auth/sso/callback`,
          scope: ['openid', 'email', 'profile']
        },
        {
          id: 'microsoft',
          name: 'microsoft',
          displayName: 'Microsoft',
          icon: 'microsoft',
          authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          clientId: process.env.MICROSOFT_CLIENT_ID,
          redirectUri: `${process.env.FRONTEND_URL}/auth/sso/callback`,
          scope: ['openid', 'email', 'profile']
        }
      ],
      defaultProvider: process.env.DEFAULT_SSO_PROVIDER,
      autoRedirect: process.env.SSO_AUTO_REDIRECT === 'true'
    }
  }

  async handleSsoCallback(callbackDto: SsoCallbackDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/sso/callback`, callbackDto, {
          headers: { 'X-Admin-SSO': 'true' }
        })
      )

      return response.data
    } catch (error: any) {
      this.logger.error(`SSO callback failed for provider ${callbackDto.provider}: ${error.message}`)
      throw new UnauthorizedException(error.response?.data?.message || 'SSO authentication failed')
    }
  }

  async linkSsoAccount(linkDto: any, user: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/sso/link`, {
          ...linkDto,
          userId: user.sub
        })
      )

      return { message: 'Account linked successfully' }
    } catch (error: any) {
      this.logger.error(`SSO account linking failed for user ${user.sub}: ${error.message}`)
      throw new UnauthorizedException(error.response?.data?.message || 'Account linking failed')
    }
  }

  async unlinkSsoAccount(unlinkDto: any, user: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${process.env.IDENTITY_SERVICE_URL}/auth/sso/unlink`, {
          ...unlinkDto,
          userId: user.sub
        })
      )

      return { message: 'Account unlinked successfully' }
    } catch (error: any) {
      this.logger.error(`SSO account unlinking failed for user ${user.sub}: ${error.message}`)
      throw new UnauthorizedException(error.response?.data?.message || 'Account unlinking failed')
    }
  }

  async getLinkedAccounts(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.IDENTITY_SERVICE_URL}/users/${userId}/sso-accounts`)
      )

      return response.data
    } catch (error: any) {
      this.logger.error(`Failed to get linked accounts for user ${userId}: ${error.message}`)
      return []
    }
  }
}