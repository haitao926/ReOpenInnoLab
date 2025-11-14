import { IsString, IsArray, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ExperimentDesignDto {
  @ApiProperty({
    description: '实验主题',
    example: '验证光合作用产生氧气'
  })
  @IsString()
  topic: string

  @ApiProperty({
    description: '学科',
    example: '生物'
  })
  @IsString()
  subject: string

  @ApiProperty({
    description: '适用年级',
    example: '高一'
  })
  @IsString()
  grade: string

  @ApiProperty({
    description: '可用材料',
    example: ['水生植物', '试管', '光源', '碳酸氢钠溶液']
  })
  @IsArray()
  @IsString({ each: true })
  availableMaterials: string[]

  @ApiPropertyOptional({
    description: '安全限制',
    example: ['避免强光直射眼睛', '小心玻璃制品']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  safetyConstraints?: string[]
}