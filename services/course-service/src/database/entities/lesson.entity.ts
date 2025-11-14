import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Index
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

import { CourseInstance } from './course-instance.entity'
import { Section } from './section.entity'
import { LessonActivity } from './lesson-activity.entity'
import { Tenant } from './tenant.entity'

@Entity('lessons')
@Index(['tenantId', 'courseId'])
@Index(['tenantId', 'classroomId'])
@Index(['tenantId', 'status'])
export class Lesson {
  @ApiProperty({ description: '课程实例ID' })
  @PrimaryGeneratedColumn('uuid')
    id: string

  @ApiProperty({ description: '租户ID' })
  @Column({ type: 'varchar', length: 255 })
    tenantId: string

  @ApiProperty({ description: '关联课程ID' })
  @Column({ type: 'varchar', length: 255 })
    courseId: string

  @ApiProperty({ description: '课程实例ID' })
  @Column({ type: 'varchar', length: 255 })
    courseInstanceId: string

  @ApiProperty({ description: '班级ID' })
  @Column({ type: 'varchar', length: 255 })
    classroomId: string

  @ApiProperty({ description: '课程标题' })
  @Column({ type: 'varchar', length: 255 })
    title: string

  @ApiProperty({ description: '课程描述', required: false })
  @Column({ type: 'text', nullable: true })
    description?: string

  @ApiProperty({ description: '课程状态' })
  @Column({
    type: 'enum',
    enum: ['draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  })
    status: string

  @ApiProperty({ description: '课程类型', required: false })
  @Column({
    type: 'enum',
    enum: ['regular', 'review', 'exam', 'lab', 'presentation'],
    nullable: true
  })
    type?: string

  @ApiProperty({ description: '计划开始时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
    scheduledStartAt?: Date

  @ApiProperty({ description: '计划结束时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
    scheduledEndAt?: Date

  @ApiProperty({ description: '实际开始时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
    actualStartAt?: Date

  @ApiProperty({ description: '实际结束时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
    actualEndAt?: Date

  @ApiProperty({ description: '预计时长（分钟）', required: false })
  @Column({ type: 'int', nullable: true })
    estimatedDuration?: number

  @ApiProperty({ description: '当前环节ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    currentSectionId?: string

  @ApiProperty({ description: '当前环节顺序', required: false })
  @Column({ type: 'int', nullable: true })
    currentSectionOrder?: number

  @ApiProperty({ description: '参与人数' })
  @Column({ type: 'int', default: 0 })
    participantCount: number

  @ApiProperty({ description: '最大参与人数', required: false })
  @Column({ type: 'int', nullable: true })
    maxParticipants?: number

  @ApiProperty({ description: '是否自动录制', required: false })
  @Column({ type: 'boolean', default: false })
    autoRecord: boolean

  @ApiProperty({ description: '课程设置', required: false })
  @Column({ type: 'json', nullable: true })
    settings?: Record<string, any>

  @ApiProperty({ description: '开始备注', required: false })
  @Column({ type: 'text', nullable: true })
    startNotes?: string

  @ApiProperty({ description: '结束原因', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    endReason?: string

  @ApiProperty({ description: '结束备注', required: false })
  @Column({ type: 'text', nullable: true })
    endNotes?: string

  @ApiProperty({ description: '创建者用户ID' })
  @Column({ type: 'varchar', length: 255 })
    createdBy: string

  @ApiProperty({ description: '更新者用户ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
    updatedBy?: string

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date

  // 关联关系
  @ManyToOne(() => CourseInstance, courseInstance => courseInstance.lessons)
    courseInstance: CourseInstance

  @ManyToOne(() => Tenant)
    tenant: Tenant

  @OneToMany(() => Section, section => section.lesson)
    sections: Section[]

  @OneToMany(() => LessonActivity, activity => activity.lesson)
    activities: LessonActivity[]
}