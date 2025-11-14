import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { CourseModule } from './course-module.entity'
import { ResourceRef } from './resource-ref.entity'

export enum ActivityType {
  INTRO = 'intro',
  KNOWLEDGE = 'knowledge',
  READING = 'reading',
  VIDEO = 'video',
  SIMULATION = 'simulation',
  EXPERIMENT = 'experiment',
  DISCUSSION = 'discussion',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
  PRESENTATION = 'presentation',
}

export enum ActivityStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('course_activities')
@Index(['moduleId', 'order'])
@Index(['type'])
@Index(['status'])
export class CourseActivity {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column({ type: 'uuid', name: 'module_id' })
  @IsUUID()
    moduleId: string

  @Column({ type: 'integer' })
    order: number

  @Column({ type: 'varchar', length: 255 })
    title: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
    description?: string

  @Column({
    type: 'enum',
    enum: ActivityType,
    name: 'activity_type'
  })
  @IsEnum(ActivityType)
    type: ActivityType

  @Column({ type: 'text', name: 'content', nullable: true })
  @IsOptional()
    content?: string

  @Column({ type: 'jsonb', name: 'resource_ref', nullable: true })
  @IsOptional()
    resourceRef?: {
    uri: string
    type: string
    metadata?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'ai_hints_json', nullable: true })
  @IsOptional()
    aiHintsJson?: {
    hints?: string[]
    suggestions?: string[]
    adaptations?: Record<string, any>
  }

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.DRAFT
  })
  @IsEnum(ActivityStatus)
    status: ActivityStatus

  @Column({ type: 'integer', name: 'estimated_minutes', nullable: true })
  @IsOptional()
    estimatedMinutes?: number

  @Column({ type: 'boolean', name: 'is_required', default: true })
    isRequired: boolean

  @Column({ type: 'boolean', name: 'is_graded', default: false })
    isGraded: boolean

  @Column({ type: 'integer', name: 'max_score', nullable: true })
  @IsOptional()
    maxScore?: number

  @Column({ type: 'jsonb', name: 'metadata', default: '{}' })
  @IsOptional()
    metadata?: Record<string, any>

  // Relationships
  @ManyToOne(() => CourseModule, { nullable: false })
  @JoinColumn({ name: 'module_id' })
    module: CourseModule

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date

  // Virtual fields
  get isPublished(): boolean {
    return this.status === ActivityStatus.PUBLISHED
  }

  get isDraft(): boolean {
    return this.status === ActivityStatus.DRAFT
  }

  get isArchived(): boolean {
    return this.status === ActivityStatus.ARCHIVED
  }

  // Helper methods
  getTypeDisplay(): string {
    const typeMap: Record<ActivityType, string> = {
      [ActivityType.INTRO]: '介绍',
      [ActivityType.KNOWLEDGE]: '知识',
      [ActivityType.READING]: '阅读',
      [ActivityType.VIDEO]: '视频',
      [ActivityType.SIMULATION]: '模拟',
      [ActivityType.EXPERIMENT]: '实验',
      [ActivityType.DISCUSSION]: '讨论',
      [ActivityType.QUIZ]: '测验',
      [ActivityType.ASSIGNMENT]: '作业',
      [ActivityType.PROJECT]: '项目',
      [ActivityType.PRESENTATION]: '展示'
    }
    return typeMap[this.type] || this.type
  }

  getStatusDisplay(): string {
    const statusMap: Record<ActivityStatus, string> = {
      [ActivityStatus.DRAFT]: '草稿',
      [ActivityStatus.PUBLISHED]: '已发布',
      [ActivityStatus.ARCHIVED]: '已归档'
    }
    return statusMap[this.status] || this.status
  }

  getDurationDisplay(): string {
    if (!this.estimatedMinutes) return '未知时长'

    const hours = Math.floor(this.estimatedMinutes / 60)
    const minutes = this.estimatedMinutes % 60

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
    }
    return `${minutes}分钟`
  }

  hasResource(): boolean {
    return !!this.resourceRef && !!this.resourceRef.uri
  }

  getResourceUri(): string {
    return this.resourceRef?.uri || ''
  }

  getResourceType(): string {
    return this.resourceRef?.type || ''
  }

  hasAiHints(): boolean {
    return !!this.aiHintsJson &&
           Object.keys(this.aiHintsJson).length > 0
  }

  getAiHints(): {
    hints?: string[]
    suggestions?: string[]
    adaptations?: Record<string, any>
    } {
    return this.aiHintsJson || {}
  }

  isInteractive(): boolean {
    return [
      ActivityType.SIMULATION,
      ActivityType.EXPERIMENT,
      ActivityType.DISCUSSION,
      ActivityType.QUIZ,
      ActivityType.PROJECT
    ].includes(this.type)
  }

  isContentBased(): boolean {
    return [
      ActivityType.INTRO,
      ActivityType.KNOWLEDGE,
      ActivityType.READING,
      ActivityType.VIDEO
    ].includes(this.type)
  }

  requiresSubmission(): boolean {
    return [
      ActivityType.ASSIGNMENT,
      ActivityType.PROJECT,
      ActivityType.PRESENTATION
    ].includes(this.type)
  }

  isAssessable(): boolean {
    return this.isGraded || this.requiresSubmission()
  }

  getCompletionCriteria(): string {
    if (this.requiresSubmission()) {
      return '需要提交作业'
    }
    if (this.isInteractive()) {
      return '需要完成交互活动'
    }
    return '需要查看内容'
  }
}