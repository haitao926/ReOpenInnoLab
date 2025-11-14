import { IsString, IsOptional, IsBoolean, IsNumber, Max, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ReasoningRequestDto {
  @ApiProperty({
    description: '请求内容',
    example: '请设计一个关于光合作用的课程教学方案'
  })
  @IsString()
  content: string

  @ApiPropertyOptional({
    description: '系统提示词',
    example: '你是一位专业的生物学教师'
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string

  @ApiPropertyOptional({
    description: '任务类型',
    enum: ['courseDesign', 'contentGeneration', 'labGuidance', 'assignmentGrading', 'learningAnalytics', 'realtimeQA', 'complexProblemSolving']
  })
  @IsOptional()
  @IsString()
  taskType?: string

  @ApiPropertyOptional({
    description: '是否启用推理模式',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  enableReasoning?: boolean

  @ApiPropertyOptional({
    description: '最大令牌数',
    maximum: 65536,
    minimum: 1,
    default: 32768
  })
  @IsOptional()
  @IsNumber()
  @Max(65536)
  @Min(1)
  maxTokens?: number
}