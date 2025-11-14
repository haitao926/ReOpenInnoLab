// ===================
// 课程核心类型定义
// ===================

import type {
  AIHint as EnhancedAIHint,
  AIExperimentConfig as EnhancedAIExperimentConfig,
  AIContext,
  type LegacyAIHint
} from './ai'

export interface Course {
  id: string
  title: string
  description: string
  className: string
  subject: CourseSubject
  schedule: string
  teacherMessage: string
  taskCount: number
  progress: number
  active: boolean
  teacherId: string
  teacherName: string
  createdAt: string
  updatedAt: string

  // ACL相关
  aclData?: AclDocument
  aclVersion?: string
}

export type CourseSubject = 'ai' | 'it' | 'data-science' | 'robotics' | 'maker' | 'general'

export interface Chapter {
  id: string
  courseId: string
  type: ChapterType
  title: string
  description: string
  objectives: string[]
  knowledgePoints?: string[]
  activities?: Activity[]
  content?: string
  status: ChapterStatus
  progress: number // 0-100
  duration: number // 预计用时（分钟）
  order: number

  // ACL扩展字段
  aiHints?: AIHint[]
  assessment?: ChapterAssessment
  expectedOutcome?: string
  classroomActions?: ClassroomAction[]
  resourceRefs?: ResourceRef[]
}

export type ChapterType = 'introduction' | 'knowledge' | 'experience' | 'experiment' | 'assignment'
export type ChapterStatus = 'locked' | 'available' | 'in_progress' | 'completed'

// ===================
// 活动类型定义
// ===================

export interface Activity {
  id: string
  chapterId: string
  type: ActivityType
  title: string
  description: string
  objectives: string[]
  status: ActivityStatus
  progress: number // 0-100
  duration: number // 预计用时（分钟）
  difficulty: 'easy' | 'medium' | 'hard'
  resourceRefs: ResourceRef[]

  // 类型特定配置
  knowledgeConfig?: KnowledgeConfig
  experimentConfig?: ExperimentConfig
  experienceConfig?: ExperienceConfig
  assignmentConfig?: AssignmentConfig

  // 通用字段
  instructions?: string
  prerequisites?: string[]
  expectedOutcome?: string
  aiHints?: AIHint[]
  assessment?: ActivityAssessment

  // 元数据
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type ActivityType = 'knowledge' | 'experiment' | 'experience' | 'assignment'
export type ActivityStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'overdue'

// ===================
// 知识学习配置
// ===================

export interface KnowledgeConfig {
  contentType: 'text' | 'video' | 'ppt' | 'document' | 'interactive'
  contentUrl?: string
  videoConfig?: VideoConfig
  pptConfig?: PPTConfig
  readingTime?: number // 预计阅读时间（分钟）
  keyPoints?: string[]
  resources?: KnowledgeResource[]
}

export interface VideoConfig {
  url: string
  poster?: string
  duration: number // 秒
  format: 'mp4' | 'hls' | 'webm'
  subtitles?: SubtitleConfig[]
  chapters?: VideoChapter[]
  playbackSpeed?: boolean
  autoPlay?: boolean
}

export interface PPTConfig {
  slideUrl: string
  slideCount: number
  format: 'html' | 'pdf' | 'pptx'
  presenterNotes?: boolean
  downloadAllowed?: boolean
}

export interface SubtitleConfig {
  language: string
  url: string
  label: string
}

export interface VideoChapter {
  startTime: number
  title: string
  description?: string
}

export interface KnowledgeResource {
  id: string
  type: 'document' | 'link' | 'video' | 'image' | 'interactive'
  title: string
  description?: string
  url: string
  size?: number
  format?: string
}

// ===================
// 实验配置
// ===================

export interface ExperimentConfig {
  experimentType: 'jupyter' | 'ai' | 'simulation'
  jupyterConfig?: JupyterConfig
  aiConfig?: AIExperimentConfig
  simulationConfig?: SimulationConfig

  // 通用实验配置
  environment: ExperimentEnvironment
  dependencies?: ExperimentDependency[]
  resources: ExperimentResource[]
  expectedOutputs?: ExperimentOutput[]
}

export interface JupyterConfig {
  notebookId: string
  notebookUrl: string
  previewUrl?: string
  runtime: 'python' | 'r' | 'javascript' | 'julia'
  kernelSpec?: KernelSpec
  autoStart?: boolean
  allowedActions?: ('run' | 'edit' | 'download')[]
}

export interface KernelSpec {
  name: string
  displayName: string
  language: string
  argv: string[]
  env?: Record<string, string>
}

// 使用增强的AI实验配置，保持向后兼容
export type AIExperimentConfig = EnhancedAIExperimentConfig

// 向后兼容的简化接口
export interface LegacyAIExperimentConfig {
  modelProvider: string
  modelName: string
  systemPrompt?: string
  tools?: AITool[]
  parameters?: AIParameters
  maxTokens?: number
  temperature?: number
}

export interface AITool {
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface AIParameters {
  [key: string]: any
}

export interface SimulationConfig {
  simulationUrl: string
  fullscreen?: boolean
  controls?: boolean
  parameters?: SimulationParameter[]
  dataRecording?: boolean
}

export interface SimulationParameter {
  name: string
  type: 'number' | 'boolean' | 'string' | 'select'
  defaultValue: any
  options?: any[]
  min?: number
  max?: number
}

export interface ExperimentEnvironment {
  type: 'local' | 'cloud' | 'hybrid'
  resources: {
    cpu?: string
    memory?: string
    gpu?: string
    storage?: string
  }
  timeout?: number // 超时时间（分钟）
  restartPolicy?: 'always' | 'on-failure' | 'never'
}

export interface ExperimentDependency {
  name: string
  version?: string
  type: 'pip' | 'conda' | 'apt' | 'custom'
  installCommand?: string
}

export interface ExperimentResource {
  id: string
  name: string
  type: 'dataset' | 'model' | 'library' | 'document'
  url: string
  size?: number
  description?: string
  required: boolean
}

export interface ExperimentOutput {
  name: string
  type: 'file' | 'directory' | 'log' | 'metric'
  path?: string
  format?: string
  required: boolean
}

// ===================
// 体验配置
// ===================

export interface ExperienceConfig {
  experienceType: 'html' | 'game' | 'simulation' | 'ar' | 'vr'
  contentUrl: string
  fullscreen?: boolean
  responsive?: boolean

  // 交互配置
  interactions?: ExperienceInteraction[]
  dataCollection?: DataCollectionConfig

  // 安全和限制
  security?: SecurityConfig
  timeLimit?: number // 时间限制（分钟）
  maxAttempts?: number
}

export interface ExperienceInteraction {
  type: 'click' | 'hover' | 'drag' | 'input' | 'scroll' | 'custom'
  selector?: string
  event?: string
  data?: Record<string, any>
  required?: boolean
}

export interface DataCollectionConfig {
  enabled: boolean
  events: string[]
  screenshots?: boolean
  mouseTracking?: boolean
  timeTracking?: boolean
  customData?: Record<string, any>
}

export interface SecurityConfig {
  sandbox: boolean
  allowedDomains?: string[]
  blockedDomains?: string[]
  cspHeaders?: Record<string, string>
  permissions?: ('camera' | 'microphone' | 'geolocation')[]
}

// ===================
// 作业配置
// ===================

export interface AssignmentConfig {
  assignmentType: 'quiz' | 'essay' | 'code' | 'file' | 'mixed'
  questions?: Question[]
  submissionConfig: SubmissionConfig
  gradingConfig: GradingConfig
  timeLimit?: number // 时间限制（分钟）
  maxAttempts?: number
  allowLateSubmission?: boolean
  latePenalty?: number
}

export interface Question {
  id: string
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'code' | 'file-upload'
  title: string
  content: string
  options?: QuestionOption[]
  correctAnswer?: any
  points: number
  required: boolean
  explanation?: string
  hints?: string[]
  timeLimit?: number
}

export interface QuestionOption {
  id: string
  text: string
  isCorrect?: boolean
  explanation?: string
}

export interface SubmissionConfig {
  allowFiles: boolean
  allowedFileTypes?: string[]
  maxFileSize?: number // MB
  maxFiles?: number
  textSubmission?: boolean
  codeSubmission?: boolean
  codeLanguages?: string[]
}

export interface GradingConfig {
  type: 'auto' | 'manual' | 'hybrid'
  rubric?: GradingRubric
  autoGradingRules?: AutoGradingRule[]
  feedbackTemplate?: string
  showCorrectAnswers?: boolean
  allowReview?: boolean
}

export interface GradingRubric {
  criteria: GradingCriteria[]
  maxScore: number
  passingScore: number
}

export interface GradingCriteria {
  id: string
  name: string
  description: string
  weight: number
  levels: RubricLevel[]
}

export interface RubricLevel {
  name: string
  description: string
  points: number
}

export interface AutoGradingRule {
  id: string
  condition: string
  action: string
  points?: number
}

// ===================
// 资源引用类型
// ===================

export interface ResourceRef {
  type: ResourceType
  domain: 'course' | 'lab' | 'assignment' | 'media' | 'experience'
  id: string
  version?: string
  metadata?: Record<string, any>
}

export type ResourceType = 'ppt' | 'video' | 'html' | 'notebook' | 'assignment' | 'image' | 'audio' | 'document' | 'dataset' | 'model' | 'interactive'

// ===================
// AI辅助类型
// ===================

// 使用增强的AI提示，保持向后兼容
export type AIHint = EnhancedAIHint

// 向后兼容的简化接口
export type LegacyAIHintType = LegacyAIHint

export interface HintCondition {
  type: 'time' | 'progress' | 'error' | 'score' | 'custom'
  value: any
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'in' | 'contains'
}

export interface HintAction {
  type: 'show' | 'navigate' | 'highlight' | 'suggest' | 'auto'
  target?: string
  data?: any
}

// ===================
// 课堂活动类型
// ===================

export interface ClassroomAction {
  id: string
  type: 'discussion' | 'poll' | 'quiz' | 'breakout' | 'presentation' | 'custom'
  title: string
  description: string
  duration: number
  instructions?: string
  materials?: ResourceRef[]
  teacherOnly?: boolean
}

// ===================
// 评估类型
// ===================

export interface ActivityAssessment {
  type: 'formative' | 'summative' | 'diagnostic'
  passingScore?: number
  maxAttempts?: number
  timeLimit?: number
  showFeedback?: boolean
  allowReview?: boolean
}

export interface ChapterAssessment extends ActivityAssessment {
  requiredActivities?: string[]
  minimumProgress?: number
  prerequisites?: string[]
}

export interface GradingCriteria {
  name: string
  weight: number
  description: string
}

// ===================
// 活动上下文类型
// ===================

export interface ActivityContext {
  courseId: string
  chapterId: string
  activityId: string
  activityType: ActivityType
  activity: Activity
  // 额外的上下文信息
  courseTitle?: string
  chapterTitle?: string
  sessionData?: any
  // AI上下文支持
  aiContext?: AIContext
}

// ===================
// 活动执行状态
// ===================

export interface ActivityExecutionState {
  activityId: string
  status: 'starting' | 'running' | 'paused' | 'completed' | 'error' | 'cancelled'
  startTime?: Date
  endTime?: Date
  duration?: number // 实际用时（秒）
  progress: number // 0-100
  data?: any // 活动特定数据
  error?: string
  result?: ActivityResult
}

export interface ActivityResult {
  success: boolean
  score?: number
  maxScore?: number
  feedback?: string
  artifacts?: ActivityArtifact[]
  analytics?: ActivityAnalytics
}

export interface ActivityArtifact {
  id: string
  name: string
  type: 'file' | 'url' | 'text' | 'data'
  content?: any
  url?: string
  size?: number
  format?: string
  createdAt: Date
}

export interface ActivityAnalytics {
  timeSpent: number // 用时（秒）
  interactions: number
  errors: number
  hints: number
  retries: number
  path?: string[] // 用户路径
  events?: AnalyticsEvent[]
}

export interface AnalyticsEvent {
  type: string
  timestamp: Date
  data?: any
}

// ===================
// ACL相关类型（保持向后兼容）
// ===================

export interface AclDocument {
  meta: {
    version: string
    createdAt: string
    updatedAt: string
    author?: string
    description?: string
  }
  courseInfo: {
    title: string
    description: string
    objectives: string[]
    subject?: CourseSubject
    duration?: number
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  }
  structure: AclChapter[]
  resourceRefs: ResourceRef[]
}

export interface AclChapter {
  id: string
  type: ChapterType
  title: string
  description?: string
  objectives: string[]
  knowledgePoints?: string[]
  resources?: ResourceRef[]
  aiHints?: string[]
  assessment?: AssessmentInfo
  expectedOutcome?: string
  duration?: number
  order?: number
}

export interface AssessmentInfo {
  type: string
  criteria: GradingCriteria[]
  passingScore?: number
  timeLimit?: number
  maxAttempts?: number
}

// ===================
// 视图映射类型
// ===================

export interface AclToViewMapping {
  courseInfo: {
    title: string
    description: string
    objectives: string[]
  }
  structure: Chapter[]
  resourceRefs: ResourceRef[]
}

// ===================
// 实验相关类型
// ===================

export interface LabSession {
  id: string
  activityId: string
  studentId: string
  status: 'initializing' | 'running' | 'stopped' | 'error'
  url?: string
  containerId?: string
  startTime?: Date
  endTime?: Date
  resourceUsage?: LabResourceUsage
  logs?: LabLog[]
}

export interface LabResourceUsage {
  cpu: number
  memory: number
  disk: number
  network?: number
}

export interface LabLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

export interface LabAgentStatus {
  status: 'online' | 'offline' | 'starting' | 'error'
  version?: string
  lastHeartbeat?: Date
  capabilities?: string[]
  resources?: LabResourceUsage
  config?: LabAgentConfig
}

export interface LabAgentConfig {
  maxSessions: number
  defaultRuntime: string
  resourceLimits: {
    cpu: string
    memory: string
    disk: string
  }
  allowedRuntimes: string[]
  securityPolicies: string[]
}

// ===================
// 工具函数类型
// ===================

export interface ActivityProgressCalculator {
  calculateProgress(activity: Activity, state: ActivityExecutionState): number
  isCompleted(activity: Activity, state: ActivityExecutionState): boolean
  canStart(activity: Activity, prerequisites?: string[]): boolean
}

export interface ResourceResolver {
  resolveResource(ref: ResourceRef): Promise<ResourceData>
  isResourceAvailable(ref: ResourceRef): Promise<boolean>
  preloadResources(refs: ResourceRef[]): Promise<void>
}

export interface ResourceData {
  id: string
  type: ResourceType
  content: any
  metadata: Record<string, any>
  url?: string
  size?: number
}