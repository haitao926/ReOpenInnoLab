import { IsString, IsOptional, IsEnum, IsNumber, IsObject, IsArray, IsDateString, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum LessonStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LessonType {
  REGULAR = 'regular',
  REVIEW = 'review',
  EXAM = 'exam',
  LAB = 'lab',
  PRESENTATION = 'presentation',
}

export class CreateLessonDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
    courseId: string

  @ApiProperty({ description: '班级ID' })
  @IsString()
    classroomId: string

  @ApiProperty({ description: '课程实例标题', example: '第一章：代数基础' })
  @IsString()
    title: string

  @ApiPropertyOptional({ description: '课程实例描述', example: '本章将学习代数的基础概念和运算' })
  @IsString()
  @IsOptional()
    description?: string

  @ApiPropertyOptional({ description: '课程类型', enum: LessonType })
  @IsEnum(LessonType)
  @IsOptional()
    type?: LessonType

  @ApiPropertyOptional({ description: '计划开始时间', example: '2025-11-10T09:00:00Z' })
  @IsDateString()
  @IsOptional()
    scheduledStartAt?: string

  @ApiPropertyOptional({ description: '计划结束时间', example: '2025-11-10T10:30:00Z' })
  @IsDateString()
  @IsOptional()
    scheduledEndAt?: string

  @ApiPropertyOptional({ description: '预计时长（分钟）', example: 90 })
  @IsNumber()
  @Min(1)
  @Max(480)
  @IsOptional()
    estimatedDuration?: number

  @ApiPropertyOptional({ description: '最大参与人数', example: 30 })
  @IsNumber()
  @Min(1)
  @Max(200)
  @IsOptional()
    maxParticipants?: number

  @ApiPropertyOptional({ description: '是否自动录制', example: false })
  @IsOptional()
    autoRecord?: boolean

  @ApiPropertyOptional({ description: '课程设置', example: { allowQuestions: true, enableChat: true } })
  @IsObject()
  @IsOptional()
    settings?: Record<string, any>

  @ApiPropertyOptional({ description: '预设环节列表' })
  @IsArray()
  @IsOptional()
    sections?: Array<{
    title: string
    type: string
    content: any
    order: number
    duration: number
  }>
}

export class UpdateLessonDto {
  @ApiPropertyOptional({ description: '课程实例标题' })
  @IsString()
  @IsOptional()
    title?: string

  @ApiPropertyOptional({ description: '课程实例描述' })
  @IsString()
  @IsOptional()
    description?: string

  @ApiPropertyOptional({ description: '课程状态', enum: LessonStatus })
  @IsEnum(LessonStatus)
  @IsOptional()
    status?: LessonStatus

  @ApiPropertyOptional({ description: '计划开始时间' })
  @IsDateString()
  @IsOptional()
    scheduledStartAt?: string

  @ApiPropertyOptional({ description: '计划结束时间' })
  @IsDateString()
  @IsOptional()
    scheduledEndAt?: string

  @ApiPropertyOptional({ description: '预计时长（分钟）' })
  @IsNumber()
  @Min(1)
  @Max(480)
  @IsOptional()
    estimatedDuration?: number

  @ApiPropertyOptional({ description: '最大参与人数' })
  @IsNumber()
  @Min(1)
  @Max(200)
  @IsOptional()
    maxParticipants?: number

  @ApiPropertyOptional({ description: '实际开始时间' })
  @IsDateString()
  @IsOptional()
    actualStartAt?: string

  @ApiPropertyOptional({ description: '实际结束时间' })
  @IsDateString()
  @IsOptional()
    actualEndAt?: string

  @ApiPropertyOptional({ description: '课程设置' })
  @IsObject()
  @IsOptional()
    settings?: Record<string, any>

  @ApiPropertyOptional({ description: '结束原因' })
  @IsString()
  @IsOptional()
    endReason?: string

  @ApiPropertyOptional({ description: '结束备注' })
  @IsString()
  @IsOptional()
    endNotes?: string
}

export class StartLessonDto {
  @ApiPropertyOptional({ description: '开始备注', example: '准备好开始今天的课程' })
  @IsString()
  @IsOptional()
    startNotes?: string

  @ApiPropertyOptional({ description: '初始设置', example: { enableRecording: true } })
  @IsObject()
  @IsOptional()
    initialSettings?: Record<string, any>
}