import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsUUID } from 'class-validator'

import { ClassSession } from './class-session.entity'

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  EARLY_DEPARTURE = 'early_departure',
}

export enum AttendanceSource {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  QR_CODE = 'qr_code',
  BIOMETRIC = 'biometric',
  RFID = 'rfid',
}

@Entity('attendance_records')
@Index(['sessionId'])
@Index(['studentId'])
@Index(['status'])
@Index(['recordedAt'])
@Index(['source'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'session_id' })
  @IsUUID()
  sessionId: string

  @Column({ type: 'uuid', name: 'student_id' })
  @IsUUID()
  studentId: string

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus

  @Column({ type: 'timestamp', name: 'recorded_at' })
  recordedAt: Date

  @Column({
    type: 'enum',
    enum: AttendanceSource,
    default: AttendanceSource.MANUAL,
  })
  @IsEnum(AttendanceSource)
  source: AttendanceSource

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  recordedBy?: string

  @Column({ type: 'inet', nullable: true })
  @IsOptional()
  ipAddress?: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes?: string

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: {
    checkInTime?: Date
    checkOutTime?: Date
    duration?: number // 分钟
    deviceInfo?: {
      userAgent?: string
      platform?: string
      deviceType?: string
    }
    location?: {
      coordinates?: {
        latitude: number
        longitude: number
      }
      accuracy?: number
      address?: string
    }
    verification?: {
      method?: string
      confidence?: number
      additionalData?: any
    }
    exceptions?: {
      reason?: string
      approvedBy?: string
      approvedAt?: Date
      documentation?: string
    }
    behavior?: {
      participationLevel?: 'low' | 'medium' | 'high'
      attentionLevel?: 'low' | 'medium' | 'high'
      interactions?: number
      timeOnTask?: number // 百分比
    }
    custom?: Record<string, any>
  }

  // Relationships
  @ManyToOne(() => ClassSession, { nullable: false })
  @JoinColumn({ name: 'session_id' })
  session: ClassSession

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  // Virtual fields
  get isPresent(): boolean {
    return this.status === AttendanceStatus.PRESENT
  }

  get isAbsent(): boolean {
    return this.status === AttendanceStatus.ABSENT
  }

  get isLate(): boolean {
    return this.status === AttendanceStatus.LATE
  }

  get isExcused(): boolean {
    return this.status === AttendanceStatus.EXCUSED
  }

  get isEarlyDeparture(): boolean {
    return this.status === AttendanceStatus.EARLY_DEPARTURE
  }

  // Helper methods
  getStatusDisplay(): string {
    const statusMap: Record<AttendanceStatus, string> = {
      [AttendanceStatus.PRESENT]: '出席',
      [AttendanceStatus.ABSENT]: '缺勤',
      [AttendanceStatus.LATE]: '迟到',
      [AttendanceStatus.EXCUSED]: '请假',
      [AttendanceStatus.EARLY_DEPARTURE]: '早退',
    }
    return statusMap[this.status] || this.status
  }

  getSourceDisplay(): string {
    const sourceMap: Record<AttendanceSource, string> = {
      [AttendanceSource.MANUAL]: '手动记录',
      [AttendanceSource.AUTOMATIC]: '自动记录',
      [AttendanceSource.QR_CODE]: '二维码签到',
      [AttendanceSource.BIOMETRIC]: '生物识别',
      [AttendanceSource.RFID]: 'RFID卡片',
    }
    return sourceMap[this.source] || this.source
  }

  getRecordedTimeDisplay(): string {
    return new Date(this.recordedAt).toLocaleString('zh-CN')
  }

  getDuration(): number | null {
    const checkIn = this.metadata?.checkInTime
    const checkOut = this.metadata?.checkOutTime

    if (!checkIn) return null
    if (!checkOut) return null

    return Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)) // 分钟
  }

  getDurationDisplay(): string {
    const duration = this.getDuration()
    if (!duration) return '未知'

    if (duration < 60) {
      return `${duration}分钟`
    }
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
  }

  hasCheckInCheckOut(): boolean {
    return !!(this.metadata?.checkInTime && this.metadata?.checkOutTime)
  }

  getCheckInTime(): Date | null {
    return this.metadata?.checkInTime || null
  }

  getCheckOutTime(): Date | null {
    return this.metadata?.checkOutTime || null
  }

  wasLateArrival(): boolean {
    if (!this.metadata?.checkInTime || !this.session) return false

    const checkInTime = this.metadata.checkInTime.getTime()
    const sessionStart = this.session.startAt.getTime()
    const lateThreshold = 5 * 60 * 1000 // 5分钟

    return checkInTime > (sessionStart + lateThreshold)
  }

  hadEarlyDeparture(): boolean {
    if (!this.metadata?.checkOutTime || !this.session) return false

    const checkOutTime = this.metadata.checkOutTime.getTime()
    const sessionEnd = this.session.endAt.getTime()
    const earlyThreshold = 5 * 60 * 1000 // 5分钟

    return checkOutTime < (sessionEnd - earlyThreshold)
  }

  getParticipationLevel(): string {
    return this.metadata?.behavior?.participationLevel || 'medium'
  }

  getAttentionLevel(): string {
    return this.metadata?.behavior?.attentionLevel || 'medium'
  }

  getInteractionCount(): number {
    return this.metadata?.behavior?.interactions || 0
  }

  getTimeOnTask(): number {
    return this.metadata?.behavior?.timeOnTask || 0
  }

  getLocationInfo(): {
    hasLocation: boolean
    coordinates?: { latitude: number; longitude: number }
    address?: string
    accuracy?: number
  } {
    const location = this.metadata?.location
    if (!location) {
      return { hasLocation: false }
    }

    return {
      hasLocation: true,
      coordinates: location.coordinates,
      address: location.address,
      accuracy: location.accuracy,
    }
  }

  getDeviceInfo(): {
    userAgent?: string
    platform?: string
    deviceType?: string
  } {
    return this.metadata?.deviceInfo || {}
  }

  getVerificationInfo(): {
    method?: string
    confidence?: number
    additionalData?: any
  } {
    return this.metadata?.verification || {}
  }

  hasExceptions(): boolean {
    return !!(this.metadata?.exceptions?.reason)
  }

  getExceptionInfo(): {
    reason?: string
    approvedBy?: string
    approvedAt?: Date
    documentation?: string
  } {
    return this.metadata?.exceptions || {}
  }

  updateCheckIn(time: Date, deviceInfo?: any, location?: any): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.deviceInfo) {
      this.metadata.deviceInfo = {}
    }

    this.metadata.checkInTime = time
    this.recordedAt = time

    if (deviceInfo) {
      Object.assign(this.metadata.deviceInfo, deviceInfo)
    }

    if (location) {
      if (!this.metadata.location) {
        this.metadata.location = {}
      }
      Object.assign(this.metadata.location, location)
    }

    // 如果迟到，更新状态
    if (this.wasLateArrival() && this.status !== AttendanceStatus.LATE) {
      this.status = AttendanceStatus.LATE
    }
  }

  updateCheckOut(time: Date): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.checkOutTime = time

    // 如果早退，更新状态
    if (this.hadEarlyDeparture() && this.status !== AttendanceStatus.EARLY_DEPARTURE) {
      this.status = AttendanceStatus.EARLY_DEPARTURE
    }
  }

  updateBehavior(data: {
    participationLevel?: 'low' | 'medium' | 'high'
    attentionLevel?: 'low' | 'medium' | 'high'
    interactions?: number
    timeOnTask?: number
  }): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.behavior) {
      this.metadata.behavior = {}
    }

    Object.assign(this.metadata.behavior, data)
  }

  addException(reason: string, approvedBy: string, documentation?: string): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.exceptions = {
      reason,
      approvedBy,
      approvedAt: new Date(),
      documentation,
    }

    this.status = AttendanceStatus.EXCUSED
  }

  isValid(): boolean {
    // 检查考勤记录是否有效
    if (!this.studentId || !this.sessionId) return false
    if (!this.recordedAt) return false

    // 检查记录时间是否在合理范围内
    const now = new Date()
    const recordTime = this.recordedAt.getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时

    return Math.abs(now.getTime() - recordTime) < maxAge
  }
}