// ===================
// AI增强数据结构
// ===================

import type { ActivityContext, ActivityResult } from './course'

// ===================
// AI上下文感知系统
// ===================

/**
 * AI上下文信息
 * 包含AI决策所需的所有环境信息
 */
export interface AIContext {
  // 基础上下文
  userId: string
  sessionId: string
  timestamp: Date

  // 学习上下文
  learningContext: LearningContext
  activityContext?: ActivityContext
  courseContext?: CourseContext

  // 行为上下文
  behaviorContext: BehaviorContext
  performanceContext: PerformanceContext

  // 环境上下文
  environmentContext: EnvironmentContext

  // 历史交互
  interactionHistory: AIInteraction[]
  currentConversation?: AIConversation
}

export interface LearningContext {
  currentGoal?: string
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  preferredDifficulty?: 'easy' | 'medium' | 'hard'
  pacePreference?: 'slow' | 'normal' | 'fast'
  strengths: string[]
  improvementAreas: string[]
  recentTopics: string[]
  masteryLevel: Record<string, number> // 主题 -> 掌握度 (0-100)
}

export interface CourseContext {
  courseId: string
  courseTitle: string
  currentChapter?: string
  currentActivity?: string
  progress: number
  timeSpent: number
  prerequisites: string[]
  learningObjectives: string[]
}

export interface BehaviorContext {
  sessionDuration: number
  clickCount: number
  scrollDepth: number
  idleTime: number
  helpRequests: number
  errorCount: number
  retryAttempts: number
  completionRate: number
  engagementLevel: 'low' | 'medium' | 'high'
}

export interface PerformanceContext {
  recentScores: number[]
  averageScore: number
  improvementTrend: 'improving' | 'stable' | 'declining'
  timeOnTask: number[]
  completionTimes: number[]
  errorPatterns: string[]
  successFactors: string[]
}

export interface EnvironmentContext {
  device: 'desktop' | 'tablet' | 'mobile'
  browser?: string
  connectionSpeed?: 'slow' | 'medium' | 'fast'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  studyLocation?: 'home' | 'school' | 'library' | 'other'
  distractions: string[]
}

// ===================
// AI交互系统
// ===================

/**
 * AI交互记录
 */
export interface AIInteraction {
  id: string
  type: InteractionType
  timestamp: Date
  context: Partial<AIContext>
  input: AIInput
  output: AIOutput
  metadata: InteractionMetadata
}

export type InteractionType =
  | 'question'           // 提问
  | 'hint_request'       // 请求提示
  | 'suggestion'         // 建议
  | 'explanation'        // 解释
  | 'feedback'           // 反馈
  | 'encouragement'      // 鼓励
  | 'correction'         // 纠正
  | 'reflection'         // 反思
  | 'goal_setting'       // 目标设定
  | 'progress_check'     // 进度检查

export interface AIInput {
  type: 'text' | 'voice' | 'action' | 'event'
  content: string
  intent?: string
  entities?: Record<string, any>
  confidence?: number
}

export interface AIOutput {
  type: 'text' | 'action' | 'resource' | 'hint' | 'suggestion'
  content: string
  format: 'plain' | 'markdown' | 'html' | 'json'
  resources?: AIResource[]
  actions?: AIAction[]
  followUp?: AIFollowUp
  metadata: OutputMetadata
}

export interface AIResource {
  id: string
  type: 'document' | 'video' | 'interactive' | 'tool' | 'example'
  title: string
  description: string
  url: string
  duration?: number
  difficulty: 'easy' | 'medium' | 'hard'
  relevanceScore: number
}

export interface AIAction {
  id: string
  type: 'navigation' | 'highlight' | 'open' | 'configure' | 'submit'
  label: string
  target: string
  parameters?: Record<string, any>
  priority: 'low' | 'medium' | 'high'
}

export interface AIFollowUp {
  questions: string[]
  suggestions: string[]
  expectedActions: string[]
  timeframe?: number // 提醒时间（秒）
}

export interface InteractionMetadata {
  processingTime: number
  confidence: number
  model: string
  tokens: number
  cost?: number
  success: boolean
  error?: string
}

// ===================
// AI对话管理
// ===================

/**
 * AI对话会话
 */
export interface AIConversation {
  id: string
  userId: string
  context: Partial<AIContext>
  status: ConversationStatus
  messages: AIMessage[]
  metadata: ConversationMetadata
}

export type ConversationStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'timeout'
  | 'error'

export interface AIMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata: MessageMetadata
}

export interface MessageMetadata {
  tokens?: number
  processingTime?: number
  confidence?: number
  model?: string
  intent?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  urgency?: 'low' | 'medium' | 'high'
}

export interface ConversationMetadata {
  startTime: Date
  endTime?: Date
  duration?: number
  totalMessages: number
  totalTokens: number
  averageResponseTime: number
  satisfactionRating?: number
  resolutionStatus: 'resolved' | 'pending' | 'escalated'
}

// ===================
// 增强的AI提示系统
// ===================

/**
 * 上下文感知的AI提示
 */
export interface EnhancedAIHint {
  id: string
  type: AIHintType
  category: AIHintCategory
  title: string
  content: string

  // 触发条件
  triggers: AITrigger[]

  // 上下文适配
  adaptation: HintAdaptation

  // 交互能力
  interaction: HintInteraction

  // 效果跟踪
  effectiveness: HintEffectiveness

  // 元数据
  metadata: HintMetadata
}

export type AIHintType =
  | 'proactive'          // 主动提示
  | 'reactive'           // 被动响应
  | 'corrective'         // 纠错提示
  | 'guidance'           // 指导提示
  | 'encouragement'      // 鼓励提示
  | 'reflection'         // 反思提示
  | 'extension'          // 扩展提示

export type AIHintCategory =
  | 'concept'            // 概念理解
  | 'procedure'          // 操作步骤
  | 'troubleshooting'    // 问题解决
  | 'optimization'       // 优化建议
  | 'connection'         // 知识联系
  | 'application'        // 实际应用
  | 'metacognition'      // 元认知

export interface AITrigger {
  type: TriggerType
  condition: TriggerCondition
  priority: number
  cooldown?: number // 冷却时间（秒）
}

export type TriggerType =
  | 'time_spent'         // 时间触发
  | 'error_count'        // 错误次数触发
  | 'inactivity'         // 不活跃触发
  | 'performance'        // 表现触发
  | 'progress_stall'     // 进度停滞触发
  | 'confusion_detected' // 困惑检测触发
  | 'opportunity'        // 机会触发
  | 'request_based'      // 请求触发

export interface TriggerCondition {
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'in' | 'contains'
  value: any
  timeWindow?: number // 时间窗口（秒）
}

export interface HintAdaptation {
  learningStyle: Record<string, string> // 学习风格 -> 适配内容
  difficulty: Record<string, string>   // 难度级别 -> 适配内容
  pace: Record<string, string>         // 学习节奏 -> 适配内容
  context: Record<string, string>      // 上下文 -> 适配内容
  personalization: PersonalizationRule[]
}

export interface PersonalizationRule {
  condition: string
  adaptation: string
  confidence: number
}

export interface HintInteraction {
  type: 'static' | 'interactive' | 'conversational'
  responses: HintResponse[]
  followUpHints: string[]
  feedbackRequest: boolean
  escalationPaths: EscalationPath[]
}

export interface HintResponse {
  trigger: string
  content: string
  action?: AIAction
  nextHint?: string
}

export interface EscalationPath {
  condition: string
  target: 'human_teacher' | 'advanced_ai' | 'peer_support'
  message: string
}

export interface HintEffectiveness {
  views: number
  acceptances: number
  rejections: number
  feedback: number[]
  improvementScore: number
  lastUpdated: Date
}

export interface HintMetadata {
  author: 'ai' | 'teacher'
  version: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: number
  prerequisites: string[]
  learningObjectives: string[]
}

// ===================
// AI实验配置增强
// ===================

/**
 * 增强的AI实验配置
 */
export interface EnhancedAIExperimentConfig {
  // 基础配置
  modelProvider: string
  modelName: string
  modelVersion?: string

  // 上下文配置
  contextConfig: AIContextConfig

  // 交互配置
  interactionConfig: AIInteractionConfig

  // 个性化配置
  personalizationConfig: AIPersonalizationConfig

  // 安全和限制
  safetyConfig: AISafetyConfig

  // 评估配置
  evaluationConfig: AIEvaluationConfig
}

export interface AIContextConfig {
  systemPrompt: string
  contextInjection: ContextInjection[]
  memoryConfig: AIMemoryConfig
  knowledgeBase: AIKnowledgeBase[]
}

export interface ContextInjection {
  type: 'course' | 'chapter' | 'activity' | 'user' | 'environment'
  enabled: boolean
  priority: number
  template?: string
}

export interface AIMemoryConfig {
  shortTermMemory: boolean
  longTermMemory: boolean
  conversationMemory: boolean
  contextWindow: number
  memoryRetention: number // 天数
}

export interface AIKnowledgeBase {
  id: string
  type: 'course_content' | 'general_knowledge' | 'user_data' | 'external_api'
  enabled: boolean
  priority: number
  queryTemplate?: string
}

export interface AIInteractionConfig {
  inputModes: ('text' | 'voice' | 'image' | 'code')[]
  outputFormats: ('text' | 'voice' | 'visual' | 'interactive')[]
  interactionStyle: 'tutorial' | 'collaborative' | 'socratic' | 'direct'
  responseStyle: 'concise' | 'detailed' | 'adaptive'
  proactiveAssistance: boolean

  // 对话管理
  conversationLimits: {
    maxMessages: number
    maxDuration: number // 分钟
    autoTimeout: number // 分钟
  }

  // 交互模式
  interactionModes: InteractionMode[]
}

export interface InteractionMode {
  id: string
  name: string
  description: string
  icon?: string
  prompt: string
  tools: AITool[]
  parameters?: Record<string, any>
}

export interface AIPersonalizationConfig {
  adaptiveDifficulty: boolean
  learningStyleAdaptation: boolean
  paceAdaptation: boolean
  interestBasedContent: boolean

  // 用户模型
  userModel: {
    updateFrequency: number // 小时
    factors: PersonalizationFactor[]
    weightAdjustment: boolean
  }
}

export interface PersonalizationFactor {
  name: string
  weight: number
  updateTrigger: string
  decayRate?: number
}

export interface AISafetyConfig {
  contentFiltering: boolean
  biasDetection: boolean
  emotionalSafety: boolean
  dataPrivacy: boolean

  // 限制设置
  limits: {
    maxTokensPerResponse: number
    maxResponsesPerSession: number
    allowedTopics: string[]
    blockedTopics: string[]
    sensitiveDataHandling: 'block' | 'mask' | 'log'
  }

  // 监控设置
  monitoring: {
    flagInappropriateContent: boolean
    logAllInteractions: boolean
    automaticEscalation: boolean
    teacherNotifications: boolean
  }
}

export interface AIEvaluationConfig {
  performanceMetrics: PerformanceMetric[]
  learningOutcomes: LearningOutcome[]
  qualityAssurance: QualityAssuranceConfig

  // 反馈循环
  feedbackLoop: {
    studentFeedback: boolean
    teacherFeedback: boolean
    automatedEvaluation: boolean
    improvementCycle: number // 天
  }
}

export interface PerformanceMetric {
  name: string
  type: 'efficiency' | 'effectiveness' | 'engagement' | 'satisfaction'
  measurement: string
  target: number
  weight: number
}

export interface LearningOutcome {
  id: string
  description: string
  indicators: string[]
  assessmentMethods: string[]
}

export interface QualityAssuranceConfig {
  responseQuality: boolean
  factualAccuracy: boolean
  appropriateness: boolean
  helpfulness: boolean

  // 阈值设置
  thresholds: {
    minimumQualityScore: number
    maximumResponseTime: number // 秒
    confusionThreshold: number
  }
}

// ===================
// AI活动处理器接口
// ===================

/**
 * AI活动处理器
 */
export interface AIActivityProcessor {
  initialize(context: ActivityContext): Promise<void>
  process(input: AIInput, context: AIContext): Promise<AIOutput>
  evaluate(result: ActivityResult): Promise<AIEvaluation>
  cleanup(): Promise<void>
}

export interface AIEvaluation {
  success: boolean
  score: number
  feedback: string
  insights: string[]
  recommendations: string[]
  nextSteps: string[]
  metadata: EvaluationMetadata
}

export interface EvaluationMetadata {
  evaluationTime: Date
  criteria: string[]
  scores: Record<string, number>
  confidence: number
  evidence: any[]
}

// ===================
// 导出类型联合
// ===================

export type AIHint = EnhancedAIHint
export type AIExperimentConfig = EnhancedAIExperimentConfig

// 兼容性类型（向后兼容）
export interface LegacyAIHint {
  id: string
  type: 'study' | 'content' | 'activity' | 'resource'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  conditions?: any[]
  action?: any
}