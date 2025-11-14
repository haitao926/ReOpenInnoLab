import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator'

export class GradeSubmissionDto {
  @ApiProperty({ description: '总分' })
  @IsNumber()
  score: number

  @ApiProperty({ description: '教师反馈', required: false })
  @IsOptional()
  @IsString()
  feedback?: string

  @ApiProperty({ description: '个别答案评分', required: false })
  @IsOptional()
  @IsArray()
  answers?: Array<{
    id: string
    teacherScore: number
    teacherComment?: string
  }>
}