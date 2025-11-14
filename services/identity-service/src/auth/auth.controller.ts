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
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ThrottlerGuard } from '@nestjs/throttler'

import { AuthService } from './auth.service'
import { LoginDto, LoginResponseDto, RefreshTokenDto, LogoutDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'

@ApiTags('认证')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

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
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress
    // const userAgent = req.headers['user-agent'] // 暂时不使用

    this.logger.log(`Login attempt for email: ${loginDto.email} from IP: ${ipAddress}`)

    return this.authService.login(loginDto, ipAddress)
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
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refresh(refreshTokenDto)
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
    @CurrentUser('sub') userId: string,
    @Body() logoutDto: LogoutDto,
  ): Promise<void> {
    this.logger.log(`Logout attempt for user ID: ${userId}`)
    return this.authService.logout(userId, logoutDto)
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
    return {
      id: user.sub,
      email: user.email,
      tenantId: user.tenantId,
      roleType: user.roleType,
      permissions: user.permissions,
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
  async verifyToken() {
    return { valid: true }
  }
}