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

import { Classroom } from './classroom.entity'
import { LabDeviceAgent } from './lab-device-agent.entity'

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum TenantPlan {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
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

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
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

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  metadata?: {
    branding?: {
      logo?: string
      primaryColor?: string
      secondaryColor?: string
      theme?: string
    }
    features?: {
      virtualLab?: boolean
      aiAssistant?: boolean
      analytics?: boolean
      realTimeCollaboration?: boolean
    }
    limits?: {
      maxClassrooms?: number
      maxStudentsPerClass?: number
      maxLabDevices?: number
      maxSessionsPerDay?: number
      storageGB?: number
    }
    configuration?: {
      defaultSessionDuration?: number // 分钟
      autoRecordSessions?: boolean
      attendanceTrackingEnabled?: boolean
      parentAccessEnabled?: boolean
      securitySettings?: {
        twoFactorAuth?: boolean
        sessionTimeout?: number
        ipWhitelist?: string[]
      }
    }
    custom?: Record<string, any>
  }

  // Relationships
  @OneToMany(() => Classroom, (classroom) => classroom.tenant)
  classrooms: Classroom[]

  @OneToMany(() => LabDeviceAgent, (agent) => agent.tenant)
  labDeviceAgents: LabDeviceAgent[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE
  }

  // Helper methods
  getBranding(): {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    theme?: string
  } {
    return this.metadata?.branding || {
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      theme: 'light',
    }
  }

  getFeatures(): {
    virtualLab?: boolean
    aiAssistant?: boolean
    analytics?: boolean
    realTimeCollaboration?: boolean
  } {
    return this.metadata?.features || {
      virtualLab: false,
      aiAssistant: false,
      analytics: false,
      realTimeCollaboration: false,
    }
  }

  getLimits(): {
    maxClassrooms?: number
    maxStudentsPerClass?: number
    maxLabDevices?: number
    maxSessionsPerDay?: number
    storageGB?: number
  } {
    const defaultLimits = {
      maxClassrooms: 10,
      maxStudentsPerClass: 30,
      maxLabDevices: 20,
      maxSessionsPerDay: 50,
      storageGB: 10,
    }

    const planLimits = {
      [TenantPlan.BASIC]: defaultLimits,
      [TenantPlan.PRO]: {
        maxClassrooms: 50,
        maxStudentsPerClass: 50,
        maxLabDevices: 100,
        maxSessionsPerDay: 200,
        storageGB: 100,
      },
      [TenantPlan.ENTERPRISE]: {
        maxClassrooms: 200,
        maxStudentsPerClass: 100,
        maxLabDevices: 500,
        maxSessionsPerDay: 1000,
        storageGB: 1000,
      },
    }

    return planLimits[this.plan] || defaultLimits
  }

  getConfiguration(): {
    defaultSessionDuration?: number
    autoRecordSessions?: boolean
    attendanceTrackingEnabled?: boolean
    parentAccessEnabled?: boolean
    securitySettings?: {
      twoFactorAuth?: boolean
      sessionTimeout?: number
      ipWhitelist?: string[]
    }
  } {
    return this.metadata?.configuration || {
      defaultSessionDuration: 45,
      autoRecordSessions: false,
      attendanceTrackingEnabled: true,
      parentAccessEnabled: false,
      securitySettings: {
        twoFactorAuth: false,
        sessionTimeout: 60,
        ipWhitelist: [],
      },
    }
  }

  canCreateClassroom(): boolean {
    const limits = this.getLimits()
    const currentClassroomCount = this.classrooms?.length || 0
    return currentClassroomCount < (limits.maxClassrooms || 10)
  }

  canAddLabDevice(): boolean {
    const limits = this.getLimits()
    const currentDeviceCount = this.labDeviceAgents?.length || 0
    return currentDeviceCount < (limits.maxLabDevices || 20)
  }

  canAddStudentToClassroom(classroomId: string): boolean {
    const limits = this.getLimits()
    const classroom = this.classrooms?.find(c => c.id === classroomId)
    if (!classroom) return false

    const currentStudents = classroom.studentCount
    return currentStudents < (limits.maxStudentsPerClass || 30)
  }

  hasFeature(feature: string): boolean {
    const features = this.getFeatures()
    return features[feature as keyof typeof features] === true
  }

  getClassroomStats(): {
    total: number
    active: number
    archived: number
  } {
    const classrooms = this.classrooms || []
    return {
      total: classrooms.length,
      active: classrooms.filter(c => c.isActive).length,
      archived: classrooms.filter(c => c.isArchived).length,
    }
  }

  getLabDeviceStats(): {
    total: number
    active: number
    offline: number
    online: number
  } {
    const agents = this.labDeviceAgents || []
    return {
      total: agents.length,
      active: agents.filter(a => a.isActive).length,
      offline: agents.filter(a => a.isOffline).length,
      online: agents.filter(a => a.isOnline).length,
    }
  }

  getStorageUsage(): {
    allocated: number // GB
    used: number // GB
    available: number // GB
    percentage: number
  } {
    const limits = this.getLimits()
    const allocated = limits.storageGB || 10
    // 这里应该计算实际使用量，暂时返回模拟数据
    const used = Math.floor(allocated * 0.3) // 模拟30%使用率
    const available = allocated - used
    const percentage = (used / allocated) * 100

    return { allocated, used, available, percentage }
  }

  getFeatureSummary(): string[] {
    const features = []
    const featureMap = {
      virtualLab: '虚拟实验室',
      aiAssistant: 'AI助手',
      analytics: '数据分析',
      realTimeCollaboration: '实时协作',
    }

    Object.entries(this.getFeatures()).forEach(([key, enabled]) => {
      if (enabled) {
        features.push(featureMap[key as keyof typeof featureMap] || key)
      }
    })

    return features
  }

  getPlanDisplay(): string {
    const planMap: Record<TenantPlan, string> = {
      [TenantPlan.BASIC]: '基础版',
      [TenantPlan.PRO]: '专业版',
      [TenantPlan.ENTERPRISE]: '企业版',
    }
    return planMap[this.plan] || this.plan
  }

  getUsageSummary(): {
    classrooms: any
    labDevices: any
    storage: any
    sessions: {
      today: number
      thisWeek: number
      thisMonth: number
    }
  } {
    return {
      classrooms: this.getClassroomStats(),
      labDevices: this.getLabDeviceStats(),
      storage: this.getStorageUsage(),
      sessions: {
        today: 0, // 需要从session表查询
        thisWeek: 0,
        thisMonth: 0,
      },
    }
  }

  updateMetadata(updates: Partial<typeof this.metadata>): void {
    this.metadata = {
      ...this.metadata,
      ...updates,
    }
  }

  updateBranding(branding: Partial<typeof this.metadata.branding>): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.branding) {
      this.metadata.branding = {}
    }
    this.metadata.branding = {
      ...this.metadata.branding,
      ...branding,
    }
  }

  updateFeatures(features: Partial<typeof this.metadata.features>): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.features) {
      this.metadata.features = {}
    }
    this.metadata.features = {
      ...this.metadata.features,
      ...features,
    }
  }

  updateLimits(limits: Partial<typeof this.metadata.limits>): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.limits) {
      this.metadata.limits = {}
    }
    this.metadata.limits = {
      ...this.metadata.limits,
      ...limits,
    }
  }

  updateConfiguration(config: Partial<typeof this.metadata.configuration>): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.configuration) {
      this.metadata.configuration = {}
    }
    this.metadata.configuration = {
      ...this.metadata.configuration,
      ...config,
    }
  }

  isNearLimit(resource: string): boolean {
    const limits = this.getLimits()
    const usage = {
      classrooms: this.classrooms?.length || 0,
      labDevices: this.labDeviceAgents?.length || 0,
      storage: this.getStorageUsage().percentage,
    }

    const threshold = 0.9 // 90%阈值
    const limit = limits[resource as keyof typeof limits] || 0

    if (resource === 'storage') {
      return usage.storage >= threshold * 100
    }

    return usage[resource as keyof typeof usage] >= threshold * limit
  }

  getUpgradeRecommendations(): string[] {
    const recommendations = []
    const usage = this.getUsageSummary()

    if (usage.classrooms.active >= usage.classrooms.total * 0.8) {
      recommendations.push('班级数量接近上限，建议升级计划')
    }

    if (usage.labDevices.active >= usage.labDevices.total * 0.8) {
      recommendations.push('实验设备数量接近上限，建议升级计划')
    }

    if (usage.storage.percentage >= 80) {
      recommendations.push('存储空间使用率超过80%，建议升级计划或清理数据')
    }

    if (!this.hasFeature('virtualLab') && usage.labDevices.total > 0) {
      recommendations.push('建议启用虚拟实验室功能以更好地管理实验设备')
    }

    if (!this.hasFeature('analytics') && usage.classrooms.total > 10) {
      recommendations.push('建议启用数据分析功能以获得更深入的洞察')
    }

    return recommendations
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const issues = this.getUpgradeRecommendations()

    if (issues.length === 0) return 'healthy'
    if (issues.length <= 2) return 'warning'
    return 'critical'
  }
}