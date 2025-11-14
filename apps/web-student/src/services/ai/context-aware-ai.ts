// ===================
// 上下文感知AI服务
// ===================

import type {
  AIContext,
  AIInteraction,
  AIConversation,
  EnhancedAIHint,
  AIInput,
  AIOutput,
  AIActivityProcessor,
  AIEvaluation,
  LearningContext,
  BehaviorContext,
  PerformanceContext,
  EnvironmentContext
} from '@/types/ai'
import type { ActivityContext, ActivityResult } from '@/types/course'

/**
 * 上下文感知AI服务
 * 负责构建和管理AI交互的上下文信息
 */
export class ContextAwareAIService {
  private static instance: ContextAwareAIService
  private activeContexts = new Map<string, AIContext>()
  private conversations = new Map<string, AIConversation>()
  private interactionHistory: AIInteraction[] = []
  private contextBuilders: ContextBuilder[] = []

  static getInstance(): ContextAwareAIService {
    if (!ContextAwareAIService.instance) {
      ContextAwareAIService.instance = new ContextAwareAIService()
    }
    return ContextAwareAIService.instance
  }

  /**
   * 初始化AI上下文
   */
  async initializeContext(activityContext: ActivityContext): Promise<AIContext> {
    const contextId = this.generateContextId(activityContext)

    // 检查是否已有缓存的上下文
    if (this.activeContexts.has(contextId)) {
      return this.activeContexts.get(contextId)!
    }

    // 构建新上下文
    const aiContext: AIContext = {
      userId: 'current_student', // TODO: 从用户store获取
      sessionId: this.generateSessionId(),
      timestamp: new Date(),

      learningContext: await this.buildLearningContext(activityContext),
      activityContext,
      courseContext: await this.buildCourseContext(activityContext),

      behaviorContext: await this.buildBehaviorContext(),
      performanceContext: await this.buildPerformanceContext(activityContext),
      environmentContext: await this.buildEnvironmentContext(),

      interactionHistory: this.getRecentInteractions(activityContext.activityId),
      currentConversation: undefined
    }

    // 缓存上下文
    this.activeContexts.set(contextId, aiContext)

    // 应用上下文构建器
    await this.applyContextBuilders(aiContext)

    return aiContext
  }

  /**
   * 更新上下文信息
   */
  async updateContext(contextId: string, updates: Partial<AIContext>): Promise<void> {
    const context = this.activeContexts.get(contextId)
    if (!context) return

    // 合并更新
    Object.assign(context, updates, { timestamp: new Date() })

    // 重新应用上下文构建器
    await this.applyContextBuilders(context)
  }

  /**
   * 处理AI交互
   */
  async processInteraction(
    input: AIInput,
    contextId: string
  ): Promise<AIOutput> {
    const context = this.activeContexts.get(contextId)
    if (!context) {
      throw new Error('AI context not found')
    }

    try {
      // 预处理输入
      const processedInput = await this.preprocessInput(input, context)

      // 生成输出
      const output = await this.generateOutput(processedInput, context)

      // 记录交互
      const interaction: AIInteraction = {
        id: this.generateInteractionId(),
        type: this.inferInteractionType(processedInput),
        timestamp: new Date(),
        context: this.sanitizeContext(context),
        input: processedInput,
        output,
        metadata: {
          processingTime: 0, // 将在生成过程中计算
          confidence: 0.8, // 将从AI响应中获取
          model: 'gpt-4',
          tokens: 0,
          success: true
        }
      }

      // 记录交互历史
      this.recordInteraction(interaction)

      // 更新上下文
      await this.updateContextFromInteraction(context, interaction)

      return output

    } catch (error) {
      console.error('AI interaction failed:', error)

      // 返回错误响应
      return this.generateErrorResponse(error, context)
    }
  }

  /**
   * 获取或创建AI对话
   */
  async getOrCreateConversation(
    contextId: string,
    mode: 'hint' | 'explanation' | 'discussion' = 'discussion'
  ): Promise<AIConversation> {
    const context = this.activeContexts.get(contextId)
    if (!context) {
      throw new Error('AI context not found')
    }

    // 检查现有对话
    if (context.currentConversation &&
        context.currentConversation.status === 'active') {
      return context.currentConversation
    }

    // 创建新对话
    const conversation: AIConversation = {
      id: this.generateConversationId(),
      userId: context.userId,
      context: this.sanitizeContext(context),
      status: 'active',
      messages: [],
      metadata: {
        startTime: new Date(),
        totalMessages: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        resolutionStatus: 'pending'
      }
    }

    // 添加欢迎消息
    const welcomeMessage = await this.generateWelcomeMessage(conversation, mode)
    conversation.messages.push(welcomeMessage)

    // 更新上下文
    context.currentConversation = conversation
    this.conversations.set(conversation.id, conversation)

    return conversation
  }

  /**
   * 生成上下文感知的提示
   */
  async generateContextualHints(
    contextId: string,
    triggerType: string
  ): Promise<EnhancedAIHint[]> {
    const context = this.activeContexts.get(contextId)
    if (!context) {
      return []
    }

    // 分析上下文以确定需要的提示
    const hintNeeds = await this.analyzeHintNeeds(context, triggerType)

    // 生成相应的提示
    const hints: EnhancedAIHint[] = []

    for (const need of hintNeeds) {
      const hint = await this.generateHint(need, context)
      if (hint) {
        hints.push(hint)
      }
    }

    return hints
  }

  /**
   * 评估AI活动结果
   */
  async evaluateActivity(
    contextId: string,
    result: ActivityResult
  ): Promise<AIEvaluation> {
    const context = this.activeContexts.get(contextId)
    if (!context) {
      throw new Error('AI context not found')
    }

    // 收集评估数据
    const evaluationData = {
      context,
      result,
      interactions: this.getInteractionsForActivity(context.activityContext?.activityId || ''),
      timeSpent: this.calculateTimeSpent(context),
      progress: this.calculateProgress(context)
    }

    // 执行评估
    const evaluation: AIEvaluation = {
      success: result.success,
      score: result.score || 0,
      feedback: await this.generateFeedback(evaluationData),
      insights: await this.generateInsights(evaluationData),
      recommendations: await this.generateRecommendations(evaluationData),
      nextSteps: await this.generateNextSteps(evaluationData),
      metadata: {
        evaluationTime: new Date(),
        criteria: ['completion', 'accuracy', 'efficiency', 'engagement'],
        scores: {
          completion: result.success ? 100 : 0,
          accuracy: result.score || 0,
          efficiency: this.calculateEfficiencyScore(evaluationData),
          engagement: this.calculateEngagementScore(evaluationData)
        },
        confidence: 0.85,
        evidence: this.collectEvidence(evaluationData)
      }
    }

    return evaluation
  }

  /**
   * 清理上下文
   */
  cleanupContext(contextId: string): void {
    const context = this.activeContexts.get(contextId)
    if (context) {
      // 结束对话
      if (context.currentConversation) {
        context.currentConversation.status = 'completed'
        context.currentConversation.metadata.endTime = new Date()
      }

      // 移除上下文
      this.activeContexts.delete(contextId)
    }
  }

  // ===================
  // 私有方法 - 上下文构建
  // ===================

  private async buildLearningContext(activityContext: ActivityContext): Promise<LearningContext> {
    // TODO: 从用户store和学习分析中获取真实数据
    return {
      currentGoal: '完成当前活动',
      learningStyle: 'visual', // TODO: 从用户配置获取
      preferredDifficulty: 'medium',
      pacePreference: 'normal',
      strengths: ['逻辑思维'],
      improvementAreas: ['代码调试'],
      recentTopics: ['变量', '函数'],
      masteryLevel: {
        '基础概念': 80,
        '函数定义': 60,
        '调试技巧': 40
      }
    }
  }

  private async buildCourseContext(activityContext: ActivityContext): Promise<any> {
    return {
      courseId: activityContext.courseId,
      courseTitle: activityContext.courseTitle,
      currentChapter: activityContext.chapterTitle,
      currentActivity: activityContext.activity.title,
      progress: 75, // TODO: 从course store获取
      timeSpent: 1200, // TODO: 计算
      prerequisites: [],
      learningObjectives: activityContext.activity.objectives
    }
  }

  private async buildBehaviorContext(): Promise<BehaviorContext> {
    // TODO: 从行为跟踪服务获取数据
    return {
      sessionDuration: 1800,
      clickCount: 45,
      scrollDepth: 0.7,
      idleTime: 120,
      helpRequests: 2,
      errorCount: 1,
      retryAttempts: 3,
      completionRate: 0.85,
      engagementLevel: 'medium'
    }
  }

  private async buildPerformanceContext(activityContext: ActivityContext): Promise<PerformanceContext> {
    // TODO: 从学习分析中获取数据
    return {
      recentScores: [85, 78, 92],
      averageScore: 85,
      improvementTrend: 'improving',
      timeOnTask: [15, 12, 18],
      completionTimes: [300, 280, 320],
      errorPatterns: ['语法错误'],
      successFactors: ['仔细阅读', '多次测试']
    }
  }

  private async buildEnvironmentContext(): Promise<EnvironmentContext> {
    return {
      device: 'desktop',
      browser: 'Chrome',
      connectionSpeed: 'fast',
      timeOfDay: 'afternoon',
      studyLocation: 'home',
      distractions: []
    }
  }

  private async applyContextBuilders(context: AIContext): Promise<void> {
    for (const builder of this.contextBuilders) {
      try {
        await builder.build(context)
      } catch (error) {
        console.error('Context builder failed:', error)
      }
    }
  }

  // ===================
  // 私有方法 - 交互处理
  // ===================

  private async preprocessInput(input: AIInput, context: AIContext): Promise<AIInput> {
    // 分析意图
    input.intent = await this.analyzeIntent(input.content, context)

    // 提取实体
    input.entities = await this.extractEntities(input.content, context)

    // 计算置信度
    input.confidence = this.calculateConfidence(input, context)

    return input
  }

  private async generateOutput(input: AIInput, context: AIContext): Promise<AIOutput> {
    // 根据输入类型和上下文生成输出
    switch (input.intent) {
      case 'question':
        return await this.generateAnswer(input, context)
      case 'hint_request':
        return await this.generateHintResponse(input, context)
      case 'explanation':
        return await this.generateExplanation(input, context)
      default:
        return await this.generateGeneralResponse(input, context)
    }
  }

  private async generateAnswer(input: AIInput, context: AIContext): Promise<AIOutput> {
    // TODO: 集成真实的AI模型调用
    return {
      type: 'text',
      content: `基于你的学习进度，我来回答你的问题：${input.content}`,
      format: 'markdown',
      resources: [],
      actions: [],
      followUp: {
        questions: ['这个回答对你有帮助吗？', '你还想了解哪些相关内容？'],
        suggestions: ['查看相关示例', '尝试练习题'],
        expectedActions: ['继续学习', '提问更多问题']
      },
      metadata: {
        processingTime: 500,
        confidence: 0.9,
        model: 'gpt-4',
        tokens: 150
      }
    }
  }

  private async generateHintResponse(input: AIInput, context: AIContext): Promise<AIOutput> {
    const hints = await this.generateContextualHints(
      this.getContextId(context),
      'request_based'
    )

    const primaryHint = hints[0]

    return {
      type: 'hint',
      content: primaryHint?.content || '让我给你一些提示...',
      format: 'plain',
      resources: primaryHint?.interaction.responses.map(r => r.action).filter(Boolean) as any[] || [],
      actions: primaryHint?.interaction.responses.map(r => r.action).filter(Boolean) || [],
      followUp: primaryHint?.interaction.followUpHints ? {
        questions: ['这个提示有帮助吗？'],
        suggestions: primaryHint.interaction.followUpHints,
        expectedActions: ['继续尝试', '需要更多帮助']
      } : undefined,
      metadata: {
        processingTime: 300,
        confidence: 0.85,
        model: 'gpt-4',
        tokens: 100
      }
    }
  }

  private async generateExplanation(input: AIInput, context: AIContext): Promise<AIOutput> {
    return {
      type: 'explanation',
      content: '让我为你详细解释这个概念...',
      format: 'markdown',
      resources: [{
        id: 'example_1',
        type: 'example',
        title: '相关示例',
        description: '查看具体的应用示例',
        url: '#',
        relevanceScore: 0.9
      }],
      actions: [{
        id: 'view_example',
        type: 'open',
        label: '查看示例',
        target: '#example',
        priority: 'medium'
      }],
      metadata: {
        processingTime: 400,
        confidence: 0.88,
        model: 'gpt-4',
        tokens: 120
      }
    }
  }

  private async generateGeneralResponse(input: AIInput, context: AIContext): Promise<AIOutput> {
    return {
      type: 'text',
      content: '我理解你的问题，让我来帮助你...',
      format: 'plain',
      metadata: {
        processingTime: 200,
        confidence: 0.7,
        model: 'gpt-4',
        tokens: 80
      }
    }
  }

  private generateErrorResponse(error: any, context: AIContext): AIOutput {
    return {
      type: 'text',
      content: '抱歉，我现在遇到了一些问题。请稍后再试或联系老师寻求帮助。',
      format: 'plain',
      metadata: {
        processingTime: 0,
        confidence: 0,
        model: 'error',
        tokens: 0,
        success: false,
        error: error.message
      }
    }
  }

  // ===================
  // 私有方法 - 辅助函数
  // ===================

  private generateContextId(activityContext: ActivityContext): string {
    return `${activityContext.courseId}_${activityContext.chapterId}_${activityContext.activityId}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConversationId(): string {
    return `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getRecentInteractions(activityId: string, limit = 10): AIInteraction[] {
    return this.interactionHistory
      .filter(i => i.context.activityContext?.activityId === activityId)
      .slice(-limit)
  }

  private recordInteraction(interaction: AIInteraction): void {
    this.interactionHistory.push(interaction)

    // 限制历史记录数量
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-500)
    }
  }

  private inferInteractionType(input: AIInput): any {
    // TODO: 实现更精确的类型推断
    if (input.content.includes('提示') || input.content.includes('help')) {
      return 'hint_request'
    }
    if (input.content.includes('为什么') || input.content.includes('解释')) {
      return 'explanation'
    }
    if (input.content.includes('?') || input.content.includes('？')) {
      return 'question'
    }
    return 'general'
  }

  private sanitizeContext(context: AIContext): Partial<AIContext> {
    // 移除敏感信息
    const { userId, ...sanitized } = context
    return sanitized
  }

  private async updateContextFromInteraction(
    context: AIContext,
    interaction: AIInteraction
  ): Promise<void> {
    // 更新行为上下文
    context.behaviorContext.clickCount++
    context.behaviorContext.sessionDuration += interaction.metadata.processingTime

    // 更新交互历史
    context.interactionHistory.push(interaction)

    // 限制历史记录
    if (context.interactionHistory.length > 50) {
      context.interactionHistory = context.interactionHistory.slice(-25)
    }
  }

  private async generateWelcomeMessage(
    conversation: AIConversation,
    mode: string
  ): Promise<any> {
    // TODO: 根据模式和上下文生成个性化欢迎消息
    return {
      id: this.generateInteractionId(),
      type: 'assistant',
      content: '你好！我是你的AI学习助手，有什么可以帮助你的吗？',
      timestamp: new Date(),
      metadata: {
        model: 'gpt-4',
        tokens: 30
      }
    }
  }

  private async analyzeHintNeeds(context: AIContext, triggerType: string): Promise<any[]> {
    // TODO: 分析上下文以确定提示需求
    return [{
      type: 'guidance',
      priority: 'medium',
      topic: '当前活动',
      difficulty: context.learningContext.preferredDifficulty
    }]
  }

  private async generateHint(need: any, context: AIContext): Promise<EnhancedAIHint | null> {
    // TODO: 生成具体的提示
    return {
      id: this.generateInteractionId(),
      type: 'reactive',
      category: 'guidance',
      title: '学习提示',
      content: '这里有一些建议可以帮助你...',
      triggers: [{
        type: 'request_based',
        condition: { operator: '=', value: true },
        priority: 1
      }],
      adaptation: {
        learningStyle: {},
        difficulty: {},
        pace: {},
        context: {},
        personalization: []
      },
      interaction: {
        type: 'conversational',
        responses: [],
        followUpHints: [],
        feedbackRequest: true,
        escalationPaths: []
      },
      effectiveness: {
        views: 0,
        acceptances: 0,
        rejections: 0,
        feedback: [],
        improvementScore: 0,
        lastUpdated: new Date()
      },
      metadata: {
        author: 'ai',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['学习', '指导'],
        difficulty: 'medium',
        estimatedTime: 2,
        prerequisites: [],
        learningObjectives: []
      }
    }
  }

  private getContextId(context: AIContext): string {
    if (context.activityContext) {
      return this.generateContextId(context.activityContext)
    }
    return context.sessionId
  }

  // 占位符方法，需要后续实现
  private async analyzeIntent(content: string, context: AIContext): Promise<string> {
    return 'question'
  }

  private async extractEntities(content: string, context: AIContext): Promise<Record<string, any>> {
    return {}
  }

  private calculateConfidence(input: AIInput, context: AIContext): number {
    return 0.8
  }

  private getInteractionsForActivity(activityId: string): AIInteraction[] {
    return this.interactionHistory.filter(i =>
      i.context.activityContext?.activityId === activityId
    )
  }

  private calculateTimeSpent(context: AIContext): number {
    return context.behaviorContext.sessionDuration
  }

  private calculateProgress(context: AIContext): number {
    // TODO: 实现进度计算逻辑
    return 75
  }

  private async generateFeedback(data: any): Promise<string> {
    return '你做得很好！继续保持。'
  }

  private async generateInsights(data: any): Promise<string[]> {
    return ['你在概念理解方面表现出色', '建议多练习实际应用']
  }

  private async generateRecommendations(data: any): Promise<string[]> {
    return ['复习相关概念', '尝试更多练习题']
  }

  private async generateNextSteps(data: any): Promise<string[]> {
    return ['进入下一个活动', '查看学习资源']
  }

  private calculateEfficiencyScore(data: any): number {
    return 85
  }

  private calculateEngagementScore(data: any): number {
    return 80
  }

  private collectEvidence(data: any): any[] {
    return []
  }

  // ===================
  // 公共方法 - 上下文构建器管理
  // ===================

  /**
   * 注册上下文构建器
   */
  registerContextBuilder(builder: ContextBuilder): void {
    this.contextBuilders.push(builder)
  }

  /**
   * 移除上下文构建器
   */
  unregisterContextBuilder(builderId: string): void {
    this.contextBuilders = this.contextBuilders.filter(b => b.id !== builderId)
  }

  /**
   * 获取活跃上下文
   */
  getActiveContext(contextId: string): AIContext | undefined {
    return this.activeContexts.get(contextId)
  }

  /**
   * 获取所有活跃上下文
   */
  getAllActiveContexts(): Map<string, AIContext> {
    return new Map(this.activeContexts)
  }

  /**
   * 获取对话历史
   */
  getConversation(conversationId: string): AIConversation | undefined {
    return this.conversations.get(conversationId)
  }

  /**
   * 获取交互历史
   */
  getInteractionHistory(limit?: number): AIInteraction[] {
    return limit ? this.interactionHistory.slice(-limit) : this.interactionHistory
  }
}

// ===================
// 上下文构建器接口
// ===================

export interface ContextBuilder {
  id: string
  name: string
  description: string
  priority: number
  build(context: AIContext): Promise<void>
}

// 导出单例实例
export const contextAwareAIService = ContextAwareAIService.getInstance()