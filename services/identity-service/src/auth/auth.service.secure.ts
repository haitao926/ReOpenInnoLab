import { Injectable, UnauthorizedException, Logger, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'

import { LoginDto, LoginResponseDto, RefreshTokenDto, LogoutDto } from './dto/login.dto'
import { User, UserStatus, UserType } from '../database/entities/user.entity'
import { RefreshToken as RefreshTokenEntity } from '../database/entities/refresh-token.entity'
import { LoginAttempt } from '../database/entities/login-attempt.entity'
import { UserRole } from '../database/entities/user-role.entity'
import { RolePermission } from '../database/entities/role-permission.entity'
import { Role } from '../database/entities/role.entity'
import { Permission } from '../database/entities/permission.entity'

interface JWTPayload {
  sub: string
  email: string
  tenantId: string
  roleType: UserType
  type: 'access' | 'refresh'
  permissions?: string[]
}

@Injectable()
export class SecureAuthService {
  private readonly logger = new Logger(SecureAuthService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponseDto> {
    const { email, password } = loginDto

    this.logger.log(`Login attempt for email: ${email} from IP: ${ipAddress}`)

    // Find user with tenant relationship
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['tenant', 'userRoles', 'userRoles.role'],
    })

    if (!user) {
      await this.recordFailedLogin(email, ipAddress, 'user_not_found')
      throw new UnauthorizedException('邮箱或密码错误')
    }

    // Check account status
    if (user.status !== UserStatus.ACTIVE) {
      await this.recordFailedLogin(email, ipAddress, 'account_inactive', user.id)
      throw new UnauthorizedException('账户已被禁用，请联系管理员')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      await this.recordFailedLogin(email, ipAddress, 'invalid_password', user.id)
      throw new UnauthorizedException('邮箱或密码错误')
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(user.id)

    // Generate tokens
    const accessToken = await this.generateAccessToken(user, permissions)
    const refreshToken = await this.generateRefreshToken(user, ipAddress, userAgent)

    // Record successful login
    await this.recordSuccessfulLogin(user, ipAddress)

    // Update last login
    user.lastLoginAt = new Date()
    await this.userRepository.save(user)

    this.logger.log(`User ${email} logged in successfully`)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleType: user.roleType,
        tenantId: user.tenantId,
        permissions,
      },
      accessToken,
      refreshToken,
      expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    const { refreshToken } = refreshTokenDto

    try {
      // Verify JWT signature
      const payload = this.jwtService.verify<JWTPayload>(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      })

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type')
      }

      // Check if refresh token exists in database and is valid
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          token: refreshToken,
          userId: payload.sub,
        },
      })

      if (!storedToken || !storedToken.isValid) {
        throw new UnauthorizedException('Invalid or expired refresh token')
      }

      // Get user with current data
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['tenant'],
      })

      if (!user || user.status !== UserStatus.ACTIVE) {
        // Revoke the refresh token if user is inactive
        if (storedToken) {
          storedToken.isRevoked = true
          storedToken.revokedAt = new Date()
          await this.refreshTokenRepository.save(storedToken)
        }
        throw new UnauthorizedException('Account is no longer active')
      }

      // Get current permissions
      const permissions = await this.getUserPermissions(user.id)

      // Generate new access token
      const newAccessToken = await this.generateAccessToken(user, permissions)

      // Generate new refresh token and revoke old one
      const newRefreshToken = await this.rotateRefreshToken(storedToken)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roleType: user.roleType,
          tenantId: user.tenantId,
          permissions,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      this.logger.error('Refresh token error:', error)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(userId: string, logoutDto: LogoutDto): Promise<void> {
    const { refreshToken, revokeAll } = logoutDto

    if (revokeAll) {
      // Revoke all refresh tokens for the user
      await this.refreshTokenRepository.update(
        { userId },
        {
          isRevoked: true,
          revokedAt: new Date(),
        }
      )
      this.logger.log(`User ${userId} logged out from all devices`)
    } else if (refreshToken) {
      // Revoke specific refresh token
      await this.refreshTokenRepository.update(
        { token: refreshToken, userId },
        {
          isRevoked: true,
          revokedAt: new Date(),
        }
      )
      this.logger.log(`User ${userId} logged out from specific device`)
    }

    // Log the logout event
    this.logger.log(`User ${userId} logged out`)
  }

  async validateUser(payload: JWTPayload): Promise<any> {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        email: payload.email,
        status: UserStatus.ACTIVE,
      },
      relations: ['tenant'],
    })

    if (!user) {
      return null
    }

    const permissions = await this.getUserPermissions(user.id)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleType: user.roleType,
      tenantId: user.tenantId,
      permissions,
    }
  }

  private async generateAccessToken(user: User, permissions: string[]): Promise<string> {
    const payload: Omit<JWTPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleType: user.roleType,
      permissions,
    }

    return this.jwtService.sign({
      ...payload,
      type: 'access'
    }, {
      secret: this.getAccessTokenSecret(),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    })
  }

  private async generateRefreshToken(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const payload: Omit<JWTPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleType: user.roleType,
    }

    const token = this.jwtService.sign({
      ...payload,
      type: 'refresh'
    }, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    })

    // Store refresh token in database
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceIp: ipAddress,
      deviceBrowser: userAgent ? this.extractBrowserFromUserAgent(userAgent) : undefined,
      devicePlatform: userAgent ? this.extractPlatformFromUserAgent(userAgent) : undefined,
      isRevoked: false,
    })

    await this.refreshTokenRepository.save(refreshTokenEntity)

    return token
  }

  private async rotateRefreshToken(oldToken: RefreshTokenEntity): Promise<string> {
    // Revoke old token
    oldToken.isRevoked = true
    oldToken.revokedAt = new Date()
    await this.refreshTokenRepository.save(oldToken)

    // Create new refresh token
    const user = await this.userRepository.findOneBy({ id: oldToken.userId })
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return this.generateRefreshToken(user, oldToken.deviceIp, oldToken.deviceBrowser)
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    })

    const permissions = new Set<string>()

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role?.rolePermissions || []) {
        permissions.add(rolePermission.permission.name)
      }
    }

    return Array.from(permissions)
  }

  private async recordSuccessfulLogin(user: User, ipAddress?: string): Promise<void> {
    const loginAttempt = this.loginAttemptRepository.create({
      email: user.email,
      ipAddress,
      status: 'success',
      userId: user.id,
    })

    await this.loginAttemptRepository.save(loginAttempt)
  }

  private async recordFailedLogin(
    email: string,
    ipAddress?: string,
    reason?: string,
    userId?: string
  ): Promise<void> {
    const loginAttempt = this.loginAttemptRepository.create({
      email,
      ipAddress,
      status: 'failed',
      failureReason: reason,
      userId,
    })

    await this.loginAttemptRepository.save(loginAttempt)
  }

  private extractBrowserFromUserAgent(userAgent: string): string {
    // Simple browser extraction - could be enhanced with ua-parser-js
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private extractPlatformFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private getAccessTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET')
    if (!secret || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long')
    }
    return secret
  }

  private getRefreshTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')
    if (!secret || secret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long')
    }
    return secret
  }

  // Utility method to create initial users (for development)
  async createSeedUsers(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { email: 'admin@reopenlab.dev' }
    })

    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 12)
      const admin = this.userRepository.create({
        email: 'admin@reopenlab.dev',
        passwordHash: adminPassword,
        name: 'Admin User',
        roleType: UserType.ADMIN,
        tenantId: 'default-tenant',
        status: UserStatus.ACTIVE,
      })
      await this.userRepository.save(admin)
    }

    const teacherExists = await this.userRepository.findOne({
      where: { email: 'teacher@reopenlab.dev' }
    })

    if (!teacherExists) {
      const teacherPassword = await bcrypt.hash('teacher123', 12)
      const teacher = this.userRepository.create({
        email: 'teacher@reopenlab.dev',
        passwordHash: teacherPassword,
        name: '教师用户',
        roleType: UserType.TEACHER,
        tenantId: 'default-tenant',
        status: UserStatus.ACTIVE,
      })
      await this.userRepository.save(teacher)
    }
  }
}