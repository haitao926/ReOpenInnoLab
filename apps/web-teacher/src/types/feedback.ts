/**
 * 反馈和评语相关类型定义
 */

// 基础类型
export type FeedbackType = 'academic' | 'behavioral' | 'skill' | 'creative' | 'collaborative'
export type FeedbackTone = 'encouraging' | 'constructive' | 'formal' | 'friendly'
export type FeedbackLength = 'brief' | 'moderate' | 'detailed'
export type FeedbackLanguage = 'zh-CN' | 'en-US'

// 学生和作业相关类型
export interface Student {
  id: string
  name: string
  gradeLevel: string
  classId: string
  email: string
  profile: StudentProfile
  performance: StudentPerformance
  preferences: StudentPreferences
}

export interface StudentProfile {
  age: number
  gender: 'male' | 'female' | 'other'
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed'
  interests: string[]
  strengths: string[]
  challenges: string[]
  personality: string[]
  motivation: StudentMotivation
  background: StudentBackground
}

export interface StudentMotivation {
  type: 'intrinsic' | 'extrinsic' | 'mixed'
  level: 'high' | 'medium' | 'low'
  factors: string[]
}

export interface StudentBackground {
  family: string
  previousEducation: string[]
  specialNeeds: string[]
  language: string[]
  cultural: string[]
}

export interface StudentPerformance {
  overall: PerformanceMetrics
  bySubject: Record<string, PerformanceMetrics>
  trends: PerformanceTrend[]
  goals: StudentGoal[]
  achievements: Achievement[]
}

export interface PerformanceMetrics {
  average: number
  trend: 'improving' | 'stable' | 'declining'
  consistency: number
  participation: number
  effort: number
  growth: number
}

export interface PerformanceTrend {
  period: string
  value: number
  change: number
  factors: string[]
}

export interface StudentGoal {
  id: string
  title: string
  description: string
  target: string
  deadline: string
  status: 'active' | 'completed' | 'paused'
  progress: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  date: string
  type: 'academic' | 'behavioral' | 'skill' | 'social'
  recognition: string[]
}

export interface StudentPreferences {
  communication: CommunicationPreferences
  feedback: FeedbackPreferences
  learning: LearningPreferences
}

export interface CommunicationPreferences {
  style: 'direct' | 'gentle' | 'detailed' | 'brief'
  channel: 'in-person' | 'written' | 'email' | 'phone'
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed'
}

export interface FeedbackPreferences {
  tone: FeedbackTone
  length: FeedbackLength
  language: FeedbackLanguage
  includeSuggestions: boolean
  includeExamples: boolean
  includeNextSteps: boolean
}

export interface LearningPreferences {
  pace: 'fast' | 'moderate' | 'slow'
  structure: 'guided' | 'independent' | 'collaborative'
  content: 'theoretical' | 'practical' | 'mixed'
  resources: string[]
}

// 作业和提交相关类型
export interface Assignment {
  id: string
  title: string
  description: string
  type: AssignmentType
  subject: string
  gradeLevel: string
  dueDate: string
  maxScore: number
  instructions: string
  resources: Resource[]
  rubric: AssessmentRubric
  settings: AssignmentSettings
  metadata: AssignmentMetadata
}

export type AssignmentType =
  | 'homework' | 'quiz' | 'exam' | 'project' | 'presentation'
  | 'essay' | 'report' | 'code' | 'art' | 'performance'

export interface Resource {
  id: string
  title: string
  type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'tool'
  url: string
  description: string
  size: number
  format: string
  duration?: number
}

export interface AssessmentRubric {
  id: string
  name: string
  description: string
  criteria: RubricCriteria[]
  maxScore: number
  weightings: Record<string, number>
  levels: RubricLevel[]
  scale: RubricScale
}

export interface RubricCriteria {
  id: string
  name: string
  description: string
  weight: number
  levels: RubricLevel[]
  indicators: string[]
  examples: RubricExample[]
}

export interface RubricLevel {
  name: string
  score: number
  description: string
  indicators: string[]
}

export interface RubricExample {
  level: string
  description: string
  excerpt: string
}

export interface RubricScale {
  type: 'points' | 'percentage' | 'descriptive'
  min: number
  max: number
  increments: number
}

export interface AssignmentSettings {
  allowLateSubmission: boolean
  latePenalty: number
  allowResubmission: boolean
  maxAttempts: number
  showCorrectAnswers: boolean
  autoGrade: boolean
  timeLimit?: number
  shuffleQuestions: boolean
}

export interface AssignmentMetadata {
  createdBy: string
  createdAt: string
  updatedAt: string
  version: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  content: SubmissionContent
  attachments: Attachment[]
  submittedAt: string
  score?: number
  feedback?: Feedback
  status: SubmissionStatus
  metadata: SubmissionMetadata
}

export interface SubmissionContent {
  text?: string
  files?: FileReference[]
  answers?: SubmissionAnswer[]
  code?: CodeSubmission
  media?: MediaSubmission
}

export interface FileReference {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
}

export interface SubmissionAnswer {
  questionId: string
  answer: any
  timeSpent: number
  attempts: number
}

export interface CodeSubmission {
  language: string
  code: string
  tests: CodeTest[]
  output?: string
  errors?: string[]
}

export interface CodeTest {
  name: string
  input: string
  expectedOutput: string
  actualOutput?: string
  passed: boolean
}

export interface MediaSubmission {
  type: 'audio' | 'video' | 'image'
  url: string
  duration?: number
  transcript?: string
  description?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
}

export type SubmissionStatus =
  | 'draft' | 'submitted' | 'graded' | 'returned'
  | 'late' | 'missing' | 'excused'

export interface SubmissionMetadata {
  ipAddress: string
  browser: string
  platform: string
  timeSpent: number
  pageViews: number
  lastActivity: string
}

export interface Feedback {
  id: string
  submissionId: string
  graderId: string
  content: FeedbackContent
  score: number
  rubricScores: Record<string, number>
  attachments: FeedbackAttachment[]
  status: FeedbackStatus
  shared: boolean
  metadata: FeedbackMetadata
}

export interface FeedbackContent {
  overall: string
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  nextSteps: string[]
  encouragement: string
  resources: FeedbackResource[]
  annotations: Annotation[]
}

export interface Annotation {
  id: string
  type: 'highlight' | 'comment' | 'correction' | 'suggestion'
  content: string
  position: AnnotationPosition
  context: string
}

export interface AnnotationPosition {
  start: number
  end: number
  page?: number
  line?: number
  column?: number
}

export interface FeedbackResource {
  id: string
  type: ResourceType
  title: string
  description: string
  url?: string
  content?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  tags: string[]
}

export type ResourceType =
  | 'video' | 'article' | 'exercise' | 'tool' | 'example'
  | 'template' | 'guide' | 'reference' | 'game'

export interface FeedbackAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  description: string
}

export type FeedbackStatus = 'draft' | 'published' | 'shared' | 'archived'

export interface FeedbackMetadata {
  createdAt: string
  updatedAt: string
  version: number
  generated: boolean
  template?: string
  processingTime: number
  quality?: FeedbackQuality
}

// 课程相关类型
export interface Course {
  id: string
  title: string
  description: string
  subject: string
  gradeLevel: string
  instructor: string
  students: string[]
  assignments: string[]
  settings: CourseSettings
  metadata: CourseMetadata
}

export interface CourseSettings {
  allowSelfEnrollment: boolean
  gradingPolicy: GradingPolicy
  communication: CommunicationSettings
  privacy: PrivacySettings
}

export interface GradingPolicy {
  scale: GradingScale
  weightings: Record<string, number>
  latePolicy: LatePolicy
  resubmissionPolicy: ResubmissionPolicy
}

export interface GradingScale {
  type: 'points' | 'percentage' | 'letter'
  ranges: GradeRange[]
  passingScore: number
}

export interface GradeRange {
  min: number
  max: number
  grade: string
  gpa?: number
  description: string
}

export interface LatePolicy {
  allowed: boolean
  penaltyType: 'percentage' | 'points' | 'none'
  penaltyAmount: number
  maximumPenalty: number
}

export interface ResubmissionPolicy {
  allowed: boolean
  maxAttempts: number
  keepHighest: boolean
  timeWindow?: number
}

export interface CommunicationSettings {
  announcements: boolean
  discussions: boolean
  messaging: boolean
  notifications: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  frequency: 'immediate' | 'daily' | 'weekly'
}

export interface PrivacySettings {
  visibility: 'public' | 'private' | 'restricted'
  allowGuestAccess: boolean
  shareMaterials: boolean
}

export interface CourseMetadata {
  createdBy: string
  createdAt: string
  updatedAt: string
  semester: string
  year: number
  credits: number
  tags: string[]
}

// 模板相关类型已在服务文件中定义，这里补充其他必要的类型

export interface ClassPerformance {
  averageScore: number
  scoreDistribution: ScoreDistribution
  commonMistakes: CommonMistake[]
  excellenceExamples: ExcellenceExample[]
  participation: ParticipationMetrics
  improvement: ImprovementMetrics
}

export interface ScoreDistribution {
  excellent: number // 90-100
  good: number // 80-89
  satisfactory: number // 70-79
  needsImprovement: number // <70
  average: number
  median: number
  standardDeviation: number
}

export interface CommonMistake {
  id: string
  description: string
  frequency: number
  examples: string[]
  suggestedRemediation: string
  resources: FeedbackResource[]
  affectedStudents: number
}

export interface ExcellenceExample {
  id: string
  description: string
  studentId: string
  extract: string
  learningPoints: string[]
  skills: string[]
  resources: FeedbackResource[]
}

export interface ParticipationMetrics {
  averageParticipation: number
  discussionPosts: number
  questionsAsked: number
  responsesGiven: number
  helpProvided: number
}

export interface ImprovementMetrics {
  averageImprovement: number
  improvedStudents: number
  declinedStudents: number
  stableStudents: number
  improvementAreas: string[]
}

export interface LearningObjective {
  id: string
  title: string
  description: string
  category: string
  level: string
  assessments: string[]
  mastery: MasteryMetrics
}

export interface MasteryMetrics {
  targetLevel: number
  currentLevel: number
  studentsMastered: number
  studentsInProgress: number
  studentsNotStarted: number
}

// 批量操作相关类型
export interface BatchOperation {
  id: string
  type: BatchOperationType
  status: BatchOperationStatus
  progress: BatchProgress
  items: BatchItem[]
  settings: BatchSettings
  results: BatchResults
  metadata: BatchMetadata
}

export type BatchOperationType =
  | 'generate_feedback' | 'send_feedback' | 'export_grades'
  | 'import_students' | 'update_assignments' | 'calculate_grades'

export type BatchOperationStatus =
  | 'pending' | 'running' | 'paused' | 'completed'
  | 'failed' | 'cancelled'

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  percentage: number
  estimatedTimeRemaining?: number
  currentItem?: string
}

export interface BatchItem {
  id: string
  type: string
  data: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  processingTime?: number
}

export interface BatchSettings {
  priority: 'low' | 'normal' | 'high'
  retries: number
  timeout: number
  parallel: boolean
  maxConcurrency: number
  notifications: NotificationSettings
}

export interface BatchResults {
  successCount: number
  failureCount: number
  totalCount: number
  successItems: BatchItem[]
  failureItems: BatchItem[]
  summary: BatchSummary
}

export interface BatchSummary {
  totalProcessingTime: number
  averageProcessingTime: number
  throughput: number
  errorRate: number
  quality: QualityMetrics
}

export interface QualityMetrics {
  accuracy: number
  completeness: number
  consistency: number
  relevance: number
  timeliness: number
}

export interface BatchMetadata {
  createdBy: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  version: string
  tags: string[]
}