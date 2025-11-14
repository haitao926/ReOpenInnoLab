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

import { Course } from './course.entity'
import { Lesson } from './lesson.entity'
import { Tenant } from './tenant.entity'

@Entity('course_instances')
@Index(['tenantId', 'courseId'])
@Index(['tenantId', 'classroomId'])
export class CourseInstance {
  @ApiProperty({ description: '课程实例ID' })
  @PrimaryGeneratedColumn('uuid')
    id: string

  @ApiProperty({ description: '租户ID' })
  @Column({ type: 'varchar', length: 255 })
    tenantId: string

  @ApiProperty({ description: '关联课程ID' })
  @Column({ type: 'varchar', length: 255 })
    courseId: string

  @ApiProperty({ description: '班级ID' })
  @Column({ type: 'varchar', length: 255 })
    classroomId: string

  @ApiProperty({ description: '课程实例标题' })
  @Column({ type: 'varchar', length: 255 })
    title: string

  @ApiProperty({ description: '课程实例描述', required: false })
  @Column({ type: 'text', nullable: true })
    description?: string

  @ApiProperty({ description: '课程实例状态' })
  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'archived', 'completed'],
    default: 'draft'
  })
    status: string

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

  @ApiProperty({ description: '当前学生数量' })
  @Column({ type: 'int', default: 0 })
    currentStudentCount: number

  @ApiProperty({ description: '最大学生数量', required: false })
  @Column({ type: 'int', nullable: true })
    maxStudents?: number

  @ApiProperty({ description: '课程实例设置', required: false })
  @Column({ type: 'json', nullable: true })
    settings?: Record<string, any>

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
  @ManyToOne(() => Course)
    course: Course

  @ManyToOne(() => Tenant)
    tenant: Tenant

  @OneToMany(() => Lesson, lesson => lesson.courseInstance)
    lessons: Lesson[]
}