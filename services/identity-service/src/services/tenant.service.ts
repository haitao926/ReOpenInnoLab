import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, Between, Not, In, MoreThan } from 'typeorm'
import { Tenant, TenantStatus, TenantPlan } from '../database/entities/tenant.entity'
import { User } from '../database/entities/user.entity'
import { AuditService, AuditAction, AuditResource } from './audit.service'

export interface CreateTenantDto {
  code: string
  name: string
  displayName?: string
  description?: string
  domain?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail: string
  contactPhone?: string
  contactPerson?: string
  address?: string
  country?: string
  industry?: string
  employeeCount?: number
  plan: TenantPlan
  trialEndsAt?: Date
  features?: Record<string, boolean>
  quotas?: Record<string, number>
  metadata?: Record<string, any>
}

export interface UpdateTenantDto {
  name?: string
  displayName?: string
  description?: string
  domain?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  address?: string
  country?: string
  industry?: string
  employeeCount?: number
  plan?: TenantPlan
  features?: Record<string, boolean>
  quotas?: Record<string, number>
  metadata?: Record<string, any>
}

export interface TenantQueryDto {
  page?: number
  pageSize?: number
  search?: string
  status?: TenantStatus | TenantStatus[]
  plan?: TenantPlan | TenantPlan[]
  industry?: string
  country?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'plan' | 'status'
  sortOrder?: 'ASC' | 'DESC'
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name)

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService
  ) {}

  async create(createTenantDto: CreateTenantDto, createdBy: string): Promise<Tenant> {
    try {
      // Check if tenant code already exists
      const existingTenant = await this.tenantRepository.findOne({
        where: { code: createTenantDto.code }
      })

      if (existingTenant) {
        throw new ConflictException(`Tenant with code ${createTenantDto.code} already exists`)
      }

      // Set default trial end date if not provided
      const trialEndsAt = createTenantDto.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        trialEndsAt,
        status: TenantStatus.TRIAL,
        usage: {},
        features: createTenantDto.features || {},
        quotas: createTenantDto.quotas || {},
        createdBy
      })

      const savedTenant = await this.tenantRepository.save(tenant)

      // Log the creation
      await this.auditService.log({
        userId: createdBy,
        action: AuditAction.CREATE,
        resource: AuditResource.TENANT,
        resourceId: savedTenant.id,
        resourceName: savedTenant.name,
        newValues: savedTenant,
        metadata: { plan: savedTenant.plan }
      })

      this.logger.log(`Created tenant: ${savedTenant.code} by user ${createdBy}`)
      return savedTenant

    } catch (error) {
      this.logger.error(`Failed to create tenant ${createTenantDto.code}:`, error)
      throw error
    }
  }

  async findAll(query: TenantQueryDto): Promise<{
    items: Tenant[]
    total: number
    page: number
    pageSize: number
  }> {
    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      plan,
      industry,
      country,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query

    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant')

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.code ILIKE :search OR tenant.displayName ILIKE :search OR tenant.contactEmail ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    if (status) {
      if (Array.isArray(status)) {
        queryBuilder.andWhere('tenant.status IN (:...status)', { status })
      } else {
        queryBuilder.andWhere('tenant.status = :status', { status })
      }
    }

    if (plan) {
      if (Array.isArray(plan)) {
        queryBuilder.andWhere('tenant.plan IN (:...plan)', { plan })
      } else {
        queryBuilder.andWhere('tenant.plan = :plan', { plan })
      }
    }

    if (industry) {
      queryBuilder.andWhere('tenant.industry = :industry', { industry })
    }

    if (country) {
      queryBuilder.andWhere('tenant.country = :country', { country })
    }

    if (isActive !== undefined) {
      if (isActive) {
        queryBuilder.andWhere('tenant.status = :activeStatus', { activeStatus: TenantStatus.ACTIVE })
      } else {
        queryBuilder.andWhere('tenant.status != :activeStatus', { activeStatus: TenantStatus.ACTIVE })
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`tenant.${sortBy}`, sortOrder)

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

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users']
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`)
    }

    return tenant
  }

  async findByCode(code: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { code }
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant with code ${code} not found`)
    }

    return tenant
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, updatedBy: string): Promise<Tenant> {
    try {
      const tenant = await this.findById(id)

      // Store old values for audit
      const oldValues = { ...tenant }

      // Update fields
      Object.assign(tenant, updateTenantDto)

      const updatedTenant = await this.tenantRepository.save(tenant)

      // Log the update
      await this.auditService.log({
        userId: updatedBy,
        action: AuditAction.UPDATE,
        resource: AuditResource.TENANT,
        resourceId: updatedTenant.id,
        resourceName: updatedTenant.name,
        oldValues,
        newValues: updatedTenant,
        metadata: { changedFields: Object.keys(updateTenantDto) }
      })

      this.logger.log(`Updated tenant: ${updatedTenant.code} by user ${updatedBy}`)
      return updatedTenant

    } catch (error) {
      this.logger.error(`Failed to update tenant ${id}:`, error)
      throw error
    }
  }

  async updateStatus(id: string, status: TenantStatus, updatedBy: string, reason?: string): Promise<Tenant> {
    const tenant = await this.findById(id)

    if (tenant.status === status) {
      return tenant // No change needed
    }

    const oldValues = { ...tenant, status: tenant.status }

    // Handle special status transitions
    if (status === TenantStatus.ACTIVE) {
      if (tenant.status === TenantStatus.PENDING || tenant.status === TenantStatus.TRIAL) {
        tenant.approvedBy = updatedBy
        tenant.approvedAt = new Date()
        tenant.rejectionReason = null
      }
    } else if (status === TenantStatus.SUSPENDED) {
      tenant.rejectionReason = reason || 'Suspended by administrator'
    } else if (status === TenantStatus.EXPIRED) {
      tenant.subscriptionEndsAt = new Date()
    }

    tenant.status = status
    const updatedTenant = await this.tenantRepository.save(tenant)

    // Log the status change
    await this.auditService.log({
      userId: updatedBy,
      action: status === TenantStatus.ACTIVE ? AuditAction.ENABLE : AuditAction.DISABLE,
      resource: AuditResource.TENANT,
      resourceId: updatedTenant.id,
      resourceName: updatedTenant.name,
      oldValues,
      newValues: updatedTenant,
      metadata: {
        statusChange: { from: oldValues.status, to: status },
        reason
      }
    })

    this.logger.log(`Updated tenant status: ${updatedTenant.code} -> ${status} by user ${updatedBy}`)
    return updatedTenant
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    try {
      const tenant = await this.findById(id)

      // Check if tenant has users
      const userCount = await this.userRepository.count({
        where: { tenantId: id }
      })

      if (userCount > 0) {
        throw new BadRequestException(`Cannot delete tenant with ${userCount} users. Please remove all users first.`)
      }

      // Store tenant info for audit before deletion
      const tenantInfo = { ...tenant }

      await this.tenantRepository.remove(tenant)

      // Log the deletion
      await this.auditService.log({
        userId: deletedBy,
        action: AuditAction.DELETE,
        resource: AuditResource.TENANT,
        resourceId: tenantInfo.id,
        resourceName: tenantInfo.name,
        oldValues: tenantInfo,
        metadata: {
          deletedBy,
          userCountBeforeDeletion: userCount
        }
      })

      this.logger.log(`Deleted tenant: ${tenantInfo.code} by user ${deletedBy}`)

    } catch (error) {
      this.logger.error(`Failed to delete tenant ${id}:`, error)
      throw error
    }
  }

  async approveTenant(id: string, approvedBy: string): Promise<Tenant> {
    return this.updateStatus(id, TenantStatus.ACTIVE, approvedBy, 'Approved by administrator')
  }

  async rejectTenant(id: string, reason: string, rejectedBy: string): Promise<Tenant> {
    const tenant = await this.findById(id)

    tenant.status = TenantStatus.INACTIVE
    tenant.approvedBy = rejectedBy
    tenant.approvedAt = new Date()
    tenant.rejectionReason = reason

    const updatedTenant = await this.tenantRepository.save(tenant)

    // Log the rejection
    await this.auditService.log({
      userId: rejectedBy,
      action: AuditAction.REJECT,
      resource: AuditResource.TENANT,
      resourceId: updatedTenant.id,
      resourceName: updatedTenant.name,
      oldValues: { status: TenantStatus.PENDING },
      newValues: updatedTenant,
      metadata: { reason }
    })

    this.logger.log(`Rejected tenant: ${updatedTenant.code} by user ${rejectedBy}`)
    return updatedTenant
  }

  async getTenantStatistics(): Promise<{
    totalTenants: number
    activeTenants: number
    trialTenants: number
    expiredTenants: number
    planDistribution: Record<TenantPlan, number>
    statusDistribution: Record<TenantStatus, number>
    recentSignups: number
    topIndustries: Array<{ industry: string; count: number }>
    topCountries: Array<{ country: string; count: number }>
  }> {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      expiredTenants,
      planDistribution,
      statusDistribution,
      recentSignups,
      topIndustries,
      topCountries
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { status: TenantStatus.ACTIVE } }),
      this.tenantRepository.count({ where: { status: TenantStatus.TRIAL } }),
      this.tenantRepository.count({ where: { status: TenantStatus.EXPIRED } }),
      this.getPlanDistribution(),
      this.getStatusDistribution(),
      this.getRecentSignups(),
      this.getTopIndustries(),
      this.getTopCountries()
    ])

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      expiredTenants,
      planDistribution,
      statusDistribution,
      recentSignups,
      topIndustries,
      topCountries
    }
  }

  async updateUsage(tenantId: string, resource: string, increment: number): Promise<void> {
    const tenant = await this.findById(tenantId)

    const currentUsage = tenant.usage || {}
    const newUsage = {
      ...currentUsage,
      [resource]: (currentUsage[resource] || 0) + increment
    }

    tenant.usage = newUsage
    await this.tenantRepository.save(tenant)
  }

  async checkQuota(tenantId: string, resource: string, required: number = 1): Promise<boolean> {
    const tenant = await this.findById(tenantId)
    return tenant.canAddResource(resource, required)
  }

  private async getPlanDistribution(): Promise<Record<TenantPlan, number>> {
    const result = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tenant.plan')
      .getRawMany()

    const distribution: Record<TenantPlan, number> = {} as any
    Object.values(TenantPlan).forEach(plan => {
      distribution[plan] = 0
    })

    result.forEach(item => {
      distribution[item.plan as TenantPlan] = parseInt(item.count)
    })

    return distribution
  }

  private async getStatusDistribution(): Promise<Record<TenantStatus, number>> {
    const result = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tenant.status')
      .getRawMany()

    const distribution: Record<TenantStatus, number> = {} as any
    Object.values(TenantStatus).forEach(status => {
      distribution[status] = 0
    })

    result.forEach(item => {
      distribution[item.status as TenantStatus] = parseInt(item.count)
    })

    return distribution
  }

  private async getRecentSignups(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return this.tenantRepository.count({
      where: {
        createdAt: MoreThan(thirtyDaysAgo)
      }
    })
  }

  private async getTopIndustries(): Promise<Array<{ industry: string; count: number }>> {
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('tenant.industry IS NOT NULL')
      .groupBy('tenant.industry')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()
  }

  private async getTopCountries(): Promise<Array<{ country: string; count: number }>> {
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('tenant.country IS NOT NULL')
      .groupBy('tenant.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()
  }
}