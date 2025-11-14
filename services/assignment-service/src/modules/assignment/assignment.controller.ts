import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { AssignmentService } from './assignment.service'
import { CreateAssignmentDto } from './dto/create-assignment.dto'
import { UpdateAssignmentDto } from './dto/update-assignment.dto'
import { SubmitAssignmentDto } from './dto/submit-assignment.dto'
import { GradeSubmissionDto } from './dto/grade-submission.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @ApiOperation({ summary: '创建作业' })
  @ApiResponse({ status: 201, description: '作业创建成功' })
  async createAssignment(@Body() createAssignmentDto: CreateAssignmentDto) {
    return await this.assignmentService.createAssignment(createAssignmentDto)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取作业详情' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAssignment(@Param('id') id: string) {
    return await this.assignmentService.getAssignment(id)
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: '获取课程下的所有作业' })
  @ApiParam({ name: 'lessonId', description: '课程ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAssignmentsByLesson(@Param('lessonId') lessonId: string) {
    return await this.assignmentService.getAssignmentsByLesson(lessonId)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新作业' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAssignment(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return await this.assignmentService.updateAssignment(id, updateAssignmentDto)
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布作业' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publishAssignment(@Param('id') id: string) {
    return await this.assignmentService.publishAssignment(id)
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭作业' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '关闭成功' })
  async closeAssignment(@Param('id') id: string) {
    return await this.assignmentService.closeAssignment(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除作业' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteAssignment(@Param('id') id: string) {
    return await this.assignmentService.deleteAssignment(id)
  }

  @Post(':id/questions')
  @ApiOperation({ summary: '添加作业题目' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 201, description: '题目添加成功' })
  async addQuestion(
    @Param('id') assignmentId: string,
    @Body() questionData: {
      type: string
      title: string
      content: string
      points: number
      order: number
      required?: boolean
      options?: any[]
      correctAnswer?: string | string[]
      referenceAnswer?: string
      gradingCriteria?: any
      explanation?: string
      hint?: string
    },
  ) {
    return await this.assignmentService.addQuestion(assignmentId, questionData)
  }

  @Get(':id/questions')
  @ApiOperation({ summary: '获取作业题目' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAssignmentQuestions(@Param('id') assignmentId: string) {
    return await this.assignmentService.getAssignmentQuestions(assignmentId)
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '学生提交作业' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 201, description: '提交成功' })
  async submitAssignment(
    @Param('id') assignmentId: string,
    @Body() submitAssignmentDto: SubmitAssignmentDto,
    @Request() req: any,
  ) {
    return await this.assignmentService.submitAssignment({
      ...submitAssignmentDto,
      assignmentId,
      studentId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })
  }

  @Get(':id/submission')
  @ApiOperation({ summary: '获取当前学生的提交记录' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentSubmission(
    @Param('id') assignmentId: string,
    @Request() req: any,
  ) {
    return await this.assignmentService.getStudentSubmission(
      assignmentId,
      req.user?.id,
    )
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: '获取作业的所有提交记录' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAssignmentSubmissions(@Param('id') assignmentId: string) {
    return await this.assignmentService.getAssignmentSubmissions(assignmentId)
  }

  @Post(':id/submissions/:submissionId/grade')
  @ApiOperation({ summary: '评分作业提交' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiParam({ name: 'submissionId', description: '提交ID' })
  @ApiResponse({ status: 200, description: '评分成功' })
  async gradeSubmission(
    @Param('id') assignmentId: string,
    @Param('submissionId') submissionId: string,
    @Body() gradeSubmissionDto: GradeSubmissionDto,
    @Request() req: any,
  ) {
    return await this.assignmentService.gradeSubmission(submissionId, {
      ...gradeSubmissionDto,
      gradedBy: req.user?.id,
    })
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取作业统计信息' })
  @ApiParam({ name: 'id', description: '作业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAssignmentStats(@Param('id') assignmentId: string) {
    return await this.assignmentService.getAssignmentStats(assignmentId)
  }
}