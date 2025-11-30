// 实验管理相关类型定义

export interface LabTemplate {
  id: string
  tenantId: string
  title: string
  description: string
  labType: 'jupyter' | 'python' | 'r' | 'markdown'
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tags: string[]
  notebookUrl: string
  notebookChecksum: string
  notebookSize: number
  previewUrl?: string
  cellMapUrl?: string
  thumbnailUrl?: string
  runtimeSpec: LabRuntimeSpec
  gradingMatrixJson: Record<string, any>
  courseActivityId?: string
  gradeBand?: string
  status: 'processing' | 'ready' | 'preview_failed'
  metadata: LabMetadata
  createdBy: string
  createdAt: string
  updatedAt: string
  resourceRef: string // resource://lab/{id}
  resourceRefs?: Array<{
    id: string
    filename: string
    url: string
    checksum: string
    size: number
    type: string
  }>
  aiDescription?: string
  runtimePolicyId?: string
}

export interface LabRuntimeSpec {
  kernelName?: string
  kernelDisplayName?: string
  language?: string
  packages?: LabPackageSpec
  environment?: Record<string, any>
  resources?: {
    cpu: number
    memory: number
    disk: number
  }
}

export interface LabPackageSpec {
  pip?: string[]
  pip_optional?: string[]
  conda?: string[]
  npm?: string[]
  system?: string[]
}

export interface LabMetadata {
  gradeLevel?: string
  subject?: string
  topics?: string[]
  estimatedDuration?: string
  learningObjectives?: string[]
  prerequisites?: string[]
  cellCount?: number
  codeCells?: number
  markdownCells?: number
}

export interface LabRuntimePolicy {
  id: string
  name: string
  description?: string
  timeoutMinutes: number
  maxRetries: number
  cpuLimit: number
  memoryLimit: number // MB
  diskLimit: number // MB
  allowedPackages: string[]
  blockedCommands: string[]
  networkAccess: boolean
  allowFileUpload: boolean
  allowFileDownload: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface LabRun {
  id: string
  labTemplateId: string
  lessonId: string
  classId: string
  status: 'preparing' | 'running' | 'completed' | 'terminated' | 'paused'
  runtimePolicyId: string
  scheduledAt: string
  startedAt?: string
  endedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  participants: LabParticipant[]
  stats: LabRunStats
}

export interface LabParticipant {
  id: string
  labRunId: string
  studentId: string
  studentName?: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'offline'
  progress: number
  notebookUrl?: string
  artifacts: LabArtifact[]
  lastHeartbeat: string
  errorCount: number
  errors?: string[]
  createdAt: string
  updatedAt: string
}

export interface LabArtifact {
  id: string
  participantId: string
  type: 'notebook' | 'output' | 'log' | 'diff' | 'screenshot'
  name: string
  url: string
  size: number
  checksum: string
  createdAt: string
}

export interface LabRunStats {
  totalParticipants: number
  completedCount: number
  runningCount: number
  errorCount: number
  offlineCount: number
  averageProgress: number
  averageDuration: number
}

// 课程结构中的实验环节
export interface ExperimentSection {
  type: 'experiment'
  labTemplateId: string
  resourceRef: string
  title: string
  description?: string
  objectives: string[]
  duration: number
  hints: AIHint[]
  runtimePolicyId?: string
  aiInstructions?: string
  maxRetries?: number
  showHints?: boolean
  collectStats?: boolean
}

export interface AIHint {
  id: string
  title: string
  content: string
  triggerConditions?: {
    cellIndex?: number
    errorType?: string
    timeSpent?: number
  }
  isActive: boolean
}

// 创建实验模板 DTO
export interface CreateLabTemplateDto {
  title: string
  description: string
  labType: 'jupyter' | 'python' | 'r' | 'markdown'
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tags?: string[]
  packageManifest?: LabPackageSpec
  metadata?: LabMetadata
  courseActivityId?: string
  gradeBand?: string
  autoRenderPreview?: boolean
  aiDescription?: string
  runtimePolicy?: Partial<LabRuntimePolicy>
}

// 创建实验运行 DTO
export interface CreateLabRunDto {
  labTemplateId: string
  lessonId: string
  classId: string
  scheduledTime: string
  endTime?: string
  runtimePolicyId?: string
  participantIds?: string[]
  config?: {
    allowLateJoin: boolean
    showProgress: boolean
    enableHints: boolean
  }
}

// 实验运行时事件
export interface LabRuntimeEvent {
  studentId: string
  lessonId: string
  labRunId: string
  eventType:
    | 'lab:start'
    | 'lab:heartbeat'
    | 'lab:progress'
    | 'lab:complete'
    | 'lab:error'
    | 'lab:artifact'
  timestamp: string
  data?: any
  metadata?: Record<string, any>
}

// 实验报告
export interface LabReport {
  id: string
  labRunId: string
  classId: string
  instructorId: string
  summary: {
    totalDuration: number
    completionRate: number
    averageScore?: number
    errorRate: number
  }
  participantReports: ParticipantLabReport[]
  aiInsights: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
  createdAt: string
}

export interface ParticipantLabReport {
  studentId: string
  studentName?: string
  status: 'completed' | 'incomplete' | 'error'
  progress: number
  duration: number
  score?: number
  artifacts: LabArtifact[]
  feedback?: string
  aiEvaluation?: {
    codeQuality: number
    approach: number
    results: number
    comment: string
  }
}
