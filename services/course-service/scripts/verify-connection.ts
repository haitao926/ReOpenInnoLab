#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { CourseService } from '../src/course/course.service'
import { LessonService } from '../src/modules/lesson/lesson.service'

interface TestResult {
  name: string
  status: 'pass' | 'fail'
  message: string
  duration?: number
}

class ConnectionVerifier {
  private results: TestResult[] = []

  async run(): Promise<void> {
    console.log('🔍 开始验证数据持久化连接...\n')

    const app = await NestFactory.createApplicationContext(AppModule)
    const dataSource = app.get(DataSource)
    const configService = app.get<ConfigService>(ConfigService)
    const courseService = app.get<CourseService>(CourseService)
    const lessonService = app.get<LessonService>(LessonService)

    try {
      // 1. 验证数据库连接
      await this.testDatabaseConnection(dataSource)

      // 2. 验证配置
      await this.testConfiguration(configService)

      // 3. 验证表结构
      await this.testTableStructure(dataSource)

      // 4. 验证服务功能
      await this.testCourseService(courseService)

      // 5. 验证课程服务
      await this.testLessonService(lessonService)

      // 6. 验证事务支持
      await this.testTransactionSupport(dataSource)

    } catch (error) {
      this.results.push({
        name: '整体验证',
        status: 'fail',
        message: error.message,
      })
    } finally {
      await app.close()
    }

    this.printResults()
  }

  private async testDatabaseConnection(dataSource: DataSource): Promise<void> {
    const startTime = Date.now()
    try {
      await dataSource.query('SELECT 1')
      this.results.push({
        name: '数据库连接',
        status: 'pass',
        message: '✅ 数据库连接成功',
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: '数据库连接',
        status: 'fail',
        message: `❌ 数据库连接失败: ${error.message}`,
      })
    }
  }

  private async testConfiguration(configService: ConfigService): Promise<void> {
    const requiredConfigs = [
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_NAME',
      'DATABASE_USER',
    ]

    const missingConfigs = requiredConfigs.filter(
      config => !configService.get(config)
    )

    if (missingConfigs.length === 0) {
      this.results.push({
        name: '配置验证',
        status: 'pass',
        message: '✅ 所有必需配置都已设置',
      })
    } else {
      this.results.push({
        name: '配置验证',
        status: 'fail',
        message: `❌ 缺少配置: ${missingConfigs.join(', ')}`,
      })
    }
  }

  private async testTableStructure(dataSource: DataSource): Promise<void> {
    try {
      const queryRunner = dataSource.createQueryRunner()
      const tables = await queryRunner.getTables(['public'])
      const tableNames = tables.map(table => table.name)

      const requiredTables = [
        'tenants',
        'courses',
        'course_instances',
        'lessons',
        'sections',
        'lesson_activities',
      ]

      const missingTables = requiredTables.filter(
        table => !tableNames.includes(table)
      )

      await queryRunner.release()

      if (missingTables.length === 0) {
        this.results.push({
          name: '表结构验证',
          status: 'pass',
          message: '✅ 所有必需表都已创建',
        })
      } else {
        this.results.push({
          name: '表结构验证',
          status: 'fail',
          message: `❌ 缺少表: ${missingTables.join(', ')}`,
        })
      }
    } catch (error) {
      this.results.push({
        name: '表结构验证',
        status: 'fail',
        message: `❌ 表结构验证失败: ${error.message}`,
      })
    }
  }

  private async testCourseService(courseService: CourseService): Promise<void> {
    const startTime = Date.now()
    try {
      const testTenantId = 'verify-test-' + Date.now()

      // 首先创建租户
      const tenantRepository = courseService['dataSource'].getRepository('Tenant')
      const tenant = tenantRepository.create({
        id: testTenantId,
        code: 'verify-test-tenant',
        name: '验证测试租户',
        isActive: true,
        createdBy: 'verify-script',
      })
      await tenantRepository.save(tenant)

      // 测试课程创建
      const createCourseDto = {
        code: 'VERIFY-COURSE-' + Date.now(),
        title: '验证测试课程',
        description: '用于验证服务功能的测试课程',
        subject: '测试',
        gradeBand: '7-9',
        level: 'beginner',
        language: 'zh-CN',
        estimatedHours: 10,
        tags: ['验证', '测试'],
        aclContent: {
          meta: { version: '1.0.0' },
          courseInfo: { title: '验证测试课程' },
          structure: { sections: [] },
        },
      }

      const course = await courseService.createCourse(
        createCourseDto,
        testTenantId,
        'verify-script'
      )

      // 测试课程查询
      const retrievedCourse = await courseService.getCourseById(course.id, testTenantId)

      if (retrievedCourse.id === course.id) {
        this.results.push({
          name: '课程服务验证',
          status: 'pass',
          message: '✅ 课程服务功能正常',
          duration: Date.now() - startTime,
        })
      } else {
        this.results.push({
          name: '课程服务验证',
          status: 'fail',
          message: '❌ 课程数据不一致',
        })
      }
    } catch (error) {
      this.results.push({
        name: '课程服务验证',
        status: 'fail',
        message: `❌ 课程服务验证失败: ${error.message}`,
      })
    }
  }

  private async testLessonService(lessonService: LessonService): Promise<void> {
    const startTime = Date.now()
    try {
      const testTenantId = 'verify-lesson-test-' + Date.now()

      // 创建必要的测试数据
      const dataSource = lessonService['dataSource']

      // 创建租户
      const tenantRepository = dataSource.getRepository('Tenant')
      const tenant = tenantRepository.create({
        id: testTenantId,
        code: 'verify-lesson-tenant',
        name: '课程验证测试租户',
        isActive: true,
        createdBy: 'verify-script',
      })
      await tenantRepository.save(tenant)

      // 创建课程
      const courseRepository = dataSource.getRepository('Course')
      const course = courseRepository.create({
        tenantId: testTenantId,
        code: 'VERIFY-LESSON-COURSE-' + Date.now(),
        title: '课程验证测试课程',
        subject: '测试',
        gradeBand: '7-9',
        status: 'published',
        createdBy: 'verify-script',
      })
      const savedCourse = await courseRepository.save(course)

      // 创建课程实例
      const courseInstanceRepository = dataSource.getRepository('CourseInstance')
      const courseInstance = courseInstanceRepository.create({
        tenantId: testTenantId,
        courseId: savedCourse.id,
        classroomId: 'verify-test-classroom',
        title: '验证测试课程实例',
        status: 'active',
        createdBy: 'verify-script',
      })
      await courseInstanceRepository.save(courseInstance)

      // 测试课程实例创建
      const createLessonDto = {
        courseId: savedCourse.id,
        classroomId: 'verify-test-classroom',
        title: '验证测试课程实例',
        description: '用于验证课程实例服务功能的测试',
        estimatedDuration: 45,
        maxParticipants: 25,
      }

      const lesson = await lessonService.createLesson(
        createLessonDto,
        testTenantId,
        'verify-script'
      )

      // 测试课程实例查询
      const retrievedLesson = await lessonService.getLessonById(lesson.id, testTenantId)

      if (retrievedLesson.id === lesson.id && retrievedLesson.sections) {
        this.results.push({
          name: '课程实例服务验证',
          status: 'pass',
          message: '✅ 课程实例服务功能正常',
          duration: Date.now() - startTime,
        })
      } else {
        this.results.push({
          name: '课程实例服务验证',
          status: 'fail',
          message: '❌ 课程实例数据不一致',
        })
      }
    } catch (error) {
      this.results.push({
        name: '课程实例服务验证',
        status: 'fail',
        message: `❌ 课程实例服务验证失败: ${error.message}`,
      })
    }
  }

  private async testTransactionSupport(dataSource: DataSource): Promise<void> {
    try {
      const queryRunner = dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const testCode = 'transaction-test-' + Date.now()

      try {
        const tenantRepository = queryRunner.manager.getRepository('Tenant')
        const tenant = tenantRepository.create({
          code: testCode,
          name: '事务测试租户',
          isActive: true,
          createdBy: 'verify-script',
        })

        await tenantRepository.save(tenant)
        await queryRunner.rollbackTransaction()

        // 验证回滚是否成功
        const tenantRepository2 = dataSource.getRepository('Tenant')
        const count = await tenantRepository2.count({
          where: { code: testCode }
        })

        if (count === 0) {
          this.results.push({
            name: '事务支持验证',
            status: 'pass',
            message: '✅ 事务回滚功能正常',
          })
        } else {
          this.results.push({
            name: '事务支持验证',
            status: 'fail',
            message: '❌ 事务回滚失败',
          })
        }
      } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
      } finally {
        await queryRunner.release()
      }
    } catch (error) {
      this.results.push({
        name: '事务支持验证',
        status: 'fail',
        message: `❌ 事务验证失败: ${error.message}`,
      })
    }
  }

  private printResults(): void {
    console.log('\n📊 验证结果汇总:')
    console.log('=' .repeat(50))

    const passedTests = this.results.filter(r => r.status === 'pass')
    const failedTests = this.results.filter(r => r.status === 'fail')

    this.results.forEach(result => {
      const statusIcon = result.status === 'pass' ? '✅' : '❌'
      const durationInfo = result.duration ? ` (${result.duration}ms)` : ''
      console.log(`${statusIcon} ${result.name}: ${result.message}${durationInfo}`)
    })

    console.log('=' .repeat(50))
    console.log(`📈 总计: ${this.results.length} 项测试`)
    console.log(`✅ 通过: ${passedTests.length} 项`)
    console.log(`❌ 失败: ${failedTests.length} 项`)

    if (failedTests.length === 0) {
      console.log('\n🎉 所有验证测试通过！数据持久化连接正常工作。')
      process.exit(0)
    } else {
      console.log('\n⚠️  存在验证失败的测试，请检查相关配置和实现。')
      process.exit(1)
    }
  }
}

// 运行验证
const verifier = new ConnectionVerifier()
verifier.run().catch(error => {
  console.error('💥 验证过程中发生错误:', error)
  process.exit(1)
})