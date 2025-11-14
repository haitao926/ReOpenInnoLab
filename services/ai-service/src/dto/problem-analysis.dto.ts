import { IsString, IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ProblemAnalysisDto {
  @ApiProperty({
    description: '背景信息',
    example: '学生正在学习能量守恒定律'
  })
  @IsString()
  context: string

  @ApiProperty({
    description: '问题内容',
    example: '为什么在自由落体运动中，不同质量的物体下落速度相同？'
  })
  @IsString()
  question: string

  @ApiProperty({
    description: '难度级别',
    enum: ['basic', 'intermediate', 'advanced'],
    example: 'intermediate'
  })
  @IsEnum(['basic', 'intermediate', 'advanced'])
  difficulty: 'basic' | 'intermediate' | 'advanced'

  @ApiProperty({
    description: '学科',
    example: '物理'
  })
  @IsString()
  subject: string
}