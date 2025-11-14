import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

import { Lesson } from './lesson.entity'
import { Tenant } from './tenant.entity'

@Entity('sections')
@Index(['tenantId', 'lessonId'])
@Index(['tenantId', 'lessonId', 'order'])
export class Section {
  @ApiProperty({ description: '环节ID' })
  @PrimaryGeneratedColumn('uuid')
    id: string

  @ApiProperty({ description: '租户ID' })
  @Column({ type: 'varchar', length: 255 })
    tenantId: string

  @ApiProperty({ description: '课程实例ID' })
  @Column({ type: 'varchar', length: 255 })
    lessonId: string

  @ApiProperty({ description: '环节标题' })
  @Column({ type: 'varchar', length: 255 })
    title: string

  @ApiProperty({ description: '环节描述', required: false })
  @Column({ type: 'text', nullable: true })
    description?: string

  @ApiProperty({ description: '环节类型' })
  @Column({
    type: 'enum',
    enum: ['introduction', 'knowledge', 'experience', 'experiment', 'assignment', 'summary']
  })
    type: string

  @ApiProperty({ description: '环节内容' })
  @Column({ type: 'json' })
    content: Record<string, any>

  @ApiProperty({ description: '环节顺序' })
  @Column({ type: 'int' })
    order: number

  @ApiProperty({ description: '预计时长（分钟）' })
  @Column({ type: 'int' })
    duration: number

  @ApiProperty({ description: '是否为必选环节' })
  @Column({ type: 'boolean', default: true })
    required: boolean

  @ApiProperty({ description: '是否可跳过' })
  @Column({ type: 'boolean', default: false })
    skippable: boolean

  @ApiProperty({ description: '环节状态' })
  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'completed', 'skipped'],
    default: 'pending'
  })
    status: string

  @ApiProperty({ description: '实际开始时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
    actualStartAt?: Date

  @ApiProperty({ description: '实际结束时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
    actualEndAt?: Date

  @ApiProperty({ description: '实际时长（分钟）', required: false })
  @Column({ type: 'int', nullable: true })
    actualDuration?: number

  @ApiProperty({ description: '环节设置', required: false })
  @Column({ type: 'json', nullable: true })
    settings?: Record<string, any>

  @ApiProperty({ description: '评估标准', required: false })
  @Column({ type: 'json', nullable: true })
    assessmentCriteria?: Record<string, any>

  @ApiProperty({ description: 'AI提示', required: false })
  @Column({ type: 'json', nullable: true })
    aiHints?: Array<{
    type: string
    content: string
    priority: string
  }>

  @ApiProperty({ description: '资源引用', required: false })
  @Column({ type: 'json', nullable: true })
    resourceRefs?: Array<{
    type: string
    id: string
    title: string
  }>

  @ApiProperty({ description: '完成条件', required: false })
  @Column({ type: 'json', nullable: true })
    completionConditions?: Record<string, any>

  @ApiProperty({ description: '创建者用户ID' })
  @Column({ type: 'varchar', length: 255 })
    createdBy: string

  @ApiProperty({ description: '更新者用户ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    updatedBy?: string

  @ApiProperty({ description: '备注', required: false })
  @Column({ type: 'text', nullable: true })
    notes?: string

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date

  // 关联关系
  @ManyToOne(() => Lesson, lesson => lesson.sections)
    lesson: Lesson

  @ManyToOne(() => Tenant)
    tenant: Tenant
}