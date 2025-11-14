import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'

import { CreateLessonDto, UpdateLessonDto, StartLessonDto, LessonStatus } from './dto/create-lesson.dto'
import { Lesson } from '../../database/entities/lesson.entity'
import { CourseInstance } from '../../database/entities/course-instance.entity'
import { Section } from '../../database/entities/section.entity'
import { LessonActivity } from '../../database/entities/lesson-activity.entity'

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name)

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(CourseInstance)
    private readonly courseInstanceRepository: Repository<CourseInstance>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(LessonActivity)
    private readonly activityRepository: Repository<LessonActivity>,
    private readonly dataSource: DataSource
  ) {}

  async createLesson(createLessonDto: CreateLessonDto, tenantId: string, userId: string): Promise<Lesson> {
    this.logger.log(`Creating lesson for course: ${createLessonDto.courseId}`)

    // 验证课程实例是否存在
    const courseInstance = await this.courseInstanceRepository.findOne({
      where: { id: createLessonDto.courseId, tenantId }
    })

    if (!courseInstance) {
      throw new NotFoundException('课程实例不存在')
    }

    // 创建课程实例
    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      tenantId,
      createdBy: userId,
      status: LessonStatus.DRAFT,
      currentSectionOrder: 0,
      participantCount: 0
    })

    const savedLesson = await this.lessonRepository.save(lesson)

    // 如果有预设环节，创建环节
    if (createLessonDto.sections && createLessonDto.sections.length > 0) {
      await this.createSections(savedLesson.id, createLessonDto.sections, tenantId, userId)
    }

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId: savedLesson.id,
      userId,
      action: 'lesson_created',
      details: {
        lessonTitle: savedLesson.title,
        courseId: savedLesson.courseId,
        classroomId: savedLesson.classroomId
      }
    })

    return this.getLessonById(savedLesson.id, tenantId)
  }

  async getLessons(tenantId: string, options: {
    courseId?: string
    classroomId?: string
    status?: LessonStatus
    page?: number
    limit?: number
  }): Promise<{ lessons: Lesson[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.lessonRepository
      .createQueryBuilder('lesson')
      .where('lesson.tenantId = :tenantId', { tenantId })

    if (options.courseId) {
      queryBuilder.andWhere('lesson.courseId = :courseId', { courseId: options.courseId })
    }

    if (options.classroomId) {
      queryBuilder.andWhere('lesson.classroomId = :classroomId', { classroomId: options.classroomId })
    }

    if (options.status) {
      queryBuilder.andWhere('lesson.status = :status', { status: options.status })
    }

    queryBuilder.orderBy('lesson.createdAt', 'DESC')

    const page = options.page || 1
    const limit = options.limit || 20

    const [lessons, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return {
      lessons,
      total,
      page,
      limit
    }
  }

  async getLessonById(id: string, tenantId: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, tenantId },
      relations: ['sections']
    })

    if (!lesson) {
      throw new NotFoundException('课程实例不存在')
    }

    return lesson
  }

  async updateLesson(id: string, updateLessonDto: UpdateLessonDto, tenantId: string, userId: string): Promise<Lesson> {
    const lesson = await this.getLessonById(id, tenantId)

    // 检查是否可以更新
    if (lesson.status === LessonStatus.COMPLETED) {
      throw new ForbiddenException('已完成的课程实例不能更新')
    }

    await this.lessonRepository.update(id, {
      ...updateLessonDto,
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId: id,
      userId,
      action: 'lesson_updated',
      details: {
        changes: updateLessonDto
      }
    })

    return this.getLessonById(id, tenantId)
  }

  async startLesson(id: string, startLessonDto: StartLessonDto, tenantId: string, userId: string): Promise<Lesson> {
    const lesson = await this.getLessonById(id, tenantId)

    if (lesson.status !== LessonStatus.DRAFT && lesson.status !== LessonStatus.SCHEDULED) {
      throw new ForbiddenException('只有草稿或计划状态的课程实例才能开始')
    }

    const now = new Date()
    await this.lessonRepository.update(id, {
      status: LessonStatus.IN_PROGRESS,
      actualStartAt: now,
      startNotes: startLessonDto.startNotes,
      settings: { ...lesson.settings, ...startLessonDto.initialSettings },
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId: id,
      userId,
      action: 'lesson_started',
      details: {
        startNotes: startLessonDto.startNotes
      }
    })

    return this.getLessonById(id, tenantId)
  }

  async pauseLesson(id: string, tenantId: string, userId: string): Promise<Lesson> {
    const lesson = await this.getLessonById(id, tenantId)

    if (lesson.status !== LessonStatus.IN_PROGRESS) {
      throw new ForbiddenException('只有进行中的课程实例才能暂停')
    }

    await this.lessonRepository.update(id, {
      status: LessonStatus.PAUSED,
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId: id,
      userId,
      action: 'lesson_paused'
    })

    return this.getLessonById(id, tenantId)
  }

  async resumeLesson(id: string, tenantId: string, userId: string): Promise<Lesson> {
    const lesson = await this.getLessonById(id, tenantId)

    if (lesson.status !== LessonStatus.PAUSED) {
      throw new ForbiddenException('只有暂停状态的课程实例才能恢复')
    }

    await this.lessonRepository.update(id, {
      status: LessonStatus.IN_PROGRESS,
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId: id,
      userId,
      action: 'lesson_resumed'
    })

    return this.getLessonById(id, tenantId)
  }

  async endLesson(id: string, tenantId: string, userId: string): Promise<Lesson> {
    const lesson = await this.getLessonById(id, tenantId)

    if (lesson.status !== LessonStatus.IN_PROGRESS && lesson.status !== LessonStatus.PAUSED) {
      throw new ForbiddenException('只有进行中或暂停状态的课程实例才能结束')
    }

    const now = new Date()
    await this.lessonRepository.update(id, {
      status: LessonStatus.COMPLETED,
      actualEndAt: now,
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId: id,
      userId,
      action: 'lesson_ended',
      details: {
        duration: lesson.actualStartAt ? Math.floor((now.getTime() - new Date(lesson.actualStartAt).getTime()) / 1000 / 60) : 0
      }
    })

    return this.getLessonById(id, tenantId)
  }

  async getLessonSections(lessonId: string, tenantId: string): Promise<Section[]> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    return this.sectionRepository.find({
      where: { lessonId, tenantId },
      order: { order: 'ASC' }
    })
  }

  async addLessonSection(
    lessonId: string,
    sectionData: {
      title: string
      type: string
      content: any
      order: number
      duration: number
    },
    tenantId: string,
    userId: string
  ): Promise<Section> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    const section = this.sectionRepository.create({
      ...sectionData,
      lessonId,
      tenantId,
      createdBy: userId
    })

    const savedSection = await this.sectionRepository.save(section)

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId,
      userId,
      action: 'section_added',
      details: {
        sectionId: savedSection.id,
        sectionTitle: savedSection.title
      }
    })

    return savedSection
  }

  async updateLessonSection(
    lessonId: string,
    sectionId: string,
    updateData: any,
    tenantId: string,
    userId: string
  ): Promise<Section> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    const section = await this.sectionRepository.findOne({
      where: { id: sectionId, lessonId, tenantId }
    })

    if (!section) {
      throw new NotFoundException('环节不存在')
    }

    await this.sectionRepository.update(sectionId, {
      ...updateData,
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId,
      userId,
      action: 'section_updated',
      details: {
        sectionId,
        changes: updateData
      }
    })

    const updatedSection = await this.sectionRepository.findOne({
      where: { id: sectionId }
    })
    if (!updatedSection) {
      throw new NotFoundException('环节不存在')
    }
    return updatedSection
  }

  async removeLessonSection(lessonId: string, sectionId: string, tenantId: string): Promise<void> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    const section = await this.sectionRepository.findOne({
      where: { id: sectionId, lessonId, tenantId }
    })

    if (!section) {
      throw new NotFoundException('环节不存在')
    }

    await this.sectionRepository.remove(section)
  }

  async setCurrentSection(
    lessonId: string,
    sectionId: string,
    tenantId: string,
    userId: string
  ): Promise<{ currentSection: Section; lesson: Lesson }> {
    const lesson = await this.getLessonById(lessonId, tenantId)
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId, lessonId, tenantId }
    })

    if (!section) {
      throw new NotFoundException('环节不存在')
    }

    // 更新课程实例的当前环节
    await this.lessonRepository.update(lessonId, {
      currentSectionId: sectionId,
      currentSectionOrder: section.order,
      updatedBy: userId
    })

    // 记录活动日志
    await this.activityRepository.save({
      tenantId,
      lessonId,
      userId,
      action: 'section_changed',
      details: {
        sectionId,
        sectionTitle: section.title,
        sectionOrder: section.order
      }
    })

    const updatedLesson = await this.getLessonById(lessonId, tenantId)

    return {
      currentSection: section,
      lesson: updatedLesson
    }
  }

  async getCurrentSection(lessonId: string, tenantId: string): Promise<Section | null> {
    const lesson = await this.getLessonById(lessonId, tenantId)

    if (!lesson.currentSectionId) {
      return null
    }

    return this.sectionRepository.findOne({
      where: { id: lesson.currentSectionId, lessonId, tenantId }
    })
  }

  async getLessonParticipants(lessonId: string, tenantId: string): Promise<any[]> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    // 这里应该从班级服务获取参与者列表
    // 暂时返回模拟数据
    return []
  }

  async addLessonParticipant(
    lessonId: string,
    participantData: { userId: string; role: string },
    tenantId: string
  ): Promise<any> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    // 这里应该调用班级服务添加参与者
    // 暂时返回模拟数据
    return {
      lessonId,
      userId: participantData.userId,
      role: participantData.role,
      joinedAt: new Date()
    }
  }

  async getLessonStats(lessonId: string, tenantId: string): Promise<any> {
    const lesson = await this.getLessonById(lessonId, tenantId)

    const sectionCount = await this.sectionRepository.count({
      where: { lessonId, tenantId }
    })

    const activityCount = await this.activityRepository.count({
      where: { lessonId, tenantId }
    })

    return {
      lessonId,
      title: lesson.title,
      status: lesson.status,
      participantCount: lesson.participantCount,
      sectionCount,
      activityCount,
      duration: lesson.actualStartAt && lesson.actualEndAt
        ? Math.floor((new Date(lesson.actualEndAt).getTime() - new Date(lesson.actualStartAt).getTime()) / 1000 / 60)
        : null,
      createdAt: lesson.createdAt,
      actualStartAt: lesson.actualStartAt,
      actualEndAt: lesson.actualEndAt
    }
  }

  async saveLessonAnnotations(
    lessonId: string,
    annotationData: {
      sectionId?: string
      content: string
      type: string
      metadata?: any
    },
    tenantId: string,
    userId: string
  ): Promise<any> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    // 记录批注活动
    const activity = this.activityRepository.create({
      tenantId,
      lessonId,
      userId,
      action: 'annotation_saved',
      details: {
        ...annotationData,
        savedAt: new Date()
      }
    })

    return this.activityRepository.save(activity)
  }

  async getLessonAnnotations(lessonId: string, tenantId: string, sectionId?: string): Promise<any[]> {
    await this.getLessonById(lessonId, tenantId) // 验证课程实例存在

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.tenantId = :tenantId', { tenantId })
      .andWhere('activity.lessonId = :lessonId', { lessonId })
      .andWhere('activity.action = :action', { action: 'annotation_saved' })
      .orderBy('activity.createdAt', 'DESC')

    if (sectionId) {
      queryBuilder.andWhere('activity.details->>\'sectionId\' = :sectionId', { sectionId })
    }

    return queryBuilder.getMany()
  }

  async deleteLesson(id: string, tenantId: string): Promise<void> {
    const lesson = await this.getLessonById(id, tenantId)

    if (lesson.status === LessonStatus.IN_PROGRESS) {
      throw new ForbiddenException('进行中的课程实例不能删除')
    }

    // 删除相关环节
    await this.sectionRepository.delete({
      lessonId: id,
      tenantId
    })

    // 删除相关活动记录
    await this.activityRepository.delete({
      lessonId: id,
      tenantId
    })

    // 删除课程实例
    await this.lessonRepository.remove(lesson)
  }

  private async createSections(
    lessonId: string,
    sections: Array<{
      title: string
      type: string
      content: any
      order: number
      duration: number
    }>,
    tenantId: string,
    userId: string
  ): Promise<void> {
    for (const sectionData of sections) {
      const section = this.sectionRepository.create({
        ...sectionData,
        lessonId,
        tenantId,
        createdBy: userId
      })
      await this.sectionRepository.save(section)
    }
  }
}