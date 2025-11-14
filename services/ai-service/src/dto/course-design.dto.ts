import { IsString, IsArray, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CourseDesignDto {
  @ApiProperty({
    description: '学科',
    example: '生物'
  })
  @IsString()
  subject: string

  @ApiProperty({
    description: '年级',
    example: '高一'
  })
  @IsString()
  grade: string

  @ApiProperty({
    description: '课程主题',
    example: '光合作用'
  })
  @IsString()
  topic: string

  @ApiProperty({
    description: '课程时长',
    example: '45分钟'
  })
  @IsString()
  duration: string

  @ApiProperty({
    description: '教学目标',
    example: ['理解光合作用的基本原理', '掌握光合作用的化学方程式', '了解光合作用的意义']
  })
  @IsArray()
  @IsString({ each: true })
  objectives: string[]

  @ApiPropertyOptional({
    description: '特殊要求',
    example: '需要包含实验演示环节'
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string
}