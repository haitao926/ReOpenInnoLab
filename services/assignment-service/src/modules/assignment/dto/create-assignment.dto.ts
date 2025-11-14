import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsEnum, IsDateString } from 'class-validator'

export enum AssignmentType {
  QUIZ = 'quiz',
  ESSAY = 'essay',
  PROJECT = 'project',
  CODE = 'code',
  EXPERIMENT = 'experiment'
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export class CreateAssignmentDto {
  @ApiProperty({ description: '作业标题' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ description: '作业描述' })
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  lessonId: string

  @ApiProperty({ description: '作业类型', enum: AssignmentType })
  @IsEnum(AssignmentType)
  type: AssignmentType

  @ApiProperty({ description: '作业状态', enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus

  @ApiProperty({ description: '总分', required: false })
  @IsOptional()
  @IsNumber()
  maxScore?: number

  @ApiProperty({ description: '截止时间', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string

  @ApiProperty({ description: '预计用时（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number

  @ApiProperty({ description: '作业题目/问题', required: false })
  @IsOptional()
  @IsArray()
  questions?: Array<{
    id: string
    type: string
    question: string
    options?: string[]
    correctAnswer?: any
    points: number
  }>

  @ApiProperty({ description: '作业要求', required: false })
  @IsOptional()
  requirements?: string[]

  @ApiProperty({ description: '资源文件', required: false })
  @IsOptional()
  resources?: Array<{
    id: string
    name: string
    type: string
    url: string
    size?: number
  }>

  @ApiProperty({ description: '设置选项', required: false })
  @IsOptional()
  settings?: {
    allowMultipleAttempts?: boolean
    showCorrectAnswers?: boolean
    timeLimit?: number
    shuffleQuestions?: boolean
    autoGrade?: boolean
  }
}