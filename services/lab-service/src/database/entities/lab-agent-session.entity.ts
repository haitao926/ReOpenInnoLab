import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany } from 'typeorm'
import { LabDeviceAgent } from './lab-device-agent.entity'
import { LabRun } from './lab-run.entity'
import { LabAgentEvent } from './lab-agent-event.entity'

export enum SessionState {
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

@Entity('lab_agent_sessions')
@Index(['agentId', 'startedAt'])
@Index(['labRunId'])
@Index(['state'])
export class LabAgentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string

  @Column({ name: 'lab_run_id', type: 'uuid' })
  labRunId: string

  @Column({ name: 'session_token', type: 'varchar', length: 255, unique: true })
  sessionToken: string

  @Column({
    type: 'enum',
    enum: SessionState,
    default: SessionState.INITIALIZING
  })
  state: SessionState

  @Column({ name: 'notebook_checksum', type: 'varchar', length: 64 })
  notebookChecksum: string

  @Column({ name: 'notebook_url', type: 'varchar', length: 512 })
  notebookUrl: string

  @Column({ name: 'package_manifest', type: 'jsonb' })
  packageManifest: {
    required: string[]
    optional: string[]
    pip_packages: string[]
    npm_packages: string[]
  }

  @Column({ name: 'exit_code', type: 'int', nullable: true })
  exitCode: number

  @Column({ name: 'exit_message', type: 'text', nullable: true })
  exitMessage: string

  @Column({ name: 'started_at', type: 'timestamp' })
  @Index()
  startedAt: Date

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date

  @Column({ name: 'last_heartbeat_at', type: 'timestamp' })
  @Index()
  lastHeartbeatAt: Date

  @Column({ name: 'offline_cache_path', type: 'varchar', length: 512, nullable: true })
  offlineCachePath: string

  @Column({ name: 'runtime_stats', type: 'jsonb', default: {} })
  runtimeStats: {
    cpu_time?: number
    memory_peak?: number
    disk_usage?: number
    network_bytes?: number
    cells_executed?: number
    errors_count?: number
  }

  @Column({ name: 'jupyter_url', type: 'varchar', length: 512, nullable: true })
  jupyterUrl: string

  @Column({ name: 'local_notebook_path', type: 'varchar', length: 512, nullable: true })
  localNotebookPath: string

  @Column({ name: 'artifacts_path', type: 'varchar', length: 512, nullable: true })
  artifactsPath: string

  @Column({ name: 'sync_status', type: 'varchar', length: 50, default: 'pending' })
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relationships
  @ManyToOne(() => LabDeviceAgent, agent => agent.sessions)
  agent: LabDeviceAgent

  @ManyToOne(() => LabRun, labRun => labRun.agentSessions)
  labRun: LabRun

  @OneToMany(() => LabAgentEvent, event => event.session)
  events: LabAgentEvent[]

  // Helper methods
  isActive(): boolean {
    const activeStates = [SessionState.INITIALIZING, SessionState.READY, SessionState.RUNNING]
    return activeStates.includes(this.state)
  }

  getDuration(): number | null {
    if (!this.startedAt) return null
    const endTime = this.endedAt || new Date()
    return endTime.getTime() - this.startedAt.getTime()
  }

  isHeartbeatAlive(maxAgeSeconds: number = 30): boolean {
    const now = new Date()
    const lastHeartbeat = new Date(this.lastHeartbeatAt)
    const diffSeconds = (now.getTime() - lastHeartbeat.getTime()) / 1000
    return diffSeconds <= maxAgeSeconds
  }
}