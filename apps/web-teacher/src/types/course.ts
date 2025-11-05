/**
 * 课程相关类型定义
 */

// 学科类型
export type CourseSubject =
  | 'chinese' | 'math' | 'english' | 'physics' | 'chemistry' | 'biology'
  | 'history' | 'geography' | 'politics' | 'art' | 'music' | 'pe' | 'it' | 'comprehensive'

// 难度级别
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

// 章节类型
export type ChapterType = 'content' | 'experiment' | 'assessment' | 'interactive' | 'project'

// 课程状态
export type CourseStatus = 'draft' | 'published' | 'archived' | 'under_review'

// 基础课程信息
export interface CourseInfo {
  id: string
  title: string
  description: string
  subject: CourseSubject
  grade: string
  duration: number // 周数
  difficulty: DifficultyLevel
  tags: string[]
  coverImage: string
  createdBy: string
  createdAt: string
  updatedAt: string
  status: CourseStatus
  targetAudience?: string
  prerequisites?: string[]
  learningObjectives?: string[]
}

// 章节内容
export interface Chapter {
  id: string
  title: string
  description: string
  type: ChapterType
  duration: number // 分钟
  order: number
  content?: string
  objectives: string[]
  resources: Resource[]
  assignments: Assignment[]
  aiEnhanced: boolean
  aiGeneratedContent?: AIGeneratedContent
}

// 资源
export interface Resource {
  id: string
  title: string
  type: 'video' | 'document' | 'interactive' | 'tool' | 'image' | 'audio'
  url: string
  description: string
  duration?: number
  size?: number
  aiGenerated: boolean
  tags: string[]
}

// 作业
export interface Assignment {
  id: string
  title: string
  description: string
  type: 'quiz' | 'essay' | 'project' | 'code' | 'presentation'
  dueDate?: string
  maxScore: number
  resources: Resource[]
  aiGenerated: boolean
  autoGrading?: boolean
}

// AI生成内容
export interface AIGeneratedContent {
  summary: string
  keyPoints: string[]
  examples: Example[]
  quizzes: Quiz[]
  resources: Resource[]
  metadata: AIMetadata
}

export interface Example {
  id: string
  title: string
  description: string
  content: string
  type: 'text' | 'code' | 'image' | 'interactive'
  difficulty: DifficultyLevel
}

export interface Quiz {
  id: string
  question: string
  type: 'choice' | 'multiple' | 'text' | 'true_false'
  options?: string[]
  correctAnswer: any
  explanation: string
  difficulty: DifficultyLevel
  points: number
}

export interface AIMetadata {
  model: string
  version: string
  generatedAt: string
  confidence: number
  processingTime: number
  tokensUsed: number
}

// 完整课程
export interface Course {
  info: CourseInfo
  chapters: Chapter[]
  assessments: Assessment[]
  resources: Resource[]
  analytics?: CourseAnalytics
  aiEnhancements?: AIEnhancements
}

// AI增强功能
export interface AIEnhancements {
  personalizedPath: boolean
  adaptiveContent: boolean
  intelligentTutoring: boolean
  autoAssessment: boolean
  predictiveAnalytics: boolean
}

// 课程分析数据
export interface CourseAnalytics {
  enrollmentCount: number
  completionRate: number
  averageScore: number
  timeSpent: number
  interactionData: InteractionData[]
  feedback: CourseFeedback[]
}

export interface InteractionData {
  studentId: string
  chapterId: string
  timeSpent: number
  completionStatus: 'completed' | 'in_progress' | 'not_started'
  score?: number
  interactions: StudentInteraction[]
}

export interface StudentInteraction {
  type: 'view' | 'click' | 'submit' | 'pause' | 'seek'
  timestamp: string
  data: any
}

export interface CourseFeedback {
  studentId: string
  rating: number
  comment: string
  suggestions: string[]
  timestamp: string
}

// AI课程建议
export interface AICourseSuggestion {
  id: string
  title: string
  description: string
  subject: CourseSubject
  targetAudience: string
  difficulty: DifficultyLevel
  estimatedDuration: number
  learningObjectives: string[]
  chapters: SuggestedChapter[]
  resources: SuggestedResource[]
  assessments: SuggestedAssessment[]
  rationale: string
  confidence: number
  tags: string[]
  prerequisites: string[]
  adaptations: CourseAdaptation[]
  versions: CourseVersion[]
  relatedCourses: string[]
  metadata: AICourseSuggestionMetadata
}

export interface SuggestedChapter {
  id: string
  title: string
  description: string
  type: ChapterType
  duration: number
  objectives: string[]
  keyTopics: string[]
  activities: LearningActivity[]
  resources: string[]
  assessments: string[]
}

export interface LearningActivity {
  id: string
  title: string
  type: 'lecture' | 'discussion' | 'experiment' | 'project' | 'quiz' | 'presentation'
  duration: number
  description: string
  materials: string[]
  instructions: string[]
  outcomes: string[]
}

export interface SuggestedResource {
  id: string
  title: string
  type: 'video' | 'document' | 'interactive' | 'tool'
  description: string
  url?: string
  duration?: number
  relevanceScore: number
  source: 'ai_generated' | 'curated' | 'teacher_created'
}

export interface SuggestedAssessment {
  id: string
  title: string
  type: 'quiz' | 'assignment' | 'project' | 'presentation'
  description: string
  estimatedTime: number
  maxScore: number
  rubric?: AssessmentRubric
  criteria: AssessmentCriteria[]
}

export interface AssessmentRubric {
  criteria: RubricCriteria[]
  maxScore: number
  passingScore: number
  levels: RubricLevel[]
}

export interface RubricCriteria {
  id: string
  name: string
  description: string
  weight: number
  levels: RubricLevel[]
}

export interface RubricLevel {
  name: string
  description: string
  score: number
  feedback: string
}

export interface AssessmentCriteria {
  id: string
  name: string
  description: string
  weight: number
  evidence: string[]
}

// 课程适配
export interface CourseAdaptation {
  id: string
  type: 'difficulty' | 'pace' | 'style' | 'content'
  description: string
  modifications: Modification[]
  targetGroup: string
  impact: string
}

export interface Modification {
  component: string
  change: string
  reason: string
  effort: 'low' | 'medium' | 'high'
}

// 课程版本
export interface CourseVersion {
  id: string
  version: string
  title: string
  description: string
  changes: VersionChange[]
  createdAt: string
  author: string
  status: 'draft' | 'active' | 'archived'
  compatibility: string[]
  migrationNotes?: string
}

export interface VersionChange {
  type: 'addition' | 'modification' | 'removal' | 'restructure'
  component: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

// AI课程建议元数据
export interface AICourseSuggestionMetadata {
  model: string
  version: string
  generatedAt: string
  processingTime: number
  confidence: number
  sourceData: DataSource[]
  constraints: GenerationConstraint[]
  qualityMetrics: QualityMetric[]
  personalizationLevel: 'low' | 'medium' | 'high'
}

export interface DataSource {
  type: 'curriculum' | 'textbook' | 'best_practices' | 'teacher_feedback' | 'student_data'
  name: string
  relevance: number
  lastUpdated: string
}

export interface GenerationConstraint {
  type: 'time' | 'difficulty' | 'resources' | 'standards' | 'accessibility'
  description: string
  value: any
  strict: boolean
}

export interface QualityMetric {
  name: string
  score: number
  threshold: number
  passed: boolean
  feedback: string
}

// 评估
export interface Assessment {
  id: string
  title: string
  type: 'quiz' | 'assignment' | 'project' | 'presentation'
  description: string
  instructions: string
  questions: Question[]
  rubric: AssessmentRubric
  estimatedTime: number
  maxScore: number
  passingScore: number
  resources: Resource[]
  aiGenerated: boolean
  adaptive?: boolean
  accommodations?: Accommodation[]
}

export interface Question {
  id: string
  type: 'choice' | 'multiple' | 'text' | 'essay' | 'code' | 'true_false' | 'fill_blank'
  question: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
  points: number
  difficulty: DifficultyLevel
  tags: string[]
  resources?: Resource[]
  aiGenerated: boolean
  accommodations?: Accommodation[]
}

export interface Accommodation {
  type: 'extended_time' | 'large_print' | 'audio' | 'simplified_language' | 'assistive_technology'
  description: string
  implementation: string
}

// 多学科模板
export interface MultiSubjectTemplate {
  id: string
  title: string
  description: string
  primarySubject: CourseSubject
  secondarySubjects: CourseSubject[]
  integrationApproach: 'interdisciplinary' | 'multidisciplinary' | 'transdisciplinary'
  learningObjectives: MultiSubjectObjective[]
  duration: number
  gradeLevels: string[]
  prerequisites: CrossSubjectPrerequisite[]
  chapters: MultiSubjectChapter[]
  assessments: MultiSubjectAssessment[]
  resources: CrossSubjectResource[]
  collaborationPlan: CollaborationPlan
  evaluationStrategy: EvaluationStrategy
  tags: string[]
  difficulty: DifficultyLevel
}

export interface MultiSubjectObjective {
  id: string
  title: string
  description: string
  subjects: CourseSubject[]
  priority: 'essential' | 'important' | 'supplementary'
  assessments: string[]
  weight: number
}

export interface CrossSubjectPrerequisite {
  id: string
  subject: CourseSubject
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  requiredFor: string[]
}

export interface MultiSubjectChapter {
  id: string
  title: string
  description: string
  subjects: CourseSubject[]
  type: ChapterType
  duration: number
  objectives: MultiSubjectObjective[]
  activities: MultiSubjectActivity[]
  resources: CrossSubjectResource[]
  assessments: string[]
  integrationPoints: IntegrationPoint[]
}

export interface MultiSubjectActivity {
  id: string
  title: string
  description: string
  type: LearningActivity['type']
  duration: number
  subjects: CourseSubject[]
  instructions: string[]
  materials: CrossSubjectResource[]
  outcomes: MultiSubjectObjective[]
  collaboration: boolean
  tools: string[]
}

export interface CrossSubjectResource {
  id: string
  title: string
  description: string
  type: Resource['type']
  subjects: CourseSubject[]
  url?: string
  duration?: number
  accessibilityFeatures: AccessibilityFeature[]
}

export interface AccessibilityFeature {
  type: 'captions' | 'transcript' | 'alt_text' | 'keyboard_navigation' | 'screen_reader' | 'high_contrast'
  available: boolean
  description: string
}

export interface MultiSubjectAssessment {
  id: string
  title: string
  description: string
  type: Assessment['type']
  subjects: CourseSubject[]
  rubric: MultiSubjectRubric
  criteria: MultiSubjectCriteria[]
  estimatedTime: number
  collaboration: boolean
}

export interface MultiSubjectRubric extends AssessmentRubric {
  subjectWeights: Record<CourseSubject, number>
  integrationCriteria: RubricCriteria[]
}

export interface MultiSubjectCriteria extends AssessmentCriteria {
  subject: CourseSubject
  integration: boolean
}

export interface IntegrationPoint {
  id: string
  title: string
  description: string
  subjects: CourseSubject[]
  type: 'concept' | 'skill' | 'application' | 'assessment'
  strength: 'weak' | 'moderate' | 'strong'
  activities: string[]
}

export interface CollaborationPlan {
  approach: 'individual' | 'pair' | 'small_group' | 'whole_class' | 'mixed'
  structure: CollaborationStructure[]
  communication: CommunicationStrategy
  assessment: CollaborationAssessment
}

export interface CollaborationStructure {
  phase: string
  grouping: CollaborationPlan['approach']
  duration: number
  roles: string[]
  deliverables: string[]
}

export interface CommunicationStrategy {
  tools: string[]
  protocols: string[]
  feedback: FeedbackStrategy
}

export interface FeedbackStrategy {
  type: 'peer' | 'self' | 'teacher' | 'ai' | 'mixed'
  frequency: 'continuous' | 'milestone' | 'final'
  criteria: string[]
}

export interface CollaborationAssessment {
  criteria: RubricCriteria[]
  methods: string[]
  weight: number
}

export interface EvaluationStrategy {
  formative: FormativeAssessment[]
  summative: SummativeAssessment[]
  portfolio?: PortfolioAssessment
  reflection?: ReflectionAssessment
}

export interface FormativeAssessment {
  id: string
  title: string
  type: 'quiz' | 'observation' | 'discussion' | 'checkpoint'
  timing: string
  criteria: string[]
}

export interface SummativeAssessment {
  id: string
  title: string
  type: 'project' | 'presentation' | 'exam' | 'portfolio'
  timing: string
  criteria: string[]
  weight: number
}

export interface PortfolioAssessment {
  description: string
  artifacts: PortfolioArtifact[]
  reflection: boolean
  presentation: boolean
}

export interface PortfolioArtifact {
  type: string
  description: string
  criteria: string[]
}

export interface ReflectionAssessment {
  prompts: string[]
  format: 'written' | 'video' | 'audio' | 'presentation'
  criteria: string[]
  frequency: string
}