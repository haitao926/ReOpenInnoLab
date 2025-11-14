import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { User } from './user.entity'

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPORT = 'export',
  IMPORT = 'import',
  ASSIGN = 'assign',
  REMOVE = 'remove',
  ENABLE = 'enable',
  DISABLE = 'disable',
  RESET_PASSWORD = 'reset_password',
  CHANGE_ROLE = 'change_role',
  BULK_OPERATION = 'bulk_operation'
}

export enum AuditResource {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  TENANT = 'tenant',
  COURSE = 'course',
  CLASSROOM = 'classroom',
  ASSIGNMENT = 'assignment',
  SUBMISSION = 'submission',
  SYSTEM = 'system',
  AUTH = 'auth',
  AUDIT_LOG = 'audit_log'
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['resource'])
@Index(['resourceId'])
@Index(['createdAt'])
@Index(['ipAddress'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', nullable: true })
  userId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({
    type: 'enum',
    enum: AuditAction,
    name: 'action'
  })
  action: AuditAction

  @Column({
    type: 'enum',
    enum: AuditResource,
    name: 'resource'
  })
  resource: AuditResource

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string

  @Column({ name: 'resource_name', nullable: true })
  resourceName: string

  @Column({ type: 'json', nullable: true })
  oldValues: Record<string, any>

  @Column({ type: 'json', nullable: true })
  newValues: Record<string, any>

  @Column({ type: 'json', nullable: true })
  metadata: {
    userAgent?: string
    platform?: string
    browser?: string
    os?: string
    sessionId?: string
    requestId?: string
    duration?: number
    batchSize?: number
    [key: string]: any
  }

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string

  @Column({ name: 'success', default: true })
  success: boolean

  @Column({ type: 'text', nullable: true })
  errorMessage: string

  @Column({ name: 'session_id', nullable: true })
  sessionId: string

  @Column({ name: 'request_id', nullable: true })
  requestId: string

  @Column({ name: 'created_at' })
  @CreateDateColumn()
  createdAt: Date
}