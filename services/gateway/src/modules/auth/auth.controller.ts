import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { Public } from '../../decorators/public.decorator'
import { AuthService } from './auth.service'
import { LoginDto, SsoCallbackDto } from './dto/auth.dto'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  async logout(@Request() req) {
    return this.authService.logout(req.user)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  async getCurrentUser(@Request() req) {
    return this.authService.getCurrentUser(req.user.sub)
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@Body() changePasswordDto: any, @Request() req) {
    return this.authService.changePassword(changePasswordDto, req.user)
  }

  // SSO endpoints
  @Get('sso/config')
  @Public()
  @ApiOperation({ summary: 'Get SSO configuration' })
  async getSsoConfig() {
    return this.authService.getSsoConfig()
  }

  @Post('sso/callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle SSO callback' })
  async handleSsoCallback(@Body() callbackDto: SsoCallbackDto) {
    return this.authService.handleSsoCallback(callbackDto)
  }

  @Post('sso/link')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Link SSO account' })
  async linkSsoAccount(@Body() linkDto: any, @Request() req) {
    return this.authService.linkSsoAccount(linkDto, req.user)
  }

  @Post('sso/unlink')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unlink SSO account' })
  async unlinkSsoAccount(@Body() unlinkDto: any, @Request() req) {
    return this.authService.unlinkSsoAccount(unlinkDto, req.user)
  }

  @Get('sso/linked-accounts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get linked SSO accounts' })
  async getLinkedAccounts(@Request() req) {
    return this.authService.getLinkedAccounts(req.user.sub)
  }
}