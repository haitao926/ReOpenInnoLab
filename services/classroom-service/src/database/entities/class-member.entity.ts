import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm'
import { IsEnum, IsUUID } from 'class-validator'

import { Classroom } from './classroom.entity'

export enum MemberRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
  ASSISTANT = 'assistant',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  GRADUATED = 'graduated',
  TRANSFERRED = 'transferred',
}

@Entity('class_members')
@Index(['classroomId', 'userId'])
@Index(['classroomId', 'role'])
@Index(['status'])
@Unique(['classroomId', 'userId'])
export class ClassMember {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'classroom_id' })
  @IsUUID()
  classroomId: string

  @Column({ type: 'uuid', name: 'user_id' })
  @IsUUID()
  userId: string

  @Column({
    type: 'enum',
    enum: MemberRole,
  })
  @IsEnum(MemberRole)
  role: MemberRole

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE,
  })
  @IsEnum(MemberStatus)
  status: MemberStatus

  @Column({ type: 'timestamp', nullable: true, name: 'joined_at' })
  joinedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'left_at' })
  leftAt?: Date

  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  @IsOptional()
  @IsUUID()
  assignedBy?: string

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
  metadata?: {
    studentId?: string
    rollNumber?: string
    seatNumber?: string
    notes?: string
    performance?: {
      averageScore?: number
      attendanceRate?: number
      participationScore?: number
    }
    specialNeeds?: string[]
    accommodations?: string[]
    custom?: Record<string, any>
  }

  // Relationships
  @ManyToOne(() => Classroom, { nullable: false })
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isActive(): boolean {
    return this.status === MemberStatus.ACTIVE
  }

  get isInactive(): boolean {
    return this.status === MemberStatus.INACTIVE
  }

  get isSuspended(): boolean {
    return this.status === MemberStatus.SUSPENDED
  }

  get hasLeft(): boolean {
    return !!this.leftAt
  }

  get membershipDuration(): number | null {
    if (!this.joinedAt) return null
    const end = this.leftAt || new Date()
    return end.getTime() - this.joinedAt.getTime()
  }

  // Helper methods
  getRoleDisplay(): string {
    const roleMap: Record<MemberRole, string> = {
      [MemberRole.TEACHER]: '教师',
      [MemberRole.STUDENT]: '学生',
      [MemberRole.ASSISTANT]: '助教',
    }
    return roleMap[this.role] || this.role
  }

  getStatusDisplay(): string {
    const statusMap: Record<MemberStatus, string> = {
      [MemberStatus.ACTIVE]: '在读',
      [MemberStatus.INACTIVE]: '非活跃',
      [MemberStatus.SUSPENDED]: '停课',
      [MemberStatus.GRADUATED]: '已毕业',
      [MemberStatus.TRANSFERRED]: '已转班',
    }
    return statusMap[this.status] || this.status
  }

  getJoinedDisplay(): string {
    if (!this.joinedAt) return '未知'
    return new Date(this.joinedAt).toLocaleDateString('zh-CN')
  }

  getLeftDisplay(): string {
    if (!this.leftAt) return '在读'
    return new Date(this.leftAt).toLocaleDateString('zh-CN')
  }

  getPerformanceInfo(): {
    averageScore?: number
    attendanceRate?: number
    participationScore?: number
    grade?: string
  } {
    const performance = this.metadata?.performance || {}
    const averageScore = performance.averageScore
    const attendanceRate = performance.attendanceRate
    const participationScore = performance.participationScore

    let grade: string | undefined
    if (averageScore !== undefined) {
      if (averageScore >= 90) grade = 'A'
      else if (averageScore >= 80) grade = 'B'
      else if (averageScore >= 70) grade = 'C'
      else if (averageScore >= 60) grade = 'D'
      else grade = 'F'
    }

    return {
      averageScore,
      attendanceRate,
      participationScore,
      grade,
    }
  }

  hasSpecialNeeds(): boolean {
    const needs = this.metadata?.specialNeeds || []
    return needs.length > 0
  }

  getSpecialNeeds(): string[] {
    return this.metadata?.specialNeeds || []
  }

  hasAccommodations(): boolean {
    const accommodations = this.metadata?.accommodations || []
    return accommodations.length > 0
  }

  getAccommodations(): string[] {
    return this.metadata?.accommodations || []
  }

  updatePerformance(data: {
    averageScore?: number
    attendanceRate?: number
    participationScore?: number
  }): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.performance) {
      this.metadata.performance = {}
    }

    Object.assign(this.metadata.performance, data)
  }

  canParticipate(): boolean {
    return this.isActive && !this.isSuspended
  }

  requiresSpecialSupport(): boolean {
    return this.hasSpecialNeeds() || this.hasAccommodations()
  }

  getEnrollmentPeriod(): string {
    if (!this.joinedAt) return '未知'

    const start = new Date(this.joinedAt).toLocaleDateString('zh-CN')
    const end = this.leftAt ? new Date(this.leftAt).toLocaleDateString('zh-CN') : '至今'

    return `${start} 至 ${end}`
  }

  getAttendanceSummary(sessions: any[]): {
    totalSessions: number
    attendedSessions: number
    attendanceRate: number
  } {
    const totalSessions = sessions.length
    const attendedSessions = sessions.filter(session =>
      // 这里需要关联考勤记录，暂时返回默认值
      true // 实际实现中需要查询 attendance_records 表
    ).length

    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0

    return {
      totalSessions,
      attendedSessions,
      attendanceRate,
    }
  }
}