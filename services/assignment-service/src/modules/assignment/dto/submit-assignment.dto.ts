import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsOptional, IsNumber } from 'class-validator'

export class SubmitAssignmentDto {
  @ApiProperty({ description: '学生答案列表' })
  @IsArray()
  answers: Array<{
    questionId: string
    answer: any
    timeSpent?: number
  }>

  @ApiProperty({ description: '总用时（秒）', required: false })
  @IsOptional()
  @IsNumber()
  timeSpent?: number
}