import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID, IsString, IsObject, IsArray } from 'class-validator'

import { ResourceRef } from './resource-ref.entity'
import { LabRun } from './lab-run.entity'

export enum TemplateStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

export enum TemplateType {
  JUPYTER_NOTEBOOK = 'jupyter_notebook',
  PYTHON_SCRIPT = 'python_script',
  R_SCRIPT = 'r_script',
  MARKDOWN = 'markdown',
  INTERACTIVE_HTML = 'interactive_html',
  VIRTUAL_LAB = 'virtual_lab',
  CUSTOM = 'custom',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum ExecutionEnvironment {
  LOCAL_JUPYTER = 'local_jupyter',
  CLOUD_JUPYTER = 'cloud_jupyter',
  CONTAINER = 'container',
  VM = 'vm',
  HYBRID = 'hybrid',
}

@Entity('lab_templates')
@Index(['tenantId'])
@Index(['status'])
@Index(['templateType'])
@Index(['difficultyLevel'])
@Index(['subjectArea'])
@Index(['createdBy'])
@Index(['publishedAt'])
export class LabTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @IsUUID()
  tenantId: string

  @Column({ type: 'uuid', name: 'created_by' })
  @IsUUID()
  createdBy: string

  @Column({ type: 'varchar', length: 255, name: 'title' })
  @IsString()
  title: string

  @Column({ type: 'text', name: 'description' })
  @IsString()
  description: string

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'subtitle' })
  @IsOptional()
  @IsString()
  subtitle?: string

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  @IsEnum(TemplateStatus)
  status: TemplateStatus

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.JUPYTER_NOTEBOOK,
  })
  @IsEnum(TemplateType)
  templateType: TemplateType

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.BEGINNER,
  })
  @IsEnum(DifficultyLevel)
  difficultyLevel: DifficultyLevel

  @Column({
    type: 'enum',
    enum: ExecutionEnvironment,
    default: ExecutionEnvironment.LOCAL_JUPYTER,
  })
  @IsEnum(ExecutionEnvironment)
  executionEnvironment: ExecutionEnvironment

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'subject_area' })
  @IsOptional()
  @IsString()
  subjectArea?: string

  @Column({ type: 'jsonb', name: 'tags', default: '[]' })
  @IsArray()
  tags: string[]

  @Column({ type: 'jsonb', name: 'learning_objectives', default: '[]' })
  @IsArray()
  learningObjectives: string[]

  @Column({ type: 'jsonb', name: 'prerequisites', default: '[]' })
  @IsArray()
  prerequisites: string[]

  @Column({ type: 'jsonb', name: 'metadata', default: '{}' })
  @IsOptional()
  @IsObject()
  metadata?: {
    version?: string
    language?: string
    kernel?: string
    estimatedTime?: number // minutes
    maxAttempts?: number
    passingScore?: number
    autoGrade?: boolean
    allowPartialCredit?: boolean
    showHints?: boolean
    showSolution?: boolean
    collaboration?: {
      enabled?: boolean
      maxGroupSize?: number
      peerReview?: boolean
    }
    resources?: {
      cpu?: string
      memory?: string
      storage?: string
      gpu?: boolean
    }
    security?: {
      allowNetwork?: boolean
      allowedDomains?: string[]
      blockedPackages?: string[]
      sandboxLevel?: 'low' | 'medium' | 'high'
    }
    aiAssistant?: {
      enabled?: boolean
      level?: 'basic' | 'advanced' | 'expert'
      customInstructions?: string
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'notebook_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  notebookMetadata?: {
    nbformat?: number
    nbformatMinor?: number
    cells?: Array<{
      cellType: string
      source: string[]
      metadata?: Record<string, any>
      outputs?: any[]
    }>
    kernelspec?: {
      displayName?: string
      language?: string
      name?: string
    }
    languageInfo?: {
      name?: string
      version?: string
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'varchar', length: 64, name: 'primary_notebook_checksum' })
  @IsString()
  primaryNotebookChecksum: string

  @Column({ type: 'integer', name: 'estimated_duration_min' })
  estimatedDurationMin: number

  @Column({ type: 'integer', nullable: true, name: 'max_attempts' })
  @IsOptional()
  maxAttempts?: number

  @Column({ type: 'integer', nullable: true, name: 'passing_score' })
  @IsOptional()
  passingScore?: number

  @Column({ type: 'boolean', default: true, name: 'auto_grade' })
  autoGrade: boolean

  @Column({ type: 'boolean', default: false, name: 'published' })
  published: boolean

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  @IsOptional()
  publishedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'archived_at' })
  @IsOptional()
  archivedAt?: Date

  @Column({ type: 'jsonb', name: 'version_info', default: '{}' })
  @IsOptional()
  @IsObject()
  versionInfo?: {
    current: string
    history: Array<{
      version: string
      author: string
      timestamp: Date
      changes: string[]
      checksum: string
    }>
    parent?: string
    branch?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'ai_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  aiMetadata?: {
    summary?: string
    difficultyAssessment?: {
      score: number
      reasoning: string
      confidence: number
    }
    tagsSuggested?: string[]
    learningObjectivesGenerated?: string[]
    prerequisitesIdentified?: string[]
    estimatedDuration?: number
    qualityScore?: number
    suggestions?: string[]
    lastAnalyzedAt?: Date
    model?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'usage_stats', default: '{}' })
  @IsOptional()
  @IsObject()
  usageStats?: {
    totalRuns: number
    uniqueUsers: number
    averageScore: number
    averageTimeSpent: number
    completionRate: number
    errorRate: number
    lastUsedAt?: Date
    popularityRank?: number
    ratingAverage?: number
    ratingCount?: number
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'content_security', nullable: true })
  @IsOptional()
  @IsObject()
  contentSecurity?: {
    scannedAt?: Date
    scanResult?: 'safe' | 'suspicious' | 'malicious'
    threats?: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      location?: string
    }>
    allowedPackages?: string[]
    blockedPackages?: string[]
    codePatterns?: Array<{
      pattern: string
      risk: 'low' | 'medium' | 'high'
      description: string
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'binding_info', nullable: true })
  @IsOptional()
  @IsObject()
  bindingInfo?: {
    courseActivityId?: string
    assignmentId?: string
    classroomId?: string
    scheduledAt?: Date
    autoStart?: boolean
    required?: boolean
    deadline?: Date
    custom?: Record<string, any>
  }

  // Relationships
  @OneToMany(() => ResourceRef, (resource) => resource, {
    cascade: true,
  })
  resources: ResourceRef[]

  @OneToMany(() => LabRun, (run) => run.template)
  runs: LabRun[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isDraft(): boolean {
    return this.status === TemplateStatus.DRAFT
  }

  get isPublished(): boolean {
    return this.status === TemplateStatus.PUBLISHED && this.published
  }

  get isDeprecated(): boolean {
    return this.status === TemplateStatus.DEPRECATED
  }

  get isArchived(): boolean {
    return this.status === TemplateStatus.ARCHIVED
  }

  get canBeUsed(): boolean {
    return [TemplateStatus.APPROVED, TemplateStatus.PUBLISHED].includes(this.status)
  }

  // Helper methods
  getStatusDisplay(): string {
    const statusMap: Record<TemplateStatus, string> = {
      [TemplateStatus.DRAFT]: '草稿',
      [TemplateStatus.PENDING_REVIEW]: '待审核',
      [TemplateStatus.APPROVED]: '已审核',
      [TemplateStatus.PUBLISHED]: '已发布',
      [TemplateStatus.DEPRECATED]: '已弃用',
      [TemplateStatus.ARCHIVED]: '已归档',
    }
    return statusMap[this.status] || this.status
  }

  getTypeDisplay(): string {
    const typeMap: Record<TemplateType, string> = {
      [TemplateType.JUPYTER_NOTEBOOK]: 'Jupyter Notebook',
      [TemplateType.PYTHON_SCRIPT]: 'Python 脚本',
      [TemplateType.R_SCRIPT]: 'R 脚本',
      [TemplateType.MARKDOWN]: 'Markdown',
      [TemplateType.INTERACTIVE_HTML]: '交互式 HTML',
      [TemplateType.VIRTUAL_LAB]: '虚拟实验室',
      [TemplateType.CUSTOM]: '自定义',
    }
    return typeMap[this.templateType] || this.templateType
  }

  getDifficultyDisplay(): string {
    const difficultyMap: Record<DifficultyLevel, string> = {
      [DifficultyLevel.BEGINNER]: '初级',
      [DifficultyLevel.INTERMEDIATE]: '中级',
      [DifficultyLevel.ADVANCED]: '高级',
      [DifficultyLevel.EXPERT]: '专家',
    }
    return difficultyMap[this.difficultyLevel] || this.difficultyLevel
  }

  getEnvironmentDisplay(): string {
    const envMap: Record<ExecutionEnvironment, string> = {
      [ExecutionEnvironment.LOCAL_JUPYTER]: '本地 Jupyter',
      [ExecutionEnvironment.CLOUD_JUPYTER]: '云端 Jupyter',
      [ExecutionEnvironment.CONTAINER]: '容器',
      [ExecutionEnvironment.VM]: '虚拟机',
      [ExecutionEnvironment.HYBRID]: '混合',
    }
    return envMap[this.executionEnvironment] || this.executionEnvironment
  }

  getDurationDisplay(): string {
    if (!this.estimatedDurationMin) return '未知时长'

    const hours = Math.floor(this.estimatedDurationMin / 60)
    const minutes = this.estimatedDurationMin % 60

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
    }
    return `${minutes}分钟`
  }

  publish(): void {
    this.status = TemplateStatus.PUBLISHED
    this.published = true
    this.publishedAt = new Date()
  }

  archive(): void {
    this.status = TemplateStatus.ARCHIVED
    this.archivedAt = new Date()
    this.published = false
  }

  deprecate(): void {
    this.status = TemplateStatus.DEPRECATED
  }

  updateUsageStats(stats: Partial<typeof this.usageStats>): void {
    this.usageStats = {
      ...this.usageStats,
      ...stats,
      lastUsedAt: new Date(),
    }
  }

  incrementUsage(userId: string, score?: number, timeSpent?: number): void {
    if (!this.usageStats) {
      this.usageStats = {}
    }

    this.usageStats.totalRuns = (this.usageStats.totalRuns || 0) + 1

    // Track unique users (simplified)
    if (!this.usageStats.uniqueUsers) {
      this.usageStats.uniqueUsers = 1
    } else {
      // This is a simplification - in practice, you'd track actual unique users
      this.usageStats.uniqueUsers = Math.min(this.usageStats.uniqueUsers + 0.1, 100)
    }

    if (score !== undefined) {
      const currentAvg = this.usageStats.averageScore || 0
      const totalRuns = this.usageStats.totalRuns
      this.usageStats.averageScore = (currentAvg * (totalRuns - 1) + score) / totalRuns
    }

    if (timeSpent !== undefined) {
      const currentAvg = this.usageStats.averageTimeSpent || 0
      const totalRuns = this.usageStats.totalRuns
      this.usageStats.averageTimeSpent = (currentAvg * (totalRuns - 1) + timeSpent) / totalRuns
    }

    this.usageStats.lastUsedAt = new Date()
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag)
  }

  addTag(tag: string): void {
    if (!this.hasTag(tag)) {
      this.tags.push(tag)
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag)
    if (index > -1) {
      this.tags.splice(index, 1)
    }
  }

  getPrimaryNotebook(): ResourceRef | null {
    if (!this.resources) return null
    return this.resources.find(r => r.resourceType === 'attachment' && r.fileName?.endsWith('.ipynb')) || null
  }

  getPreview(): ResourceRef | null {
    if (!this.resources) return null
    return this.resources.find(r => r.resourceType === 'preview') || null
  }

  getThumbnail(): ResourceRef | null {
    if (!this.resources) return null
    return this.resources.find(r => r.resourceType === 'thumbnail') || null
  }

  isSecure(): boolean {
    const security = this.contentSecurity
    if (!security || !security.scannedAt) return false
    return security.scanResult === 'safe'
  }

  hasSecurityIssues(): boolean {
    const security = this.contentSecurity
    return !!(security?.threats && security.threats.length > 0)
  }

  getSecurityLevel(): 'safe' | 'caution' | 'danger' {
    const security = this.contentSecurity
    if (!security?.threats || security.threats.length === 0) return 'safe'

    const hasHighOrCritical = security.threats.some(t =>
      t.severity === 'high' || t.severity === 'critical'
    )
    if (hasHighOrCritical) return 'danger'

    const hasMedium = security.threats.some(t => t.severity === 'medium')
    if (hasMedium) return 'caution'

    return 'safe'
  }

  toJSON(): any {
    return {
      id: this.id,
      tenantId: this.tenantId,
      createdBy: this.createdBy,
      title: this.title,
      description: this.description,
      subtitle: this.subtitle,
      status: this.status,
      statusDisplay: this.getStatusDisplay(),
      templateType: this.templateType,
      typeDisplay: this.getTypeDisplay(),
      difficultyLevel: this.difficultyLevel,
      difficultyDisplay: this.getDifficultyDisplay(),
      executionEnvironment: this.executionEnvironment,
      environmentDisplay: this.getEnvironmentDisplay(),
      subjectArea: this.subjectArea,
      tags: this.tags,
      learningObjectives: this.learningObjectives,
      prerequisites: this.prerequisites,
      metadata: this.metadata,
      notebookMetadata: this.notebookMetadata,
      primaryNotebookChecksum: this.primaryNotebookChecksum,
      estimatedDurationMin: this.estimatedDurationMin,
      durationDisplay: this.getDurationDisplay(),
      maxAttempts: this.maxAttempts,
      passingScore: this.passingScore,
      autoGrade: this.autoGrade,
      published: this.published,
      publishedAt: this.publishedAt,
      archivedAt: this.archivedAt,
      versionInfo: this.versionInfo,
      aiMetadata: this.aiMetadata,
      usageStats: this.usageStats,
      contentSecurity: this.contentSecurity,
      bindingInfo: this.bindingInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}