import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Classroom } from '@/database/entities/classroom.entity';
import { ClassMember } from '@/database/entities/class-member.entity';
import { CreateClassroomDto, UpdateClassroomDto, JoinClassroomDto } from './dto';
import { ClassroomStatus } from './dto/create-classroom.dto';
// import { RedisService } from '@nestjs-modules/ioredis';

@Injectable()
export class ClassroomService {
  private readonly logger = new Logger(ClassroomService.name);

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    @InjectRepository(ClassMember)
    private readonly classMemberRepository: Repository<ClassMember>,
    // private readonly redisService: RedisService,
  ) {}

  async create(createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    try {
      // 检查班级代码是否已存在
      const existingClassroom = await this.classroomRepository.findOne({
        where: { code: createClassroomDto.code },
      });

      if (existingClassroom) {
        throw new ConflictException('班级代码已存在');
      }

      const classroom = this.classroomRepository.create(createClassroomDto);
      const savedClassroom = await this.classroomRepository.save(classroom);

      // 创建教师成员记录
      const teacherMember = this.classMemberRepository.create({
        classroomId: savedClassroom.id,
        userId: createClassroomDto.teacherId,
        role: 'teacher',
        joinedAt: new Date(),
      });
      await this.classMemberRepository.save(teacherMember);

      // 缓存班级信息 (Redis暂时禁用)
      // await this.cacheClassroom(savedClassroom);

      this.logger.log(`Created classroom: ${savedClassroom.id}`);
      return savedClassroom;
    } catch (error) {
      this.logger.error(`Failed to create classroom: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    teacherId?: string,
    courseId?: string,
    page = 1,
    limit = 10,
  ): Promise<{ classrooms: Classroom[]; total: number }> {
    try {
      const whereCondition: any = {};

      if (teacherId) {
        whereCondition.teacherId = teacherId;
      }

      if (courseId) {
        whereCondition.courseId = courseId;
      }

      const [classrooms, total] = await this.classroomRepository.findAndCount({
        where: whereCondition,
        relations: ['teacher', 'course'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return { classrooms, total };
    } catch (error) {
      this.logger.error(`Failed to find classrooms: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Classroom> {
    try {
      // 直接从数据库查询 (Redis缓存暂时禁用)
      const classroom = await this.classroomRepository.findOne({
        where: { id },
        relations: ['teacher', 'course', 'members', 'members.user'],
      });

      if (!classroom) {
        throw new NotFoundException(`班级 ${id} 不存在`);
      }

      // 缓存班级信息 (Redis暂时禁用)
      // await this.cacheClassroom(classroom);

      return classroom;
    } catch (error) {
      this.logger.error(`Failed to find classroom ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByCode(code: string): Promise<Classroom> {
    try {
      const classroom = await this.classroomRepository.findOne({
        where: { code },
        relations: ['teacher', 'course'],
      });

      if (!classroom) {
        throw new NotFoundException(`班级代码 ${code} 不存在`);
      }

      return classroom;
    } catch (error) {
      this.logger.error(`Failed to find classroom by code ${code}: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateClassroomDto: UpdateClassroomDto): Promise<Classroom> {
    try {
      const classroom = await this.findOne(id);

      const updatedClassroom = this.classroomRepository.merge(
        classroom,
        updateClassroomDto,
      );

      const savedClassroom = await this.classroomRepository.save(updatedClassroom);

      // 更新缓存 (Redis暂时禁用)
      // await this.cacheClassroom(savedClassroom);

      this.logger.log(`Updated classroom: ${id}`);
      return savedClassroom;
    } catch (error) {
      this.logger.error(`Failed to update classroom ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const classroom = await this.findOne(id);

      await this.classroomRepository.remove(classroom);

      // 删除缓存 (Redis暂时禁用)
      // await this.deleteCachedClassroom(id);

      this.logger.log(`Removed classroom: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove classroom ${id}: ${error.message}`);
      throw error;
    }
  }

  async joinClassroom(joinClassroomDto: JoinClassroomDto): Promise<ClassMember> {
    try {
      const classroom = await this.findByCode(joinClassroomDto.code);

      // 检查学生是否已经在班级中
      const existingMember = await this.classMemberRepository.findOne({
        where: {
          classroomId: classroom.id,
          userId: joinClassroomDto.studentId,
        },
      });

      if (existingMember) {
        throw new ConflictException('学生已在班级中');
      }

      // 检查班级人数限制
      const currentStudents = await this.classMemberRepository.count({
        where: {
          classroomId: classroom.id,
          role: 'student',
        },
      });

      if (currentStudents >= classroom.maxStudents) {
        throw new ConflictException('班级人数已满');
      }

      const classMember = this.classMemberRepository.create({
        classroomId: classroom.id,
        userId: joinClassroomDto.studentId,
        role: 'student',
        joinedAt: new Date(),
      });

      const savedMember = await this.classMemberRepository.save(classMember);

      this.logger.log(`Student ${joinClassroomDto.studentId} joined classroom ${classroom.id}`);
      return savedMember;
    } catch (error) {
      this.logger.error(`Failed to join classroom: ${error.message}`);
      throw error;
    }
  }

  async getMembers(classroomId: string): Promise<ClassMember[]> {
    try {
      const members = await this.classMemberRepository.find({
        where: { classroomId },
        relations: ['user'],
        order: { joinedAt: 'ASC' },
      });

      return members;
    } catch (error) {
      this.logger.error(`Failed to get members for classroom ${classroomId}: ${error.message}`);
      throw error;
    }
  }

  async leaveClassroom(classroomId: string, userId: string): Promise<void> {
    try {
      const member = await this.classMemberRepository.findOne({
        where: { classroomId, userId },
      });

      if (!member) {
        throw new NotFoundException('学生不在班级中');
      }

      await this.classMemberRepository.remove(member);

      this.logger.log(`User ${userId} left classroom ${classroomId}`);
    } catch (error) {
      this.logger.error(`Failed to leave classroom: ${error.message}`);
      throw error;
    }
  }

  // 缓存相关方法 (Redis暂时禁用，后续添加)
  /*
  private async cacheClassroom(classroom: Classroom): Promise<void> {
    const cacheKey = `classroom:${classroom.id}`;
    await this.redisService.set(cacheKey, JSON.stringify(classroom), 'EX', 3600); // 1小时过期
  }

  private async getCachedClassroom(id: string): Promise<Classroom | null> {
    const cacheKey = `classroom:${id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as Classroom;
    }

    return null;
  }

  private async deleteCachedClassroom(id: string): Promise<void> {
    const cacheKey = `classroom:${id}`;
    await this.redisService.del(cacheKey);
  }
  */
}