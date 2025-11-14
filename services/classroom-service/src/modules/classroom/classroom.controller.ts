import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto, UpdateClassroomDto, JoinClassroomDto } from './dto';
import { Classroom } from '@/database/entities/classroom.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('classrooms')
@Controller('classrooms')
@UseGuards(JwtAuthGuard)
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @ApiOperation({ summary: '创建班级' })
  @ApiResponse({ status: 201, description: '班级创建成功', type: Classroom })
  @ApiResponse({ status: 409, description: '班级代码已存在' })
  async create(@Body() createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    return this.classroomService.create(createClassroomDto);
  }

  @Get()
  @ApiOperation({ summary: '获取班级列表' })
  @ApiResponse({ status: 200, description: '班级列表获取成功' })
  @ApiQuery({ name: 'teacherId', required: false, description: '教师ID' })
  @ApiQuery({ name: 'courseId', required: false, description: '课程ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  async findAll(
    @Query('teacherId') teacherId?: string,
    @Query('courseId') courseId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{ classrooms: Classroom[]; total: number }> {
    return this.classroomService.findAll(teacherId, courseId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取班级详情' })
  @ApiResponse({ status: 200, description: '班级详情获取成功', type: Classroom })
  @ApiResponse({ status: 404, description: '班级不存在' })
  @ApiParam({ name: 'id', description: '班级ID' })
  async findOne(@Param('id') id: string): Promise<Classroom> {
    return this.classroomService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '通过班级代码查找班级' })
  @ApiResponse({ status: 200, description: '班级查找成功', type: Classroom })
  @ApiResponse({ status: 404, description: '班级代码不存在' })
  @ApiParam({ name: 'code', description: '班级代码' })
  async findByCode(@Param('code') code: string): Promise<Classroom> {
    return this.classroomService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新班级信息' })
  @ApiResponse({ status: 200, description: '班级更新成功', type: Classroom })
  @ApiResponse({ status: 404, description: '班级不存在' })
  @ApiParam({ name: 'id', description: '班级ID' })
  async update(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ): Promise<Classroom> {
    return this.classroomService.update(id, updateClassroomDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除班级' })
  @ApiResponse({ status: 204, description: '班级删除成功' })
  @ApiResponse({ status: 404, description: '班级不存在' })
  @ApiParam({ name: 'id', description: '班级ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.classroomService.remove(id);
  }

  @Post('join')
  @ApiOperation({ summary: '加入班级' })
  @ApiResponse({ status: 201, description: '加入班级成功' })
  @ApiResponse({ status: 404, description: '班级代码不存在' })
  @ApiResponse({ status: 409, description: '学生已在班级中或班级人数已满' })
  async joinClassroom(@Body() joinClassroomDto: JoinClassroomDto): Promise<any> {
    return this.classroomService.joinClassroom(joinClassroomDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '获取班级成员' })
  @ApiResponse({ status: 200, description: '班级成员获取成功' })
  @ApiParam({ name: 'id', description: '班级ID' })
  async getMembers(@Param('id') id: string): Promise<any[]> {
    return this.classroomService.getMembers(id);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '离开班级' })
  @ApiResponse({ status: 204, description: '离开班级成功' })
  @ApiResponse({ status: 404, description: '学生不在班级中' })
  @ApiParam({ name: 'id', description: '班级ID' })
  async leaveClassroom(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ): Promise<void> {
    return this.classroomService.leaveClassroom(id, req.user.sub);
  }
}