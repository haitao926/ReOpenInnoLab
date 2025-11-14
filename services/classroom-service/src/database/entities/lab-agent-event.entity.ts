import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { LabAgentSession } from './lab-agent-session.entity'

export enum EventType {
  HEARTBEAT = 'heartbeat',
  ARTIFACT = 'artifact',
  LOG = 'log',
  SYNC = 'sync',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
  METRIC = 'metric',
  CUSTOM = 'custom',
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('lab_agent_events')
@Index(['agentSessionId'])
@Index(['eventType'])
@Index(['priority'])
@Index(['createdAt'])
export class LabAgentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'agent_session_id' })
  @IsUUID()
  agentSessionId: string

  @Column({
    type: 'enum',
    enum: EventType,
    name: 'event_type',
  })
  @IsEnum(EventType)
  eventType: EventType

  @Column({
    type: 'enum',
    enum: EventPriority,
    default: EventPriority.LOW,
  })
  @IsEnum(EventPriority)
  priority: EventPriority

  @Column({ type: 'jsonb', name: 'payload_json', nullable: true })
  @IsOptional()
  payloadJson?: {
    message?: string
    data?: any
    metadata?: Record<string, any>
    tags?: string[]
    source?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'context_info', nullable: true })
  @IsOptional()
  contextInfo?: {
    agentVersion?: string
    platform?: string
    sessionId?: string
    userId?: string
    requestId?: string
    correlationId?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'integer', name: 'sequence_number', nullable: true })
  @IsOptional()
  sequenceNumber?: number

  @Column({ type: 'timestamp', nullable: true, name: 'client_timestamp' })
  @IsOptional()
  clientTimestamp?: Date

  @Column({ type: 'jsonb', name: 'event_metadata', default: '{}' })
  @IsOptional()
  eventMetadata?: {
    size?: number // 事件大小（字节）
    compressed?: boolean
    encrypted?: boolean
    retryCount?: number
    lastRetryAt?: Date
    ttl?: number // 生存时间（秒）
    custom?: Record<string, any>
  }

  // Relationships
  @ManyToOne(() => LabAgentSession, { nullable: false })
  @JoinColumn({ name: 'agent_session_id' })
  session: LabAgentSession

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  // Virtual fields
  get isHeartbeat(): boolean {
    return this.eventType === EventType.HEARTBEAT
  }

  get isArtifact(): boolean {
    return this.eventType === EventType.ARTIFACT
  }

  get isLog(): boolean {
    return this.eventType === EventType.LOG
  }

  get isSync(): boolean {
    return this.eventType === EventType.SYNC
  }

  get isError(): boolean {
    return this.eventType === EventType.ERROR
  }

  get isWarning(): boolean {
    return this.eventType === EventType.WARNING
  }

  get isHighPriority(): boolean {
    return [EventPriority.HIGH, EventPriority.CRITICAL].includes(this.priority)
  }

  // Helper methods
  getEventTypeDisplay(): string {
    const typeMap: Record<EventType, string> = {
      [EventType.HEARTBEAT]: '心跳',
      [EventType.ARTIFACT]: '成果',
      [EventType.LOG]: '日志',
      [EventType.SYNC]: '同步',
      [EventType.ERROR]: '错误',
      [EventType.WARNING]: '警告',
      [EventType.INFO]: '信息',
      [EventType.DEBUG]: '调试',
      [EventType.METRIC]: '指标',
      [EventType.CUSTOM]: '自定义',
    }
    return typeMap[this.eventType] || this.eventType
  }

  getPriorityDisplay(): string {
    const priorityMap: Record<EventPriority, string> = {
      [EventPriority.LOW]: '低',
      [EventPriority.MEDIUM]: '中',
      [EventPriority.HIGH]: '高',
      [EventPriority.CRITICAL]: '关键',
    }
    return priorityMap[this.priority] || this.priority
  }

  getCreatedDisplay(): string {
    return new Date(this.createdAt).toLocaleString('zh-CN')
  }

  getPayload(): any {
    return this.payloadJson || {}
  }

  getMessage(): string {
    const payload = this.getPayload()
    return payload.message || ''
  }

  getData(): any {
    const payload = this.getPayload()
    return payload.data || null
  }

  getTags(): string[] {
    const payload = this.getPayload()
    return payload.tags || []
  }

  hasTag(tag: string): boolean {
    return this.getTags().includes(tag)
  }

  getContext(): any {
    return this.contextInfo || {}
  }

  getSource(): string {
    const payload = this.getPayload()
    return payload.source || 'unknown'
  }

  getSize(): number {
    return this.eventMetadata?.size || 0
  }

  getSizeDisplay(): string {
    const size = this.getSize()
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`
    return `${Math.round(size / (1024 * 1024))}MB`
  }

  isCompressed(): boolean {
    return this.eventMetadata?.compressed || false
  }

  isEncrypted(): boolean {
    return this.eventMetadata?.encrypted || false
  }

  getRetryCount(): number {
    return this.eventMetadata?.retryCount || 0
  }

  shouldRetry(): boolean {
    const maxRetries = 3
    return this.getRetryCount() < maxRetries
  }

  incrementRetryCount(): void {
    if (!this.eventMetadata) {
      this.eventMetadata = {}
    }
    this.eventMetadata.retryCount = (this.eventMetadata.retryCount || 0) + 1
    this.eventMetadata.lastRetryAt = new Date()
  }

  getTtl(): number {
    return this.eventMetadata?.ttl || 86400 // 默认24小时
  }

  isExpired(): boolean {
    const ttl = this.getTtl() * 1000 // 转换为毫秒
    const age = Date.now() - this.createdAt.getTime()
    return age > ttl
  }

  getTimeSinceCreated(): string {
    const now = Date.now()
    const created = this.createdAt.getTime()
    const diffMs = now - created
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`
    return `${Math.floor(diffMins / 1440)}天前`
  }

  // 心跳事件特定方法
  getHeartbeatInfo(): {
    status: string
    uptime?: number
    memory?: number
    cpu?: number
  } | null {
    if (!this.isHeartbeat) return null

    const data = this.getData()
    return {
      status: data?.status || 'unknown',
      uptime: data?.uptime,
      memory: data?.memory,
      cpu: data?.cpu,
    }
  }

  // 成果事件特定方法
  getArtifactInfo(): {
    type?: string
    path?: string
    size?: number
    checksum?: string
  } | null {
    if (!this.isArtifact) return null

    const data = this.getData()
    return {
      type: data?.type,
      path: data?.path,
      size: data?.size,
      checksum: data?.checksum,
    }
  }

  // 错误事件特定方法
  getErrorInfo(): {
    type?: string
    message?: string
    stackTrace?: string
    code?: number
  } | null {
    if (!this.isError) return null

    const data = this.getData()
    return {
      type: data?.type,
      message: this.getMessage(),
      stackTrace: data?.stackTrace,
      code: data?.code,
    }
  }

  // 日志事件特定方法
  getLogInfo(): {
    level?: string
    message?: string
    module?: string
    function?: string
    line?: number
  } | null {
    if (!this.isLog) return null

    const data = this.getData()
    return {
      level: data?.level,
      message: this.getMessage(),
      module: data?.module,
      function: data?.function,
      line: data?.line,
    }
  }

  // 同步事件特定方法
  getSyncInfo(): {
    type?: string
    files?: Array<{
      path: string
      checksum: string
      size: number
      status: 'pending' | 'completed' | 'failed'
    }>
    totalFiles?: number
    completedFiles?: number
  } | null {
    if (!this.isSync) return null

    const data = this.getData()
    const files = data?.files || []
    return {
      type: data?.type,
      files,
      totalFiles: data?.totalFiles || files.length,
      completedFiles: files.filter(f => f.status === 'completed').length,
    }
  }

  // 指标事件特定方法
  getMetricInfo(): {
    name?: string
    value?: number
    unit?: string
    timestamp?: Date
    tags?: Record<string, string>
  } | null {
    if (!this.isMetric) return null

    const data = this.getData()
    return {
      name: data?.name,
      value: data?.value,
      unit: data?.unit,
      timestamp: data?.timestamp ? new Date(data.timestamp) : this.createdAt,
      tags: data?.tags || {},
    }
  }

  // 搜索和过滤方法
  matchesSearchTerm(term: string): boolean {
    const message = this.getMessage().toLowerCase()
    const data = JSON.stringify(this.getData()).toLowerCase()
    const tags = this.getTags().join(' ').toLowerCase()

    const searchTerm = term.toLowerCase()
    return message.includes(searchTerm) || data.includes(searchTerm) || tags.includes(searchTerm)
  }

  matchesTimeRange(start: Date, end: Date): boolean {
    return this.createdAt >= start && this.createdAt <= end
  }

  matchesPriority(minPriority?: EventPriority): boolean {
    if (!minPriority) return true

    const priorityLevels = {
      [EventPriority.LOW]: 1,
      [EventPriority.MEDIUM]: 2,
      [EventPriority.HIGH]: 3,
      [EventPriority.CRITICAL]: 4,
    }

    const eventLevel = priorityLevels[this.priority]
    const minLevel = priorityLevels[minPriority]

    return eventLevel >= minLevel
  }

  // 序列化方法
  toJSON(): any {
    return {
      id: this.id,
      agentSessionId: this.agentSessionId,
      eventType: this.eventType,
      priority: this.priority,
      payload: this.payloadJson,
      contextInfo: this.contextInfo,
      sequenceNumber: this.sequenceNumber,
      clientTimestamp: this.clientTimestamp,
      eventMetadata: this.eventMetadata,
      createdAt: this.createdAt,
    }
  }

  // 工厂方法
  static createHeartbeat(sessionId: string, data: any): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.HEARTBEAT
    event.priority = EventPriority.LOW
    event.payloadJson = {
      message: 'Heartbeat',
      data,
      source: 'agent',
    }
    return event
  }

  static createArtifact(sessionId: string, artifactData: any): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.ARTIFACT
    event.priority = EventPriority.MEDIUM
    event.payloadJson = {
      message: 'Artifact created',
      data: artifactData,
      source: 'agent',
    }
    return event
  }

  static createError(sessionId: string, errorData: any): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.ERROR
    event.priority = EventPriority.HIGH
    event.payloadJson = {
      message: errorData.message || 'Unknown error',
      data: errorData,
      source: 'agent',
    }
    return event
  }

  static createLog(sessionId: string, logLevel: string, logData: any): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.LOG
    event.priority = logLevel === 'error' ? EventPriority.HIGH : EventPriority.LOW
    event.payloadJson = {
      message: logData.message || '',
      data: { level: logLevel, ...logData },
      source: 'agent',
    }
    return event
  }

  static createSync(sessionId: string, syncData: any): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.SYNC
    event.priority = EventPriority.MEDIUM
    event.payloadJson = {
      message: 'Data sync',
      data: syncData,
      source: 'agent',
    }
    return event
  }
}