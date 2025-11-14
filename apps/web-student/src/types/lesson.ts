import type { User } from './user'

// 课程相关类型
export interface Course {
  id: string
  title: string
  description?: string
  instructor: User
  thumbnail?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'published' | 'archived'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number // 分钟
  category: string
}

// 课程实例
export interface Lesson {
  id: string
  courseId: string
  classroomId: string
  title: string
  description?: string
  status: 'draft' | 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  type?: 'regular' | 'review' | 'exam' | 'lab' | 'presentation'
  scheduledStartAt?: Date
  scheduledEndAt?: Date
  actualStartAt?: Date
  actualEndAt?: Date
  estimatedDuration?: number
  currentSectionId?: string
  currentSectionOrder?: number
  participantCount: number
  maxParticipants?: number
  autoRecord: boolean
  settings?: Record<string, any>
  startNotes?: string
  endReason?: string
  endNotes?: string
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
  sections: LessonSection[]
}

// 课程环节
export interface LessonSection {
  id: string
  lessonId: string
  title: string
  type: 'introduction' | 'knowledge' | 'experience' | 'experiment' | 'assignment'
  order: number
  duration: number // 分钟
  description?: string
  content?: any
  data?: SectionData
  isActive: boolean
  isCompleted: boolean
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 环节数据
export interface SectionData {
  // 通用属性
  priority?: 'high' | 'medium' | 'low'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  objectives?: Array<{
    id: string
    text: string
    completed?: boolean
  }>
  resources?: Array<{
    id: string
    title: string
    type: 'document' | 'video' | 'link'
    url: string
    description?: string
  }>

  // 引入环节特有
  welcomeMessage?: string
  overview?: string
  media?: {
    type: 'video' | 'image'
    url: string
    poster?: string
    alt?: string
  }

  // 新知环节特有
  knowledgePoints?: Array<{
    id: string
    title: string
    description: string
    type: 'concept' | 'skill' | 'application' | 'theory'
    keyConcepts?: string[]
    content?: string
    example?: {
      type: 'code' | 'formula'
      title?: string
      content: string
    }
    practiceQuestion?: {
      question: string
      options: Array<{ value: string; label: string }>
      correctAnswer: string
      explanation?: string
      hint?: string
      userAnswer?: string
      feedback?: {
        correct: boolean
        explanation: string
      }
    }
    progress?: number
    completed?: boolean
  }>
  knowledgeMap?: {
    nodes: Array<{
      id: string
      label: string
      x: number
      y: number
      active?: boolean
    }>
  }

  // 体验环节特有
  interactionType?: 'simulation' | 'chart' | 'dragdrop' | 'quiz'
  instructions?: string[]
  taskTitle?: string
  taskDescription?: string

  // 仿真特有
  safetyNotes?: string

  // 拖拽排序特有
  dragItems?: Array<{
    id: string
    text: string
    isDragging?: boolean
  }>
  correctOrder?: string[]

  // 测验特有
  quizQuestions?: Array<{
    id: string
    question: string
    options: Array<{ value: string; label: string }>
    correctAnswer: string
    userAnswer?: string
    answered?: boolean
    feedback?: {
      correct: boolean
      explanation: string
    }
  }>

  // 实验环节特有
  experimentType?: 'virtual' | 'notebook' | 'analysis' | 'physical'
  experimentTitle?: string
  experimentData?: {
    equipment?: Array<{
      id: string
      name: string
      description: string
      icon: string
      selected?: boolean
    }>
    datasets?: Array<{
      id: string
      name: string
      rows: number
      columns: number
      active?: boolean
    }>
    steps?: Array<{
      id: string
      title: string
      description: string
      completed?: boolean
    }>
  }

  // 作业环节特有
  assignmentType?: 'quiz' | 'homework' | 'exam' | 'practice'
  assignmentTitle?: string
  instructions?: string[]
  questions?: Question[]
}

// 题目类型
export interface Question {
  id: string
  type: 'choice' | 'multiple' | 'fill' | 'judge' | 'essay' | 'coding'
  title: string
  description: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit?: number // 秒
  required?: boolean

  // 选择题特有
  options?: Array<{
    value: string
    label: string
    text: string
  }>
  correctAnswer?: string | string[]

  // 多选题特有
  userAnswers?: string[]

  // 填空题特有
  blanks?: Array<{
    answer: string
    userAnswer?: string
  }>

  // 判断题特有
  userAnswer?: boolean

  // 简答题特有
  minWords?: number
  maxWords?: number
  userAnswer?: string

  // 编程题特有
  language?: 'python' | 'javascript' | 'java'
  requirements?: string[]
  starterCode?: string
  solution?: string
  userAnswer?: string
  output?: string

  // 通用属性
  answered?: boolean
  feedback?: {
    correct: boolean
    explanation: string
    correctAnswer?: any
  }
}

// 学生进度
export interface StudentProgress {
  lessonId: string
  sectionProgress: Record<string, SectionProgress>
  totalTime: number
  interactionCount: number
  lastActivity: Date | null
  startTime: Date | null
  endTime: Date | null
}

// 环节进度
export interface SectionProgress {
  completed: boolean
  progress: number // 0-100
  timeSpent: number // 毫秒
  interactions: Array<{
    type: string
    data: any
    timestamp: Date
  }>
}

// 学生互动
export interface StudentInteraction {
  type: string
  data: any
  timestamp: Date
  sectionIndex?: number
}

// 学生数据
export interface StudentData {
  interactions: StudentInteraction[]
  notes: string
  progress: SectionProgress
  handRaised: boolean
}

// 学习活动
export interface LearningActivity {
  id: string
  studentId: string
  lessonId: string
  sectionId: string
  type: string
  data: any
  timestamp: Date
  duration?: number
}

// 学习统计
export interface LearningStatistics {
  totalTime: number
  completedSections: number
  totalSections: number
  interactionCount: number
  averageScore?: number
  lastActivity: Date
  streak?: number // 连续学习天数
}

// 实验记录
export interface ExperimentRecord {
  id: string
  lessonId: string
  sectionId: string
  studentId: string
  title: string
  description: string
  data?: any
  timestamp: Date
}

// 笔记
export interface Note {
  id: string
  lessonId: string
  sectionId?: string
  content: string
  tags: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// 作业提交
export interface AssignmentSubmission {
  id: string
  lessonId: string
  sectionId: string
  studentId: string
  answers: Array<{
    questionId: string
    answer: any
    answered: boolean
  }>
  score?: number
  totalPoints: number
  timeSpent: number
  submittedAt: Date
  gradedAt?: Date
  feedback?: string
  gradedBy?: string
}

// 学习报告
export interface LearningReport {
  id: string
  studentId: string
  lessonId: string
  sectionReports: SectionReport[]
  totalScore: number
  totalPoints: number
  timeSpent: number
  interactionCount: number
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  generatedAt: Date
}

export interface SectionReport {
  sectionId: string
  sectionTitle: string
  sectionType: string
  progress: number
  timeSpent: number
  interactions: number
  score?: number
  completed: boolean
  feedback?: string
}