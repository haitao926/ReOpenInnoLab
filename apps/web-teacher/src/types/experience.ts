// 体验管理相关类型定义

export interface ExperienceTemplate {
  id: string
  type: 'quiz' | 'poll' | 'video' | 'custom' | 'html5'
  title: string
  description: string
  content: ExperienceContent
  config: ExperienceConfig
  securityPolicy: SecurityPolicy
  postMessageSchema: MessageSchema
  status: 'draft' | 'published' | 'archived'
  version: number
  tags: string[]
  thumbnailUrl?: string
  previewUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  resourceRef: string // resource://experience/{id}
  metadata?: ExperienceMetadata
}

export interface ExperienceContent {
  // Quiz 内容
  questions?: Question[]

  // Poll 内容
  poll?: {
    question: string
    options: string[]
    allowMultiple: boolean
    anonymous: boolean
  }

  // 视频内容
  video?: {
    url: string
    thumbnail?: string
    duration: number
    chapters?: VideoChapter[]
    interactions?: VideoInteraction[]
  }

  // 自定义 HTML 内容
  html?: {
    files: ExperienceFile[]
    entryFile: string
    assets?: ExperienceFile[]
  }

  // 通用内容
  title?: string
  description?: string
  instructions?: string
}

export interface Question {
  id: string
  type: 'single' | 'multiple' | 'true-false' | 'fill' | 'essay' | 'matching' | 'ordering'
  question: string
  options?: string[]
  answer: string | string[] | boolean
  explanation?: string
  hints?: string[]
  points: number
  timeLimit?: number
  required?: boolean
  metadata?: Record<string, any>
}

export interface VideoChapter {
  id: string
  title: string
  startTime: number
  endTime: number
  description?: string
}

export interface VideoInteraction {
  id: string
  type: 'pause' | 'question' | 'note' | 'link'
  time: number
  data: any
}

export interface ExperienceFile {
  name: string
  type: string
  size: number
  url: string
  checksum?: string
}

export interface ExperienceConfig {
  duration: number // 预计完成时间（秒）
  allowRetries: boolean
  maxRetries?: number
  requireRealName: boolean
  showResult: boolean
  showCorrectAnswer: boolean
  allowSkip: boolean
  collectAnalytics: boolean
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  timeLimit?: number
  passingScore?: number
  gradeAutomatically: boolean
  allowReview?: boolean
  showProgressBar: boolean
  allowPause?: boolean
}

export interface SecurityPolicy {
  csp: string // Content Security Policy
  sandboxFlags: string[]
  allowedOrigins: string[]
  allowedScripts?: string[]
  blockedDomains?: string[]
  allowCamera: boolean
  allowMicrophone: boolean
  allowFullscreen: boolean
}

export interface MessageSchema {
  // 定义允许的 postMessage 类型
  events: MessageEvent[]
  schema: Record<string, any>
}

export interface MessageEvent {
  type:
    | 'start'
    | 'progress'
    | 'answer'
    | 'complete'
    | 'pause'
    | 'resume'
    | 'error'
    | 'analytics'
    | 'custom'
  payload: Record<string, any>
  required?: boolean
}

export interface ExperienceMetadata {
  gradeLevel?: string
  subject?: string
  topics?: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedDuration: number
  learningObjectives?: string[]
  prerequisites?: string[]
  tags?: string[]
}

export interface ExperienceRun {
  id: string
  experienceTemplateId: string
  lessonId: string
  classId: string
  status: 'preparing' | 'running' | 'completed' | 'terminated' | 'paused'
  config: ExperienceRunConfig
  startedAt?: string
  endedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  participants: ExperienceParticipant[]
  stats: ExperienceRunStats
}

export interface ExperienceRunConfig {
  duration: number
  startTime: string
  endTime?: string
  allowRetries: boolean
  requireRealName: boolean
  showLeaderboard?: boolean
  anonymousMode?: boolean
  customSettings?: Record<string, any>
}

export interface ExperienceParticipant {
  id: string
  experienceRunId: string
  studentId: string
  studentName?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned'
  progress: number
  currentQuestion?: number
  answers: ParticipantAnswer[]
  score?: number
  timeSpent: number
  startTime?: string
  endTime?: string
  lastActivity: string
  events: ExperienceEvent[]
}

export interface ParticipantAnswer {
  questionId: string
  answer: any
  isCorrect?: boolean
  points?: number
  timeSpent: number
  attempts: number
  hints: string[]
  timestamp: string
}

export interface ExperienceEvent {
  id: string
  experienceRunId: string
  studentId: string
  eventType:
    | 'start'
    | 'answer'
    | 'skip'
    | 'pause'
    | 'resume'
    | 'complete'
    | 'exit'
    | 'error'
    | 'heartbeat'
    | 'page_view'
    | 'interaction'
  timestamp: string
  data: any
  metadata?: Record<string, any>
}

export interface ExperienceRunStats {
  totalParticipants: number
  startedCount: number
  completedCount: number
  inProgressCount: number
  averageScore?: number
  averageTimeSpent: number
  completionRate: number
  questionStats: QuestionStats[]
  timelineData: TimelinePoint[]
}

export interface QuestionStats {
  questionId: string
  totalAnswers: number
  correctAnswers: number
  averageTimeSpent: number
  skipCount: number
  hintsUsed: number
  answerDistribution: Record<string, number>
}

export interface TimelinePoint {
  timestamp: string
  activeParticipants: number
  completedParticipants: number
  averageScore: number
}

// 课程结构中的体验环节
export interface ExperienceSection {
  type: 'experience'
  experienceTemplateId: string
  resourceRef: string
  title: string
  description?: string
  objectives: string[]
  duration: number
  hints: string[]
  config: {
    showTimer: boolean
    allowRetry: boolean
    showLeaderboard: boolean
    collectAnalytics: boolean
    customSettings?: Record<string, any>
  }
}

// 创建体验模板 DTO
export interface CreateExperienceTemplateDto {
  type: 'quiz' | 'poll' | 'video' | 'custom' | 'html5'
  title: string
  description: string
  content: ExperienceContent
  config: ExperienceConfig
  securityPolicy?: SecurityPolicy
  postMessageSchema: MessageSchema
  tags?: string[]
  metadata?: ExperienceMetadata
}

// 创建体验运行 DTO
export interface CreateExperienceRunDto {
  experienceTemplateId: string
  lessonId: string
  classId: string
  config: {
    duration: number
    startTime: string
    endTime?: string
    allowRetries?: boolean
    requireRealName?: boolean
    showLeaderboard?: boolean
    anonymousMode?: boolean
  }
  participantIds?: string[]
}

// 体验事件 DTO
export interface ExperienceEventDto {
  studentId: string
  experienceRunId: string
  eventType:
    | 'start'
    | 'answer'
    | 'skip'
    | 'pause'
    | 'resume'
    | 'complete'
    | 'exit'
    | 'error'
    | 'heartbeat'
    | 'page_view'
    | 'interaction'
  timestamp: string
  data: any
  metadata?: Record<string, any>
}

// 体验报告
export interface ExperienceReport {
  id: string
  experienceRunId: string
  classId: string
  instructorId: string
  summary: {
    totalDuration: number
    completionRate: number
    averageScore: number
    participationRate: number
    engagementLevel: number
  }
  participantReports: ParticipantExperienceReport[]
  questionAnalytics: QuestionAnalytics[]
  timelineAnalytics: TimelineAnalytics[]
  aiInsights: {
    strengths: string[]
    improvements: string[]
    recommendations: string[]
  }
  createdAt: string
}

export interface ParticipantExperienceReport {
  studentId: string
  studentName?: string
  status: 'completed' | 'incomplete' | 'abandoned'
  progress: number
  score: number
  timeSpent: number
  answers: ParticipantAnswer[]
  behaviorPattern?: {
    perseverance: number
    speed: number
    accuracy: number
    engagement: number
  }
  feedback?: string
}

export interface QuestionAnalytics {
  questionId: string
  question: string
  type: string
  difficulty: number
  discrimination: number
  correctRate: number
  averageTime: number
  commonMistakes: string[]
  improvement: string
}

export interface TimelineAnalytics {
  periods: TimePeriod[]
  dropOffPoints: DropOffPoint[]
  engagementPeaks: EngagementPeak[]
}

export interface TimePeriod {
  startTime: number
  endTime: number
  activeUsers: number
  completionRate: number
  averageScore: number
}

export interface DropOffPoint {
  time: number
  questionId?: string
  dropOffCount: number
  percentage: number
  possibleReasons: string[]
}

export interface EngagementPeak {
  time: number
  engagementScore: number
  trigger?: string
}
