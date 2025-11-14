import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { LabDeviceAgent } from './lab-device-agent.entity'
import { LabAgentEvent } from './lab-agent-event.entity'

export enum SessionStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum SessionType {
  NOTEBOOK = 'notebook',
  TERMINAL = 'terminal',
  PYTHON_SCRIPT = 'python_script',
  R_SCRIPT = 'r_script',
  JUPYTER_LAB = 'jupyter_lab',
  CUSTOM = 'custom',
}

@Entity('lab_agent_sessions')
@Index(['agentId'])
@Index(['labRunId'])
@Index(['status'])
@Index(['startedAt'])
@Index(['endedAt'])
export class LabAgentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'agent_id' })
  @IsUUID()
  agentId: string

  @Column({ type: 'uuid', nullable: true, name: 'lab_run_id' })
  @IsOptional()
  @IsUUID()
  labRunId?: string

  @Column({ type: 'varchar', length: 64, name: 'notebook_checksum' })
  notebookChecksum: string

  @Column({ type: 'jsonb', name: 'package_manifest', nullable: true })
  @IsOptional()
  packageManifest?: {
    required: Array<{
      name: string
      version: string
      source: string
    }>
    installed: Array<{
      name: string
      version: string
      installTime: Date
      size: number
    }>
    failed: Array<{
      name: string
      version: string
      error: string
    }>
    environment?: {
      python?: string
      conda?: string
      node?: string
      r?: string
      julia?: string
    }
    custom?: Record<string, any>
  }

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.STARTING,
  })
  @IsEnum(SessionStatus)
  status: SessionStatus

  @Column({
    type: 'enum',
    enum: SessionType,
    default: SessionType.NOTEBOOK,
  })
  @IsEnum(SessionType)
  type: SessionType

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date

  @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
  @IsOptional()
  endedAt?: Date

  @Column({ type: 'integer', nullable: true, name: 'exit_code' })
  @IsOptional()
  exitCode?: number

  @Column({ type: 'text', nullable: true, name: 'exit_message' })
  @IsOptional()
  exitMessage?: string

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'working_directory' })
  @IsOptional()
  workingDirectory?: string

  @Column({ type: 'jsonb', name: 'session_config', nullable: true })
  @IsOptional()
  sessionConfig?: {
    kernel?: string
    memoryLimit?: string
    cpuLimit?: string
    timeLimit?: number // 分钟
    allowedImports?: string[]
    blockedImports?: string[]
    environmentVariables?: Record<string, string>
    startupCommands?: string[]
    shutdownCommands?: string[]
    autoSave?: boolean
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'runtime_info', nullable: true })
  @IsOptional()
  runtimeInfo?: {
    processId?: number
    port?: number
    token?: string
    url?: string
    kernelId?: string
    jupyterVersion?: string
    pythonVersion?: string
    ipywidgets?: string[]
    extensions?: string[]
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'performance_metrics', nullable: true })
  @IsOptional()
  performanceMetrics?: {
    startupTime?: number // 毫秒
    executionTime?: number // 毫秒
    memoryPeak?: number // MB
    cpuUsage?: number // 百分比
    cellExecutions?: number
    errors?: number
    warnings?: number
    outputSize?: number // 字节
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'security_info', nullable: true })
  @IsOptional()
  securityInfo?: {
    codeAnalysis?: {
      riskyImports?: string[]
      suspiciousCode?: Array<{
        line: number
        code: string
        risk: 'low' | 'medium' | 'high'
        reason: string
      }>
    }
    blockedOperations?: Array<{
      operation: string
      reason: string
      timestamp: Date
    }>
    sandboxViolations?: Array<{
      violation: string
      severity: 'low' | 'medium' | 'high'
      timestamp: Date
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'offline_cache_path' })
  @IsOptional()
  offlineCachePath?: string

  @Column({ type: 'jsonb', name: 'error_details', nullable: true })
  @IsOptional()
  errorDetails?: {
    type?: string
    message?: string
    stackTrace?: string
    timestamp?: Date
    context?: Record<string, any>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'session_metadata', default: '{}' })
  @IsOptional()
  sessionMetadata?: {
    studentId?: string
    classroomId?: string
    courseActivityId?: string
    assignmentId?: string
    tags?: string[]
    notes?: string
    custom?: Record<string, any>
  }

  // Relationships
  @ManyToOne(() => LabDeviceAgent, { nullable: false })
  @JoinColumn({ name: 'agent_id' })
  agent: LabDeviceAgent

  @OneToMany(() => LabAgentEvent, (event) => event.session)
  events: LabAgentEvent[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isRunning(): boolean {
    return this.status === SessionStatus.RUNNING
  }

  get isCompleted(): boolean {
    return this.status === SessionStatus.COMPLETED
  }

  get isFailed(): boolean {
    return [SessionStatus.FAILED, SessionStatus.TIMEOUT].includes(this.status)
  }

  get isCancelled(): boolean {
    return this.status === SessionStatus.CANCELLED
  }

  get isStarting(): boolean {
    return this.status === SessionStatus.STARTING
  }

  // Helper methods
  getStatusDisplay(): string {
    const statusMap: Record<SessionStatus, string> = {
      [SessionStatus.STARTING]: '启动中',
      [SessionStatus.RUNNING]: '运行中',
      [SessionStatus.COMPLETED]: '已完成',
      [SessionStatus.FAILED]: '失败',
      [SessionStatus.CANCELLED]: '已取消',
      [SessionStatus.TIMEOUT]: '超时',
    }
    return statusMap[this.status] || this.status
  }

  getTypeDisplay(): string {
    const typeMap: Record<SessionType, string> = {
      [SessionType.NOTEBOOK]: 'Jupyter Notebook',
      [SessionType.TERMINAL]: '终端',
      [SessionType.PYTHON_SCRIPT]: 'Python 脚本',
      [SessionType.R_SCRIPT]: 'R 脚本',
      [SessionType.JUPYTER_LAB]: 'JupyterLab',
      [SessionType.CUSTOM]: '自定义',
    }
    return typeMap[this.type] || this.type
  }

  getDuration(): number | null {
    if (!this.endedAt) return null
    return this.endedAt.getTime() - this.startedAt.getTime()
  }

  getDurationDisplay(): string {
    const duration = this.getDuration()
    if (!duration) return '运行中'

    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}小时${minutes % 60 > 0 ? `${minutes % 60}分钟` : ''}`
    }
    if (minutes > 0) {
      return `${minutes}分钟${seconds % 60 > 0 ? `${seconds % 60}秒` : ''}`
    }
    return `${seconds}秒`
  }

  getStartTimeDisplay(): string {
    return new Date(this.startedAt).toLocaleString('zh-CN')
  }

  getEndTimeDisplay(): string {
    if (!this.endedAt) return '运行中'
    return new Date(this.endedAt).toLocaleString('zh-CN')
  }

  getExitStatus(): string {
    if (!this.endedAt) return '运行中'
    if (this.exitCode === 0) return '正常退出'
    if (this.exitCode && this.exitCode > 0) return `异常退出 (${this.exitCode})`
    return this.exitMessage || '未知状态'
  }

  getPerformanceSummary(): {
    startupTime?: number
    executionTime?: number
    memoryPeak?: number
    cellExecutions?: number
    errors?: number
  } {
    const metrics = this.performanceMetrics || {}
    return {
      startupTime: metrics.startupTime,
      executionTime: metrics.executionTime,
      memoryPeak: metrics.memoryPeak,
      cellExecutions: metrics.cellExecutions,
      errors: metrics.errors,
    }
  }

  getSecuritySummary(): {
    hasRiskyImports: boolean
    hasSuspiciousCode: boolean
    blockedOperations: number
    sandboxViolations: number
  } {
    const security = this.securityInfo || {}
    const riskyImports = security.codeAnalysis?.riskyImports || []
    const suspiciousCode = security.codeAnalysis?.suspiciousCode || []
    const blockedOps = security.blockedOperations || []
    const violations = security.sandboxViolations || []

    return {
      hasRiskyImports: riskyImports.length > 0,
      hasSuspiciousCode: suspiciousCode.length > 0,
      blockedOperations: blockedOps.length,
      sandboxViolations: violations.length,
    }
  }

  getPackageStatus(): {
    requiredCount: number
    installedCount: number
    failedCount: number
    successRate: number
  } {
    const manifest = this.packageManifest || {}
    const required = manifest.required || []
    const installed = manifest.installed || []
    const failed = manifest.failed || []

    return {
      requiredCount: required.length,
      installedCount: installed.length,
      failedCount: failed.length,
      successRate: required.length > 0 ? (installed.length / required.length) * 100 : 100,
    }
  }

  getJupyterInfo(): {
    url?: string
    token?: string
    kernel?: string
    port?: number
    version?: string
  } {
    const runtime = this.runtimeInfo || {}
    return {
      url: runtime.url,
      token: runtime.token,
      kernel: runtime.kernelId,
      port: runtime.port,
      version: runtime.jupyterVersion,
    }
  }

  hasJupyterServer(): boolean {
    return !!(this.runtimeInfo?.url && this.runtimeInfo?.token)
  }

  isJupyterAccessible(): boolean {
    return this.hasJupyterServer() && this.isRunning
  }

  completeSession(exitCode?: number, message?: string): void {
    this.status = exitCode === 0 ? SessionStatus.COMPLETED : SessionStatus.FAILED
    this.endedAt = new Date()
    this.exitCode = exitCode
    this.exitMessage = message
  }

  cancelSession(reason?: string): void {
    this.status = SessionStatus.CANCELLED
    this.endedAt = new Date()
    this.exitMessage = reason
  }

  timeoutSession(): void {
    this.status = SessionStatus.TIMEOUT
    this.endedAt = new Date()
    this.exitMessage = 'Session timed out'
  }

  updateRuntimeInfo(info: Partial<typeof this.runtimeInfo>): void {
    this.runtimeInfo = {
      ...this.runtimeInfo,
      ...info,
    }
  }

  updatePerformanceMetrics(metrics: Partial<typeof this.performanceMetrics>): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      ...metrics,
    }
  }

  recordCellExecution(): void {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {}
    }
    this.performanceMetrics.cellExecutions = (this.performanceMetrics.cellExecutions || 0) + 1
  }

  recordError(): void {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {}
    }
    this.performanceMetrics.errors = (this.performanceMetrics.errors || 0) + 1
  }

  addSecurityEvent(event: {
    type: 'risky_import' | 'suspicious_code' | 'blocked_operation' | 'sandbox_violation'
    details: any
  }): void {
    if (!this.securityInfo) {
      this.securityInfo = {}
    }

    switch (event.type) {
      case 'risky_import':
        if (!this.securityInfo.codeAnalysis) {
          this.securityInfo.codeAnalysis = {}
        }
        if (!this.securityInfo.codeAnalysis.riskyImports) {
          this.securityInfo.codeAnalysis.riskyImports = []
        }
        this.securityInfo.codeAnalysis.riskyImports.push(event.details)
        break

      case 'suspicious_code':
        if (!this.securityInfo.codeAnalysis) {
          this.securityInfo.codeAnalysis = {}
        }
        if (!this.securityInfo.codeAnalysis.suspiciousCode) {
          this.securityInfo.codeAnalysis.suspiciousCode = []
        }
        this.securityInfo.codeAnalysis.suspiciousCode.push(event.details)
        break

      case 'blocked_operation':
        if (!this.securityInfo.blockedOperations) {
          this.securityInfo.blockedOperations = []
        }
        this.securityInfo.blockedOperations.push({
          operation: event.details.operation,
          reason: event.details.reason,
          timestamp: new Date(),
        })
        break

      case 'sandbox_violation':
        if (!this.securityInfo.sandboxViolations) {
          this.securityInfo.sandboxViolations = []
        }
        this.securityInfo.sandboxViolations.push({
          violation: event.details.violation,
          severity: event.details.severity,
          timestamp: new Date(),
        })
        break
    }
  }

  isSessionValid(): boolean {
    // 检查会话是否有效
    if (!this.startedAt) return false
    if (this.isFailed || this.isCancelled) return false

    const now = new Date()
    const maxDuration = 24 * 60 * 60 * 1000 // 24小时
    const duration = now.getTime() - this.startedAt.getTime()

    return duration < maxDuration
  }

  requiresAttention(): boolean {
    return this.isFailed || this.getSecuritySummary().hasRiskyImports || this.getPackageStatus().successRate < 100
  }

  getDiagnosticInfo(): {
    sessionId: string
    status: string
    duration: string
    type: string
    performance: any
    security: any
    packages: any
    jupyter: any
  } {
    return {
      sessionId: this.id,
      status: this.getStatusDisplay(),
      duration: this.getDurationDisplay(),
      type: this.getTypeDisplay(),
      performance: this.getPerformanceSummary(),
      security: this.getSecuritySummary(),
      packages: this.getPackageStatus(),
      jupyter: this.getJupyterInfo(),
    }
  }
}