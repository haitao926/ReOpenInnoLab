// ===================
// AI上下文构建器实现
// ===================

import type { AIContext, ContextBuilder } from './context-aware-ai'
import type { ActivityContext } from '@/types/course'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'

/**
 * 学习行为分析构建器
 * 分析用户的学习行为模式和偏好
 */
export class LearningBehaviorBuilder implements ContextBuilder {
  id = 'learning_behavior'
  name = '学习行为分析'
  description = '分析用户的学习行为模式和偏好'
  priority = 1

  async build(context: AIContext): Promise<void> {
    const userStore = useUserStore()
    const courseStore = useCourseStore()

    // 分析学习风格
    const learningStyle = this.analyzeLearningStyle(userStore.profile)
    context.learningContext.learningStyle = learningStyle

    // 分析学习节奏
    const pacePreference = this.analyzePacePreference(userStore.learningHistory)
    context.learningContext.pacePreference = pacePreference

    // 分析难度偏好
    const preferredDifficulty = this.analyzeDifficultyPreference(userStore.learningHistory)
    context.learningContext.preferredDifficulty = preferredDifficulty

    // 更新行为上下文
    context.behaviorContext.engagementLevel = this.calculateEngagementLevel(userStore)
    context.behaviorContext.helpRequests = this.countHelpRequests(userStore)
    context.behaviorContext.retryAttempts = this.countRetryAttempts(userStore)
  }

  private analyzeLearningStyle(profile: any): 'visual' | 'auditory' | 'kinesthetic' | 'reading' {
    // 基于用户历史行为分析学习风格
    const preferences = profile.learningPreferences || {}

    if (preferences.visualContent && preferences.visualContent > 0.6) return 'visual'
    if (preferences.audioContent && preferences.audioContent > 0.6) return 'auditory'
    if (preferences.interactiveContent && preferences.interactiveContent > 0.6) return 'kinesthetic'
    if (preferences.readingContent && preferences.readingContent > 0.6) return 'reading'

    return 'visual' // 默认
  }

  private analyzePacePreference(learningHistory: any[]): 'slow' | 'normal' | 'fast' {
    if (!learningHistory || learningHistory.length === 0) return 'normal'

    const avgCompletionTime = learningHistory
      .filter(h => h.completionTime)
      .reduce((sum, h) => sum + h.completionTime, 0) / learningHistory.length

    const estimatedTime = learningHistory
      .filter(h => h.estimatedTime)
      .reduce((sum, h) => sum + h.estimatedTime, 0) / learningHistory.length

    const ratio = avgCompletionTime / estimatedTime

    if (ratio > 1.5) return 'slow'
    if (ratio < 0.8) return 'fast'
    return 'normal'
  }

  private analyzeDifficultyPreference(learningHistory: any[]): 'easy' | 'medium' | 'hard' {
    if (!learningHistory || learningHistory.length === 0) return 'medium'

    const recentScores = learningHistory.slice(-10)
    const avgScore = recentScores.reduce((sum, h) => sum + (h.score || 0), 0) / recentScores.length

    if (avgScore > 90) return 'hard'
    if (avgScore < 60) return 'easy'
    return 'medium'
  }

  private calculateEngagementLevel(userStore: any): 'low' | 'medium' | 'high' {
    const profile = userStore.profile || {}
    const recentActivity = profile.recentActivity || []

    if (recentActivity.length === 0) return 'low'

    const lastActivity = recentActivity[recentActivity.length - 1]
    const daysSinceLastActivity = (Date.now() - new Date(lastActivity.date).getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLastActivity > 7) return 'low'
    if (daysSinceLastActivity > 3) return 'medium'
    return 'high'
  }

  private countHelpRequests(userStore: any): number {
    const profile = userStore.profile || {}
    return profile.helpRequests || 0
  }

  private countRetryAttempts(userStore: any): number {
    const profile = userStore.profile || {}
    return profile.retryAttempts || 0
  }
}

/**
 * 学习进度分析构建器
 * 分析用户的学习进度和掌握情况
 */
export class LearningProgressBuilder implements ContextBuilder {
  id = 'learning_progress'
  name = '学习进度分析'
  description = '分析用户的学习进度和知识掌握情况'
  priority = 2

  async build(context: AIContext): Promise<void> {
    const courseStore = useCourseStore()

    if (!context.activityContext) return

    const { courseId, chapterId, activityId } = context.activityContext

    // 获取课程进度数据
    const courseProgress = courseStore.getCourseProgress(courseId)
    if (courseProgress) {
      context.courseContext = {
        courseId,
        courseTitle: courseStore.currentCourse?.title || '',
        currentChapter: courseStore.currentChapter?.title || '',
        currentActivity: context.activityContext.activity.title,
        progress: courseProgress.overall,
        timeSpent: courseProgress.totalTimeSpent || 0,
        prerequisites: courseStore.currentChapter?.prerequisites || [],
        learningObjectives: context.activityContext.activity.objectives
      }
    }

    // 分析知识掌握情况
    const masteryLevels = await this.analyzeMasteryLevels(context)
    context.learningContext.masteryLevel = masteryLevels

    // 识别优势和改进领域
    const analysis = await this.analyzeStrengthsAndWeaknesses(context)
    context.learningContext.strengths = analysis.strengths
    context.learningContext.improvementAreas = analysis.improvementAreas

    // 更新最近学习主题
    context.learningContext.recentTopics = await this.getRecentTopics(context)
  }

  private async analyzeMasteryLevels(context: AIContext): Promise<Record<string, number>> {
    // 基于活动表现分析知识掌握程度
    const masteryLevels: Record<string, number> = {}

    // TODO: 从学习分析服务获取真实数据
    // 这里使用模拟数据
    masteryLevels['基础概念'] = 85
    masteryLevels['实际应用'] = 70
    masteryLevels['问题解决'] = 60

    return masteryLevels
  }

  private async analyzeStrengthsAndWeaknesses(context: AIContext): Promise<{
    strengths: string[]
    improvementAreas: string[]
  }> {
    // TODO: 实现真实的优劣势分析
    return {
      strengths: ['理论理解', '逻辑思维'],
      improvementAreas: ['实践应用', '代码调试']
    }
  }

  private async getRecentTopics(context: AIContext): Promise<string[]> {
    // TODO: 从最近的学习活动中获取主题
    return ['变量定义', '函数调用', '条件语句']
  }
}

/**
 * 环境感知构建器
 * 分析用户的学习环境和设备信息
 */
export class EnvironmentAwareBuilder implements ContextBuilder {
  id = 'environment_aware'
  name = '环境感知分析'
  description = '分析用户的学习环境和使用设备'
  priority = 3

  async build(context: AIContext): Promise<void> {
    // 设备信息
    context.environmentContext.device = this.detectDevice()
    context.environmentContext.browser = this.detectBrowser()
    context.environmentContext.connectionSpeed = await this.detectConnectionSpeed()

    // 时间信息
    context.environmentContext.timeOfDay = this.getTimeOfDay()

    // 学习环境推断
    context.environmentContext.studyLocation = this.inferStudyLocation(context)

    // 干扰因素检测
    context.environmentContext.distractions = await this.detectDistractions(context)
  }

  private detectDevice(): 'desktop' | 'tablet' | 'mobile' {
    const userAgent = navigator.userAgent.toLowerCase()

    if (/mobile|android|iphone/.test(userAgent)) {
      return 'mobile'
    }
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet'
    }
    return 'desktop'
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent

    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'

    return 'Unknown'
  }

  private async detectConnectionSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    // 使用Navigation Timing API检测网络速度
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const effectiveType = connection.effectiveType

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow'
        case '3g':
          return 'medium'
        case '4g':
          return 'fast'
        default:
          return 'medium'
      }
    }

    // 备用方法：基于页面加载时间
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart

    if (loadTime > 3000) return 'slow'
    if (loadTime > 1000) return 'medium'
    return 'fast'
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours()

    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'night'
  }

  private inferStudyLocation(context: AIContext): 'home' | 'school' | 'library' | 'other' {
    // 基于时间、设备类型和行为推断学习地点
    const hour = new Date().getHours()
    const device = context.environmentContext.device

    // 简单的启发式规则
    if (hour >= 8 && hour <= 16 && device === 'desktop') {
      return 'school'
    }
    if (hour >= 19 && hour <= 22 && device === 'desktop') {
      return 'home'
    }
    if (device === 'mobile') {
      return 'other' // 可能在通勤或其他地方
    }

    return 'home' // 默认假设在家
  }

  private async detectDistractions(context: AIContext): Promise<string[]> {
    const distractions: string[] = []

    // 检测页面可见性
    if (document.hidden) {
      distractions.push('页面切换')
    }

    // 检测长时间不活跃
    const inactiveTime = Date.now() - context.behaviorContext.lastActivityTime
    if (inactiveTime > 5 * 60 * 1000) { // 5分钟
      distractions.push('长时间不活跃')
    }

    // 检测多标签页浏览
    // TODO: 实现更复杂的检测逻辑

    return distractions
  }
}

/**
 * 情感状态分析构建器
 * 分析用户的情感状态和学习情绪
 */
export class EmotionalStateBuilder implements ContextBuilder {
  id = 'emotional_state'
  name = '情感状态分析'
  description = '分析用户的情感状态和学习情绪'
  priority = 4

  async build(context: AIContext): Promise<void> {
    // 分析情感状态
    const emotionalState = await this.analyzeEmotionalState(context)
    context.learningContext.currentGoal = emotionalState.goal

    // 更新行为上下文的情感相关指标
    context.behaviorContext.errorCount = emotionalState.errorCount
    context.behaviorContext.completionRate = emotionalState.completionRate
  }

  private async analyzeEmotionalState(context: AIContext): Promise<{
    goal: string
    errorCount: number
    completionRate: number
  }> {
    // TODO: 实现真实的情感状态分析
    // 基于错误频率、完成率、交互模式等

    return {
      goal: '完成当前学习任务',
      errorCount: context.behaviorContext.errorCount,
      completionRate: context.behaviorContext.completionRate
    }
  }
}

/**
 * 社交学习分析构建器
 * 分析用户的社交学习行为和协作模式
 */
export class SocialLearningBuilder implements ContextBuilder {
  id = 'social_learning'
  name = '社交学习分析'
  description = '分析用户的社交学习行为和协作模式'
  priority = 5

  async build(context: AIContext): Promise<void> {
    // TODO: 实现社交学习分析
    // 包括讨论参与度、帮助他人、寻求帮助等行为
  }
}

// ===================
// 上下文构建器工厂
// ===================

export class ContextBuilderFactory {
  private static builders: Map<string, new () => ContextBuilder> = new Map([
    ['learning_behavior', LearningBehaviorBuilder],
    ['learning_progress', LearningProgressBuilder],
    ['environment_aware', EnvironmentAwareBuilder],
    ['emotional_state', EmotionalStateBuilder],
    ['social_learning', SocialLearningBuilder]
  ])

  static createBuilder(type: string): ContextBuilder | null {
    const BuilderClass = this.builders.get(type)
    return BuilderClass ? new BuilderClass() : null
  }

  static getAllBuilders(): ContextBuilder[] {
    return Array.from(this.builders.values()).map(BuilderClass => new BuilderClass())
  }

  static registerBuilder(type: string, builderClass: new () => ContextBuilder): void {
    this.builders.set(type, builderClass)
  }
}

// ===================
// 导出常用构建器
// ===================

export const defaultContextBuilders = [
  new LearningBehaviorBuilder(),
  new LearningProgressBuilder(),
  new EnvironmentAwareBuilder(),
  new EmotionalStateBuilder(),
  new SocialLearningBuilder()
]