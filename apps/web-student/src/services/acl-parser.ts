import type { Course, Chapter, Activity } from '@/stores/course'
import type {
  AiCourseLayout,
  CourseNode,
  NodeType,
  CourseStructure,
  ExperienceContent,
  ExperimentContent,
  AssignmentContent
} from '@reopeninnolab/acl-sdk'

// 转换后的课程视图数据
export interface CourseView {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  learningObjectives: string[]
  estimatedDuration: number
  chapters: ChapterView[]
}

export interface ChapterView {
  id: string
  title: string
  type: 'introduction' | 'knowledge' | 'activity'
  objectives: string[]
  content?: string
  knowledgePoints?: string[]
  activities?: ActivityView[]
  status: 'locked' | 'available' | 'completed'
  order: number
  estimatedDuration: number
}

export interface ActivityView {
  id: string
  type: 'lab' | 'experience' | 'assignment' | 'quiz'
  title: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed'
  estimatedDuration: number
  difficulty: 'easy' | 'medium' | 'hard'
  resources?: any[]
  instructions?: string
  objectives?: string[]
  url?: string
  attachments?: any[]
}

/**
 * ACL解析服务
 * 负责将.acl文件转换为前端可用的课程结构
 */
export class ACLParserService {
  private static instance: ACLParserService

  static getInstance(): ACLParserService {
    if (!ACLParserService.instance) {
      ACLParserService.instance = new ACLParserService()
    }
    return ACLParserService.instance
  }

  /**
   * 解析ACL文件并转换为课程视图
   */
  async parseToCourseView(aclData: AiCourseLayout, courseId: string): Promise<CourseView> {
    const { courseInfo, structure } = aclData

    const chapters: ChapterView[] = this.convertStructureToChapters(structure)

    return {
      id: courseId,
      title: courseInfo.title,
      description: courseInfo.description || '',
      subject: courseInfo.subject,
      grade: courseInfo.grade,
      learningObjectives: courseInfo.learningObjectives.map(obj => obj.description),
      estimatedDuration: courseInfo.estimatedDuration,
      chapters
    }
  }

  /**
   * 将ACL结构转换为章节列表
   */
  private convertStructureToChapters(structure: CourseStructure): ChapterView[] {
    return structure.map((node, index) => this.convertNodeToChapter(node, index + 1))
  }

  /**
   * 将单个节点转换为章节
   */
  private convertNodeToChapter(node: CourseNode, order: number): ChapterView {
    const baseChapter = {
      id: node.id,
      title: node.title,
      order,
      estimatedDuration: node.duration,
      objectives: node.learningGoals,
      status: 'locked' as const
    }

    switch (node.type) {
      case 'introduction':
        return {
          ...baseChapter,
          type: 'introduction',
          content: this.formatIntroductionContent(node.content),
          status: 'available' as const // 导入章节通常立即可用
        }

      case 'knowledge':
        return {
          ...baseChapter,
          type: 'knowledge',
          knowledgePoints: this.extractKnowledgePoints(node.content),
          content: this.formatKnowledgeContent(node.content),
          status: 'available' as const
        }

      case 'experience':
        return {
          ...baseChapter,
          type: 'activity',
          activities: this.convertExperienceToActivities(node.content),
          content: node.content.instructions,
          status: 'locked' as const // 体验活动通常需要先完成前置章节
        }

      case 'experiment':
        return {
          ...baseChapter,
          type: 'activity',
          activities: this.convertExperimentToActivities(node.content),
          content: this.formatExperimentContent(node.content),
          status: 'locked' as const
        }

      case 'assignment':
        return {
          ...baseChapter,
          type: 'activity',
          activities: this.convertAssignmentToActivities(node.content),
          content: node.content.questions ? '包含测试题目' : '作业任务',
          status: 'locked' as const
        }

      case 'chapter':
        // 如果是章节容器，递归处理子节点
        if (node.children) {
          const subChapters = this.convertStructureToChapters(node.children)
          return {
            ...baseChapter,
            type: 'introduction', // 章节容器作为引导章节
            content: `本章节包含 ${subChapters.length} 个子模块`,
            status: 'available' as const
          }
        }
        break

      default:
        console.warn(`未知的节点类型: ${node.type}`)
        return {
          ...baseChapter,
          type: 'knowledge',
          content: '未知内容类型',
          status: 'available' as const
        }
    }

    return baseChapter
  }

  /**
   * 格式化导入内容
   */
  private formatIntroductionContent(content: any): string {
    if (typeof content === 'string') return content

    if (content.hookContent) {
      switch (content.hookType) {
        case 'question':
          return `🤔 ${content.hookContent}`
        case 'story':
          return `📖 ${content.hookContent}`
        case 'video':
          return `🎥 [视频] ${content.hookContent}`
        case 'image':
          return `🖼️ [图片] ${content.hookContent}`
        default:
          return content.hookContent
      }
    }

    return content?.toString() || '课程导入内容'
  }

  /**
   * 提取知识点
   */
  private extractKnowledgePoints(content: any): string[] {
    if (!content) return []

    if (typeof content === 'string') {
      // 尝试从文本中提取知识点（简单实现）
      return content.split(/[。！？]/).filter(s => s.trim().length > 10)
    }

    if (content.examples && Array.isArray(content.examples)) {
      return content.examples.map((example: any) => example.title)
    }

    if (content.content && typeof content.content === 'string') {
      return [content.content]
    }

    return []
  }

  /**
   * 格式化知识内容
   */
  private formatKnowledgeContent(content: any): string {
    if (typeof content === 'string') return content

    if (content.format === 'text' && typeof content.content === 'string') {
      return content.content
    }

    if (content.format === 'video' && content.content) {
      return `🎥 [视频内容] ${this.getMediaDescription(content.content)}`
    }

    if (content.format === 'audio' && content.content) {
      return `🎵 [音频内容] ${this.getMediaDescription(content.content)}`
    }

    if (content.format === 'interactive' && content.content) {
      return `🎮 [互动内容] 点击开始互动学习`
    }

    return content?.toString() || '知识内容'
  }

  /**
   * 获取媒体描述
   */
  private getMediaDescription(media: any): string {
    if (typeof media === 'string') return media
    if (media.title) return media.title
    if (media.url) return media.url
    return '媒体文件'
  }

  /**
   * 将体验内容转换为活动
   */
  private convertExperienceToActivities(content: ExperienceContent): ActivityView[] {
    const activities: ActivityView[] = []

    activities.push({
      id: `exp-${content.experienceType}`,
      type: 'experience',
      title: '互动体验',
      description: content.instructions,
      status: 'not-started',
      estimatedDuration: content.duration,
      difficulty: this.mapInteractionLevelToDifficulty(content.interactionLevel),
      instructions: content.instructions,
      objectives: [],
      url: `/experience/${content.experienceType}`
    })

    return activities
  }

  /**
   * 将实验内容转换为活动
   */
  private convertExperimentToActivities(content: ExperimentContent): ActivityView[] {
    const activities: ActivityView[] = []

    activities.push({
      id: `lab-${content.experimentType}`,
      type: 'lab',
      title: '虚拟实验',
      description: `实验类型：${content.experimentType}`,
      status: 'not-started',
      estimatedDuration: 30, // 默认30分钟
      difficulty: content.safetyLevel === 'high' ? 'hard' : 'medium',
      instructions: '请按照实验步骤进行操作',
      objectives: [],
      url: content.notebook || `/lab/${content.experimentType}`,
      resources: content.aiAssistant ? [{
        id: 'ai-assistant',
        name: 'AI实验助手',
        description: '提供实验指导',
        type: 'tool'
      }] : []
    })

    return activities
  }

  /**
   * 将作业内容转换为活动
   */
  private convertAssignmentToActivities(content: AssignmentContent): ActivityView[] {
    const activities: ActivityView[] = []

    activities.push({
      id: `assignment-${content.assignmentType}`,
      type: content.assignmentType === 'quiz' ? 'quiz' : 'assignment',
      title: this.getAssignmentTitle(content.assignmentType),
      description: this.getAssignmentDescription(content),
      status: 'not-started',
      estimatedDuration: 20, // 默认20分钟
      difficulty: 'medium',
      instructions: '请仔细阅读题目要求',
      objectives: content.rubric?.criteria.map(c => c.description) || []
    })

    return activities
  }

  /**
   * 获取作业标题
   */
  private getAssignmentTitle(type: string): string {
    const titles = {
      'quiz': '随堂测验',
      'essay': '问答题',
      'project': '项目作业',
      'presentation': '展示任务'
    }
    return titles[type as keyof typeof titles] || '作业任务'
  }

  /**
   * 获取作业描述
   */
  private getAssignmentDescription(content: AssignmentContent): string {
    if (content.questions && content.questions.length > 0) {
      return `包含 ${content.questions.length} 道题目`
    }

    if (content.submissionFormat && content.submissionFormat.length > 0) {
      return `提交格式：${content.submissionFormat.join(', ')}`
    }

    return '请完成相应作业'
  }

  /**
   * 将交互级别映射到难度
   */
  private mapInteractionLevelToDifficulty(level: string): 'easy' | 'medium' | 'hard' {
    const mapping = {
      'low': 'easy',
      'medium': 'medium',
      'high': 'hard'
    }
    return mapping[level as keyof typeof mapping] || 'medium'
  }

  /**
   * 更新章节状态
   */
  updateChapterStatus(chapters: ChapterView[], progress: Record<string, 'completed'>): ChapterView[] {
    return chapters.map((chapter, index) => {
      const isCompleted = progress[chapter.id] === 'completed'
      const isAvailable = index === 0 || progress[chapters[index - 1]?.id] === 'completed'

      return {
        ...chapter,
        status: isCompleted ? 'completed' : isAvailable ? 'available' : 'locked'
      }
    })
  }

  /**
   * 获取下一个可用章节
   */
  getNextAvailableChapter(chapters: ChapterView[]): ChapterView | null {
    return chapters.find(ch => ch.status === 'available') || null
  }

  /**
   * 计算整体进度
   */
  calculateProgress(chapters: ChapterView[]): number {
    if (chapters.length === 0) return 0
    const completed = chapters.filter(ch => ch.status === 'completed').length
    return Math.round((completed / chapters.length) * 100)
  }

  /**
   * 根据学习进度推荐活动
   */
  recommendActivities(chapters: ChapterView[], userProgress: Record<string, any>): ActivityView[] {
    const recommendations: ActivityView[] = []

    chapters.forEach(chapter => {
      if (chapter.status === 'available' && chapter.activities) {
        recommendations.push(...chapter.activities.filter(activity =>
          activity.status === 'not-started'
        ))
      }
    })

    return recommendations.slice(0, 3) // 最多推荐3个活动
  }

  /**
   * 生成学习路径建议
   */
  generateLearningPath(chapters: ChapterView[]): string[] {
    const path: string[] = []

    chapters.forEach((chapter, index) => {
      if (chapter.type === 'introduction') {
        path.push(`📚 ${chapter.title} - 了解课程目标`)
      } else if (chapter.type === 'knowledge') {
        path.push(`📖 ${chapter.title} - 学习新知识`)
      } else if (chapter.type === 'activity') {
        path.push(`🎯 ${chapter.title} - 实践应用`)
      }
    })

    return path
  }
}

// 导出单例实例
export const aclParserService = ACLParserService.getInstance()