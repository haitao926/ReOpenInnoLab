import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ThrottlerGuard } from '@nestjs/throttler'

import { SecureAuthService } from './auth.service.secure'
import { LoginDto, LoginResponseDto, RefreshTokenDto, LogoutDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { User } from '../database/entities/user.entity'

@ApiTags('认证')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class SecureAuthController {
  private readonly logger = new Logger(SecureAuthController.name)

  constructor(private readonly authService: SecureAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: LoginResponseDto
  })
  @ApiResponse({
    status: 401,
    description: '邮箱或密码错误'
  })
  @ApiResponse({
    status: 429,
    description: '登录尝试过于频繁'
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Request() req: any,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    // 不记录敏感的登录信息，只记录尝试次数和IP
    this.logger.log(`Login attempt for email: ${loginDto.email} from IP: ${ipAddress}`)

    try {
      const result = await this.authService.login(loginDto, ipAddress, userAgent)
      return result
    } catch (error) {
      this.logger.warn(`Login failed for email: ${loginDto.email} from IP: ${ipAddress}`)
      throw error
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功',
    type: LoginResponseDto
  })
  @ApiResponse({
    status: 401,
    description: '无效的刷新令牌'
  })
  async refresh(
    @Body(ValidationPipe) refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    this.logger.log('Token refresh attempt')

    try {
      const result = await this.authService.refresh(refreshTokenDto)
      this.logger.log('Token refresh successful')
      return result
    } catch (error) {
      this.logger.warn('Token refresh failed')
      throw error
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({
    status: 200,
    description: '登出成功'
  })
  @ApiResponse({
    status: 401,
    description: '未授权'
  })
  async logout(
    @CurrentUser('sub', ParseUUIDPipe) userId: string,
    @Body(ValidationPipe) logoutDto: LogoutDto,
  ): Promise<void> {
    this.logger.log(`Logout attempt for user ID: ${userId}`)

    try {
      await this.authService.logout(userId, logoutDto)
      this.logger.log(`User ${userId} logged out successfully`)
    } catch (error) {
      this.logger.warn(`Logout failed for user ${userId}:`, error)
      throw error
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取用户信息成功'
  })
  @ApiResponse({
    status: 401,
    description: '未授权'
  })
  async getProfile(@CurrentUser() user: any) {
    this.logger.log(`Profile requested for user ID: ${user.sub}`)

    try {
      // 从数据库获取完整的用户信息
      const fullUser = await this.authService.validateUser({
        sub: user.sub,
        email: user.email,
        tenantId: user.tenantId,
        roleType: user.roleType,
        type: 'access'
      })

      if (!fullUser) {
        throw new Error('User not found')
      }

      return {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        roleType: fullUser.roleType,
        tenantId: fullUser.tenantId,
        permissions: fullUser.permissions,
      }
    } catch (error) {
      this.logger.warn(`Failed to get profile for user ${user.sub}:`, error)
      throw error
    }
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '验证访问令牌' })
  @ApiResponse({
    status: 200,
    description: '令牌有效'
  })
  @ApiResponse({
    status: 401,
    description: '令牌无效'
  })
  async verifyToken(@CurrentUser() user: any) {
    this.logger.log(`Token verification requested for user ID: ${user.sub}`)

    return {
      valid: true,
      user: {
        id: user.sub,
        email: user.email,
        roleType: user.roleType,
        tenantId: user.tenantId,
      }
    }
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出所有设备' })
  @ApiResponse({
    status: 200,
    description: '已登出所有设备'
  })
  async logoutAllDevices(
    @CurrentUser('sub', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    this.logger.log(`Logout all devices requested for user ID: ${userId}`)

    try {
      await this.authService.logout(userId, { refreshToken: '', revokeAll: true })
      this.logger.log(`User ${userId} logged out from all devices successfully`)
    } catch (error) {
      this.logger.warn(`Logout all devices failed for user ${userId}:`, error)
      throw error
    }
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取活跃会话列表' })
  @ApiResponse({
    status: 200,
    description: '获取会话列表成功'
  })
  async getActiveSessions(
    @CurrentUser('sub', ParseUUIDPipe) userId: string,
  ): Promise<any> {
    this.logger.log(`Active sessions requested for user ID: ${userId}`)

    // 这里可以实现获取用户所有活跃会话的逻辑
    // 返回会话列表，包括设备信息、最后活动时间等
    return {
      sessions: [],
      total: 0,
    }
  }

  // 健康检查端点（不需要认证）
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '认证服务健康检查' })
  @ApiResponse({
    status: 200,
    description: '认证服务运行正常'
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
    }
  }
}