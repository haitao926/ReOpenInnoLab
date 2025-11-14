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
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { TenantService, CreateTenantDto, UpdateTenantDto, TenantQueryDto } from '../services/tenant.service'
import { Tenant, TenantStatus, TenantPlan } from '../database/entities/tenant.entity'

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  async create(@Body() createTenantDto: CreateTenantDto, @Request() req) {
    return this.tenantService.create(createTenantDto, req.user.sub)
  }

  @Get()
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get all tenants with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async findAll(@Query() query: TenantQueryDto) {
    return this.tenantService.findAll(query)
  }

  @Get('statistics')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.tenantService.getTenantStatistics()
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findById(@Param('id') id: string) {
    return this.tenantService.findById(id)
  }

  @Get('code/:code')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tenant by code' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findByCode(@Param('code') code: string) {
    return this.tenantService.findByCode(code)
  }

  @Put(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto, @Request() req) {
    return this.tenantService.update(id, updateTenantDto, req.user.sub)
  }

  @Put(':id/status')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update tenant status' })
  @ApiResponse({ status: 200, description: 'Tenant status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TenantStatus; reason?: string },
    @Request() req
  ) {
    return this.tenantService.updateStatus(id, body.status, req.user.sub, body.reason)
  }

  @Post(':id/approve')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve tenant' })
  @ApiResponse({ status: 200, description: 'Tenant approved successfully' })
  async approve(@Param('id') id: string, @Request() req) {
    return this.tenantService.approveTenant(id, req.user.sub)
  }

  @Post(':id/reject')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject tenant' })
  @ApiResponse({ status: 200, description: 'Tenant rejected successfully' })
  async reject(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.tenantService.rejectTenant(id, body.reason, req.user.sub)
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant (super admin only)' })
  @ApiResponse({ status: 204, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.tenantService.remove(id, req.user.sub)
  }

  @Get('plans/list')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get available tenant plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getPlans() {
    return {
      plans: Object.values(TenantPlan).map(plan => ({
        value: plan,
        label: this.getPlanDisplayName(plan),
        description: this.getPlanDescription(plan)
      }))
    }
  }

  @Get('statuses/list')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get available tenant statuses' })
  @ApiResponse({ status: 200, description: 'Statuses retrieved successfully' })
  async getStatuses() {
    return {
      statuses: Object.values(TenantStatus).map(status => ({
        value: status,
        label: this.getStatusDisplayName(status),
        color: this.getStatusColor(status)
      }))
    }
  }

  @Post(':id/usage/:resource')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tenant usage (internal)' })
  async updateUsage(
    @Param('id') id: string,
    @Param('resource') resource: string,
    @Body() body: { increment: number }
  ) {
    await this.tenantService.updateUsage(id, resource, body.increment)
    return { success: true }
  }

  @Get(':id/quotas/check')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Check if tenant can add more resources' })
  async checkQuota(
    @Param('id') id: string,
    @Query('resource') resource: string,
    @Query('required') required?: string
  ) {
    const requiredAmount = required ? parseInt(required) : 1
    const canAdd = await this.tenantService.checkQuota(id, resource, requiredAmount)
    return {
      canAdd,
      resource,
      required: requiredAmount
    }
  }

  private getPlanDisplayName(plan: TenantPlan): string {
    const displayNames: Record<TenantPlan, string> = {
      [TenantPlan.STARTER]: '入门版',
      [TenantPlan.BASIC]: '基础版',
      [TenantPlan.PRO]: '专业版',
      [TenantPlan.ENTERPRISE]: '企业版',
      [TenantPlan.CUSTOM]: '定制版'
    }
    return displayNames[plan] || plan
  }

  private getPlanDescription(plan: TenantPlan): string {
    const descriptions: Record<TenantPlan, string> = {
      [TenantPlan.STARTER]: '适合小型团队，包含基础功能',
      [TenantPlan.BASIC]: '适合成长型团队，包含AI助手和分析功能',
      [TenantPlan.PRO]: '适合中大型企业，包含完整功能套件',
      [TenantPlan.ENTERPRISE]: '适合大型企业，无限制使用所有功能',
      [TenantPlan.CUSTOM]: '根据需求定制的专属方案'
    }
    return descriptions[plan] || ''
  }

  private getStatusDisplayName(status: TenantStatus): string {
    const displayNames: Record<TenantStatus, string> = {
      [TenantStatus.PENDING]: '待审核',
      [TenantStatus.ACTIVE]: '正常',
      [TenantStatus.INACTIVE]: '未激活',
      [TenantStatus.SUSPENDED]: '已暂停',
      [TenantStatus.TRIAL]: '试用中',
      [TenantStatus.EXPIRED]: '已过期'
    }
    return displayNames[status] || status
  }

  private getStatusColor(status: TenantStatus): string {
    const colors: Record<TenantStatus, string> = {
      [TenantStatus.PENDING]: 'warning',
      [TenantStatus.ACTIVE]: 'success',
      [TenantStatus.INACTIVE]: 'info',
      [TenantStatus.SUSPENDED]: 'danger',
      [TenantStatus.TRIAL]: 'primary',
      [TenantStatus.EXPIRED]: 'danger'
    }
    return colors[status] || 'default'
  }
}