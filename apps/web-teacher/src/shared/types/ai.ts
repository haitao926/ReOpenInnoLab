// AI 相关类型定义

export type AIContext = 'course' | 'lab' | 'experiment' | 'assignment' | 'general'

export interface AIMessage {
  role: 'user' | 'ai' | 'system'
  content: string
  timestamp: number
  suggestions?: AISuggestion[]
  attachments?: AIAttachment[]
}

export interface AISuggestion {
  type: string
  content: string
  action?: {
    type: string
    data?: any
  }
  priority?: 'low' | 'medium' | 'high'
  autoApply?: boolean
}

export interface AIAttachment {
  id: string
  type: 'image' | 'file' | 'link'
  name: string
  url: string
  size?: number
}

export interface AIAction {
  type: string
  key: string
  data?: any
  context?: AIContext
}

// 课程 AI 助手相关
export interface AICourseHelperData {
  title?: string
  objectives?: string[]
  content?: string
  activities?: CourseActivity[]
  assessments?: CourseAssessment[]
}

export interface CourseActivity {
  id: string
  type: 'introduction' | 'discussion' | 'practice' | 'experiment'
  title: string
  description: string
  duration: number
  materials?: string[]
}

export interface CourseAssessment {
  id: string
  type: 'quiz' | 'assignment' | 'project' | 'exam'
  title: string
  questions: Question[]
  totalPoints: number
}

// 实验 AI 助手相关
export interface AIExperimentData {
  experimentType?: string
  objectives?: string[]
  materials?: Material[]
  steps?: ExperimentStep[]
  expectedResults?: string
  safetyNotes?: string[]
}

export interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  specifications?: string
}

export interface ExperimentStep {
  id: string
  order: number
  title: string
  description: string
  expectedObservation?: string
  duration?: number
}

// 作业 AI 助手相关
export interface AIAssignmentData {
  type?: 'quiz' | 'essay' | 'project' | 'homework'
  questions?: Question[]
  rubric?: GradingRubric
  feedback?: string
}

export interface Question {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options?: string[]
  correctAnswer?: any
  points: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface GradingRubric {
  criteria: RubricCriterion[]
  totalPoints: number
}

export interface RubricCriterion {
  name: string
  description: string
  levels: RubricLevel[]
  weight: number
}

export interface RubricLevel {
  name: string
  points: number
  description: string
}

// AI 配置
export interface AIConfig {
  enabled: boolean
  context: AIContext
  mode: 'float' | 'panel' | 'inline'
  autoTrigger?: boolean
  suggestions?: boolean
  features?: {
    chat?: boolean
    suggestions?: boolean
    autoGenerate?: boolean
    analysis?: boolean
  }
  api?: {
    endpoint: string
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

// AI 响应
export interface AIResponse {
  content: string
  suggestions?: AISuggestion[]
  actions?: AIAction[]
  data?: any
  error?: string
}

// AI 能力定义
export interface AICapability {
  id: string
  name: string
  description: string
  context: AIContext[]
  features: string[]
  enabled: boolean
}