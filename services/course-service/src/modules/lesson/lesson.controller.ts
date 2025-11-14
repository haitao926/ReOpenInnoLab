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

import { LessonService } from './lesson.service'
import { CreateLessonDto, UpdateLessonDto, StartLessonDto } from './dto/create-lesson.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'

@ApiTags('课程实例管理')
@Controller('lessons')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class LessonController {
  private readonly logger = new Logger(LessonController.name)

  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建课程实例' })
  @ApiResponse({
    status: 201,
    description: '课程实例创建成功'
  })
  async createLesson(
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Creating lesson for course: ${createLessonDto.courseId} in classroom: ${createLessonDto.classroomId}`)
    return this.lessonService.createLesson(createLessonDto, tenantId, userId)
  }

  @Get()
  @ApiOperation({ summary: '获取课程实例列表' })
  @ApiQuery({ name: 'courseId', required: false, description: '课程ID' })
  @ApiQuery({ name: 'classroomId', required: false, description: '班级ID' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  async getLessons(
    @CurrentUser('tenantId') tenantId: string,
    @Query('courseId') courseId?: string,
    @Query('classroomId') classroomId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const options = {
      courseId,
      classroomId,
      status: status as any,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined
    }

    return this.lessonService.getLessons(tenantId, options)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课程实例详情' })
  async getLessonById(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.lessonService.getLessonById(id, tenantId)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新课程实例' })
  async updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Updating lesson: ${id}`)
    return this.lessonService.updateLesson(id, updateLessonDto, tenantId, userId)
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '开始课程实例' })
  async startLesson(
    @Param('id') id: string,
    @Body() startLessonDto: StartLessonDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Starting lesson: ${id}`)
    return this.lessonService.startLesson(id, startLessonDto, tenantId, userId)
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '暂停课程实例' })
  async pauseLesson(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Pausing lesson: ${id}`)
    return this.lessonService.pauseLesson(id, tenantId, userId)
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '恢复课程实例' })
  async resumeLesson(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Resuming lesson: ${id}`)
    return this.lessonService.resumeLesson(id, tenantId, userId)
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '结束课程实例' })
  async endLesson(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Ending lesson: ${id}`)
    return this.lessonService.endLesson(id, tenantId, userId)
  }

  @Get(':id/sections')
  @ApiOperation({ summary: '获取课程实例的环节列表' })
  async getLessonSections(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.lessonService.getLessonSections(id, tenantId)
  }

  @Post(':id/sections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '为课程实例添加环节' })
  async addLessonSection(
    @Param('id') id: string,
    @Body() sectionData: {
      title: string
      type: string
      content: any
      order: number
      duration: number
    },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Adding section to lesson: ${id}`)
    return this.lessonService.addLessonSection(id, sectionData, tenantId, userId)
  }

  @Put(':id/sections/:sectionId')
  @ApiOperation({ summary: '更新课程实例环节' })
  async updateLessonSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() updateData: any,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Updating section ${sectionId} in lesson: ${id}`)
    return this.lessonService.updateLessonSection(id, sectionId, updateData, tenantId, userId)
  }

  @Delete(':id/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除课程实例环节' })
  async removeLessonSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    this.logger.log(`Removing section ${sectionId} from lesson: ${id}`)
    await this.lessonService.removeLessonSection(id, sectionId, tenantId)
  }

  @Post(':id/current-section/:sectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设置当前活跃环节' })
  async setCurrentSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Setting current section ${sectionId} for lesson: ${id}`)
    return this.lessonService.setCurrentSection(id, sectionId, tenantId, userId)
  }

  @Get(':id/current-section')
  @ApiOperation({ summary: '获取当前活跃环节' })
  async getCurrentSection(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.lessonService.getCurrentSection(id, tenantId)
  }

  @Get(':id/participants')
  @ApiOperation({ summary: '获取课程参与者列表' })
  async getLessonParticipants(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.lessonService.getLessonParticipants(id, tenantId)
  }

  @Post(':id/participants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '添加课程参与者' })
  async addLessonParticipant(
    @Param('id') id: string,
    @Body() participantData: {
      userId: string
      role: string
    },
    @CurrentUser('tenantId') tenantId: string
  ) {
    this.logger.log(`Adding participant ${participantData.userId} to lesson: ${id}`)
    return this.lessonService.addLessonParticipant(id, participantData, tenantId)
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取课程实例统计信息' })
  async getLessonStats(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.lessonService.getLessonStats(id, tenantId)
  }

  @Post(':id/annotations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '保存课程批注' })
  async saveLessonAnnotations(
    @Param('id') id: string,
    @Body() annotationData: {
      sectionId?: string
      content: string
      type: string
      metadata?: any
    },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string
  ) {
    this.logger.log(`Saving annotations for lesson: ${id}`)
    return this.lessonService.saveLessonAnnotations(id, annotationData, tenantId, userId)
  }

  @Get(':id/annotations')
  @ApiOperation({ summary: '获取课程批注' })
  @ApiQuery({ name: 'sectionId', required: false, description: '环节ID' })
  async getLessonAnnotations(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('sectionId') sectionId?: string
  ) {
    return this.lessonService.getLessonAnnotations(id, sectionId || '', tenantId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除课程实例' })
  async deleteLesson(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    this.logger.log(`Deleting lesson: ${id}`)
    await this.lessonService.deleteLesson(id, tenantId)
  }
}