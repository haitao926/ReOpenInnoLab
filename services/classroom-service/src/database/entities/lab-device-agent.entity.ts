import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { Classroom } from './classroom.entity'
import { LabAgentSession } from './lab-agent-session.entity'

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  BLOCKED = 'blocked',
}

export enum TrustLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  UNKNOWN = 'unknown',
}

export enum AgentVersion {
  V1_0 = '1.0.0',
  V1_1 = '1.1.0',
  V2_0 = '2.0.0',
}

@Entity('lab_device_agents')
@Index(['tenantId'])
@Index(['studentId'])
@Index(['classroomId'])
@Index(['status'])
@Index(['deviceFingerprint'])
export class LabDeviceAgent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @IsUUID()
  tenantId: string

  @Column({ type: 'uuid', nullable: true, name: 'student_id' })
  @IsOptional()
  @IsUUID()
  studentId?: string

  @Column({ type: 'uuid', nullable: true, name: 'classroom_id' })
  @IsOptional()
  @IsUUID()
  classroomId?: string

  @Column({ type: 'varchar', length: 255, name: 'device_fingerprint' })
  deviceFingerprint: string

  @Column({
    type: 'enum',
    enum: AgentVersion,
    name: 'agent_version',
    default: AgentVersion.V1_0,
  })
  @IsEnum(AgentVersion)
  agentVersion: AgentVersion

  @Column({ type: 'jsonb', name: 'os_info', nullable: true })
  @IsOptional()
  osInfo?: {
    platform: string
    arch: string
    version: string
    hostname: string
    uptime?: number
    loadAverage?: number[]
    memory?: {
      total: number
      free: number
      used: number
    }
    cpu?: {
      model: string
      cores: number
      usage: number
    }
    disk?: {
      total: number
      free: number
      used: number
    }
  }

  @Column({ type: 'integer', name: 'jupyter_port', nullable: true })
  @IsOptional()
  jupyterPort?: number

  @Column({
    type: 'enum',
    enum: AgentStatus,
    default: AgentStatus.INACTIVE,
  })
  @IsEnum(AgentStatus)
  status: AgentStatus

  @Column({
    type: 'enum',
    enum: TrustLevel,
    default: TrustLevel.UNKNOWN,
  })
  @IsEnum(TrustLevel)
  trustLevel: TrustLevel

  @Column({ type: 'timestamp', nullable: true, name: 'last_seen_at' })
  @IsOptional()
  lastSeenAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'first_registered_at' })
  @IsOptional()
  firstRegisteredAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'last_heartbeat_at' })
  @IsOptional()
  lastHeartbeatAt?: Date

  @Column({ type: 'integer', name: 'heartbeat_interval_sec', default: 30 })
  @IsOptional()
  heartbeatIntervalSec: number

  @Column({ type: 'jsonb', name: 'capabilities', nullable: true })
  @IsOptional()
  capabilities?: {
    jupyter?: boolean
    docker?: boolean
    kubernetes?: boolean
    gpu?: boolean
    python?: string[]
    r?: string[]
    julia?: string[]
    nodejs?: string[]
    storage?: {
      totalSpace: number
      availableSpace: number
    }
    network?: {
      bandwidth: number
      latency: number
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'security_info', nullable: true })
  @IsOptional()
  securityInfo?: {
    certificateFingerprint?: string
    publicKey?: string
    lastSecurityScan?: Date
    vulnerabilities?: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      detectedAt: Date
    }>
    policies?: {
      allowedPackages: string[]
      blockedPackages: string[]
      networkRestrictions: string[]
      resourceLimits: {
        maxMemory: number
        maxCpu: number
        maxDisk: number
      }
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'configuration', nullable: true })
  @IsOptional()
  configuration?: {
    autoStartJupyter?: boolean
    defaultKernel?: string
    notebookDirectory?: string
    environmentVariables?: Record<string, string>
    startupScripts?: string[]
    shutdownPolicy?: 'immediate' | 'idle_timeout' | 'manual'
    idleTimeoutMinutes?: number
    backupEnabled?: boolean
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'metrics', nullable: true })
  @IsOptional()
  metrics?: {
    totalSessions: number
    totalRuntime: number // 分钟
    averageSessionDuration: number
    uptimePercentage: number
    lastCrashAt?: Date
    crashCount: number
    performance?: {
      averageResponseTime: number
      successRate: number
      errorRate: number
    }
    resourceUsage?: {
      avgCpuUsage: number
      avgMemoryUsage: number
      peakCpuUsage: number
      peakMemoryUsage: number
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'agent_metadata', default: '{}' })
  @IsOptional()
  agentMetadata?: {
    installationId?: string
    registrationSource?: string
    versionHistory?: Array<{
      version: string
      installedAt: Date
      uninstalledAt?: Date
    }>
    tags?: string[]
    notes?: string
    custom?: Record<string, any>
  }

  // Relationships
  @ManyToOne(() => Classroom, { nullable: true })
  @JoinColumn({ name: 'classroom_id' })
  classroom?: Classroom

  @OneToMany(() => LabAgentSession, (session) => session.agent)
  sessions: LabAgentSession[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isActive(): boolean {
    return this.status === AgentStatus.ACTIVE
  }

  get isOnline(): boolean {
    if (!this.lastSeenAt) return false
    const now = new Date()
    const lastSeen = new Date(this.lastSeenAt)
    const timeout = this.heartbeatIntervalSec * 3 * 1000 // 3倍心跳间隔
    return (now.getTime() - lastSeen.getTime()) < timeout
  }

  get isOffline(): boolean {
    return !this.isOnline
  }

  get needsAttention(): boolean {
    return this.isOffline || this.status === AgentStatus.MAINTENANCE || this.status === AgentStatus.BLOCKED
  }

  get isJupyterReady(): boolean {
    return !!(this.jupyterPort && this.capabilities?.jupyter)
  }

  // Helper methods
  getStatusDisplay(): string {
    const statusMap: Record<AgentStatus, string> = {
      [AgentStatus.ACTIVE]: '活跃',
      [AgentStatus.INACTIVE]: '非活跃',
      [AgentStatus.OFFLINE]: '离线',
      [AgentStatus.MAINTENANCE]: '维护中',
      [AgentStatus.BLOCKED]: '已阻止',
    }
    return statusMap[this.status] || this.status
  }

  getTrustLevelDisplay(): string {
    const trustMap: Record<TrustLevel, string> = {
      [TrustLevel.HIGH]: '高信任',
      [TrustLevel.MEDIUM]: '中等信任',
      [TrustLevel.LOW]: '低信任',
      [TrustLevel.UNKNOWN]: '未知',
    }
    return trustMap[this.trustLevel] || this.trustLevel
  }

  getVersionDisplay(): string {
    return `v${this.agentVersion}`
  }

  getLastSeenDisplay(): string {
    if (!this.lastSeenAt) return '从未连接'
    const lastSeen = new Date(this.lastSeenAt)
    const now = new Date()
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`
    return `${Math.floor(diffMins / 1440)}天前`
  }

  getOperatingSystem(): string {
    if (!this.osInfo) return '未知'
    return `${this.osInfo.platform} ${this.osInfo.arch || ''} ${this.osInfo.version || ''}`.trim()
  }

  getJupyterUrl(): string {
    if (!this.isJupyterReady || !this.osInfo?.hostname) return ''
    const port = this.jupyterPort || 8888
    const hostname = this.osInfo.hostname === 'localhost' ? '127.0.0.1' : this.osInfo.hostname
    return `http://${hostname}:${port}`
  }

  getResourceUsage(): {
    cpu: number
    memory: number
    disk: number
  } {
    const osInfo = this.osInfo || {}
    return {
      cpu: osInfo.cpu?.usage || 0,
      memory: osInfo.memory ? (osInfo.memory.used / osInfo.memory.total) * 100 : 0,
      disk: osInfo.disk ? (osInfo.disk.used / osInfo.disk.total) * 100 : 0,
    }
  }

  getResourceUsageDisplay(): {
    cpu: string
    memory: string
    disk: string
  } {
    const usage = this.getResourceUsage()
    return {
      cpu: `${Math.round(usage.cpu)}%`,
      memory: `${Math.round(usage.memory)}%`,
      disk: `${Math.round(usage.disk)}%`,
    }
  }

  getPerformanceMetrics(): {
    totalSessions: number
    totalRuntime: number
    averageSessionDuration: number
    uptimePercentage: number
  } {
    const metrics = this.metrics || {}
    return {
      totalSessions: metrics.totalSessions || 0,
      totalRuntime: metrics.totalRuntime || 0,
      averageSessionDuration: metrics.averageSessionDuration || 0,
      uptimePercentage: metrics.uptimePercentage || 0,
    }
  }

  updateHeartbeat(): void {
    this.lastSeenAt = new Date()
    this.lastHeartbeatAt = new Date()

    if (this.status === AgentStatus.OFFLINE) {
      this.status = AgentStatus.ACTIVE
    }
  }

  updateStatus(newStatus: AgentStatus): void {
    this.status = newStatus
    this.updatedAt = new Date()
  }

  updateSystemInfo(newOsInfo: Partial<typeof this.osInfo>): void {
    this.osInfo = {
      ...this.osInfo,
      ...newOsInfo,
    }
  }

  updateCapabilities(newCapabilities: Partial<typeof this.capabilities>): void {
    this.capabilities = {
      ...this.capabilities,
      ...newCapabilities,
    }
  }

  recordSession(duration: number): void {
    if (!this.metrics) {
      this.metrics = {}
    }

    this.metrics.totalSessions = (this.metrics.totalSessions || 0) + 1
    this.metrics.totalRuntime = (this.metrics.totalRuntime || 0) + duration

    // 计算平均会话时长
    this.metrics.averageSessionDuration = this.metrics.totalRuntime / this.metrics.totalSessions
  }

  recordCrash(): void {
    if (!this.metrics) {
      this.metrics = {}
    }

    this.metrics.lastCrashAt = new Date()
    this.metrics.crashCount = (this.metrics.crashCount || 0) + 1
  }

  hasCapability(capability: string): boolean {
    if (!this.capabilities) return false
    return this.capabilities[capability as keyof typeof this.capabilities] === true
  }

  getSecurityStatus(): {
    hasVulnerabilities: boolean
    vulnerabilityCount: number
    lastScan?: Date
    certificateValid: boolean
  } {
    const security = this.securityInfo || {}
    const vulnerabilities = security.vulnerabilities || []
    const hasVulnerabilities = vulnerabilities.some(v => v.severity === 'high' || v.severity === 'critical')

    return {
      hasVulnerabilities,
      vulnerabilityCount: vulnerabilities.length,
      lastScan: security.lastSecurityScan,
      certificateValid: !!security.certificateFingerprint,
    }
  }

  canStartJupyter(): boolean {
    return this.isJupyterReady && this.isOnline && this.isActive
  }

  getConfigurationSummary(): {
    autoStartJupyter: boolean
    defaultKernel: string
    idleTimeout: number
    backupEnabled: boolean
  } {
    const config = this.configuration || {}
    return {
      autoStartJupyter: config.autoStartJupyter ?? false,
      defaultKernel: config.defaultKernel || 'python3',
      idleTimeout: config.idleTimeoutMinutes || 30,
      backupEnabled: config.backupEnabled ?? false,
    }
  }

  isCompatibleWith(version: AgentVersion): boolean {
    const currentVersionParts = this.agentVersion.split('.').map(Number)
    const targetVersionParts = version.split('.').map(Number)

    // 主版本必须匹配，次版本不能低于要求
    if (currentVersionParts[0] !== targetVersionParts[0]) return false
    if (currentVersionParts[1] < targetVersionParts[1]) return false

    return true
  }

  getDiagnosticInfo(): {
    agentId: string
    status: string
    lastSeen: string
    version: string
    os: string
    jupyterReady: boolean
    resourceUsage: any
    trustLevel: string
    securityStatus: any
  } {
    return {
      agentId: this.id,
      status: this.getStatusDisplay(),
      lastSeen: this.getLastSeenDisplay(),
      version: this.getVersionDisplay(),
      os: this.getOperatingSystem(),
      jupyterReady: this.isJupyterReady,
      resourceUsage: this.getResourceUsageDisplay(),
      trustLevel: this.getTrustLevelDisplay(),
      securityStatus: this.getSecurityStatus(),
    }
  }
}