import { DataSource } from 'typeorm'
import { Tenant } from '../entities/tenant.entity'
import { Course } from '../entities/course.entity'
import { CourseInstance } from '../entities/course-instance.entity'
import { Lesson } from '../entities/lesson.entity'
import { Section } from '../entities/section.entity'

export class SeedData {
  constructor(private dataSource: DataSource) {}

  async run() {
    console.log('🌱 开始执行种子数据...')

    try {
      // 创建租户
      await this.createTenants()

      // 创建课程
      await this.createCourses()

      // 创建课程实例
      await this.createCourseInstances()

      // 创建课程实例
      await this.createLessons()

      // 创建环节
      await this.createSections()

      console.log('✅ 种子数据执行完成!')
    } catch (error) {
      console.error('❌ 种子数据执行失败:', error)
      throw error
    }
  }

  private async createTenants() {
    const tenantRepository = this.dataSource.getRepository(Tenant)

    // 检查是否已存在租户
    const existingTenant = await tenantRepository.findOne({
      where: { code: 'demo-school' }
    })

    if (existingTenant) {
      console.log('📋 租户已存在，跳过创建')
      return
    }

    const tenant = tenantRepository.create({
      code: 'demo-school',
      name: '示例学校',
      description: '用于演示的示例学校',
      settings: {
        timezone: 'Asia/Shanghai',
        language: 'zh-CN'
      },
      isActive: true
    })

    await tenantRepository.save(tenant)
    console.log('✅ 创建租户: 示例学校')
  }

  private async createCourses() {
    const courseRepository = this.dataSource.getRepository(Course)
    const tenantRepository = this.dataSource.getRepository(Tenant)

    const tenant = await tenantRepository.findOne({
      where: { code: 'demo-school' }
    })

    if (!tenant) {
      throw new Error('租户不存在')
    }

    // 检查是否已存在课程
    const existingCourse = await courseRepository.findOne({
      where: { tenantId: tenant.id, code: 'MATH-001' }
    })

    if (existingCourse) {
      console.log('📋 课程已存在，跳过创建')
      return
    }

    const course = courseRepository.create({
      tenantId: tenant.id,
      code: 'MATH-001',
      title: '初中数学基础',
      description: '适合初中生的基础数学课程，涵盖代数、几何等基础概念',
      subject: '数学',
      gradeBand: '7-9',
      level: 'beginner',
      language: 'zh-CN',
      estimatedHours: 40,
      tags: ['基础', '代数', '几何'],
      status: 'published',
      settings: {
        allowSelfEnroll: true,
        requireApproval: false
      },
      createdBy: 'system'
    })

    await courseRepository.save(course)
    console.log('✅ 创建课程: 初中数学基础')
  }

  private async createCourseInstances() {
    const instanceRepository = this.dataSource.getRepository(CourseInstance)
    const courseRepository = this.dataSource.getRepository(Course)

    const course = await courseRepository.findOne({
      where: { code: 'MATH-001' }
    })

    if (!course) {
      throw new Error('课程不存在')
    }

    // 检查是否已存在课程实例
    const existingInstance = await instanceRepository.findOne({
      where: { courseId: course.id, classroomId: 'classroom-001' }
    })

    if (existingInstance) {
      console.log('📋 课程实例已存在，跳过创建')
      return
    }

    const instance = instanceRepository.create({
      tenantId: course.tenantId,
      courseId: course.id,
      classroomId: 'classroom-001',
      title: '初一(1)班 - 数学课程',
      description: '为初一(1)班定制的数学课程实例',
      status: 'active',
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后
      estimatedDuration: 90, // 90分钟
      maxStudents: 40,
      currentStudentCount: 25,
      settings: {
        enableRecording: true,
        enableChat: true,
        enableQuestions: true
      },
      createdBy: 'teacher-001'
    })

    await instanceRepository.save(instance)
    console.log('✅ 创建课程实例: 初一(1)班 - 数学课程')
  }

  private async createLessons() {
    const lessonRepository = this.dataSource.getRepository(Lesson)
    const instanceRepository = this.dataSource.getRepository(CourseInstance)

    const instance = await instanceRepository.findOne({
      where: { classroomId: 'classroom-001' }
    })

    if (!instance) {
      throw new Error('课程实例不存在')
    }

    // 检查是否已存在课程
    const existingLesson = await lessonRepository.findOne({
      where: { courseInstanceId: instance.id, title: '第一章：代数基础' }
    })

    if (existingLesson) {
      console.log('📋 课程已存在，跳过创建')
      return
    }

    const lesson = lessonRepository.create({
      tenantId: instance.tenantId,
      courseId: instance.courseId,
      courseInstanceId: instance.id,
      classroomId: instance.classroomId,
      title: '第一章：代数基础',
      description: '学习代数的基本概念和运算方法',
      status: 'draft',
      type: 'regular',
      scheduledStartAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
      estimatedDuration: 90,
      participantCount: 0,
      maxParticipants: 40,
      autoRecord: false,
      settings: {
        enableBreakoutRooms: false,
        enableWhiteboard: true,
        enableScreenShare: true
      },
      createdBy: 'teacher-001'
    })

    await lessonRepository.save(lesson)
    console.log('✅ 创建课程: 第一章：代数基础')
  }

  private async createSections() {
    const sectionRepository = this.dataSource.getRepository(Section)
    const lessonRepository = this.dataSource.getRepository(Lesson)

    const lesson = await lessonRepository.findOne({
      where: { title: '第一章：代数基础' }
    })

    if (!lesson) {
      throw new Error('课程不存在')
    }

    // 检查是否已存在环节
    const existingSections = await sectionRepository.find({
      where: { lessonId: lesson.id }
    })

    if (existingSections.length > 0) {
      console.log('📋 环节已存在，跳过创建')
      return
    }

    const sections = [
      {
        title: '课程引入',
        type: 'introduction',
        content: {
          description: '介绍本节课的学习目标和重点内容',
          objectives: ['理解代数的基本概念', '掌握基本运算方法']
        },
        order: 1,
        duration: 10,
        required: true,
        skippable: false
      },
      {
        title: '新知讲解：变量与表达式',
        type: 'knowledge',
        content: {
          description: '讲解变量的概念和基本运算规则',
          keyPoints: ['变量的定义', '表达式的组成', '运算优先级'],
          examples: [
            { expression: '2x + 3 = 7', explanation: '解一元一次方程' },
            { expression: 'a + b = b + a', explanation: '加法交换律' }
          ]
        },
        order: 2,
        duration: 25,
        required: true,
        skippable: false
      },
      {
        title: '体验理解：方程练习',
        type: 'experience',
        content: {
          description: '通过互动练习加深对方程的理解',
          experienceType: 'interactive',
          interactionLevel: 'medium',
          instructions: '学生将完成一系列方程练习题',
          materials: ['练习册', '计算器']
        },
        order: 3,
        duration: 15,
        required: true,
        skippable: false
      },
      {
        title: '实验活动：数学建模',
        type: 'experiment',
        content: {
          description: '用代数方法解决实际问题',
          experimentType: 'jupyter',
          difficultyLevel: 'intermediate',
          requiresCompute: false,
          steps: [
            { title: '问题分析', description: '分析实际问题的数学模型' },
            { title: '建立方程', description: '将问题转化为代数方程' },
            { title: '求解验证', description: '求解并验证答案的正确性' }
          ]
        },
        order: 4,
        duration: 20,
        required: true,
        skippable: true
      },
      {
        title: '作业测试：综合练习',
        type: 'assignment',
        content: {
          description: '检验本节课学习效果的综合测试',
          assignmentType: 'quiz',
          questionCount: 10,
          totalScore: 100,
          passingScore: 60,
          timeLimit: true,
          questions: [
            {
              id: 1,
              type: 'single_choice',
              content: '方程 2x + 1 = 7 的解是？',
              options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'],
              correctAnswer: 2,
              score: 10
            },
            {
              id: 2,
              type: 'fill_blank',
              content: '如果 3x = 15，那么 x = ___',
              correctAnswer: '5',
              score: 10
            }
          ]
        },
        order: 5,
        duration: 15,
        required: true,
        skippable: false
      }
    ]

    for (const sectionData of sections) {
      const section = sectionRepository.create({
        ...sectionData,
        lessonId: lesson.id,
        tenantId: lesson.tenantId,
        createdBy: lesson.createdBy
      })
      await sectionRepository.save(section)
    }

    console.log(`✅ 创建 ${sections.length} 个环节`)
  }
}