import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  StreamableFile,
  NotFoundException,
  Body
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Response as ExpressResponse } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { AuditService, AuditLogQuery, AuditAction, AuditResource } from '../services/audit.service'
import { AuditLog } from '../database/entities/audit-log.entity'

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(@Query() query: AuditLogQuery) {
    return this.auditService.findByQuery(query)
  }

  @Get('statistics')
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    let timeRange
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    }

    return this.auditService.getAuditStatistics(timeRange)
  }

  @Get(':id')
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLog(@Param('id') id: string) {
    const auditLog = await this.auditService.findById(id)

    if (!auditLog) {
      throw new NotFoundException('Audit log not found')
    }

    return auditLog
  }

  @Get('users/:userId')
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100
    return this.auditService.findByUserId(userId, limitNum)
  }

  @Get('resources/:resource/:resourceId?')
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get audit logs for a specific resource' })
  @ApiResponse({ status: 200, description: 'Resource audit logs retrieved successfully' })
  async getResourceAuditLogs(
    @Param('resource') resource: AuditResource,
    @Param('resourceId') resourceId?: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100
    return this.auditService.findByResource(resource, resourceId, limitNum)
  }

  @Post('export')
  @Roles('admin', 'super_admin', 'auditor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  async exportAuditLogs(
    @Body() query: AuditLogQuery,
    @Response() res: ExpressResponse
  ) {
    const exportData = await this.auditService.exportAuditLogs(query)

    // Convert data to CSV
    const csv = this.convertToCSV(exportData.data)

    // Set response headers
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${exportData.filename}"`,
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(csv, 'utf8')
    })

    res.send(csv)
  }

  @Post('cleanup')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up old audit logs (super admin only)' })
  @ApiResponse({ status: 200, description: 'Old audit logs cleaned up successfully' })
  async cleanupOldLogs(@Query('retentionDays') retentionDays?: string) {
    const days = retentionDays ? parseInt(retentionDays, 10) : 90
    const deletedCount = await this.auditService.cleanupOldLogs(days)

    return {
      message: `Successfully cleaned up ${deletedCount} audit logs older than ${days} days`,
      deletedCount
    }
  }

  @Get('actions/list')
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get list of available audit actions' })
  @ApiResponse({ status: 200, description: 'Audit actions list retrieved successfully' })
  async getAuditActions() {
    return {
      actions: Object.values(AuditAction).map(action => ({
        value: action,
        label: this.getActionDisplayName(action)
      }))
    }
  }

  @Get('resources/list')
  @Roles('admin', 'super_admin', 'auditor')
  @ApiOperation({ summary: 'Get list of available audit resources' })
  @ApiResponse({ status: 200, description: 'Audit resources list retrieved successfully' })
  async getAuditResources() {
    return {
      resources: Object.values(AuditResource).map(resource => ({
        value: resource,
        label: this.getResourceDisplayName(resource)
      }))
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) {
      return 'No data available'
    }

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')

    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Escape quotes and handle commas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  private getActionDisplayName(action: AuditAction): string {
    const displayNames: Record<AuditAction, string> = {
      [AuditAction.LOGIN]: '登录',
      [AuditAction.LOGOUT]: '退出登录',
      [AuditAction.CREATE]: '创建',
      [AuditAction.UPDATE]: '更新',
      [AuditAction.DELETE]: '删除',
      [AuditAction.VIEW]: '查看',
      [AuditAction.APPROVE]: '审批',
      [AuditAction.REJECT]: '拒绝',
      [AuditAction.EXPORT]: '导出',
      [AuditAction.IMPORT]: '导入',
      [AuditAction.ASSIGN]: '分配',
      [AuditAction.REMOVE]: '移除',
      [AuditAction.ENABLE]: '启用',
      [AuditAction.DISABLE]: '禁用',
      [AuditAction.RESET_PASSWORD]: '重置密码',
      [AuditAction.CHANGE_ROLE]: '更改角色',
      [AuditAction.BULK_OPERATION]: '批量操作'
    }

    return displayNames[action] || action
  }

  private getResourceDisplayName(resource: AuditResource): string {
    const displayNames: Record<AuditResource, string> = {
      [AuditResource.USER]: '用户',
      [AuditResource.ROLE]: '角色',
      [AuditResource.PERMISSION]: '权限',
      [AuditResource.TENANT]: '租户',
      [AuditResource.COURSE]: '课程',
      [AuditResource.CLASSROOM]: '课堂',
      [AuditResource.ASSIGNMENT]: '作业',
      [AuditResource.SUBMISSION]: '提交',
      [AuditResource.SYSTEM]: '系统',
      [AuditResource.AUTH]: '认证',
      [AuditResource.AUDIT_LOG]: '审计日志'
    }

    return displayNames[resource] || resource
  }
}