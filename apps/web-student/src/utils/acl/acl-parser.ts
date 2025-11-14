import type {
  AclDocument,
  AclChapter,
  Chapter,
  Activity,
  ResourceRef,
  Course,
  AclToViewMapping
} from '@/types/course'

// ===================
// ACL解析器
// ===================

/**
 * ACL文档解析器
 * 将ACL格式的课程文档转换为可用的视图数据结构
 */
export class AclParser {
  /**
   * 解析ACL文档
   */
  static parseAclDocument(aclDoc: AclDocument): AclToViewMapping {
    const mapping: AclToViewMapping = {
      courseInfo: {
        title: aclDoc.courseInfo.title,
        description: aclDoc.courseInfo.description,
        objectives: aclDoc.courseInfo.objectives
      },
      structure: [],
      resourceRefs: aclDoc.resourceRefs
    }

    // 转换章节结构
    mapping.structure = aclDoc.structure.map(aclChapter =>
      this.convertAclChapterToChapter(aclChapter)
    )

    return mapping
  }

  /**
   * 转换ACL章节为视图章节
   */
  static convertAclChapterToChapter(aclChapter: AclChapter, courseId?: string): Chapter {
    const chapter: Chapter = {
      id: aclChapter.id,
      courseId: courseId || 'default-course',
      type: aclChapter.type,
      title: aclChapter.title,
      description: aclChapter.description || '',
      objectives: aclChapter.objectives,
      knowledgePoints: aclChapter.knowledgePoints,
      activities: this.generateActivitiesFromAclChapter(aclChapter),
      status: 'locked', // 默认状态，实际应该根据进度计算
      progress: 0,
      duration: aclChapter.duration || 60,
      order: aclChapter.order || 0,
      resourceRefs: aclChapter.resources || [],
      aiHints: this.convertAiHints(aclChapter.aiHints),
      assessment: aclChapter.assessment,
      expectedOutcome: aclChapter.expectedOutcome,
      classroomActions: this.generateClassroomActions(aclChapter)
    }

    return chapter
  }

  /**
   * 从ACL章节生成活动列表
   */
  static generateActivitiesFromAclChapter(aclChapter: AclChapter): Activity[] {
    const activities: Activity[] = []

    // 根据章节类型生成对应的活动
    switch (aclChapter.type) {
      case 'knowledge':
        activities.push(this.generateKnowledgeActivity(aclChapter))
        break
      case 'experiment':
        activities.push(this.generateExperimentActivity(aclChapter))
        break
      case 'experience':
        activities.push(this.generateExperienceActivity(aclChapter))
        break
      case 'assignment':
        activities.push(this.generateAssignmentActivity(aclChapter))
        break
      case 'introduction':
        activities.push(this.generateIntroductionActivity(aclChapter))
        break
    }

    return activities
  }

  /**
   * 生成知识学习活动
   */
  static generateKnowledgeActivity(aclChapter: AclChapter): Activity {
    return {
      id: `${aclChapter.id}_knowledge`,
      chapterId: aclChapter.id,
      type: 'knowledge',
      title: `知识学习: ${aclChapter.title}`,
      description: aclChapter.description || '',
      objectives: aclChapter.objectives,
      status: 'locked',
      progress: 0,
      duration: Math.floor((aclChapter.duration || 60) * 0.7),
      difficulty: 'medium',
      resourceRefs: aclChapter.resources || [],
      knowledgeConfig: {
        contentType: 'text',
        readingTime: (aclChapter.duration || 60) * 0.7,
        keyPoints: aclChapter.knowledgePoints,
        resources: []
      },
      instructions: `请仔细学习${aclChapter.title}的相关知识内容，理解核心概念和要点。`,
      expectedOutcome: aclChapter.expectedOutcome,
      aiHints: this.convertAiHints(aclChapter.aiHints),
      assessment: aclChapter.assessment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成实验活动
   */
  static generateExperimentActivity(aclChapter: AclChapter): Activity {
    return {
      id: `${aclChapter.id}_experiment`,
      chapterId: aclChapter.id,
      type: 'experiment',
      title: `实验活动: ${aclChapter.title}`,
      description: aclChapter.description || '',
      objectives: aclChapter.objectives,
      status: 'locked',
      progress: 0,
      duration: Math.floor((aclChapter.duration || 60) * 1.2),
      difficulty: 'medium',
      resourceRefs: aclChapter.resources || [],
      experimentConfig: {
        experimentType: 'jupyter',
        environment: {
          type: 'cloud',
          resources: {
            cpu: '2',
            memory: '4Gi',
            storage: '10Gi'
          },
          timeout: aclChapter.duration || 60,
          restartPolicy: 'on-failure'
        },
        resources: [],
        jupyterConfig: {
          notebookId: `${aclChapter.id}_notebook`,
          notebookUrl: `/notebooks/${aclChapter.id}.ipynb`,
          runtime: 'python',
          kernelSpec: {
            name: 'python3',
            displayName: 'Python 3',
            language: 'python',
            argv: ['python', '-m', 'ipykernel_launcher', '-f', '{connection_file}']
          },
          autoStart: true,
          allowedActions: ['run', 'edit', 'download']
        }
      },
      instructions: `请按照实验指导完成${aclChapter.title}的实验操作，记录实验过程和结果。`,
      expectedOutcome: aclChapter.expectedOutcome,
      aiHints: this.convertAiHints(aclChapter.aiHints),
      assessment: aclChapter.assessment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成体验活动
   */
  static generateExperienceActivity(aclChapter: AclChapter): Activity {
    return {
      id: `${aclChapter.id}_experience`,
      chapterId: aclChapter.id,
      type: 'experience',
      title: `互动体验: ${aclChapter.title}`,
      description: aclChapter.description || '',
      objectives: aclChapter.objectives,
      status: 'locked',
      progress: 0,
      duration: aclChapter.duration || 60,
      difficulty: 'medium',
      resourceRefs: aclChapter.resources || [],
      experienceConfig: {
        experienceType: 'html',
        contentUrl: `/experiences/${aclChapter.id}.html`,
        fullscreen: true,
        responsive: true,
        interactions: [
          {
            type: 'click',
            required: true
          },
          {
            type: 'scroll',
            required: false
          }
        ],
        dataCollection: {
          enabled: true,
          events: ['click', 'scroll', 'mousemove'],
          screenshots: false,
          mouseTracking: true,
          timeTracking: true
        },
        security: {
          sandbox: true,
          allowedDomains: ['localhost', 'reopeninnolab.com'],
          blockedDomains: [],
          cspHeaders: {},
          permissions: []
        },
        timeLimit: aclChapter.duration,
        maxAttempts: 3
      },
      instructions: `请通过互动体验深入理解${aclChapter.title}的内容，积极参与各项交互活动。`,
      expectedOutcome: aclChapter.expectedOutcome,
      aiHints: this.convertAiHints(aclChapter.aiHints),
      assessment: aclChapter.assessment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成作业活动
   */
  static generateAssignmentActivity(aclChapter: AclChapter): Activity {
    return {
      id: `${aclChapter.id}_assignment`,
      chapterId: aclChapter.id,
      type: 'assignment',
      title: `作业任务: ${aclChapter.title}`,
      description: aclChapter.description || '',
      objectives: aclChapter.objectives,
      status: 'locked',
      progress: 0,
      duration: aclChapter.duration || 60,
      difficulty: 'medium',
      resourceRefs: aclChapter.resources || [],
      assignmentConfig: {
        assignmentType: 'mixed',
        submissionConfig: {
          allowFiles: true,
          allowedFileTypes: ['.pdf', '.docx', '.txt', '.py', '.ipynb'],
          maxFileSize: 10, // MB
          maxFiles: 5,
          textSubmission: true,
          codeSubmission: true,
          codeLanguages: ['python', 'javascript', 'markdown']
        },
        gradingConfig: {
          type: 'hybrid',
          rubric: aclChapter.assessment?.criteria ? {
            criteria: aclChapter.assessment.criteria.map((c, i) => ({
              id: `criterion_${i}`,
              name: c.name,
              description: c.description,
              weight: c.weight,
              levels: [
                { name: '优秀', description: '超出预期', points: 100 },
                { name: '良好', description: '达到预期', points: 80 },
                { name: '及格', description: '基本达到', points: 60 },
                { name: '不及格', description: '未达到', points: 0 }
              ]
            })),
            maxScore: 100,
            passingScore: aclChapter.assessment?.passingScore || 60
          } : undefined,
          feedbackTemplate: '您的作业已完成评估，请查看详细反馈。',
          showCorrectAnswers: false,
          allowReview: true
        },
        timeLimit: aclChapter.duration ? aclChapter.duration * 2 : 120, // 作业时间通常是章节时间的2倍
        maxAttempts: aclChapter.assessment?.maxAttempts || 3,
        allowLateSubmission: true,
        latePenalty: 10
      },
      instructions: `请完成${aclChapter.title}的作业任务，确保按照要求提交所有必要的内容。`,
      expectedOutcome: aclChapter.expectedOutcome,
      aiHints: this.convertAiHints(aclChapter.aiHints),
      assessment: aclChapter.assessment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成介绍活动
   */
  static generateIntroductionActivity(aclChapter: AclChapter): Activity {
    return {
      id: `${aclChapter.id}_intro`,
      chapterId: aclChapter.id,
      type: 'knowledge', // 介绍活动使用知识学习类型
      title: `课程介绍: ${aclChapter.title}`,
      description: aclChapter.description || '',
      objectives: aclChapter.objectives,
      status: 'locked',
      progress: 0,
      duration: Math.floor((aclChapter.duration || 60) * 0.3),
      difficulty: 'easy',
      resourceRefs: aclChapter.resources || [],
      knowledgeConfig: {
        contentType: 'text',
        readingTime: (aclChapter.duration || 60) * 0.3,
        keyPoints: aclChapter.knowledgePoints,
        resources: []
      },
      instructions: `请仔细阅读${aclChapter.title}的介绍内容，了解课程整体安排和学习要求。`,
      expectedOutcome: aclChapter.expectedOutcome,
      aiHints: this.convertAiHints(aclChapter.aiHints),
      assessment: aclChapter.assessment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 转换AI提示
   */
  static convertAiHints(aiHints?: string[]): any[] {
    if (!aiHints || aiHints.length === 0) return []

    return aiHints.map((hint, index) => ({
      id: `hint_${index}`,
      type: 'study' as const,
      title: `学习提示 ${index + 1}`,
      content: hint,
      priority: 'medium' as const,
      conditions: [
        {
          type: 'progress' as const,
          value: 30,
          operator: '<' as const
        }
      ],
      action: {
        type: 'show' as const,
        data: hint
      }
    }))
  }

  /**
   * 生成课堂活动
   */
  static generateClassroomActions(aclChapter: AclChapter): any[] {
    const actions: any[] = []

    // 根据章节类型生成相应的课堂活动
    switch (aclChapter.type) {
      case 'knowledge':
        actions.push({
          id: `${aclChapter.id}_discussion`,
          type: 'discussion',
          title: '小组讨论',
          description: `就${aclChapter.title}的核心概念进行小组讨论`,
          duration: 15,
          instructions: '请分组讨论以下问题...',
          teacherOnly: false
        })
        break

      case 'experiment':
        actions.push({
          id: `${aclChapter.id}_demo`,
          type: 'presentation',
          title: '实验演示',
          description: '教师演示实验操作流程',
          duration: 20,
          instructions: '请仔细观察实验演示...',
          teacherOnly: true
        })
        break

      case 'experience':
        actions.push({
          id: `${aclChapter.id}_interaction`,
          type: 'breakout',
          title: '分组体验',
          description: '分组完成互动体验任务',
          duration: 25,
          instructions: '请按小组完成体验任务...',
          teacherOnly: false
        })
        break

      case 'assignment':
        actions.push({
          id: `${aclChapter.id}_review`,
          type: 'presentation',
          title: '作业讲解',
          description: '讲解作业要求和评分标准',
          duration: 10,
          instructions: '请仔细听讲作业要求...',
          teacherOnly: false
        })
        break
    }

    return actions
  }

  /**
   * 验证ACL文档结构
   */
  static validateAclDocument(aclDoc: AclDocument): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查必需字段
    if (!aclDoc.meta?.version) {
      errors.push('缺少文档版本信息')
    }

    if (!aclDoc.courseInfo?.title) {
      errors.push('缺少课程标题')
    }

    if (!aclDoc.structure || aclDoc.structure.length === 0) {
      errors.push('缺少课程结构')
    }

    // 检查章节结构
    if (aclDoc.structure) {
      aclDoc.structure.forEach((chapter, index) => {
        if (!chapter.id) {
          errors.push(`章节 ${index + 1} 缺少ID`)
        }
        if (!chapter.type) {
          errors.push(`章节 ${index + 1} 缺少类型`)
        }
        if (!chapter.title) {
          errors.push(`章节 ${index + 1} 缺少标题`)
        }
        if (!chapter.objectives || chapter.objectives.length === 0) {
          errors.push(`章节 ${index + 1} 缺少学习目标`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 创建默认ACL文档结构
   */
  static createDefaultAclDocument(title: string, description: string): AclDocument {
    return {
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: `${title} - ACL课程文档`
      },
      courseInfo: {
        title,
        description,
        objectives: [
          '理解课程核心概念',
          '掌握基本技能和方法',
          '能够独立完成实践任务'
        ],
        subject: 'general',
        duration: 120,
        difficulty: 'beginner'
      },
      structure: [
        {
          id: 'intro_chapter',
          type: 'introduction',
          title: '课程介绍',
          description: '课程整体介绍和学习安排',
          objectives: [
            '了解课程目标和内容安排',
            '熟悉学习平台的使用方法',
            '理解学习评估方式'
          ],
          duration: 30,
          order: 0,
          resources: [],
          aiHints: [
            '建议先了解课程整体安排',
            '注意学习方法和时间管理'
          ],
          expectedOutcome: '学生能够清晰了解课程安排和学习要求'
        }
      ],
      resourceRefs: []
    }
  }
}