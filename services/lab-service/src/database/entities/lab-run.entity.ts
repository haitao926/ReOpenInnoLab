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
import { IsEnum, IsOptional, IsUUID, IsString, IsObject, IsNumber } from 'class-validator'

import { LabTemplate } from './lab-template.entity'
import { LabArtifact } from './lab-artifact.entity'

export enum RunStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum RunMode {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  COLLABORATIVE = 'collaborative',
  DEMONSTRATION = 'demonstration',
  ASSESSMENT = 'assessment',
}

export enum ExecutionMode {
  LOCAL = 'local',
  CLOUD = 'cloud',
  HYBRID = 'hybrid',
  OFFLINE = 'offline',
}

export enum GradingStatus {
  NOT_GRADED = 'not_graded',
  PENDING_GRADING = 'pending_grading',
  GRADING_IN_PROGRESS = 'grading_in_progress',
  GRADED = 'graded',
  GRADE_FAILED = 'grade_failed',
}

@Entity('lab_runs')
@Index(['tenantId'])
@Index(['templateId'])
@Index(['studentId'])
@Index(['classroomId'])
@Index(['status'])
@Index(['runMode'])
@Index(['startedAt'])
@Index(['completedAt'])
export class LabRun {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @IsUUID()
  tenantId: string

  @Column({ type: 'uuid', name: 'template_id' })
  @IsUUID()
  templateId: string

  @Column({ type: 'uuid', name: 'student_id' })
  @IsUUID()
  studentId: string

  @Column({ type: 'uuid', nullable: true, name: 'classroom_id' })
  @IsOptional()
  @IsUUID()
  classroomId?: string

  @Column({ type: 'uuid', nullable: true, name: 'course_activity_id' })
  @IsOptional()
  @IsUUID()
  courseActivityId?: string

  @Column({ type: 'uuid', nullable: true, name: 'assignment_id' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'session_code' })
  @IsOptional()
  @IsString()
  sessionCode?: string

  @Column({
    type: 'enum',
    enum: RunStatus,
    default: RunStatus.INITIALIZING,
  })
  @IsEnum(RunStatus)
  status: RunStatus

  @Column({
    type: 'enum',
    enum: RunMode,
    default: RunMode.INDIVIDUAL,
  })
  @IsEnum(RunMode)
  runMode: RunMode

  @Column({
    type: 'enum',
    enum: ExecutionMode,
    default: ExecutionMode.LOCAL,
  })
  @IsEnum(ExecutionMode)
  executionMode: ExecutionMode

  @Column({
    type: 'enum',
    enum: GradingStatus,
    default: GradingStatus.NOT_GRADED,
  })
  @IsEnum(GradingStatus)
  gradingStatus: GradingStatus

  @Column({ type: 'varchar', length: 64, name: 'template_checksum' })
  @IsString()
  templateChecksum: string

  @Column({ type: 'jsonb', name: 'environment_config', nullable: true })
  @IsOptional()
  @IsObject()
  environmentConfig?: {
    kernel?: string
    memoryLimit?: string
    cpuLimit?: string
    timeLimit?: number // minutes
    diskSpace?: string
    networkEnabled?: boolean
    allowedDomains?: string[]
    packages?: Array<{
      name: string
      version?: string
      source?: string
    }>
    environmentVariables?: Record<string, string>
    startupCommands?: string[]
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'session_info', nullable: true })
  @IsOptional()
  @IsObject()
  sessionInfo?: {
    agentId?: string
    agentSessionId?: string
    jupyterUrl?: string
    jupyterToken?: string
    port?: number
    kernelId?: string
    workingDirectory?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  @IsOptional()
  startedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  @IsOptional()
  completedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'last_activity_at' })
  @IsOptional()
  lastActivityAt?: Date

  @Column({ type: 'integer', nullable: true, name: 'time_spent_sec' })
  @IsOptional()
  @IsNumber()
  timeSpentSec?: number

  @Column({ type: 'integer', nullable: true, name: 'attempts_count' })
  @IsOptional()
  @IsNumber()
  attemptsCount?: number

  @Column({ type: 'integer', nullable: true, name: 'max_attempts' })
  @IsOptional()
  @IsNumber()
  maxAttempts?: number

  @Column({ type: 'jsonb', name: 'progress', nullable: true })
  @IsOptional()
  @IsObject()
  progress?: {
    totalCells?: number
    completedCells?: number
    currentCell?: number
    percentage?: number
    lastCheckpoint?: string
    milestones?: Array<{
      name: string
      completedAt?: Date
      skipped?: boolean
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'execution_state', nullable: true })
  @IsOptional()
  @IsObject()
  executionState?: {
    currentStep?: string
    totalSteps?: number
    completedSteps?: number
    errorsCount?: number
    warningsCount?: number
    outputsCount?: number
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'collaboration', nullable: true })
  @IsOptional()
  @IsObject()
  collaboration?: {
    groupId?: string
    groupMembers?: string[]
    role?: 'leader' | 'member' | 'observer'
    sharedNotebook?: boolean
    realTimeSync?: boolean
    chatEnabled?: boolean
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'grading_info', nullable: true })
  @IsOptional()
  @IsObject()
  gradingInfo?: {
    score?: number
    maxScore?: number
    percentage?: number
    gradedBy?: string
    gradedAt?: Date
    feedback?: string
    rubricScores?: Record<string, number>
    autoGradingResults?: {
      passed: number
      failed: number
      total: number
      details?: Array<{
        test: string
        passed: boolean
        score: number
        feedback?: string
      }>
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'performance_metrics', nullable: true })
  @IsOptional()
  @IsObject()
  performanceMetrics?: {
    startupTime?: number // milliseconds
    totalExecutionTime?: number // milliseconds
    cellExecutionTimes?: Array<{
      cellIndex: number
      executionTime: number
      memoryPeak: number
    }>
    memoryUsage?: {
      peak: number
      average: number
      final: number
    }
    cpuUsage?: {
      peak: number
      average: number
    }
    errors?: Array<{
      type: string
      message: string
      timestamp: Date
      cellIndex?: number
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'security_events', nullable: true })
  @IsOptional()
  @IsObject()
  securityEvents?: {
    blockedOperations?: Array<{
      operation: string
      reason: string
      timestamp: Date
      severity: 'low' | 'medium' | 'high'
    }>
    suspiciousCode?: Array<{
      code: string
      location: string
      risk: 'low' | 'medium' | 'high'
      reason: string
      timestamp: Date
    }>
    networkAccess?: Array<{
      domain: string
      allowed: boolean
      timestamp: Date
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'interaction_data', nullable: true })
  @IsOptional()
  @IsObject()
  interactionData?: {
    cellExecutions?: number
    inputChanges?: number
    outputViews?: number
    helpRequests?: number
    hintViews?: number
    solutionViews?: number
    timePerCell?: Array<{
      cellIndex: number
      timeSpent: number
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'backup_info', nullable: true })
  @IsOptional()
  @IsObject()
  backupInfo?: {
    lastBackupAt?: Date
    backupLocation?: string
    backupSize?: number
    backupCount?: number
    autoBackup?: boolean
    restorePoints?: Array<{
      timestamp: Date
      description: string
      location: string
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'custom_data', nullable: true })
  @IsOptional()
  @IsObject()
  customData?: Record<string, any>

  // Relationships
  @ManyToOne(() => LabTemplate, { nullable: false })
  @JoinColumn({ name: 'template_id' })
  template: LabTemplate

  @OneToMany(() => LabArtifact, (artifact) => artifact.run)
  artifacts: LabArtifact[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isInitializing(): boolean {
    return this.status === RunStatus.INITIALIZING
  }

  get isReady(): boolean {
    return this.status === RunStatus.READY
  }

  get isRunning(): boolean {
    return this.status === RunStatus.RUNNING
  }

  get isPaused(): boolean {
    return this.status === RunStatus.PAUSED
  }

  get isCompleted(): boolean {
    return this.status === RunStatus.COMPLETED
  }

  get isFailed(): boolean {
    return [RunStatus.FAILED, RunStatus.TIMEOUT].includes(this.status)
  }

  get isCancelled(): boolean {
    return this.status === RunStatus.CANCELLED
  }

  get isActive(): boolean {
    return [RunStatus.READY, RunStatus.RUNNING, RunStatus.PAUSED].includes(this.status)
  }

  get canBeGraded(): boolean {
    return this.isCompleted && this.gradingStatus !== GradingStatus.GRADED
  }

  get isOverdue(): boolean {
    if (!this.startedAt || this.isCompleted) return false
    const maxDuration = (this.environmentConfig?.timeLimit || 120) * 60 * 1000 // Convert to milliseconds
    return Date.now() - this.startedAt.getTime() > maxDuration
  }

  // Helper methods
  getStatusDisplay(): string {
    const statusMap: Record<RunStatus, string> = {
      [RunStatus.INITIALIZING]: '初始化中',
      [RunStatus.READY]: '就绪',
      [RunStatus.RUNNING]: '运行中',
      [RunStatus.PAUSED]: '已暂停',
      [RunStatus.COMPLETED]: '已完成',
      [RunStatus.FAILED]: '失败',
      [RunStatus.CANCELLED]: '已取消',
      [RunStatus.TIMEOUT]: '超时',
    }
    return statusMap[this.status] || this.status
  }

  getModeDisplay(): string {
    const modeMap: Record<RunMode, string> = {
      [RunMode.INDIVIDUAL]: '个人',
      [RunMode.GROUP]: '小组',
      [RunMode.COLLABORATIVE]: '协作',
      [RunMode.DEMONSTRATION]: '演示',
      [RunMode.ASSESSMENT]: '考核',
    }
    return modeMap[this.runMode] || this.runMode
  }

  getExecutionModeDisplay(): string {
    const modeMap: Record<ExecutionMode, string> = {
      [ExecutionMode.LOCAL]: '本地',
      [ExecutionMode.CLOUD]: '云端',
      [ExecutionMode.HYBRID]: '混合',
      [ExecutionMode.OFFLINE]: '离线',
    }
    return modeMap[this.executionMode] || this.executionMode
  }

  getGradingStatusDisplay(): string {
    const statusMap: Record<GradingStatus, string> = {
      [GradingStatus.NOT_GRADED]: '未评分',
      [GradingStatus.PENDING_GRADING]: '待评分',
      [GradingStatus.GRADING_IN_PROGRESS]: '评分中',
      [GradingStatus.GRADED]: '已评分',
      [GradingStatus.GRADE_FAILED]: '评分失败',
    }
    return statusMap[this.gradingStatus] || this.gradingStatus
  }

  getDuration(): number | null {
    if (!this.startedAt) return null
    const endTime = this.completedAt || new Date()
    return endTime.getTime() - this.startedAt.getTime()
  }

  getDurationDisplay(): string {
    const duration = this.getDuration()
    if (!duration) return '未开始'

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

  getTimeSpentDisplay(): string {
    if (!this.timeSpentSec) return '无记录'

    const hours = Math.floor(this.timeSpentSec / 3600)
    const minutes = Math.floor((this.timeSpentSec % 3600) / 60)
    const seconds = this.timeSpentSec % 60

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
    }
    if (minutes > 0) {
      return `${minutes}分钟${seconds > 0 ? `${seconds}秒` : ''}`
    }
    return `${seconds}秒`
  }

  getProgressPercentage(): number {
    return this.progress?.percentage || 0
  }

  getScore(): number | null {
    return this.gradingInfo?.score || null
  }

  getScoreDisplay(): string {
    const score = this.getScore()
    if (score === null) return '未评分'

    const maxScore = this.gradingInfo?.maxScore || 100
    return `${score}/${maxScore}`
  }

  start(): void {
    this.status = RunStatus.RUNNING
    this.startedAt = new Date()
    this.lastActivityAt = new Date()
  }

  pause(): void {
    this.status = RunStatus.PAUSED
    this.lastActivityAt = new Date()
  }

  resume(): void {
    this.status = RunStatus.RUNNING
    this.lastActivityAt = new Date()
  }

  complete(): void {
    this.status = RunStatus.COMPLETED
    this.completedAt = new Date()
    this.lastActivityAt = new Date()

    if (this.startedAt) {
      this.timeSpentSec = Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / 1000)
    }
  }

  cancel(reason?: string): void {
    this.status = RunStatus.CANCELLED
    this.completedAt = new Date()
    this.lastActivityAt = new Date()

    if (reason) {
      if (!this.customData) this.customData = {}
      this.customData.cancelReason = reason
    }
  }

  fail(error?: string): void {
    this.status = RunStatus.FAILED
    this.completedAt = new Date()
    this.lastActivityAt = new Date()

    if (error) {
      if (!this.customData) this.customData = {}
      this.customData.failureReason = error
    }
  }

  timeout(): void {
    this.status = RunStatus.TIMEOUT
    this.completedAt = new Date()
    this.lastActivityAt = new Date()
  }

  updateProgress(percentage: number, details?: any): void {
    if (!this.progress) {
      this.progress = {}
    }

    this.progress.percentage = Math.min(100, Math.max(0, percentage))
    this.lastActivityAt = new Date()

    if (details) {
      this.progress = { ...this.progress, ...details }
    }
  }

  recordCellExecution(cellIndex: number, executionTime: number, memoryPeak: number): void {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {}
    }
    if (!this.performanceMetrics.cellExecutionTimes) {
      this.performanceMetrics.cellExecutionTimes = []
    }

    this.performanceMetrics.cellExecutionTimes.push({
      cellIndex,
      executionTime,
      memoryPeak,
    })

    this.lastActivityAt = new Date()
  }

  recordError(error: any, cellIndex?: number): void {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {}
    }
    if (!this.performanceMetrics.errors) {
      this.performanceMetrics.errors = []
    }

    this.performanceMetrics.errors.push({
      type: error.type || 'unknown',
      message: error.message || 'Unknown error',
      timestamp: new Date(),
      cellIndex,
    })

    this.lastActivityAt = new Date()
  }

  recordSecurityEvent(event: {
    type: string
    details: any
    severity: 'low' | 'medium' | 'high'
  }): void {
    if (!this.securityEvents) {
      this.securityEvents = {}
    }

    const eventMap = {
      blocked_operation: 'blockedOperations',
      suspicious_code: 'suspiciousCode',
      network_access: 'networkAccess',
    }

    const key = eventMap[event.type as keyof typeof eventMap]
    if (key && this.securityEvents[key]) {
      this.securityEvents[key].push({
        ...event.details,
        timestamp: new Date(),
        severity: event.severity,
      })
    }

    this.lastActivityAt = new Date()
  }

  grade(score: number, maxScore: number, gradedBy: string, feedback?: string): void {
    this.gradingStatus = GradingStatus.GRADED

    if (!this.gradingInfo) {
      this.gradingInfo = {}
    }

    this.gradingInfo.score = score
    this.gradingInfo.maxScore = maxScore
    this.gradingInfo.percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
    this.gradingInfo.gradedBy = gradedBy
    this.gradingInfo.gradedAt = new Date()
    if (feedback) {
      this.gradingInfo.feedback = feedback
    }
  }

  canBeAttempted(): boolean {
    if (!this.maxAttempts) return true
    const currentAttempts = this.attemptsCount || 0
    return currentAttempts < this.maxAttempts
  }

  incrementAttempts(): void {
    this.attemptsCount = (this.attemptsCount || 0) + 1
  }

  hasJupyterSession(): boolean {
    return !!(this.sessionInfo?.jupyterUrl && this.sessionInfo?.jupyterToken)
  }

  getJupyterUrl(): string | null {
    if (!this.hasJupyterSession()) return null

    const { jupyterUrl, jupyterToken } = this.sessionInfo!
    return `${jupyterUrl}/?token=${jupyterToken}`
  }

  isCollaborative(): boolean {
    return [RunMode.GROUP, RunMode.COLLABORATIVE].includes(this.runMode)
  }

  getSecurityRiskLevel(): 'low' | 'medium' | 'high' {
    if (!this.securityEvents) return 'low'

    const events = [
      ...(this.securityEvents.blockedOperations || []),
      ...(this.securityEvents.suspiciousCode || []),
    ]

    const highSeverityCount = events.filter(e => e.severity === 'high').length
    const mediumSeverityCount = events.filter(e => e.severity === 'medium').length

    if (highSeverityCount > 0) return 'high'
    if (mediumSeverityCount > 2) return 'high'
    if (mediumSeverityCount > 0) return 'medium'

    return 'low'
  }

  toJSON(): any {
    return {
      id: this.id,
      tenantId: this.tenantId,
      templateId: this.templateId,
      studentId: this.studentId,
      classroomId: this.classroomId,
      courseActivityId: this.courseActivityId,
      assignmentId: this.assignmentId,
      sessionCode: this.sessionCode,
      status: this.status,
      statusDisplay: this.getStatusDisplay(),
      runMode: this.runMode,
      modeDisplay: this.getModeDisplay(),
      executionMode: this.executionMode,
      executionModeDisplay: this.getExecutionModeDisplay(),
      gradingStatus: this.gradingStatus,
      gradingStatusDisplay: this.getGradingStatusDisplay(),
      templateChecksum: this.templateChecksum,
      environmentConfig: this.environmentConfig,
      sessionInfo: this.sessionInfo,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      lastActivityAt: this.lastActivityAt,
      timeSpentSec: this.timeSpentSec,
      timeSpentDisplay: this.getTimeSpentDisplay(),
      attemptsCount: this.attemptsCount,
      maxAttempts: this.maxAttempts,
      progress: this.progress,
      progressPercentage: this.getProgressPercentage(),
      executionState: this.executionState,
      collaboration: this.collaboration,
      gradingInfo: this.gradingInfo,
      score: this.getScore(),
      scoreDisplay: this.getScoreDisplay(),
      performanceMetrics: this.performanceMetrics,
      securityEvents: this.securityEvents,
      interactionData: this.interactionData,
      backupInfo: this.backupInfo,
      customData: this.customData,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}