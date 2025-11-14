import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { ThrottlerGuard } from '@nestjs/throttler'

import { CourseService } from './course.service'
import { CreateCourseDto, CreateCourseWithContentDto, UpdateCourseDto } from '../dto/create-course.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('课程管理')
@Controller('courses')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class CourseController {
  private readonly logger = new Logger(CourseController.name)

  constructor(private readonly courseService: CourseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建课程' })
  @ApiResponse({
    status: 201,
    description: '课程创建成功'
  })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Creating course: ${createCourseDto.code} for tenant: ${tenantId}`)
    return this.courseService.createCourse(createCourseDto, tenantId, userId)
  }

  @Post('with-content')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建带内容的课程' })
  @ApiResponse({
    status: 201,
    description: '带内容的课程创建成功',
    schema: {
      type: 'object',
      properties: {
        course: {
          type: 'object',
          description: '创建的课程信息'
        },
        versionId: {
          type: 'string',
          description: '初始版本ID'
        }
      }
    }
  })
  async createCourseWithContent(
    @Body() createCourseDto: CreateCourseWithContentDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Creating course with content: ${createCourseDto.code} for tenant: ${tenantId}`)
    return this.courseService.createCourseWithContent(createCourseDto, tenantId, userId)
  }

  @Get()
  @ApiOperation({ summary: '获取课程列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, description: '课程状态' })
  @ApiQuery({ name: 'subject', required: false, description: '学科' })
  @ApiQuery({ name: 'gradeBand', required: false, description: '年级段' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  async getCourses(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('subject') subject?: string,
    @Query('gradeBand') gradeBand?: string,
    @Query('search') search?: string
  ) {
    const options = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status: status as any,
      subject,
      gradeBand,
      search
    }

    return this.courseService.getCourses(tenantId, options)
  }

  @Get('stats')
  @ApiOperation({ summary: '获取课程统计信息' })
  async getCourseStats(@CurrentUser('tenantId') tenantId: string) {
    return this.courseService.getCourseStats(tenantId)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课程详情' })
  async getCourseById(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.courseService.getCourseById(id, tenantId)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新课程' })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Updating course: ${id}`)
    return this.courseService.updateCourse(id, updateCourseDto, tenantId, userId)
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发布课程' })
  async publishCourse(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Publishing course: ${id}`)
    return this.courseService.publishCourse(id, tenantId, userId)
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '归档课程' })
  async archiveCourse(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Archiving course: ${id}`)
    return this.courseService.archiveCourse(id, tenantId, userId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除课程' })
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    this.logger.log(`Deleting course: ${id}`)
    await this.courseService.deleteCourse(id, tenantId)
  }

  @Get(':id/versions/latest')
  @ApiOperation({ summary: '获取课程最新版本' })
  async getLatestVersion(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.courseService.getLatestVersion(id, tenantId)
  }

  @Get(':id/versions/published')
  @ApiOperation({ summary: '获取课程已发布版本' })
  async getPublishedVersion(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.courseService.getPublishedVersion(id, tenantId)
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建课程版本' })
  async createVersion(
    @Param('id') id: string,
    @Body() body: {
      aclContent: any
      versionMetadata?: any
    },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Creating version for course: ${id}`)
    return this.courseService.createVersion(
      id,
      body.aclContent,
      tenantId,
      userId,
      body.versionMetadata
    )
  }
}