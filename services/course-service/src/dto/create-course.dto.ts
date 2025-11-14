import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional, IsNumber, IsUUID, IsArray, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

import { CourseStatus, DeliveryMode, GradeBand } from '../database/entities/course.entity'
import { ModuleType, ModuleStatus } from '../database/entities/course-module.entity'
import { ActivityType, ActivityStatus } from '../database/entities/course-activity.entity'

export class CreateCourseDto {
  @ApiProperty({
    description: '课程代码',
    example: 'CS101'
  })
  @IsString()
    code: string

  @ApiProperty({
    description: '课程标题',
    example: '计算机科学基础'
  })
  @IsString()
    title: string

  @ApiPropertyOptional({
    description: '课程描述',
    example: '这是一门计算机科学入门课程，涵盖基本概念和原理。'
  })
  @IsString()
  @IsOptional()
    description?: string

  @ApiProperty({
    description: '适用年级',
    enum: GradeBand,
    example: GradeBand.G9
  })
  @IsEnum(GradeBand)
    gradeBand: GradeBand

  @ApiProperty({
    description: '学科',
    example: '计算机科学'
  })
  @IsString()
    subject: string

  @ApiPropertyOptional({
    description: '授课模式',
    enum: DeliveryMode,
    example: DeliveryMode.HYBRID
  })
  @IsEnum(DeliveryMode)
  @IsOptional()
    deliveryMode?: DeliveryMode

  @ApiPropertyOptional({
    description: '预计学时',
    example: 48
  })
  @IsNumber()
  @IsOptional()
    estimatedHours?: number

  @ApiPropertyOptional({
    description: '学分',
    example: 3
  })
  @IsNumber()
  @IsOptional()
    creditHours?: number

  @ApiPropertyOptional({
    description: '课程缩略图',
    example: 'https://example.com/course-thumbnail.jpg'
  })
  @IsString()
  @IsOptional()
    thumbnail?: string

  @ApiPropertyOptional({
    description: '课程元数据',
    example: {
      tags: ['编程', '算法', '数据结构'],
      difficulty: 'beginner',
      prerequisites: ['基础数学']
    }
  })
  @IsObject()
  @IsOptional()
    metadata?: Record<string, any>
}

export class CreateModuleDto {
  @ApiProperty({
    description: '模块标题',
    example: '算法基础'
  })
  @IsString()
    title: string

  @ApiPropertyOptional({
    description: '模块描述',
    example: '学习基本算法概念和实现。'
  })
  @IsString()
  @IsOptional()
    description?: string

  @ApiProperty({
    description: '模块类型',
    enum: ModuleType,
    example: ModuleType.KNOWLEDGE
  })
  @IsEnum(ModuleType)
    type: ModuleType

  @ApiPropertyOptional({
    description: '预计时长（分钟）',
    example: 90
  })
  @IsNumber()
  @IsOptional()
    estimatedMinutes?: number

  @ApiPropertyOptional({
    description: '是否必需',
    example: true
  })
  @IsOptional()
    isRequired?: boolean

  @ApiPropertyOptional({
    description: '是否有前置依赖',
    example: false
  })
  @IsOptional()
    hasPrerequisites?: boolean

  @ApiPropertyOptional({
    description: '前置依赖模块ID列表',
    example: ['module-1-id', 'module-2-id']
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
    prerequisites?: string[]

  @ApiPropertyOptional({
    description: '模块活动列表',
    type: () => CreateActivityDto,
    isArray: true
  })
  @IsArray()
  @IsOptional()
  @Type(() => CreateActivityDto)
    activities?: CreateActivityDto[]
}

export class CreateActivityDto {
  @ApiProperty({
    description: '活动标题',
    example: '冒泡排序算法'
  })
  @IsString()
    title: string

  @ApiPropertyOptional({
    description: '活动描述',
    example: '学习并实现冒泡排序算法。'
  })
  @IsString()
  @IsOptional()
    description?: string

  @ApiProperty({
    description: '活动类型',
    enum: ActivityType,
    example: ActivityType.KNOWLEDGE
  })
  @IsEnum(ActivityType)
    type: ActivityType

  @ApiPropertyOptional({
    description: '活动内容',
    example: '冒泡排序是一种简单的排序算法...'
  })
  @IsString()
  @IsOptional()
    content?: string

  @ApiPropertyOptional({
    description: '资源引用',
    example: {
      uri: 'https://example.com/bubble-sort.pdf',
      type: 'document'
    }
  })
  @IsObject()
  @IsOptional()
    resourceRef?: {
    uri: string
    type: string
    metadata?: Record<string, any>
  }

  @ApiPropertyOptional({
    description: 'AI提示',
    example: {
      hints: ['注意比较相邻元素', '需要多轮遍历'],
      suggestions: ['可以尝试优化算法']
    }
  })
  @IsObject()
  @IsOptional()
    aiHintsJson?: {
    hints?: string[]
    suggestions?: string[]
    adaptations?: Record<string, any>
  }

  @ApiPropertyOptional({
    description: '预计时长（分钟）',
    example: 45
  })
  @IsNumber()
  @IsOptional()
    estimatedMinutes?: number

  @ApiPropertyOptional({
    description: '是否必需',
    example: true
  })
  @IsOptional()
    isRequired?: boolean

  @ApiPropertyOptional({
    description: '是否评分',
    example: false
  })
  @IsOptional()
    isGraded?: boolean

  @ApiPropertyOptional({
    description: '最高分数',
    example: 100
  })
  @IsNumber()
  @IsOptional()
    maxScore?: number
}

export class CreateCourseWithContentDto extends CreateCourseDto {
  @ApiPropertyOptional({
    description: '课程版本',
    example: '1.0.0'
  })
  @IsString()
  @IsOptional()
    version?: string

  @ApiPropertyOptional({
    description: 'ACL内容',
    example: {
      title: '计算机科学基础课程',
      description: '课程描述',
      modules: [
        {
          title: '第一章：介绍',
          activities: [
            {
              title: '课程介绍',
              type: 'intro'
            }
          ]
        }
      ]
    }
  })
  @IsObject()
  @IsOptional()
    aclContent?: any

  @ApiPropertyOptional({
    description: '课程模块列表',
    type: [CreateModuleDto]
  })
  @IsArray()
  @IsOptional()
  @Type(() => CreateModuleDto)
    modules?: CreateModuleDto[]

  @ApiPropertyOptional({
    description: '版本元数据',
    example: {
      changelog: '初始版本',
      breakingChanges: false
    }
  })
  @IsObject()
  @IsOptional()
    versionMetadata?: {
    changelog?: string
    breakingChanges?: boolean
    migrationNotes?: string
    compatibility?: string
  }
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: '课程标题',
    example: '计算机科学基础（更新版）'
  })
  @IsString()
  @IsOptional()
    title?: string

  @ApiPropertyOptional({
    description: '课程描述',
    example: '更新的课程描述'
  })
  @IsString()
  @IsOptional()
    description?: string

  @ApiPropertyOptional({
    description: '授课模式',
    enum: DeliveryMode
  })
  @IsEnum(DeliveryMode)
  @IsOptional()
    deliveryMode?: DeliveryMode

  @ApiPropertyOptional({
    description: '预计学时',
    example: 60
  })
  @IsNumber()
  @IsOptional()
    estimatedHours?: number

  @ApiPropertyOptional({
    description: '学分',
    example: 4
  })
  @IsNumber()
  @IsOptional()
    creditHours?: number

  @ApiPropertyOptional({
    description: '课程缩略图'
  })
  @IsString()
  @IsOptional()
    thumbnail?: string

  @ApiPropertyOptional({
    description: '课程状态',
    enum: CourseStatus
  })
  @IsEnum(CourseStatus)
  @IsOptional()
    status?: CourseStatus

  @ApiPropertyOptional({
    description: '课程元数据'
  })
  @IsObject()
  @IsOptional()
    metadata?: Record<string, any>
}