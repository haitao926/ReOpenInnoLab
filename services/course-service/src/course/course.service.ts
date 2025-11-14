import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Not, DataSource, EntityManager } from 'typeorm'
import { ConfigService } from '@nestjs/config'

import { Course, CourseStatus } from '../database/entities/course.entity'
import { CourseVersion, VersionStatus } from '../database/entities/course-version.entity'
import { CourseModule, ModuleType, ModuleStatus } from '../database/entities/course-module.entity'
import { CourseActivity, ActivityType, ActivityStatus } from '../database/entities/course-activity.entity'
import { Tenant } from '../database/entities/tenant.entity'
import { ResourceRef } from '../database/entities/resource-ref.entity'
import { CreateCourseDto, CreateCourseWithContentDto, UpdateCourseDto } from '../dto/create-course.dto'

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name)

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseVersion)
    private readonly courseVersionRepository: Repository<CourseVersion>,
    @InjectRepository(CourseModule)
    private readonly courseModuleRepository: Repository<CourseModule>,
    @InjectRepository(CourseActivity)
    private readonly courseActivityRepository: Repository<CourseActivity>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(ResourceRef)
    private readonly resourceRefRepository: Repository<ResourceRef>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * 创建新课程
   */
  async createCourse(createCourseDto: CreateCourseDto, tenantId: string, createdBy: string): Promise<Course> {
    // 验证租户权限
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['courses']
    })
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('租户不存在或已禁用')
    }

    // 获取实际课程数量进行额度检查
    const currentCourseCount = await this.courseRepository.count({
      where: { tenantId }
    })

    const limits = tenant.getLimits()
    if (currentCourseCount >= limits.max_courses) {
      throw new ForbiddenException(`租户课程数量已达上限 (${limits.max_courses})`)
    }

    // 检查课程代码是否重复
    const existingCourse = await this.courseRepository.findOne({
      where: { tenantId, code: createCourseDto.code }
    })
    if (existingCourse) {
      throw new BadRequestException('课程代码已存在')
    }

    const course = this.courseRepository.create({
      ...createCourseDto,
      tenantId,
      createdBy,
      status: CourseStatus.DRAFT
    })

    const savedCourse = await this.courseRepository.save(course)
    this.logger.log(`Created course: ${savedCourse.code} for tenant: ${tenantId}`)

    return savedCourse
  }

  /**
   * 创建带内容的课程（包括版本、模块、活动）
   */
  async createCourseWithContent(
    createCourseDto: CreateCourseWithContentDto,
    tenantId: string,
    createdBy: string
  ): Promise<{ course: Course; versionId: string }> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 验证租户权限和额度
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { id: tenantId },
        relations: ['courses']
      })
      if (!tenant || !tenant.isActive) {
        throw new NotFoundException('租户不存在或已禁用')
      }

      // 获取实际课程数量进行额度检查
      const currentCourseCount = await queryRunner.manager.count(Course, {
        where: { tenantId }
      })

      const limits = tenant.getLimits()
      if (currentCourseCount >= limits.max_courses) {
        throw new ForbiddenException(`租户课程数量已达上限 (${limits.max_courses})`)
      }

      // 检查课程代码是否重复
      const existingCourse = await queryRunner.manager.findOne(Course, {
        where: { tenantId, code: createCourseDto.code }
      })
      if (existingCourse) {
        throw new BadRequestException('课程代码已存在')
      }

      // 创建课程
      const course = queryRunner.manager.create(Course, {
        ...createCourseDto,
        tenantId,
        createdBy,
        status: CourseStatus.DRAFT
      })

      const savedCourse = await queryRunner.manager.save(course)

      // 创建初始版本
      const version = queryRunner.manager.create(CourseVersion, {
        courseId: savedCourse.id,
        version: createCourseDto.version || '1.0.0',
        aclJsonb: JSON.stringify(createCourseDto.aclContent || this.generateDefaultAclContent(createCourseDto)),
        status: VersionStatus.DRAFT,
        versionMetadata: createCourseDto.versionMetadata,
        createdBy
      })

      const savedVersion = await queryRunner.manager.save(version)

      // 如果提供了模块，创建模块和活动
      if (createCourseDto.modules && createCourseDto.modules.length > 0) {
        await this.createModulesForVersionWithTransaction(
          queryRunner.manager,
          savedVersion.id,
          createCourseDto.modules
        )
      }

      await queryRunner.commitTransaction()

      this.logger.log(`Created course with content: ${savedCourse.code} for tenant: ${tenantId}, version: ${savedVersion.version}`)

      return {
        course: savedCourse,
        versionId: savedVersion.id
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * 获取课程列表
   */
  async getCourses(
    tenantId: string,
    options: {
      page?: number
      limit?: number
      status?: CourseStatus
      subject?: string
      gradeBand?: string
      search?: string
    } = {}
  ): Promise<{ courses: Course[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, subject, gradeBand, search } = options

    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.versions', 'versions')
      .where('course.tenantId = :tenantId', { tenantId })

    if (status) {
      queryBuilder.andWhere('course.status = :status', { status })
    }

    if (subject) {
      queryBuilder.andWhere('course.subject = :subject', { subject })
    }

    if (gradeBand) {
      queryBuilder.andWhere('course.gradeBand = :gradeBand', { gradeBand })
    }

    if (search) {
      queryBuilder.andWhere(
        '(course.title ILIKE :search OR course.description ILIKE :search OR course.code ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    const total = await queryBuilder.getCount()

    const courses = await queryBuilder
      .orderBy('course.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    return { courses, total, page, limit }
  }

  /**
   * 根据ID获取课程详情
   */
  async getCourseById(id: string, tenantId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, tenantId },
      relations: ['versions', 'versions.modules', 'versions.modules.activities']
    })

    if (!course) {
      throw new NotFoundException('课程不存在')
    }

    return course
  }

  /**
   * 更新课程
   */
  async updateCourse(
    id: string,
    updateCourseDto: UpdateCourseDto,
    tenantId: string,
    updatedBy: string
  ): Promise<Course> {
    const course = await this.getCourseById(id, tenantId)

    // 检查课程状态是否允许更新
    if (course.status === CourseStatus.PUBLISHED) {
      // 已发布的课程只能更新部分字段
      const allowedFields = ['description', 'thumbnail', 'metadata']
      const updateKeys = Object.keys(updateCourseDto)
      const hasDisallowedFields = updateKeys.some(key => !allowedFields.includes(key))

      if (hasDisallowedFields) {
        throw new ForbiddenException('已发布的课程只能更新描述、缩略图和元数据')
      }
    }

    Object.assign(course, updateCourseDto, { updatedBy })
    const updatedCourse = await this.courseRepository.save(course)

    this.logger.log(`Updated course: ${course.code}`)
    return updatedCourse
  }

  /**
   * 发布课程
   */
  async publishCourse(id: string, tenantId: string, publishedBy: string): Promise<Course> {
    const course = await this.getCourseById(id, tenantId)

    // 检查是否有已发布的版本
    const publishedVersion = course.getPublishedVersion()
    if (!publishedVersion) {
      throw new BadRequestException('课程没有可发布的版本')
    }

    course.status = CourseStatus.PUBLISHED
    course.updatedBy = publishedBy

    const updatedCourse = await this.courseRepository.save(course)

    // 发布版本
    if (publishedVersion.status !== VersionStatus.PUBLISHED) {
      publishedVersion.status = VersionStatus.PUBLISHED
      publishedVersion.publishedAt = new Date()
      await this.courseVersionRepository.save(publishedVersion)
    }

    this.logger.log(`Published course: ${course.code}`)
    return updatedCourse
  }

  /**
   * 归档课程
   */
  async archiveCourse(id: string, tenantId: string, archivedBy: string): Promise<Course> {
    const course = await this.getCourseById(id, tenantId)

    course.status = CourseStatus.ARCHIVED
    course.updatedBy = archivedBy

    const updatedCourse = await this.courseRepository.save(course)

    // 归档所有版本
    await this.courseVersionRepository.update(
      { courseId: id },
      { status: VersionStatus.ARCHIVED, archivedAt: new Date() }
    )

    this.logger.log(`Archived course: ${course.code}`)
    return updatedCourse
  }

  /**
   * 删除课程
   */
  async deleteCourse(id: string, tenantId: string): Promise<void> {
    const course = await this.getCourseById(id, tenantId)

    if (course.status === CourseStatus.PUBLISHED) {
      throw new ForbiddenException('已发布的课程不能删除，请先归档')
    }

    await this.courseRepository.remove(course)
    this.logger.log(`Deleted course: ${course.code}`)
  }

  /**
   * 获取课程的最新版本
   */
  async getLatestVersion(courseId: string, tenantId: string): Promise<CourseVersion> {
    const course = await this.getCourseById(courseId, tenantId)
    const latestVersion = course.getLatestVersion()

    if (!latestVersion) {
      throw new NotFoundException('课程没有版本')
    }

    return latestVersion
  }

  /**
   * 获取课程的已发布版本
   */
  async getPublishedVersion(courseId: string, tenantId: string): Promise<CourseVersion> {
    const course = await this.getCourseById(courseId, tenantId)
    const publishedVersion = course.getPublishedVersion()

    if (!publishedVersion) {
      throw new NotFoundException('课程没有已发布的版本')
    }

    return publishedVersion
  }

  /**
   * 创建课程版本
   */
  async createVersion(
    courseId: string,
    aclContent: any,
    tenantId: string,
    createdBy: string,
    versionMetadata?: any
  ): Promise<CourseVersion> {
    const course = await this.getCourseById(courseId, tenantId)

    // 生成新版本号
    const latestVersion = course.getLatestVersion()
    const newVersionNumber = this.generateNextVersionNumber(latestVersion?.version)

    const version = this.courseVersionRepository.create({
      courseId,
      version: newVersionNumber,
      aclJsonb: JSON.stringify(aclContent),
      status: VersionStatus.DRAFT,
      versionMetadata,
      createdBy
    })

    const savedVersion = await this.courseVersionRepository.save(version)
    this.logger.log(`Created version ${newVersionNumber} for course: ${course.code}`)

    return savedVersion
  }

  /**
   * 为版本创建模块
   */
  private async createModulesForVersion(
    courseVersionId: string,
    modules: any[]
  ): Promise<void> {
    for (let i = 0; i < modules.length; i++) {
      const moduleData = modules[i]

      const module = this.courseModuleRepository.create({
        courseVersionId,
        order: i + 1,
        title: moduleData.title,
        description: moduleData.description,
        type: moduleData.type,
        status: ModuleStatus.DRAFT,
        estimatedMinutes: moduleData.estimatedMinutes,
        isRequired: moduleData.isRequired ?? true,
        hasPrerequisites: moduleData.hasPrerequisites ?? false,
        prerequisites: moduleData.prerequisites || []
      })

      const savedModule = await this.courseModuleRepository.save(module)

      // 如果模块有活动，创建活动
      if (moduleData.activities && moduleData.activities.length > 0) {
        await this.createActivitiesForModule(savedModule.id, moduleData.activities)
      }
    }
  }

  /**
   * 为模块创建活动
   */
  private async createActivitiesForModule(
    moduleId: string,
    activities: any[]
  ): Promise<void> {
    for (let i = 0; i < activities.length; i++) {
      const activityData = activities[i]

      const activity = this.courseActivityRepository.create({
        moduleId,
        order: i + 1,
        title: activityData.title,
        description: activityData.description,
        type: activityData.type,
        content: activityData.content,
        resourceRef: activityData.resourceRef,
        aiHintsJson: activityData.aiHintsJson,
        status: 'draft' as ActivityStatus,
        estimatedMinutes: activityData.estimatedMinutes,
        isRequired: activityData.isRequired ?? true,
        isGraded: activityData.isGraded ?? false,
        maxScore: activityData.maxScore
      })

      await this.courseActivityRepository.save(activity)
    }
  }

  /**
   * 为版本创建模块（事务版本）
   */
  private async createModulesForVersionWithTransaction(
    manager: EntityManager,
    courseVersionId: string,
    modules: any[]
  ): Promise<void> {
    for (let i = 0; i < modules.length; i++) {
      const moduleData = modules[i]

      const module = manager.create(CourseModule, {
        courseVersionId,
        order: i + 1,
        title: moduleData.title,
        description: moduleData.description,
        type: moduleData.type,
        status: ModuleStatus.DRAFT,
        estimatedMinutes: moduleData.estimatedMinutes,
        isRequired: moduleData.isRequired ?? true,
        hasPrerequisites: moduleData.hasPrerequisites ?? false,
        prerequisites: moduleData.prerequisites || []
      })

      const savedModule = await manager.save(module)

      // 如果模块有活动，创建活动
      if (moduleData.activities && moduleData.activities.length > 0) {
        await this.createActivitiesForModuleWithTransaction(manager, savedModule.id, moduleData.activities)
      }
    }
  }

  /**
   * 为模块创建活动（事务版本）
   */
  private async createActivitiesForModuleWithTransaction(
    manager: EntityManager,
    moduleId: string,
    activities: any[]
  ): Promise<void> {
    for (let i = 0; i < activities.length; i++) {
      const activityData = activities[i]

      const activity = manager.create(CourseActivity, {
        moduleId,
        order: i + 1,
        title: activityData.title,
        description: activityData.description,
        type: activityData.type,
        content: activityData.content,
        resourceRef: activityData.resourceRef,
        aiHintsJson: activityData.aiHintsJson,
        status: 'draft' as ActivityStatus,
        estimatedMinutes: activityData.estimatedMinutes,
        isRequired: activityData.isRequired ?? true,
        isGraded: activityData.isGraded ?? false,
        maxScore: activityData.maxScore
      })

      await manager.save(activity)
    }
  }

  /**
   * 生成默认ACL内容
   */
  private generateDefaultAclContent(courseData: CreateCourseDto): any {
    return {
      title: courseData.title,
      description: courseData.description || '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: 'intro-module',
          title: '课程介绍',
          type: ModuleType.INTRODUCTION,
          order: 1,
          activities: [
            {
              id: 'intro-activity',
              title: '欢迎学习',
              type: ActivityType.INTRO,
              order: 1,
              content: `欢迎来到《${courseData.title}》课程！`
            }
          ]
        }
      ]
    }
  }

  /**
   * 生成下一个版本号
   */
  private generateNextVersionNumber(currentVersion?: string): string {
    if (!currentVersion) {
      return '1.0.0'
    }

    const [major, minor, patch] = currentVersion.split('.').map(Number)
    return `${major}.${minor}.${patch + 1}`
  }

  /**
   * 获取课程统计信息
   */
  async getCourseStats(tenantId: string): Promise<{
    totalCourses: number
    publishedCourses: number
    draftCourses: number
    archivedCourses: number
    totalVersions: number
    totalModules: number
    totalActivities: number
  }> {
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses
    ] = await Promise.all([
      this.courseRepository.count({ where: { tenantId } }),
      this.courseRepository.count({ where: { tenantId, status: CourseStatus.PUBLISHED } }),
      this.courseRepository.count({ where: { tenantId, status: CourseStatus.DRAFT } }),
      this.courseRepository.count({ where: { tenantId, status: CourseStatus.ARCHIVED } })
    ])

    // 获取课程ID列表
    const courses = await this.courseRepository.find({
      where: { tenantId },
      select: ['id']
    })
    const courseIds = courses.map(c => c.id)

    const [totalVersions, totalModules, totalActivities] = await Promise.all([
      this.courseVersionRepository.count({ where: { courseId: In(courseIds) } }),
      this.courseModuleRepository
        .createQueryBuilder('module')
        .leftJoin('course_versions', 'version', 'version.id = module.courseVersionId')
        .where('version.courseId IN (:...courseIds)', { courseIds })
        .getCount(),
      this.courseActivityRepository
        .createQueryBuilder('activity')
        .leftJoin('course_modules', 'module', 'module.id = activity.moduleId')
        .leftJoin('course_versions', 'version', 'version.id = module.courseVersionId')
        .where('version.courseId IN (:...courseIds)', { courseIds })
        .getCount()
    ])

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalVersions,
      totalModules,
      totalActivities
    }
  }
}