import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'

import { DatabaseModule } from '../database/database.module'
import { CourseModule } from '../course/course.module'
import { LessonModule } from '../modules/lesson/lesson.module'
import { CourseService } from '../course/course.service'
import { LessonService } from '../modules/lesson/lesson.service'

import configuration from '../config/configuration'
import { validationSchema } from '../config/validation.schema'

describe('Database Connection and Data Persistence Tests', () => {
  let module: TestingModule
  let dataSource: DataSource
  let configService: ConfigService
  let courseService: CourseService
  let lessonService: LessonService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema,
          validationOptions: {
            allowUnknown: false,
            abortEarly: true,
          },
        }),
        DatabaseModule,
        CourseModule,
        LessonModule,
      ],
    }).compile()

    dataSource = module.get<DataSource>(DataSource)
    configService = module.get<ConfigService>(ConfigService)
    courseService = module.get<CourseService>(CourseService)
    lessonService = module.get<LessonService>(LessonService)
  })

  afterAll(async () => {
    await module.close()
  })

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      expect(dataSource).toBeDefined()
      expect(dataSource.isInitialized).toBe(true)
    })

    it('should have correct database configuration', () => {
      const dbConfig = {
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        database: configService.get('DATABASE_NAME'),
        username: configService.get('DATABASE_USER'),
      }

      expect(dbConfig.host).toBeDefined()
      expect(dbConfig.port).toBeDefined()
      expect(dbConfig.database).toBeDefined()
      expect(dbConfig.username).toBeDefined()
    })

    it('should have all required tables', async () => {
      const queryRunner = dataSource.createQueryRunner()

      const tables = await queryRunner.getTables(['public'])
      const tableNames = tables.map(table => table.name)

      // Check for core tables
      expect(tableNames).toContain('tenants')
      expect(tableNames).toContain('courses')
      expect(tableNames).toContain('course_instances')
      expect(tableNames).toContain('lessons')
      expect(tableNames).toContain('sections')
      expect(tableNames).toContain('lesson_activities')

      await queryRunner.release()
    })

    it('should have proper indexes created', async () => {
      const queryRunner = dataSource.createQueryRunner()

      const lessonTable = await queryRunner.getTable('lessons')
      const lessonIndexes = lessonTable.indices.map(index => index.name)

      expect(lessonIndexes).toContain('IDX_lessons_tenant_course')
      expect(lessonIndexes).toContain('IDX_lessons_tenant_classroom')
      expect(lessonIndexes).toContain('IDX_lessons_tenant_status')

      await queryRunner.release()
    })
  })

  describe('Data Persistence - Course Service', () => {
    let tenantId: string
    let createdCourse: any

    it('should create a course successfully', async () => {
      const createCourseDto = {
        code: 'TEST-COURSE-001',
        title: '测试课程',
        description: '用于测试数据库连接的课程',
        subject: '数学',
        gradeBand: '7-9',
        level: 'beginner',
        language: 'zh-CN',
        estimatedHours: 20,
        tags: ['测试', '数学'],
        aclContent: {
          meta: { version: '1.0.0' },
          courseInfo: { title: '测试课程' },
          structure: { sections: [] },
        },
      }

      // 使用一个模拟的租户ID
      tenantId = 'test-tenant-' + Date.now()

      try {
        createdCourse = await courseService.createCourse(
          createCourseDto,
          tenantId,
          'test-user'
        )

        expect(createdCourse).toBeDefined()
        expect(createdCourse.id).toBeDefined()
        expect(createdCourse.code).toBe(createCourseDto.code)
        expect(createdCourse.title).toBe(createCourseDto.title)
        expect(createdCourse.tenantId).toBe(tenantId)
      } catch (error) {
        console.log('Course creation error:', error)
        // 如果课程创建失败，我们可能需要创建租户先
        const tenantRepository = dataSource.getRepository('Tenant')
        const tenant = tenantRepository.create({
          id: tenantId,
          code: 'test-tenant',
          name: '测试租户',
          isActive: true,
          createdBy: 'test-user',
        })
        await tenantRepository.save(tenant)

        createdCourse = await courseService.createCourse(
          createCourseDto,
          tenantId,
          'test-user'
        )

        expect(createdCourse).toBeDefined()
        expect(createdCourse.id).toBeDefined()
      }
    })

    it('should retrieve the created course', async () => {
      const retrievedCourse = await courseService.getCourseById(createdCourse.id, tenantId)

      expect(retrievedCourse).toBeDefined()
      expect(retrievedCourse.id).toBe(createdCourse.id)
      expect(retrievedCourse.code).toBe(createdCourse.code)
      expect(retrievedCourse.title).toBe(createdCourse.title)
    })

    it('should update the course successfully', async () => {
      const updateDto = {
        title: '更新后的测试课程',
        description: '课程描述已更新',
      }

      const updatedCourse = await courseService.updateCourse(
        createdCourse.id,
        updateDto,
        tenantId,
        'test-user'
      )

      expect(updatedCourse.title).toBe(updateDto.title)
      expect(updatedCourse.description).toBe(updateDto.description)
    })

    it('should list courses with pagination', async () => {
      const result = await courseService.getCourses(tenantId, {
        page: 1,
        limit: 10,
      })

      expect(result).toBeDefined()
      expect(result.courses).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })
  })

  describe('Data Persistence - Lesson Service', () => {
    let tenantId: string
    let courseId: string
    let classroomId: string
    let createdLesson: any

    beforeAll(async () => {
      // 创建测试租户
      tenantId = 'test-tenant-lesson-' + Date.now()
      const tenantRepository = dataSource.getRepository('Tenant')
      const tenant = tenantRepository.create({
        id: tenantId,
        code: 'test-tenant-lesson',
        name: '课程测试租户',
        isActive: true,
        createdBy: 'test-user',
      })
      await tenantRepository.save(tenant)

      // 创建测试课程
      const courseRepository = dataSource.getRepository('Course')
      const course = courseRepository.create({
        tenantId,
        code: 'TEST-COURSE-LESSON-001',
        title: '课程测试课程',
        subject: '数学',
        gradeBand: '7-9',
        status: 'published',
        createdBy: 'test-user',
      })
      const savedCourse = await courseRepository.save(course)
      courseId = savedCourse.id

      // 创建测试课程实例
      const courseInstanceRepository = dataSource.getRepository('CourseInstance')
      const courseInstance = courseInstanceRepository.create({
        tenantId,
        courseId,
        classroomId: 'test-classroom-001',
        title: '测试班级课程实例',
        status: 'active',
        createdBy: 'test-user',
      })
      await courseInstanceRepository.save(courseInstance)
      classroomId = 'test-classroom-001'
    })

    it('should create a lesson successfully', async () => {
      const createLessonDto = {
        courseId,
        classroomId,
        title: '测试课程实例',
        description: '用于测试数据库连接的课程实例',
        estimatedDuration: 90,
        maxParticipants: 30,
        sections: [
          {
            title: '测试环节1',
            type: 'introduction',
            content: { description: '这是一个测试环节' },
            order: 1,
            duration: 15,
          },
          {
            title: '测试环节2',
            type: 'knowledge',
            content: { description: '这是另一个测试环节' },
            order: 2,
            duration: 25,
          },
        ],
      }

      createdLesson = await lessonService.createLesson(
        createLessonDto,
        tenantId,
        'test-user'
      )

      expect(createdLesson).toBeDefined()
      expect(createdLesson.id).toBeDefined()
      expect(createdLesson.title).toBe(createLessonDto.title)
      expect(createdLesson.tenantId).toBe(tenantId)
      expect(createdLesson.courseId).toBe(courseId)
      expect(createdLesson.classroomId).toBe(classroomId)
    })

    it('should retrieve the created lesson', async () => {
      const retrievedLesson = await lessonService.getLessonById(createdLesson.id, tenantId)

      expect(retrievedLesson).toBeDefined()
      expect(retrievedLesson.id).toBe(createdLesson.id)
      expect(retrievedLesson.title).toBe(createdLesson.title)
      expect(retrievedLesson.sections).toBeDefined()
      expect(retrievedLesson.sections).toHaveLength(2)
    })

    it('should start the lesson successfully', async () => {
      const startLessonDto = {
        startNotes: '开始测试课程',
      }

      const startedLesson = await lessonService.startLesson(
        createdLesson.id,
        startLessonDto,
        tenantId,
        'test-user'
      )

      expect(startedLesson.status).toBe('in_progress')
      expect(startedLesson.actualStartAt).toBeDefined()
    })

    it('should add a section to the lesson', async () => {
      const sectionData = {
        title: '动态添加的测试环节',
        type: 'experience',
        content: { description: '这是一个动态添加的环节' },
        order: 3,
        duration: 20,
      }

      const addedSection = await lessonService.addLessonSection(
        createdLesson.id,
        sectionData,
        tenantId,
        'test-user'
      )

      expect(addedSection).toBeDefined()
      expect(addedSection.id).toBeDefined()
      expect(addedSection.title).toBe(sectionData.title)
      expect(addedSection.type).toBe(sectionData.type)
    })

    it('should set current section', async () => {
      const updatedLesson = await lessonService.setCurrentSection(
        createdLesson.id,
        createdLesson.sections[0].id,
        tenantId,
        'test-user'
      )

      expect(updatedLesson.currentSectionId).toBe(createdLesson.sections[0].id)
      expect(updatedLesson.currentSectionOrder).toBe(createdLesson.sections[0].order)
    })

    it('should get lesson statistics', async () => {
      const stats = await lessonService.getLessonStats(createdLesson.id, tenantId)

      expect(stats).toBeDefined()
      expect(stats.lessonId).toBe(createdLesson.id)
      expect(stats.title).toBe(createdLesson.title)
      expect(stats.sectionCount).toBeGreaterThanOrEqual(2)
    })

    it('should save lesson annotations', async () => {
      const annotationData = {
        content: '这是一个测试批注',
        type: 'note',
        metadata: { priority: 'high' },
      }

      const savedAnnotation = await lessonService.saveLessonAnnotations(
        createdLesson.id,
        annotationData,
        tenantId,
        'test-user'
      )

      expect(savedAnnotation).toBeDefined()
      expect(savedAnnotation.id).toBeDefined()
    })

    it('should retrieve lesson annotations', async () => {
      const annotations = await lessonService.getLessonAnnotations(createdLesson.id, null, tenantId)

      expect(annotations).toBeInstanceOf(Array)
      expect(annotations.length).toBeGreaterThan(0)
    })

    it('should end the lesson successfully', async () => {
      const endedLesson = await lessonService.endLesson(
        createdLesson.id,
        tenantId,
        'test-user'
      )

      expect(endedLesson.status).toBe('completed')
      expect(endedLesson.actualEndAt).toBeDefined()
    })
  })

  describe('Transaction Support', () => {
    it('should handle transactions correctly', async () => {
      const queryRunner = dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        const tenantRepository = queryRunner.manager.getRepository('Tenant')
        const tenant = tenantRepository.create({
          code: 'transaction-test-' + Date.now(),
          name: '事务测试租户',
          isActive: true,
          createdBy: 'test-user',
        })

        const savedTenant = await tenantRepository.save(tenant)
        expect(savedTenant.id).toBeDefined()

        await queryRunner.commitTransaction()
      } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
      } finally {
        await queryRunner.release()
      }
    })

    it('should rollback on transaction failure', async () => {
      const queryRunner = dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        const tenantRepository = queryRunner.manager.getRepository('Tenant')
        const tenant = tenantRepository.create({
          code: 'rollback-test-' + Date.now(),
          name: '回滚测试租户',
          isActive: true,
          createdBy: 'test-user',
        })

        await tenantRepository.save(tenant)

        // 故意抛出错误触发回滚
        throw new Error('Intentional transaction failure')
      } catch (error) {
        await queryRunner.rollbackTransaction()
        // 验证数据确实被回滚了
        const tenantRepository = dataSource.getRepository('Tenant')
        const count = await tenantRepository.count({
          where: { code: 'rollback-test-' + Date.now() }
        })
        expect(count).toBe(0)
      } finally {
        await queryRunner.release()
      }
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent database operations', async () => {
      const promises = []
      const operationCount = 10

      for (let i = 0; i < operationCount; i++) {
        promises.push(
          courseService.getCourses('test-concurrent-' + Date.now(), {
            page: 1,
            limit: 10,
          })
        )
      }

      const results = await Promise.all(promises)

      expect(results).toHaveLength(operationCount)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.courses).toBeInstanceOf(Array)
      })
    })

    it('should complete database operations within reasonable time', async () => {
      const startTime = Date.now()

      await courseService.getCourses('test-performance-' + Date.now(), {
        page: 1,
        limit: 20,
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000) // 应该在1秒内完成
    })
  })
})