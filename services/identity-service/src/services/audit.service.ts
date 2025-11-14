import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, MoreThan, LessThan } from 'typeorm'
import { AuditLog, AuditAction, AuditResource } from '../database/entities/audit-log.entity'

// Re-export enums for use by other modules
export { AuditAction, AuditResource } from '../database/entities/audit-log.entity'
import { User } from '../database/entities/user.entity'

export interface AuditLogData {
  userId?: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  resourceName?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  tenantId?: string
  success?: boolean
  errorMessage?: string
  sessionId?: string
  requestId?: string
}

export interface AuditLogQuery {
  userId?: string
  action?: AuditAction
  resource?: AuditResource
  resourceId?: string
  tenantId?: string
  ipAddress?: string
  success?: boolean
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  async log(data: AuditLogData): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...data,
        success: data.success ?? true
      })

      const savedLog = await this.auditLogRepository.save(auditLog)

      // Log high-priority actions
      if (this.isHighPriorityAction(data.action)) {
        this.logger.warn(
          `High priority audit: ${data.action} on ${data.resource} by user ${data.userId}`
        )
      }

      return savedLog
    } catch (error) {
      this.logger.error('Failed to save audit log:', error)
      // Don't throw - audit logging should not break the main flow
      throw error
    }
  }

  async logWithUser(user: User | null, data: Omit<AuditLogData, 'userId'>): Promise<AuditLog> {
    return this.log({
      ...data,
      userId: user?.id
    })
  }

  async findByQuery(query: AuditLogQuery): Promise<{
    items: AuditLog[]
    total: number
    page: number
    pageSize: number
  }> {
    const {
      userId,
      action,
      resource,
      resourceId,
      tenantId,
      ipAddress,
      success,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId })
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action })
    }

    if (resource) {
      queryBuilder.andWhere('audit_log.resource = :resource', { resource })
    }

    if (resourceId) {
      queryBuilder.andWhere('audit_log.resourceId = :resourceId', { resourceId })
    }

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId })
    }

    if (ipAddress) {
      queryBuilder.andWhere('audit_log.ipAddress = :ipAddress', { ipAddress })
    }

    if (success !== undefined) {
      queryBuilder.andWhere('audit_log.success = :success', { success })
    }

    if (startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate })
    }

    if (endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate })
    }

    // Apply sorting
    queryBuilder.orderBy(`audit_log.${sortBy}`, sortOrder)

    // Get total count
    const total = await queryBuilder.getCount()

    // Apply pagination
    const offset = (page - 1) * pageSize
    queryBuilder.skip(offset).take(pageSize)

    const items = await queryBuilder.getMany()

    return {
      items,
      total,
      page,
      pageSize
    }
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['user']
    })
  }

  async findByUserId(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user']
    })
  }

  async findByResource(resource: AuditResource, resourceId?: string, limit = 100): Promise<AuditLog[]> {
    const where: any = { resource }
    if (resourceId) {
      where.resourceId = resourceId
    }

    return this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user']
    })
  }

  async getAuditStatistics(timeRange?: { start: Date; end: Date }): Promise<{
    totalLogs: number
    successRate: number
    topActions: Array<{ action: string; count: number }>
    topResources: Array<{ resource: string; count: number }>
    topUsers: Array<{ userId: string; userName: string; count: number }>
    errorRate: number
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')

    if (timeRange) {
      queryBuilder.where('audit_log.createdAt BETWEEN :start AND :end', {
        start: timeRange.start,
        end: timeRange.end
      })
    }

    const totalLogs = await queryBuilder.getCount()

    const successCount = await queryBuilder
      .clone()
      .andWhere('audit_log.success = :success', { success: true })
      .getCount()

    const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0

    // Top actions
    const topActions = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit_log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    // Top resources
    const topResources = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.resource', 'resource')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit_log.resource')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    // Top users
    const topUsers = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoin('audit_log.user', 'user')
      .select('audit_log.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('COUNT(*)', 'count')
      .where('audit_log.userId IS NOT NULL')
      .groupBy('audit_log.userId, user.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    const errorRate = 100 - successRate

    return {
      totalLogs,
      successRate: Math.round(successRate * 100) / 100,
      topActions: topActions.map(item => ({ action: item.action, count: parseInt(item.count) })),
      topResources: topResources.map(item => ({ resource: item.resource, count: parseInt(item.count) })),
      topUsers: topUsers.map(item => ({
        userId: item.userId,
        userName: item.userName || 'Unknown',
        count: parseInt(item.count)
      })),
      errorRate: Math.round(errorRate * 100) / 100
    }
  }

  async exportAuditLogs(query: AuditLogQuery): Promise<{
    data: any[]
    filename: string
    mimeType: string
  }> {
    const result = await this.findByQuery({
      ...query,
      page: 1,
      pageSize: 10000 // Export limit
    })

    const data = result.items.map(log => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      user: log.user?.name || 'System',
      action: log.action,
      resource: log.resource,
      resourceName: log.resourceName,
      resourceId: log.resourceId,
      success: log.success,
      errorMessage: log.errorMessage,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      tenantId: log.tenantId,
      sessionId: log.sessionId,
      requestId: log.requestId,
      oldValues: JSON.stringify(log.oldValues),
      newValues: JSON.stringify(log.newValues),
      metadata: JSON.stringify(log.metadata)
    }))

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `audit-logs-${timestamp}.csv`

    return {
      data,
      filename,
      mimeType: 'text/csv'
    }
  }

  async cleanupOldLogs(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .from(AuditLog)
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute()

    const deletedCount = result.affected || 0
    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} old audit logs older than ${retentionDays} days`)
    }

    return deletedCount
  }

  private isHighPriorityAction(action: AuditAction): boolean {
    return [
      AuditAction.DELETE,
      AuditAction.BULK_OPERATION,
      AuditAction.RESET_PASSWORD,
      AuditAction.CHANGE_ROLE
    ].includes(action)
  }
}