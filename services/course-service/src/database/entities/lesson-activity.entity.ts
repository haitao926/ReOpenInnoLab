import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

import { Lesson } from './lesson.entity'
import { Section } from './section.entity'
import { Tenant } from './tenant.entity'

@Entity('lesson_activities')
@Index(['tenantId', 'lessonId'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'action'])
@Index(['tenantId', 'createdAt'])
export class LessonActivity {
  @ApiProperty({ description: '活动ID' })
  @PrimaryGeneratedColumn('uuid')
    id: string

  @ApiProperty({ description: '租户ID' })
  @Column({ type: 'varchar', length: 255 })
    tenantId: string

  @ApiProperty({ description: '课程实例ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    lessonId?: string

  @ApiProperty({ description: '环节ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    sectionId?: string

  @ApiProperty({ description: '用户ID' })
  @Column({ type: 'varchar', length: 255 })
    userId: string

  @ApiProperty({ description: '用户角色' })
  @Column({
    type: 'enum',
    enum: ['teacher', 'student', 'assistant', 'observer'],
    default: 'teacher'
  })
    userRole: string

  @ApiProperty({ description: '活动类型' })
  @Column({
    type: 'enum',
    enum: [
      'lesson_created',
      'lesson_updated',
      'lesson_started',
      'lesson_paused',
      'lesson_resumed',
      'lesson_ended',
      'section_added',
      'section_updated',
      'section_removed',
      'section_changed',
      'annotation_saved',
      'participant_joined',
      'participant_left',
      'interaction_started',
      'assignment_submitted',
      'experiment_started',
      'feedback_provided',
      'resource_accessed',
      'system_alert'
    ]
  })
    action: string

  @ApiProperty({ description: '活动详情', required: false })
  @Column({ type: 'json', nullable: true })
    details?: Record<string, any>

  @ApiProperty({ description: 'IP地址', required: false })
  @Column({ type: 'varchar', length: 45, nullable: true })
    ipAddress?: string

  @ApiProperty({ description: '用户代理', required: false })
  @Column({ type: 'text', nullable: true })
    userAgent?: string

  @ApiProperty({ description: '设备信息', required: false })
  @Column({ type: 'json', nullable: true })
    deviceInfo?: Record<string, any>

  @ApiProperty({ description: '地理位置', required: false })
  @Column({ type: 'json', nullable: true })
    location?: {
    country?: string
    region?: string
    city?: string
  }

  @ApiProperty({ description: '会话ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    sessionId?: string

  @ApiProperty({ description: '请求ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    requestId?: string

  @ApiProperty({ description: '是否成功' })
  @Column({ type: 'boolean', default: true })
    success: boolean

  @ApiProperty({ description: '错误信息', required: false })
  @Column({ type: 'text', nullable: true })
    errorMessage?: string

  @ApiProperty({ description: '执行时长（毫秒）', required: false })
  @Column({ type: 'int', nullable: true })
    duration?: number

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date

  // 关联关系
  @ManyToOne(() => Lesson, lesson => lesson.activities)
    lesson?: Lesson

  @ManyToOne(() => Section)
    section?: Section

  @ManyToOne(() => Tenant)
    tenant: Tenant
}