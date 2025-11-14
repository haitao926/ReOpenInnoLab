import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany } from 'typeorm'
import { Tenant } from './tenant.entity'
import { User } from './user.entity'
import { Classroom } from './classroom.entity'
import { LabAgentSession } from './lab-agent-session.entity'
import { LabDevicePolicy } from './lab-device-policy.entity'

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum TrustLevel {
  UNTRUSTED = 'untrusted',
  TRUSTED = 'trusted',
  PRIVILEGED = 'privileged'
}

@Entity('lab_device_agents')
@Index(['tenantId', 'studentId'])
@Index(['deviceId', 'lastSeenAt'])
@Index(['status', 'trustLevel'])
export class LabDeviceAgent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  studentId: string

  @Column({ name: 'classroom_id', type: 'uuid', nullable: true })
  classroomId: string

  @Column({ name: 'device_id', type: 'varchar', length: 255, unique: true })
  deviceId: string

  @Column({ name: 'device_fingerprint', type: 'varchar', length: 512 })
  deviceFingerprint: string

  @Column({ name: 'agent_version', type: 'varchar', length: 50 })
  agentVersion: string

  @Column({ name: 'os_info', type: 'jsonb' })
  osInfo: Record<string, any>

  @Column({ name: 'jupyter_port', type: 'int', nullable: true })
  jupyterPort: number

  @Column({
    type: 'enum',
    enum: AgentStatus,
    default: AgentStatus.OFFLINE
  })
  status: AgentStatus

  @Column({
    type: 'enum',
    enum: TrustLevel,
    default: TrustLevel.UNTRUSTED
  })
  trustLevel: TrustLevel

  @Column({ name: 'last_seen_at', type: 'timestamp' })
  @Index()
  lastSeenAt: Date

  @Column({ name: 'heartbeat_interval', type: 'int', default: 5 })
  heartbeatInterval: number // seconds

  @Column({ name: 'offline_cache_path', type: 'varchar', length: 512, nullable: true })
  offlineCachePath: string

  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyId: string

  @Column({ name: 'capabilities', type: 'jsonb', default: {} })
  capabilities: Record<string, any>

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relationships
  @ManyToOne(() => Tenant, tenant => tenant.labDeviceAgents)
  tenant: Tenant

  @ManyToOne(() => User, user => user.labDeviceAgents)
  student: User

  @ManyToOne(() => Classroom, classroom => classroom.labDeviceAgents)
  classroom: Classroom

  @ManyToOne(() => LabDevicePolicy, policy => policy.agents)
  policy: LabDevicePolicy

  @OneToMany(() => LabAgentSession, session => session.agent)
  sessions: LabAgentSession[]

  // Helper methods
  isOnline(): boolean {
    const now = new Date()
    const timeDiff = now.getTime() - this.lastSeenAt.getTime()
    const heartbeatThreshold = (this.heartbeatInterval + 10) * 1000 // Add 10s buffer
    return this.status === AgentStatus.ONLINE && timeDiff < heartbeatThreshold
  }

  canRunExperiment(): boolean {
    return this.isOnline() &&
           this.trustLevel !== TrustLevel.UNTRUSTED &&
           this.status !== AgentStatus.BUSY
  }
}