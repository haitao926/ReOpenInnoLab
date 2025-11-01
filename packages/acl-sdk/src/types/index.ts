/**
 * AiCourseLayout (.acl) 类型定义
 * 教育知识工程化的数据结构标准
 */

// 主要的.acl文件结构
export interface AiCourseLayout {
  meta: CourseMeta
  courseInfo: CourseInfo
  structure: CourseStructure
  resourceRefs: ResourceReference[]
  analyticsProfile?: AnalyticsProfile
}

// 元数据
export interface CourseMeta {
  id: string
  version: string
  tenant?: string
  tags: string[]
  contributors: string[]
  license?: string
  lastModified: string
  createdAt?: string
}

// 课程信息
export interface CourseInfo {
  title: string
  description?: string
  subject: string
  grade: string
  learningObjectives: LearningObjective[]
  targetAudience: TargetAudience
  estimatedDuration: number // 分钟
  prerequisites?: string[]
  aiPrompts: AIPrompts
}

// 学习目标
export interface LearningObjective {
  id: string
  description: string
  cognitiveLevel: CognitiveLevel
  assessmentCriteria: string[]
  prerequisites?: string[]
}

// 认知层次 (基于布鲁姆分类学)
export type CognitiveLevel =
  | 'remember'     // 记忆
  | 'understand'   // 理解
  | 'apply'        // 应用
  | 'analyze'      // 分析
  | 'evaluate'     // 评价
  | 'create'       // 创造

// 目标受众
export interface TargetAudience {
  grade: string
  classSize?: string
  priorKnowledge?: string
  learningStyles: LearningStyle[]
  specialNeeds?: string[]
}

export type LearningStyle =
  | 'visual'       // 视觉型
  | 'auditory'     // 听觉型
  | 'kinesthetic'  // 动觉型
  | 'reading'      // 阅读型

// AI提示配置
export interface AIPrompts {
  generation: string
  assessment: string
  intervention?: string
}

// 课程结构
export interface CourseStructure extends CourseNode[] {
  // 这是一个数组，同时也是一个CourseNode的集合
}

// 课程节点基类
export interface BaseCourseNode {
  id: string
  title: string
  type: NodeType
  duration: number // 分钟
  learningGoals: string[]
  aiStrategy?: AIStrategy
  assessment?: Assessment
  resourceRefs: string[]
  metadata?: Record<string, any>
}

// 课程节点
export type CourseNode = BaseCourseNode & (
  | { type: 'introduction'; content: IntroductionContent }
  | { type: 'knowledge'; content: KnowledgeContent }
  | { type: 'activity'; content: ActivityContent }
  | { type: 'experiment'; content: ExperimentContent }
  | { type: 'interaction'; content: InteractionContent }
  | { type: 'assignment'; content: AssignmentContent }
  | { type: 'assessment'; content: AssessmentContent }
  | { type: 'chapter'; children: CourseStructure } & BaseCourseNode
)

// 节点类型
export type NodeType =
  | 'introduction'  // 导入
  | 'chapter'       // 章节
  | 'knowledge'     // 知识讲授
  | 'activity'      // 活动
  | 'experiment'    // 实验
  | 'interaction'   // 交互体验
  | 'assignment'    // 作业
  | 'assessment'    // 评估

// AI策略
export interface AIStrategy {
  type: string
  dataSources?: string[]
  fallbackContent?: string
  adaptationRules?: Record<string, any>
}

// 评估配置
export interface Assessment {
  type: AssessmentType
  indicators: string[]
  aiAnalysis?: string
  interventionThreshold?: Record<string, string>
}

export type AssessmentType =
  | 'formative'     // 形成性评估
  | 'summative'     // 总结性评估
  | 'diagnostic'    // 诊断性评估

// 各种内容类型定义
export interface IntroductionContent {
  hookType: 'question' | 'story' | 'video' | 'image'
  hookContent: string
  objectives: string[]
  prerequisites?: string[]
}

export interface KnowledgeContent {
  format: 'text' | 'video' | 'audio' | 'interactive'
  content: string | MediaContent
  examples?: Example[]
  checkpoints?: Checkpoint[]
}

export interface ActivityContent {
  activityType: 'individual' | 'group' | 'class'
  instructions: string
  materials?: string[]
  duration: number
  collaborationLevel: 'low' | 'medium' | 'high'
}

export interface ExperimentContent {
  experimentType: 'jupyter' | 'virtual' | 'physical' | 'simulation'
  notebook?: string
  environment?: ExperimentEnvironment
  aiAssistant?: AIExperimentAssistant
  safetyLevel: 'safe' | 'moderate' | 'high'
}

export interface InteractionContent {
  interactionType: 'html' | 'simulation' | 'game' | 'vr'
  content: string
  previewConfig?: PreviewConfig
  tracking?: TrackingConfig
}

export interface AssignmentContent {
  assignmentType: 'quiz' | 'essay' | 'project' | 'presentation'
  questions?: Question[]
  rubric?: Rubric
  submissionFormat: string[]
}

export interface AssessmentContent {
  assessmentType: 'quiz' | 'test' | 'portfolio' | 'performance'
  questions: Question[]
  timeLimit?: number
  passingScore?: number
}

// 媒体内容
export interface MediaContent {
  type: 'video' | 'audio' | 'image' | 'document'
  url: string
  duration?: number
  size?: number
  format: string
}

// 示例
export interface Example {
  id: string
  title: string
  content: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// 检查点
export interface Checkpoint {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer: string | number
  explanation?: string
}

// 实验环境
export interface ExperimentEnvironment {
  type: 'jupyter' | 'docker' | 'web'
  image?: string
  resources?: ResourceAllocation
  dependencies?: string[]
}

export interface ResourceAllocation {
  cpu: string
  memory: string
  storage?: string
  gpu?: boolean
}

// AI实验助手
export interface AIExperimentAssistant {
  capabilities: string[]
  interactionStyle: 'socratic' | 'direct' | 'guided'
  adaptationLevel: string
  personality?: string
}

// 预览配置
export interface PreviewConfig {
  device: 'desktop' | 'tablet' | 'mobile'
  orientation: 'portrait' | 'landscape'
  interactive: boolean
}

// 追踪配置
export interface TrackingConfig {
  events: string[]
  analytics: boolean
  privacy: 'strict' | 'standard' | 'minimal'
}

// 问题
export interface Question {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer: string | number | boolean
  points: number
  explanation?: string
  metadata?: Record<string, any>
}

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'fill-blank'
  | 'matching'
  | 'ordering'

// 评分标准
export interface Rubric {
  criteria: RubricCriteria[]
  maxScore: number
  levels: RubricLevel[]
}

export interface RubricCriteria {
  id: string
  description: string
  weight: number
  levels: RubricLevel[]
}

export interface RubricLevel {
  name: string
  description: string
  points: number
}

// 资源引用
export interface ResourceReference {
  id: string
  type: ResourceType
  title: string
  description?: string
  url: string
  metadata?: Record<string, any>
}

export type ResourceType =
  | 'video'
  | 'image'
  | 'document'
  | 'audio'
  | 'simulation'
  | 'notebook'
  | 'tool'
  | 'external'

// 分析配置
export interface AnalyticsProfile {
  learningMetrics: string[]
  aiInsights: AIInsights
}

export interface AIInsights {
  learningPathOptimization: boolean
  difficultyAdjustment: boolean
  recommendationEngine: boolean
}

// 验证结果
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: ValidationSummary
}

export interface ValidationError {
  path: string
  message: string
  code: string
  severity: 'error'
}

export interface ValidationWarning {
  path: string
  message: string
  code: string
  severity: 'warning'
}

export interface ValidationSummary {
  totalErrors: number
  totalWarnings: number
  schemaVersion: string
  validatedAt: string
}

// 渲染选项
export interface RenderOptions {
  format: RenderFormat
  theme?: string
  includeMetadata?: boolean
  includeAnalytics?: boolean
  customStyles?: Record<string, any>
}

export type RenderFormat =
  | 'html'
  | 'markdown'
  | 'pdf'
  | 'docx'
  | 'json'

// 版本信息
export interface VersionInfo {
  id: string
  courseId: string
  version: string
  changes: VersionChange[]
  author: string
  commitMessage: string
  createdAt: string
  fingerprint: string
}

export interface VersionChange {
  type: 'add' | 'modify' | 'delete' | 'move'
  path: string
  oldValue?: any
  newValue?: any
  description?: string
}

// 差异比较结果
export interface ACDiff {
  additions: DiffNode[]
  deletions: DiffNode[]
  modifications: DiffModification[]
  moves: DiffMove[]
  summary: DiffSummary
}

export interface DiffNode {
  path: string
  type: string
  content: any
}

export interface DiffModification {
  path: string
  type: string
  oldValue: any
  newValue: any
}

export interface DiffMove {
  oldPath: string
  newPath: string
  type: string
}

export interface DiffSummary {
  totalChanges: number
  additions: number
  deletions: number
  modifications: number
  moves: number
  structuralChanges: boolean
}

// 解析选项
export interface ParseOptions {
  strict?: boolean
  allowUnknownFields?: boolean
  validateReferences?: boolean
  maxFileSize?: number
}

// 导出选项
export interface ExportOptions {
  format: ExportFormat
  includeAssets?: boolean
  compress?: boolean
  encryption?: EncryptionOptions
}

export type ExportFormat =
  | 'acl'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'package'

export interface EncryptionOptions {
  enabled: boolean
  algorithm?: string
  key?: string
}

// 搜索选项
export interface SearchOptions {
  query: string
  fields?: string[]
  fuzzy?: boolean
  caseSensitive?: boolean
  limit?: number
  offset?: number
}

// 搜索结果
export interface SearchResult {
  items: SearchResultItem[]
  total: number
  facets?: SearchFacet[]
}

export interface SearchResultItem {
  id: string
  title: string
  description?: string
  type: string
  score: number
  highlights?: string[]
  metadata?: Record<string, any>
}

export interface SearchFacet {
  field: string
  values: FacetValue[]
}

export interface FacetValue {
  value: string
  count: number
}

// 事件类型
export interface ACLEvent {
  type: ACLEventType
  data: any
  timestamp: string
  userId?: string
  sessionId?: string
}

export type ACLEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'versioned'
  | 'exported'
  | 'imported'
  | 'validated'
  | 'rendered'