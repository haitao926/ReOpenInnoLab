import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional } from 'class-validator'

import { User } from './user.entity'
import { Role } from './role.entity'
import { AuthProvider } from './auth-provider.entity'

export enum TenantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

export enum TenantPlan {
  STARTER = 'starter',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

@Entity('tenants')
@Index(['code'], { unique: true })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string

  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor: string

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor: string

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  @IsEnum(TenantStatus)
  status: TenantStatus

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.BASIC,
  })
  @IsEnum(TenantPlan)
  plan: TenantPlan

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactPerson: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string

  @Column({ type: 'int', default: 0 })
  employeeCount: number

  @Column({ type: 'date', nullable: true })
  trialEndsAt: Date

  @Column({ type: 'date', nullable: true })
  subscriptionEndsAt: Date

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyPrice: number

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  features: Record<string, boolean>

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  quotas: Record<string, number>

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  usage: Record<string, number>

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  metadata?: Record<string, any>

  @Column({ name: 'created_by', nullable: true })
  createdBy: string

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date

  @Column({ type: 'text', nullable: true })
  rejectionReason: string

  // Relationships
  @OneToMany(() => User, (user) => user.tenant)
  users: User[]

  @OneToMany(() => Role, (role) => role.tenant)
  roles: Role[]

  @OneToMany(() => AuthProvider, (authProvider) => authProvider.tenant)
  authProviders: AuthProvider[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE
  }

  get isTrial(): boolean {
    return this.status === TenantStatus.TRIAL
  }

  get isExpired(): boolean {
    return this.status === TenantStatus.EXPIRED ||
           (this.subscriptionEndsAt && this.subscriptionEndsAt < new Date())
  }

  get trialDaysRemaining(): number {
    if (!this.trialEndsAt) return 0
    const now = new Date()
    const diffTime = this.trialEndsAt.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  get subscriptionDaysRemaining(): number {
    if (!this.subscriptionEndsAt) return 0
    const now = new Date()
    const diffTime = this.subscriptionEndsAt.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  // Helper methods
  getBranding(): Record<string, any> {
    return {
      logo: this.logo,
      primaryColor: this.primaryColor || '#4F46E5',
      secondaryColor: this.secondaryColor || '#10B981',
      displayName: this.displayName || this.name,
      domain: this.domain
    }
  }

  getDefaultFeatures(): Record<string, boolean> {
    const baseFeatures = {
      ai_assistant: false,
      virtual_lab: false,
      analytics: false,
      sso_integration: false,
      api_access: false,
      custom_branding: false,
      priority_support: false,
      data_export: true,
      user_management: true,
      course_management: true
    }

    switch (this.plan) {
      case TenantPlan.STARTER:
        return {
          ...baseFeatures,
          user_management: true,
          course_management: true,
          data_export: true
        }
      case TenantPlan.BASIC:
        return {
          ...baseFeatures,
          ai_assistant: true,
          analytics: true,
          api_access: true
        }
      case TenantPlan.PRO:
        return {
          ...baseFeatures,
          ai_assistant: true,
          virtual_lab: true,
          analytics: true,
          sso_integration: true,
          api_access: true,
          custom_branding: true
        }
      case TenantPlan.ENTERPRISE:
      case TenantPlan.CUSTOM:
        return {
          ...baseFeatures,
          ai_assistant: true,
          virtual_lab: true,
          analytics: true,
          sso_integration: true,
          api_access: true,
          custom_branding: true,
          priority_support: true
        }
      default:
        return baseFeatures
    }
  }

  getFeatures(): Record<string, boolean> {
    return { ...this.getDefaultFeatures(), ...this.features }
  }

  getQuotas(): Record<string, number> {
    const defaultQuotas = {
      max_users: 10,
      max_courses: 5,
      max_students: 50,
      storage_gb: 5,
      api_calls_per_month: 1000,
      ai_tokens_per_month: 10000
    }

    const planQuotas = {
      [TenantPlan.STARTER]: {
        max_users: 25,
        max_courses: 10,
        max_students: 100,
        storage_gb: 10,
        api_calls_per_month: 5000,
        ai_tokens_per_month: 50000
      },
      [TenantPlan.BASIC]: {
        max_users: 100,
        max_courses: 50,
        max_students: 1000,
        storage_gb: 50,
        api_calls_per_month: 25000,
        ai_tokens_per_month: 250000
      },
      [TenantPlan.PRO]: {
        max_users: 500,
        max_courses: 200,
        max_students: 5000,
        storage_gb: 200,
        api_calls_per_month: 100000,
        ai_tokens_per_month: 1000000
      },
      [TenantPlan.ENTERPRISE]: {
        max_users: -1, // Unlimited
        max_courses: -1,
        max_students: -1,
        storage_gb: 1000,
        api_calls_per_month: -1,
        ai_tokens_per_month: -1
      },
      [TenantPlan.CUSTOM]: this.quotas || {}
    }

    return { ...defaultQuotas, ...planQuotas[this.plan], ...this.quotas }
  }

  getUsagePercentage(): Record<string, number> {
    const quotas = this.getQuotas()
    const usage = this.usage || {}

    const percentages: Record<string, number> = {}

    for (const [key, quota] of Object.entries(quotas)) {
      if (quota === -1) {
        percentages[key] = 0 // Unlimited
      } else {
        const used = usage[key] || 0
        percentages[key] = Math.min(100, Math.round((used / quota) * 100))
      }
    }

    return percentages
  }

  isFeatureEnabled(feature: string): boolean {
    const features = this.getFeatures()
    return features[feature] === true
  }

  isOverQuota(resource: string): boolean {
    const quotas = this.getQuotas()
    const usage = this.usage || {}
    const quota = quotas[resource]

    if (quota === -1) return false // Unlimited
    return (usage[resource] || 0) >= quota
  }

  canAddResource(resource: string, count = 1): boolean {
    const quotas = this.getQuotas()
    const usage = this.usage || {}
    const quota = quotas[resource]

    if (quota === -1) return true // Unlimited
    return (usage[resource] || 0) + count <= quota
  }
}