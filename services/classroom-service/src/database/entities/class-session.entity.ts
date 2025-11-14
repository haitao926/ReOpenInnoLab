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
import { AttendanceRecord } from './attendance-record.entity'

export enum SessionState {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export enum SessionType {
  REGULAR = 'regular',
  LAB = 'lab',
  EXAM = 'exam',
  REVIEW = 'review',
  FIELD_TRIP = 'field_trip',
  ONLINE = 'online',
}

@Entity('class_sessions')
@Index(['classroomId'])
@Index(['courseVersionId'])
@Index(['state'])
@Index(['startAt'])
@Index(['endAt'])
export class ClassSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'classroom_id' })
  @IsUUID()
  classroomId: string

  @Column({ type: 'uuid', nullable: true, name: 'course_version_id' })
  @IsOptional()
  @IsUUID()
  courseVersionId?: string

  @Column({
    type: 'enum',
    enum: SessionState,
    default: SessionState.SCHEDULED,
  })
  @IsEnum(SessionState)
  state: SessionState

  @Column({
    type: 'enum',
    enum: SessionType,
    default: SessionType.REGULAR,
  })
  @IsEnum(SessionType)
  type: SessionType

  @Column({ type: 'timestamp', name: 'start_at' })
  startAt: Date

  @Column({ type: 'timestamp', name: 'end_at' })
  endAt: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  title?: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  location?: string

  @Column({ type: 'jsonb', name: 'session_data', nullable: true })
  @IsOptional()
  sessionData?: {
    agenda?: string[]
    materials?: string[]
    objectives?: string[]
    activities?: string[]
    homework?: string
    notes?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'realtime_state', nullable: true })
  @IsOptional()
  realtimeState?: {
    currentSlide?: number
    totalSlides?: number
    currentActivity?: string
    interactionResults?: {
      polls?: Array<{
        question: string
        options: string[]
        responses: Array<{
          userId: string
          answer: string
          timestamp: Date
        }>
      }>
      quizzes?: Array<{
        questionId: string
        responses: Array<{
          userId: string
          answer: any
          score: number
          timestamp: Date
        }>
      }>
    }
    whiteboardData?: string
    sharedScreen?: boolean
    recordingStatus?: 'not_started' | 'recording' | 'paused' | 'completed'
  }

  @Column({ type: 'uuid', nullable: true, name: 'teacher_id' })
  @IsOptional()
  @IsUUID()
  teacherId?: string

  @Column({ type: 'jsonb', name: 'attendance_summary', nullable: true })
  @IsOptional()
  attendanceSummary?: {
    totalStudents: number
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
    attendanceRate: number
  }

  @Column({ type: 'integer', name: 'participant_count', default: 0 })
  @IsOptional()
  participantCount: number

  @Column({ type: 'jsonb', name: 'technology_used', nullable: true })
  @IsOptional()
  technologyUsed?: {
    smartboard?: boolean
    projector?: boolean
    computers?: boolean
    tablets?: boolean
    microscopes?: boolean
    labEquipment?: string[]
    software?: string[]
  }

  @Column({ type: 'jsonb', name: 'session_outcomes', nullable: true })
  @IsOptional()
  sessionOutcomes?: {
    learningObjectivesMet?: string[]
    keyTakeaways?: string[]
    studentFeedback?: {
      averageRating?: number
      comments?: string[]
      suggestions?: string[]
    }
    issues?: string[]
    followUpActions?: string[]
  }

  @Column({ type: 'jsonb', name: 'session_metadata', default: '{}' })
  @IsOptional()
  sessionMetadata?: {
    weatherConditions?: string
    specialEvents?: string[]
    disruptions?: string[]
    custom?: Record<string, any>
  }

  // Relationships
  @ManyToOne(() => Classroom, { nullable: false })
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom

  @OneToMany(() => AttendanceRecord, (record) => record.session)
  attendanceRecords: AttendanceRecord[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isScheduled(): boolean {
    return this.state === SessionState.SCHEDULED
  }

  get isInProgress(): boolean {
    return this.state === SessionState.IN_PROGRESS
  }

  get isCompleted(): boolean {
    return this.state === SessionState.COMPLETED
  }

  get isCancelled(): boolean {
    return this.state === SessionState.CANCELLED
  }

  get isPaused(): boolean {
    return this.state === SessionState.PAUSED
  }

  // Helper methods
  getStateDisplay(): string {
    const stateMap: Record<SessionState, string> = {
      [SessionState.SCHEDULED]: '已安排',
      [SessionState.IN_PROGRESS]: '进行中',
      [SessionState.COMPLETED]: '已完成',
      [SessionState.CANCELLED]: '已取消',
      [SessionState.PAUSED]: '已暂停',
    }
    return stateMap[this.state] || this.state
  }

  getTypeDisplay(): string {
    const typeMap: Record<SessionType, string> = {
      [SessionType.REGULAR]: '常规课程',
      [SessionType.LAB]: '实验课',
      [SessionType.EXAM]: '考试',
      [SessionType.REVIEW]: '复习课',
      [SessionType.FIELD_TRIP]: '实地考察',
      [SessionType.ONLINE]: '在线课程',
    }
    return typeMap[this.type] || this.type
  }

  getDuration(): number {
    return this.endAt.getTime() - this.startAt.getTime()
  }

  getDurationDisplay(): string {
    const durationMs = this.getDuration()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
    }
    return `${minutes}分钟`
  }

  getDateTimeDisplay(): string {
    const startDate = new Date(this.startAt)
    const endDate = new Date(this.endAt)

    return `${startDate.toLocaleDateString('zh-CN')} ${startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  isCurrent(): boolean {
    const now = new Date()
    return this.startAt <= now && this.endAt >= now
  }

  isUpcoming(): boolean {
    return this.startAt > new Date()
  }

  isPast(): boolean {
    return this.endAt < new Date()
  }

  getTimeUntilStart(): number {
    const now = new Date()
    return this.startAt.getTime() - now.getTime()
  }

  getTimeUntilEnd(): number {
    const now = new Date()
    return this.endAt.getTime() - now.getTime()
  }

  getProgress(): number {
    const now = new Date()
    const totalDuration = this.getDuration()
    const elapsed = now.getTime() - this.startAt.getTime()

    if (elapsed <= 0) return 0
    if (elapsed >= totalDuration) return 100

    return Math.round((elapsed / totalDuration) * 100)
  }

  updateRealtimeState(data: Partial<typeof this.realtimeState>): void {
    this.realtimeState = {
      ...this.realtimeState,
      ...data,
    }
  }

  getCurrentSlide(): number {
    return this.realtimeState?.currentSlide || 0
  }

  getTotalSlides(): number {
    return this.realtimeState?.totalSlides || 0
  }

  getSlideProgress(): number {
    const current = this.getCurrentSlide()
    const total = this.getTotalSlides()
    return total > 0 ? Math.round((current / total) * 100) : 0
  }

  isRecording(): boolean {
    return this.realtimeState?.recordingStatus === 'recording'
  }

  startRecording(): void {
    this.updateRealtimeState({
      recordingStatus: 'recording'
    })
  }

  pauseRecording(): void {
    this.updateRealtimeState({
      recordingStatus: 'paused'
    })
  }

  stopRecording(): void {
    this.updateRealtimeState({
      recordingStatus: 'completed'
    })
  }

  getAttendanceSummary(): {
    totalStudents: number
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
    attendanceRate: number
  } {
    const summary = this.attendanceSummary || {
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendanceRate: 0,
    }

    return summary
  }

  updateAttendanceSummary(records: AttendanceRecord[]): void {
    const totalStudents = records.length
    const presentCount = records.filter(r => r.status === 'present').length
    const absentCount = records.filter(r => r.status === 'absent').length
    const lateCount = records.filter(r => r.status === 'late').length
    const excusedCount = records.filter(r => r.status === 'excused').length
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0

    this.attendanceSummary = {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
    }
  }

  addInteractionResult(type: 'poll' | 'quiz', data: any): void {
    if (!this.realtimeState) {
      this.realtimeState = {}
    }
    if (!this.realtimeState.interactionResults) {
      this.realtimeState.interactionResults = {}
    }

    if (type === 'poll') {
      if (!this.realtimeState.interactionResults.polls) {
        this.realtimeState.interactionResults.polls = []
      }
      this.realtimeState.interactionResults.polls.push(data)
    } else if (type === 'quiz') {
      if (!this.realtimeState.interactionResults.quizzes) {
        this.realtimeState.interactionResults.quizzes = []
      }
      this.realtimeState.interactionResults.quizzes.push(data)
    }
  }

  hasTechnologyEquipment(): boolean {
    const tech = this.technologyUsed
    if (!tech) return false

    return Object.values(tech).some(value =>
      typeof value === 'boolean' ? value : (Array.isArray(value) ? value.length > 0 : false)
    )
  }

  getUsedEquipment(): string[] {
    const tech = this.technologyUsed || {}
    const equipment: string[] = []

    if (tech.smartboard) equipment.push('智能白板')
    if (tech.projector) equipment.push('投影仪')
    if (tech.computers) equipment.push('电脑')
    if (tech.tablets) equipment.push('平板')
    if (tech.microscopes) equipment.push('显微镜')
    if (tech.labEquipment && tech.labEquipment.length > 0) {
      equipment.push(...tech.labEquipment)
    }
    if (tech.software && tech.software.length > 0) {
      equipment.push(...tech.software.map(s => `软件: ${s}`))
    }

    return equipment
  }
}