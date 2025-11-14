import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne } from 'typeorm'
import { LabAgentSession } from './lab-agent-session.entity'

export enum EventType {
  HEARTBEAT = 'heartbeat',
  LOG = 'log',
  ARTIFACT = 'artifact',
  ERROR = 'error',
  WARNING = 'warning',
  SYNC = 'sync',
  STATUS_CHANGE = 'status_change',
  CELL_EXECUTED = 'cell_executed',
  OUTPUT = 'output',
  DEBUG = 'debug'
}

@Entity('lab_agent_events')
@Index(['agentSessionId', 'eventType', 'createdAt'])
@Index(['createdAt'])
export class LabAgentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'agent_session_id', type: 'uuid' })
  agentSessionId: string

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType
  })
  @Index()
  eventType: EventType

  @Column({ name: 'payload_json', type: 'jsonb' })
  payload: Record<string, any>

  @Column({ name: 'event_timestamp', type: 'timestamp' })
  @Index()
  eventTimestamp: Date

  @Column({ name: 'sequence_number', type: 'bigint' })
  @Index()
  sequenceNumber: number

  @Column({ name: 'level', type: 'varchar', length: 20, nullable: true })
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'

  @Column({ name: 'source', type: 'varchar', length: 100, nullable: true })
  source: string // e.g., 'jupyter', 'agent', 'runtime'

  @Column({ name: 'correlation_id', type: 'varchar', length: 100, nullable: true })
  correlationId: string // For grouping related events

  @Column({ name: 'is_processed', type: 'boolean', default: false })
  @Index()
  isProcessed: boolean

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  // Relationships
  @ManyToOne(() => LabAgentSession, session => session.events)
  session: LabAgentSession

  // Static factory methods
  static createHeartbeat(sessionId: string, payload: Record<string, any>): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.HEARTBEAT
    event.payload = payload
    event.eventTimestamp = new Date()
    event.sequenceNumber = Date.now()
    event.level = 'info'
    event.source = 'agent'
    return event
  }

  static createLog(sessionId: string, level: string, message: string, metadata?: Record<string, any>): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.LOG
    event.payload = { message, ...metadata }
    event.eventTimestamp = new Date()
    event.sequenceNumber = Date.now()
    event.level = level as any
    event.source = 'jupyter'
    return event
  }

  static createArtifact(sessionId: string, artifactInfo: Record<string, any>): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.ARTIFACT
    event.payload = artifactInfo
    event.eventTimestamp = new Date()
    event.sequenceNumber = Date.now()
    event.level = 'info'
    event.source = 'agent'
    return event
  }

  static createError(sessionId: string, error: Error, context?: Record<string, any>): LabAgentEvent {
    const event = new LabAgentEvent()
    event.agentSessionId = sessionId
    event.eventType = EventType.ERROR
    event.payload = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    }
    event.eventTimestamp = new Date()
    event.sequenceNumber = Date.now()
    event.level = 'error'
    event.source = 'runtime'
    return event
  }

  // Helper methods
  markAsProcessed(): void {
    this.isProcessed = true
    this.processedAt = new Date()
  }

  incrementRetry(): void {
    this.retryCount += 1
  }
}