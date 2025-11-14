import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator'

export class UpdateAssignmentDto {
  @ApiProperty({ description: '作业标题', required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ description: '作业描述', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: '作业状态', enum: ['draft', 'published', 'closed', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'closed', 'archived'])
  status?: string

  @ApiProperty({ description: '总分', required: false })
  @IsOptional()
  @IsNumber()
  totalPoints?: number

  @ApiProperty({ description: '及格分数', required: false })
  @IsOptional()
  @IsNumber()
  passingScore?: number

  @ApiProperty({ description: '时间限制（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  timeLimit?: number

  @ApiProperty({ description: '最大尝试次数', required: false })
  @IsOptional()
  @IsNumber()
  maxAttempts?: number

  @ApiProperty({ description: '是否显示正确答案', required: false })
  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean

  @ApiProperty({ description: '是否随机排序题目', required: false })
  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean

  @ApiProperty({ description: '作业设置', required: false })
  @IsOptional()
  settings?: {
    allowLateSubmission: boolean
    latePenalty: number
    showFeedback: boolean
    autoGrade: boolean
    aiAssistance: boolean
  }

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  startsAt?: Date

  @ApiProperty({ description: '截止时间', required: false })
  @IsOptional()
  dueAt?: Date
}