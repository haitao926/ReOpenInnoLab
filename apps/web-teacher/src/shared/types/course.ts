// 课程相关类型定义

export interface CourseData {
  id: string | number
  title: string
  description?: string
  subject: string
  grade: number
  status: CourseStatus
  cover?: string
  sections: CourseSectionData[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CourseSectionData {
  id: string
  type: SectionType
  title: string
  order: number
  data: SectionData
  duration?: number
  required?: boolean
}

export type SectionType = 'introduction' | 'knowledge' | 'experience' | 'experiment' | 'assignment'

export type CourseStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'unpublished'

// 各环节的数据结构
export interface SectionData {
  [key: string]: any
}

// 课程引入数据
export interface IntroductionData extends SectionData {
  video?: VideoResource
  images?: ImageResource[]
  text?: string
  objectives?: string[]
  keyQuestions?: string[]
}

// 新知讲解数据
export interface KnowledgeData extends SectionData {
  content?: string // 富文本内容
  slides?: SlideResource[]
  concepts?: ConceptItem[]
  examples?: ExampleItem[]
  notes?: string
}

// 体验理解数据
export interface ExperienceData extends SectionData {
  interactiveContents?: InteractiveContent[]
  vrResources?: VRResource[]
  simulations?: SimulationResource[]
  reflections?: ReflectionPrompt[]
}

// 实验活动数据
export interface ExperimentData extends SectionData {
  experimentType?: 'virtual' | 'physical' | 'simulation'
  materials?: MaterialItem[]
  steps?: ExperimentStep[]
  safetyNotes?: string[]
  expectedResults?: string
  reportTemplate?: ReportTemplate
}

// 作业测试数据
export interface AssignmentData extends SectionData {
  type?: 'quiz' | 'homework' | 'project' | 'exam'
  questions?: QuestionItem[]
  resources?: ResourceItem[]
  submissionType?: 'online' | 'offline' | 'mixed'
  deadline?: string
  gradingCriteria?: GradingCriteria[]
}

// 资源类型定义
export interface VideoResource {
  id: string
  url: string
  title: string
  duration: number
  cover?: string
  captions?: CaptionItem[]
}

export interface ImageResource {
  id: string
  url: string
  title: string
  alt?: string
  width?: number
  height?: number
}

export interface SlideResource {
  id: string
  title: string
  pages: SlidePage[]
  thumbnail?: string
}

export interface SlidePage {
  id: string
  content: string
  layout?: string
  animations?: any[]
}

export interface ConceptItem {
  id: string
  term: string
  definition: string
  examples?: string[]
  relatedConcepts?: string[]
}

export interface ExampleItem {
  id: string
  title: string
  description: string
  solution?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface InteractiveContent {
  id: string
  type: 'quiz' | 'simulation' | 'game' | 'virtual_tour'
  title: string
  description: string
  url?: string
  embedCode?: string
  duration?: number
}

export interface VRResource {
  id: string
  title: string
  type: '360_video' | 'vr_tour' | 'ar_model'
  url: string
  thumbnail?: string
  instructions?: string
}

export interface SimulationResource {
  id: string
  title: string
  description: string
  url: string
  parameters?: SimulationParameter[]
  expectedOutcome?: string
}

export interface SimulationParameter {
  name: string
  type: 'number' | 'select' | 'boolean'
  value: any
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
}

export interface ReflectionPrompt {
  id: string
  question: string
  type: 'text' | 'multiple_choice' | 'rating'
  options?: string[]
  required?: boolean
}

export interface MaterialItem {
  id: string
  name: string
  type: 'equipment' | 'consumable' | 'software' | 'document'
  quantity: number
  unit?: string
  description?: string
  image?: string
}

export interface ExperimentStep {
  id: string
  order: number
  title: string
  description: string
  image?: string
  video?: string
  duration?: number
  safetyNote?: string
}

export interface ReportTemplate {
  id: string
  name: string
  sections: ReportSection[]
  requirements?: string
}

export interface ReportSection {
  id: string
  title: string
  type: 'text' | 'table' | 'image' | 'file_upload'
  required?: boolean
  instructions?: string
}

export interface QuestionItem {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank'
  question: string
  options?: string[]
  correctAnswer?: any
  points: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface ResourceItem {
  id: string
  type: 'document' | 'video' | 'image' | 'link' | 'tool'
  title: string
  url: string
  description?: string
  size?: number
  format?: string
}

export interface GradingCriteria {
  id: string
  aspect: string
  description: string
  weight: number
  rubric?: RubricLevel[]
}

export interface RubricLevel {
  level: string
  score: number
  description: string
}

export interface CaptionItem {
  language: string
  url: string
  label?: string
}