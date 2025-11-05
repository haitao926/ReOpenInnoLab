/**
 * 课程数据类型定义
 * ReOpenInnoLab K12 AI教学平台
 */

// 课程基本信息
export interface CourseInfo {
  id: string
  title: string
  description: string
  subject: CourseSubject
  grade: string
  duration: number // 课时
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  coverImage?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'published' | 'archived'
  version: string
}

// 学科类型
export type CourseSubject =
  | 'chinese'      // 语文
  | 'math'         // 数学
  | 'english'      // 英语
  | 'physics'      // 物理
  | 'chemistry'    // 化学
  | 'biology'      // 生物
  | 'history'      // 历史
  | 'geography'    // 地理
  | 'politics'     // 政治
  | 'art'          // 艺术
  | 'music'        // 音乐
  | 'pe'           // 体育
  | 'it'           // 信息技术
  | 'comprehensive' // 综合实践

// 章节信息
export interface Chapter {
  id: string
  order: number
  title: string
  description: string
  type: 'content' | 'experiment' | 'interactive' | 'assessment'
  duration: number // 分钟
  objectives: string[]
  prerequisites?: string[]
  aiEnhanced?: boolean // 是否启用AI增强
  content?: ChapterContent
}

// 章节内容
export interface ChapterContent {
  // 知识讲授内容
  knowledge?: {
    concepts: Concept[]
    examples: Example[]
    resources: Resource[]
  }

  // 实验内容
  experiment?: {
    type: 'jupyter' | 'ai-generated' | 'uploaded'
    files: ExperimentFile[]
    environment?: ExperimentEnvironment
    instructions: string[]
  }

  // 互动体验内容
  interactive?: {
    type: 'html' | 'simulation' | 'game'
    files: InteractiveFile[]
    settings?: InteractiveSettings
  }

  // 评估内容
  assessment?: {
    type: 'quiz' | 'assignment' | 'project'
    questions?: Question[]
    rubric?: Rubric
  }
}

// 概念定义
export interface Concept {
  id: string
  name: string
  definition: string
  examples: string[]
  relatedConcepts?: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

// 示例
export interface Example {
  id: string
  title: string
  description: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio'
  mediaUrl?: string
  aiGenerated?: boolean
}

// 资源
export interface Resource {
  id: string
  title: string
  type: 'document' | 'video' | 'audio' | 'image' | 'link'
  url: string
  description?: string
  size?: number
  format?: string
}

// 实验文件
export interface ExperimentFile {
  id: string
  name: string
  type: 'notebook' | 'script' | 'data' | 'config'
  content: string
  language?: string
  size?: number
  checksum?: string
}

// 实验环境配置
export interface ExperimentEnvironment {
  image: string // Docker镜像
  packages: string[] // Python包列表
  resources: {
    cpu: string
    memory: string
    storage: string
  }
  settings?: Record<string, any>
}

// 互动文件
export interface InteractiveFile {
  id: string
  name: string
  type: 'html' | 'css' | 'js' | 'asset'
  content: string
  path?: string
}

// 互动设置
export interface InteractiveSettings {
  fullscreen?: boolean
  responsive?: boolean
  allowResize?: boolean
  customStyles?: string
  scripts?: string[]
}

// 问题
export interface Question {
  id: string
  type: 'choice' | 'multiple' | 'text' | 'essay' | 'code'
  question: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
  points: number
  aiGenerated?: boolean
}

// 评分标准
export interface Rubric {
  criteria: RubricCriteria[]
  maxScore: number
  passingScore: number
}

export interface RubricCriteria {
  name: string
  description: string
  levels: RubricLevel[]
}

export interface RubricLevel {
  name: string
  score: number
  description: string
}

// 完整课程结构
export interface Course {
  info: CourseInfo
  chapters: Chapter[]
  settings: CourseSettings
  analytics?: CourseAnalytics
}

// 课程设置
export interface CourseSettings {
  aiEnabled: boolean
  autoSave: boolean
  collaboration: boolean
  publicAccess: boolean
  allowDownload: boolean
  certificateEnabled: boolean
  customization: {
    theme: string
    branding: boolean
    customCSS?: string
  }
}

// 课程分析数据
export interface CourseAnalytics {
  totalStudents: number
  completionRate: number
  averageScore: number
  timeSpent: number
  engagement: {
    views: number
    interactions: number
    downloads: number
  }
  feedback: {
    rating: number
    comments: CourseComment[]
  }
}

// 课程评论
export interface CourseComment {
  id: string
  userId: string
  userName: string
  content: string
  rating: number
  createdAt: Date
  replies?: CourseComment[]
}

// 课程导入/导出格式
export interface CoursePackage {
  version: string
  course: Course
  dependencies: {
    packages: string[]
    assets: AssetFile[]
  }
  metadata: {
    exportDate: Date
    exportedBy: string
    platform: string
  }
}

// 资源文件
export interface AssetFile {
  path: string
  name: string
  type: string
  size: number
  checksum: string
  content?: string // Base64编码的文件内容
}

// 课程模板
export interface CourseTemplate {
  id: string
  name: string
  description: string
  subject: CourseSubject
  grade: string
  structure: Partial<Course>
  isPublic: boolean
  usageCount: number
  rating: number
  tags: string[]
}

// AI生成的课程建议
export interface AICourseSuggestion {
  title: string
  description: string
  targetAudience: string
  learningObjectives: string[]
  suggestedChapters: Array<{
    title: string
    duration: number
    content: string
    type: 'content' | 'experiment' | 'interactive'
  }>
  recommendedResources: Array<{
    type: string
    title: string
    description: string
  }>
}

// 课程验证规则
export interface CourseValidationRule {
  field: string
  required: boolean
  type: 'string' | 'number' | 'array' | 'object'
  pattern?: string
  min?: number
  max?: number
  custom?: (value: any) => boolean | string
}

// 课程导入错误
export interface CourseImportError {
  field: string
  message: string
  line?: number
  suggestion?: string
}

// 课程搜索过滤条件
export interface CourseFilter {
  subject?: CourseSubject
  grade?: string
  difficulty?: string
  duration?: {
    min?: number
    max?: number
  }
  tags?: string[]
  aiEnabled?: boolean
  hasExperiments?: boolean
  hasInteractive?: boolean
  createdBy?: string
  status?: string
}

// 课程统计
export interface CourseStatistics {
  total: number
  published: number
  draft: number
  archived: number
  bySubject: Record<CourseSubject, number>
  byGrade: Record<string, number>
  recentlyCreated: Course[]
  mostPopular: Course[]
  averageRating: number
}