import {
  Controller,
  Get,
  UseGuards,
  Request,
  Logger,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('学科管理')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubjectsController {
  private readonly logger = new Logger(SubjectsController.name)

  constructor() {}

  @Get('teacher/me')
  @ApiOperation({ summary: '获取当前教师的学科列表' })
  @ApiResponse({
    status: 200,
    description: '成功获取教师学科列表',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            subjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'ai' },
                  name: { type: 'string', example: '人工智能' },
                  code: { type: 'string', example: 'AI' },
                  description: { type: 'string', example: '人工智能与机器学习' },
                  color: { type: 'string', example: '#8b5cf6' },
                  icon: { type: 'string', example: 'Cpu' },
                  isActive: { type: 'boolean', example: true },
                  courseCount: { type: 'number', example: 0 },
                  studentCount: { type: 'number', example: 0 }
                }
              }
            },
            totalCount: { type: 'number', example: 10 },
            defaultSubject: { type: 'string', example: 'my-subjects' }
          }
        }
      }
    }
  })
  async getTeacherSubjects(@Request() req: any) {
    this.logger.log(`Getting subjects for teacher: ${req.user?.sub || 'unknown'}`)

    // 临时返回默认学科列表，后续应该从数据库获取
    const defaultSubjects = [
      {
        id: 'my-subjects',
        name: '我的学科',
        code: 'MY_SUBJECTS',
        description: '我的主教学科',
        color: '#6366f1',
        icon: 'Collection',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'ai',
        name: '人工智能',
        code: 'AI',
        description: '人工智能与机器学习',
        color: '#8b5cf6',
        icon: 'Cpu',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'it',
        name: '信息技术',
        code: 'IT',
        description: '信息技术基础',
        color: '#3b82f6',
        icon: 'Monitor',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'physics',
        name: '物理',
        code: 'PHYSICS',
        description: '物理学基础',
        color: '#06b6d4',
        icon: 'Compass',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'chemistry',
        name: '化学',
        code: 'CHEMISTRY',
        description: '化学基础',
        color: '#10b981',
        icon: 'Science',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'math',
        name: '数学',
        code: 'MATH',
        description: '数学基础',
        color: '#f59e0b',
        icon: 'Calculate',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'biology',
        name: '生物',
        code: 'BIOLOGY',
        description: '生物学基础',
        color: '#22c55e',
        icon: 'Leaf',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'language',
        name: '语文',
        code: 'LANGUAGE',
        description: '语言文学',
        color: '#ef4444',
        icon: 'Reading',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'english',
        name: '英语',
        code: 'ENGLISH',
        description: '英语语言',
        color: '#ec4899',
        icon: 'ChatLineRound',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'all',
        name: '全部学科',
        code: 'ALL',
        description: '所有学科',
        color: '#64748b',
        icon: 'Grid',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      }
    ]

    return {
      success: true,
      data: {
        subjects: defaultSubjects,
        totalCount: defaultSubjects.length,
        defaultSubject: 'my-subjects'
      }
    }
  }

  @Get('recommendations/me')
  @ApiOperation({ summary: '获取当前教师的推荐学科列表' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制', example: 5 })
  @ApiResponse({
    status: 200,
    description: '成功获取推荐学科列表',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ai' },
              name: { type: 'string', example: '人工智能' },
              code: { type: 'string', example: 'AI' },
              description: { type: 'string', example: '人工智能与机器学习' },
              color: { type: 'string', example: '#8b5cf6' },
              icon: { type: 'string', example: 'Cpu' },
              isActive: { type: 'boolean', example: true },
              courseCount: { type: 'number', example: 0 },
              studentCount: { type: 'number', example: 0 }
            }
          }
        }
      }
    }
  })
  async getRecommendedSubjects(@Request() req: any, @Query('limit') limit?: string) {
    this.logger.log(`Getting recommended subjects for teacher: ${req.user?.sub || 'unknown'}`)

    const limitNumber = limit ? parseInt(limit, 10) : 5

    // 临时返回推荐学科列表，后续应该基于用户行为和偏好进行智能推荐
    const recommendedSubjects = [
      {
        id: 'ai',
        name: '人工智能',
        code: 'AI',
        description: '人工智能与机器学习',
        color: '#8b5cf6',
        icon: 'Cpu',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'it',
        name: '信息技术',
        code: 'IT',
        description: '信息技术基础',
        color: '#3b82f6',
        icon: 'Monitor',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'physics',
        name: '物理',
        code: 'PHYSICS',
        description: '物理学基础',
        color: '#06b6d4',
        icon: 'Compass',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'chemistry',
        name: '化学',
        code: 'CHEMISTRY',
        description: '化学基础',
        color: '#10b981',
        icon: 'Science',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'math',
        name: '数学',
        code: 'MATH',
        description: '数学基础',
        color: '#f59e0b',
        icon: 'Calculate',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      }
    ]

    return {
      success: true,
      data: recommendedSubjects.slice(0, limitNumber)
    }
  }
}