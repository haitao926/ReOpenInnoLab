import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { RolesGuard } from '../../guards/roles.guard'
import { Roles } from '../../decorators/roles.decorator'
import { AdminService } from './admin.service'

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name)

  constructor(private readonly adminService: AdminService) {}

  // ==================== TENANT MANAGEMENT ====================

  @Get('tenants')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async getTenants(@Query() query: any) {
    return this.adminService.proxyToService('identity-service', '/tenants', 'GET', null, query)
  }

  @Post('tenants')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create tenant' })
  async createTenant(@Body() createTenantDto: any, @Request() req) {
    return this.adminService.proxyToService('identity-service', '/tenants', 'POST', createTenantDto, null, req.user)
  }

  @Get('tenants/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getTenant(@Param('id') id: string) {
    return this.adminService.proxyToService('identity-service', `/tenants/${id}`, 'GET')
  }

  @Put('tenants/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update tenant' })
  async updateTenant(@Param('id') id: string, @Body() updateTenantDto: any, @Request() req) {
    return this.adminService.proxyToService('identity-service', `/tenants/${id}`, 'PUT', updateTenantDto, null, req.user)
  }

  @Delete('tenants/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete tenant' })
  async deleteTenant(@Param('id') id: string, @Request() req) {
    return this.adminService.proxyToService('identity-service', `/tenants/${id}`, 'DELETE', null, null, req.user)
  }

  // ==================== USER MANAGEMENT ====================

  @Get('users')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query() query: any) {
    return this.adminService.proxyToService('identity-service', '/users', 'GET', null, query)
  }

  @Post('users')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create user' })
  async createUser(@Body() createUserDto: any, @Request() req) {
    return this.adminService.proxyToService('identity-service', '/users', 'POST', createUserDto, null, req.user)
  }

  @Get('users/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.proxyToService('identity-service', `/users/${id}`, 'GET')
  }

  @Put('users/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: any, @Request() req) {
    return this.adminService.proxyToService('identity-service', `/users/${id}`, 'PUT', updateUserDto, null, req.user)
  }

  @Delete('users/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string, @Request() req) {
    return this.adminService.proxyToService('identity-service', `/users/${id}`, 'DELETE', null, null, req.user)
  }

  @Post('users/:id/reset-password')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(@Param('id') id: string, @Body() resetPasswordDto: any, @Request() req) {
    return this.adminService.proxyToService('identity-service', `/users/${id}/reset-password`, 'POST', resetPasswordDto, null, req.user)
  }

  // ==================== COURSE MANAGEMENT ====================

  @Get('courses')
  @Roles('admin', 'content_admin')
  @ApiOperation({ summary: 'Get all courses for admin review' })
  async getCourses(@Query() query: any) {
    return this.adminService.proxyToService('course-service', '/admin/courses', 'GET', null, query)
  }

  @Get('courses/:id')
  @Roles('admin', 'content_admin')
  @ApiOperation({ summary: 'Get course details for admin review' })
  async getCourse(@Param('id') id: string) {
    return this.adminService.proxyToService('course-service', `/admin/courses/${id}`, 'GET')
  }

  @Post('courses/:id/approve')
  @Roles('admin', 'content_admin')
  @ApiOperation({ summary: 'Approve course' })
  async approveCourse(@Param('id') id: string, @Body() approvalDto: any, @Request() req) {
    return this.adminService.proxyToService('course-service', `/admin/courses/${id}/approve`, 'POST', approvalDto, null, req.user)
  }

  @Post('courses/:id/reject')
  @Roles('admin', 'content_admin')
  @ApiOperation({ summary: 'Reject course' })
  async rejectCourse(@Param('id') id: string, @Body() rejectionDto: any, @Request() req) {
    return this.adminService.proxyToService('course-service', `/admin/courses/${id}/reject`, 'POST', rejectionDto, null, req.user)
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-logs')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(@Query() query: any) {
    return this.adminService.proxyToService('identity-service', '/audit-logs', 'GET', null, query)
  }

  // ==================== SYSTEM HEALTH ====================

  @Get('system/health')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get system health status' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth()
  }

  @Get('system/metrics')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get system metrics' })
  async getSystemMetrics(@Query() query: any) {
    return this.adminService.getSystemMetrics(query)
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard/stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats()
  }
}