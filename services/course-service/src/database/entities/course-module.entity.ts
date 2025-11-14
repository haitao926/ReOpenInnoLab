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

import { CourseVersion } from './course-version.entity'
import { CourseActivity } from './course-activity.entity'

export enum ModuleType {
  INTRODUCTION = 'introduction',
  KNOWLEDGE = 'knowledge',
  ACTIVITY = 'activity',
  ASSIGNMENT = 'assignment',
  ASSESSMENT = 'assessment',
  RESOURCE = 'resource',
}

export enum ModuleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('course_modules')
@Index(['courseVersionId', 'order'])
@Index(['type'])
@Index(['status'])
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column({ type: 'uuid', name: 'course_version_id' })
  @IsUUID()
    courseVersionId: string

  @Column({ type: 'integer' })
    order: number

  @Column({ type: 'varchar', length: 255 })
    title: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
    description?: string

  @Column({
    type: 'enum',
    enum: ModuleType,
    name: 'module_type'
  })
  @IsEnum(ModuleType)
    type: ModuleType

  @Column({
    type: 'enum',
    enum: ModuleStatus,
    default: ModuleStatus.DRAFT
  })
  @IsEnum(ModuleStatus)
    status: ModuleStatus

  @Column({ type: 'integer', name: 'estimated_minutes', nullable: true })
  @IsOptional()
    estimatedMinutes?: number

  @Column({ type: 'boolean', name: 'is_required', default: true })
    isRequired: boolean

  @Column({ type: 'boolean', name: 'has_prerequisites', default: false })
    hasPrerequisites: boolean

  @Column({ type: 'jsonb', name: 'prerequisites', nullable: true })
  @IsOptional()
    prerequisites?: string[] // 依赖的其他模块ID

  @Column({ type: 'jsonb', name: 'metadata', default: '{}' })
  @IsOptional()
    metadata?: Record<string, any>

  // Relationships
  @ManyToOne(() => CourseVersion, { nullable: false })
  @JoinColumn({ name: 'course_version_id' })
    courseVersion: CourseVersion

  @OneToMany(() => CourseActivity, (activity) => activity.module)
    activities: CourseActivity[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date

  // Virtual fields
  get isPublished(): boolean {
    return this.status === ModuleStatus.PUBLISHED
  }

  get isDraft(): boolean {
    return this.status === ModuleStatus.DRAFT
  }

  get isHidden(): boolean {
    return this.status === ModuleStatus.HIDDEN
  }

  // Helper methods
  getTypeDisplay(): string {
    const typeMap: Record<ModuleType, string> = {
      [ModuleType.INTRODUCTION]: '介绍',
      [ModuleType.KNOWLEDGE]: '知识',
      [ModuleType.ACTIVITY]: '活动',
      [ModuleType.ASSIGNMENT]: '作业',
      [ModuleType.ASSESSMENT]: '评估',
      [ModuleType.RESOURCE]: '资源'
    }
    return typeMap[this.type] || this.type
  }

  getStatusDisplay(): string {
    const statusMap: Record<ModuleStatus, string> = {
      [ModuleStatus.DRAFT]: '草稿',
      [ModuleStatus.PUBLISHED]: '已发布',
      [ModuleStatus.HIDDEN]: '隐藏'
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

  hasPrerequisiteModules(): boolean {
    return Boolean(this.hasPrerequisites &&
           this.prerequisites &&
           this.prerequisites.length > 0)
  }

  isAccessibleBy(userCompletedModules: string[]): boolean {
    if (!this.hasPrerequisiteModules()) {
      return true
    }

    return this.prerequisites!.every(prereqId =>
      userCompletedModules.includes(prereqId)
    )
  }

  getProgress(userCompletedActivities: string[]): {
    total: number
    completed: number
    percentage: number
  } {
    if (!this.activities || this.activities.length === 0) {
      return { total: 0, completed: 0, percentage: 0 }
    }

    const total = this.activities.length
    const completed = this.activities.filter(activity =>
      userCompletedActivities.includes(activity.id)
    ).length

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, percentage }
  }
}