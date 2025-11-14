import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { ClassMember } from './class-member.entity'
import { ClassSession } from './class-session.entity'
import { LabDeviceAgent } from './lab-device-agent.entity'
import { Tenant } from './tenant.entity'

export enum ClassroomStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum ClassroomType {
  REGULAR = 'regular',
  LAB = 'lab',
  ONLINE = 'online',
  HYBRID = 'hybrid',
}

@Entity('classrooms')
@Index(['tenantId', 'name'])
@Index(['status'])
@Index(['type'])
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @IsUUID()
  tenantId: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'school_id' })
  @IsOptional()
  schoolId?: string

  @Column({ type: 'jsonb', name: 'schedule_json', nullable: true })
  @IsOptional()
  scheduleJson?: {
    daysOfWeek: number[]
    startTime: string
    endTime: string
    timezone: string
    recurring: boolean
    exceptions?: Date[]
  }

  @Column({ type: 'uuid', nullable: true, name: 'homeroom_teacher_id' })
  @IsOptional()
  @IsUUID()
  homeroomTeacherId?: string

  @Column({
    type: 'enum',
    enum: ClassroomStatus,
    default: ClassroomStatus.ACTIVE,
  })
  @IsEnum(ClassroomStatus)
  status: ClassroomStatus

  @Column({
    type: 'enum',
    enum: ClassroomType,
    default: ClassroomType.REGULAR,
  })
  @IsEnum(ClassroomType)
  type: ClassroomType

  @Column({ type: 'integer', name: 'max_students', nullable: true })
  @IsOptional()
  maxStudents?: number

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  description?: string

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  metadata?: {
    grade?: string
    subject?: string
    roomNumber?: string
    building?: string
    equipment?: string[]
    specialNeeds?: string[]
    custom?: Record<string, any>
  }

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  @IsOptional()
  @IsUUID()
  createdBy?: string

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  @IsOptional()
  @IsUUID()
  updatedBy?: string

  // Relationships
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @OneToMany(() => ClassMember, (member) => member.classroom)
  members: ClassMember[]

  @OneToMany(() => ClassSession, (session) => session.classroom)
  sessions: ClassSession[]

  @OneToMany(() => LabDeviceAgent, (agent) => agent.classroom)
  labDeviceAgents: LabDeviceAgent[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isActive(): boolean {
    return this.status === ClassroomStatus.ACTIVE
  }

  get isArchived(): boolean {
    return this.status === ClassroomStatus.ARCHIVED
  }

  get studentCount(): number {
    return this.members?.filter(m => m.role === 'student').length || 0
  }

  get teacherCount(): number {
    return this.members?.filter(m => m.role === 'teacher').length || 0
  }

  get currentMembers(): number {
    return this.members?.filter(m => m.status === 'active').length || 0
  }

  // Helper methods
  getTypeDisplay(): string {
    const typeMap: Record<ClassroomType, string> = {
      [ClassroomType.REGULAR]: '常规班级',
      [ClassroomType.LAB]: '实验室班级',
      [ClassroomType.ONLINE]: '在线班级',
      [ClassroomType.HYBRID]: '混合班级',
    }
    return typeMap[this.type] || this.type
  }

  getStatusDisplay(): string {
    const statusMap: Record<ClassroomStatus, string> = {
      [ClassroomStatus.ACTIVE]: '活跃',
      [ClassroomStatus.INACTIVE]: '非活跃',
      [ClassroomStatus.ARCHIVED]: '已归档',
    }
    return statusMap[this.status] || this.status
  }

  getScheduleDisplay(): string {
    if (!this.scheduleJson) return '未设置时间表'

    const { daysOfWeek, startTime, endTime, timezone } = this.scheduleJson
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dayDisplay = daysOfWeek.map(day => dayNames[day]).join('、')

    return `${dayDisplay} ${startTime}-${endTime} (${timezone})`
  }

  getCapacityInfo(): {
    current: number
    max: number | undefined
    percentage: number
    isFull: boolean
  } {
    const current = this.studentCount
    const max = this.maxStudents
    const percentage = max ? Math.round((current / max) * 100) : 0

    return {
      current,
      max,
      percentage,
      isFull: max ? current >= max : false,
    }
  }

  getMembersByRole(role: 'teacher' | 'student'): ClassMember[] {
    return this.members?.filter(member => member.role === role) || []
  }

  getActiveMembers(): ClassMember[] {
    return this.members?.filter(member => member.status === 'active') || []
  }

  hasMember(userId: string): boolean {
    return this.members?.some(member => member.userId === userId) || false
  }

  getMemberRole(userId: string): 'teacher' | 'student' | null {
    const member = this.members?.find(m => m.userId === userId)
    return member?.role || null
  }

  canAddStudent(): boolean {
    if (!this.maxStudents) return true
    return this.studentCount < this.maxStudents
  }

  getRecentSessions(count: number = 5): ClassSession[] {
    if (!this.sessions || this.sessions.length === 0) return []

    return this.sessions
      .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())
      .slice(0, count)
  }

  getActiveSession(): ClassSession | undefined {
    if (!this.sessions || this.sessions.length === 0) return undefined

    const now = new Date()
    return this.sessions.find(session =>
      session.startAt <= now && session.endAt >= now
    )
  }

  isSessionInProgress(): boolean {
    return !!this.getActiveSession()
  }

  getUpcomingSessions(count: number = 3): ClassSession[] {
    if (!this.sessions || this.sessions.length === 0) return []

    const now = new Date()
    return this.sessions
      .filter(session => session.startAt > now)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
      .slice(0, count)
  }

  isLabClassroom(): boolean {
    return this.type === ClassroomType.LAB || this.type === ClassroomType.HYBRID
  }

  getLabCapabilities(): {
    hasLabDevices: boolean
    deviceCount: number
    activeDevices: number
  } {
    const devices = this.labDeviceAgents || []
    const activeDevices = devices.filter(d => d.status === 'active').length

    return {
      hasLabDevices: devices.length > 0,
      deviceCount: devices.length,
      activeDevices,
    }
  }
}