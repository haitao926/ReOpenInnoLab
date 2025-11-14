import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID, IsString, IsObject, IsNumber } from 'class-validator'

import { LabRun } from './lab-run.entity'
import { ResourceRef } from './resource-ref.entity'

export enum ArtifactType {
  NOTEBOOK = 'notebook',
  OUTPUT = 'output',
  PLOT = 'plot',
  IMAGE = 'image',
  DATA = 'data',
  LOG = 'log',
  ERROR = 'error',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  CODE = 'code',
  MODEL = 'model',
  REPORT = 'report',
  CUSTOM = 'custom',
}

export enum ArtifactStatus {
  GENERATING = 'generating',
  READY = 'ready',
  PROCESSING = 'processing',
  FAILED = 'failed',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum ArtifactSource {
  USER_UPLOAD = 'user_upload',
  AUTO_GENERATED = 'auto_generated',
  SYSTEM_CAPTURE = 'system_capture',
  AI_GENERATED = 'ai_generated',
  COLLABORATIVE = 'collaborative',
  IMPORTED = 'imported',
}

@Entity('lab_artifacts')
@Index(['runId'])
@Index(['artifactType'])
@Index(['status'])
@Index(['source'])
@Index(['studentId'])
@Index(['createdAt'])
export class LabArtifact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'run_id' })
  @IsUUID()
  runId: string

  @Column({ type: 'uuid', name: 'student_id' })
  @IsUUID()
  studentId: string

  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  @IsOptional()
  @IsUUID()
  tenantId?: string

  @Column({ type: 'varchar', length: 255, name: 'title' })
  @IsString()
  title: string

  @Column({ type: 'text', nullable: true, name: 'description' })
  @IsOptional()
  @IsString()
  description?: string

  @Column({
    type: 'enum',
    enum: ArtifactType,
  })
  @IsEnum(ArtifactType)
  artifactType: ArtifactType

  @Column({
    type: 'enum',
    enum: ArtifactStatus,
    default: ArtifactStatus.GENERATING,
  })
  @IsEnum(ArtifactStatus)
  status: ArtifactStatus

  @Column({
    type: 'enum',
    enum: ArtifactSource,
    default: ArtifactSource.AUTO_GENERATED,
  })
  @IsEnum(ArtifactSource)
  source: ArtifactSource

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'cell_index' })
  @IsOptional()
  @IsString()
  cellIndex?: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'execution_id' })
  @IsOptional()
  @IsString()
  executionId?: string

  @Column({ type: 'jsonb', name: 'content_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  contentMetadata?: {
    format?: string
    encoding?: string
    language?: string
    version?: string
    schema?: string
    dimensions?: {
      width?: number
      height?: number
      depth?: number
    }
    quality?: {
      resolution?: string
      dpi?: number
      bitrate?: number
      frameRate?: number
    }
    structure?: {
      pages?: number
      chapters?: number
      sections?: string[]
      layers?: string[]
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'generation_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  generationMetadata?: {
    method?: string
    algorithm?: string
    parameters?: Record<string, any>
    codeSnippet?: string
    command?: string
    inputFiles?: string[]
    outputFiles?: string[]
    environment?: Record<string, string>
    duration?: number // milliseconds
    memoryUsage?: number // bytes
    cpuUsage?: number // percentage
    timestamp?: Date
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'extraction_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  extractionMetadata?: {
    extractedFrom?: string
    extractionMethod?: string
    extractionRules?: Array<{
      pattern: string
      action: string
      parameters?: Record<string, any>
    }>
    processingSteps?: string[]
    quality?: {
      accuracy?: number
      completeness?: number
      consistency?: number
    }
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'analysis_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  analysisMetadata?: {
    contentType?: string
    features?: Record<string, any>
    patterns?: Array<{
      type: string
      confidence: number
      location?: string
      description?: string
    }>
    statistics?: {
      size?: number
      complexity?: number
      uniqueness?: number
      similarity?: number
    }
    classifications?: Array<{
      category: string
      confidence: number
      reason?: string
    }>
    tags?: string[]
    summary?: string
    insights?: string[]
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'security_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  securityMetadata?: {
    scannedAt?: Date
    scanResult?: 'safe' | 'suspicious' | 'malicious'
    threats?: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      location?: string
      confidence?: number
    }>
    piiDetected?: boolean
    sensitiveData?: Array<{
      type: string
      location: string
      confidence: number
    }>
    allowed?: boolean
    blockedReason?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'usage_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  usageMetadata?: {
    downloadCount?: number
    viewCount?: number
    shareCount?: number
    lastAccessedAt?: Date
    accessLog?: Array<{
      userId: string
      action: string
      timestamp: Date
      ipAddress?: string
      userAgent?: string
    }>
    citations?: Array<{
      runId: string
      timestamp: Date
      context?: string
    }>
    custom?: Record<string, any>
  }

  @Column({ type: 'integer', nullable: true, name: 'file_size' })
  @IsOptional()
  @IsNumber()
  fileSize?: number // bytes

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'file_hash' })
  @IsOptional()
  @IsString()
  fileHash?: string

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'mime_type' })
  @IsOptional()
  @IsString()
  mimeType?: string

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'file_path' })
  @IsOptional()
  @IsString()
  filePath?: string

  @Column({ type: 'jsonb', name: 'checksums', nullable: true })
  @IsOptional()
  @IsObject()
  checksums?: {
    md5?: string
    sha1?: string
    sha256?: string
    sha512?: string
    custom?: Record<string, string>
  }

  @Column({ type: 'jsonb', name: 'thumbnail_info', nullable: true })
  @IsOptional()
  @IsObject()
  thumbnailInfo?: {
    path?: string
    size?: number
    dimensions?: {
      width: number
      height: number
    }
    format?: string
    quality?: number
    generatedAt?: Date
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'preview_info', nullable: true })
  @IsOptional()
  @IsObject()
  previewInfo?: {
    type?: 'image' | 'text' | 'video' | 'audio' | 'document'
    url?: string
    size?: number
    generatedAt?: Date
    expiresAt?: Date
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'sharing_info', nullable: true })
  @IsOptional()
  @IsObject()
  sharingInfo?: {
    isPublic?: boolean
    shareCode?: string
    shareUrl?: string
    permissions?: {
      canView?: boolean
      canDownload?: boolean
      canShare?: boolean
      canEdit?: boolean
    }
    allowedUsers?: string[]
    allowedRoles?: string[]
    expiresAt?: Date
    downloadLimit?: number
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'grading_info', nullable: true })
  @IsOptional()
  @IsObject()
  gradingInfo?: {
    includedInGrading?: boolean
    weight?: number
    score?: number
    maxScore?: number
    feedback?: string
    rubricScores?: Record<string, number>
    autoGradingResults?: {
      passed: boolean
      score: number
      details?: any[]
    }
    gradedBy?: string
    gradedAt?: Date
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'custom_metadata', nullable: true })
  @IsOptional()
  @IsObject()
  customMetadata?: Record<string, any>

  // Relationships
  @ManyToOne(() => LabRun, { nullable: false })
  @JoinColumn({ name: 'run_id' })
  run: LabRun

  @OneToMany(() => ResourceRef, (resource) => resource, {
    cascade: true,
  })
  resources: ResourceRef[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isGenerating(): boolean {
    return this.status === ArtifactStatus.GENERATING
  }

  get isReady(): boolean {
    return this.status === ArtifactStatus.READY
  }

  get isProcessing(): boolean {
    return this.status === ArtifactStatus.PROCESSING
  }

  get isFailed(): boolean {
    return this.status === ArtifactStatus.FAILED
  }

  get isArchived(): boolean {
    return this.status === ArtifactStatus.ARCHIVED
  }

  get isDeleted(): boolean {
    return this.status === ArtifactStatus.DELETED
  }

  get canBeAccessed(): boolean {
    return [ArtifactStatus.READY, ArtifactStatus.PROCESSING].includes(this.status)
  }

  // Helper methods
  getStatusDisplay(): string {
    const statusMap: Record<ArtifactStatus, string> = {
      [ArtifactStatus.GENERATING]: '生成中',
      [ArtifactStatus.READY]: '就绪',
      [ArtifactStatus.PROCESSING]: '处理中',
      [ArtifactStatus.FAILED]: '失败',
      [ArtifactStatus.ARCHIVED]: '已归档',
      [ArtifactStatus.DELETED]: '已删除',
    }
    return statusMap[this.status] || this.status
  }

  getTypeDisplay(): string {
    const typeMap: Record<ArtifactType, string> = {
      [ArtifactType.NOTEBOOK]: 'Notebook',
      [ArtifactType.OUTPUT]: '输出',
      [ArtifactType.PLOT]: '图表',
      [ArtifactType.IMAGE]: '图片',
      [ArtifactType.DATA]: '数据',
      [ArtifactType.LOG]: '日志',
      [ArtifactType.ERROR]: '错误',
      [ArtifactType.VIDEO]: '视频',
      [ArtifactType.AUDIO]: '音频',
      [ArtifactType.DOCUMENT]: '文档',
      [ArtifactType.ARCHIVE]: '压缩包',
      [ArtifactType.CODE]: '代码',
      [ArtifactType.MODEL]: '模型',
      [ArtifactType.REPORT]: '报告',
      [ArtifactType.CUSTOM]: '自定义',
    }
    return typeMap[this.artifactType] || this.artifactType
  }

  getSourceDisplay(): string {
    const sourceMap: Record<ArtifactSource, string> = {
      [ArtifactSource.USER_UPLOAD]: '用户上传',
      [ArtifactSource.AUTO_GENERATED]: '自动生成',
      [ArtifactSource.SYSTEM_CAPTURE]: '系统捕获',
      [ArtifactSource.AI_GENERATED]: 'AI 生成',
      [ArtifactSource.COLLABORATIVE]: '协作创建',
      [ArtifactSource.IMPORTED]: '导入',
    }
    return sourceMap[this.source] || this.source
  }

  getHumanSize(): string {
    if (!this.fileSize) return '未知大小'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = this.fileSize
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  getFileExtension(): string {
    if (!this.filePath && !this.title) return ''
    const filename = this.filePath || this.title
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : ''
  }

  isSecure(): boolean {
    const security = this.securityMetadata
    if (!security || !security.scannedAt) return false
    return security.scanResult === 'safe' && security.allowed !== false
  }

  hasSecurityIssues(): boolean {
    const security = this.securityMetadata
    return !!(security?.threats && security.threats.length > 0)
  }

  getSecurityLevel(): 'safe' | 'caution' | 'danger' {
    const security = this.securityMetadata
    if (!security?.threats || security.threats.length === 0) return 'safe'

    const hasHighOrCritical = security.threats.some(t =>
      t.severity === 'high' || t.severity === 'critical'
    )
    if (hasHighOrCritical) return 'danger'

    const hasMedium = security.threats.some(t => t.severity === 'medium')
    if (hasMedium) return 'caution'

    return 'safe'
  }

  markAsReady(): void {
    this.status = ArtifactStatus.READY
  }

  markAsFailed(error?: string): void {
    this.status = ArtifactStatus.FAILED
    if (error && !this.customMetadata) {
      this.customMetadata = {}
    }
    if (error) {
      this.customMetadata!.failureReason = error
    }
  }

  archive(): void {
    this.status = ArtifactStatus.ARCHIVED
  }

  delete(): void {
    this.status = ArtifactStatus.DELETED
  }

  updateFileSize(size: number): void {
    this.fileSize = size
  }

  updateChecksums(checksums: Record<string, string>): void {
    this.checksums = {
      ...this.checksums,
      ...checksums,
    }
  }

  recordAccess(userId: string, action: string = 'view', metadata?: any): void {
    if (!this.usageMetadata) {
      this.usageMetadata = {}
    }
    if (!this.usageMetadata.accessLog) {
      this.usageMetadata.accessLog = []
    }

    this.usageMetadata.accessLog.push({
      userId,
      action,
      timestamp: new Date(),
      ...metadata,
    })

    this.usageMetadata.lastAccessedAt = new Date()

    // Update counters
    switch (action) {
      case 'view':
        this.usageMetadata.viewCount = (this.usageMetadata.viewCount || 0) + 1
        break
      case 'download':
        this.usageMetadata.downloadCount = (this.usageMetadata.downloadCount || 0) + 1
        break
      case 'share':
        this.usageMetadata.shareCount = (this.usageMetadata.shareCount || 0) + 1
        break
    }
  }

  canBeShared(): boolean {
    return this.isReady && !this.hasSecurityIssues()
  }

  generateShareCode(): string {
    const code = Math.random().toString(36).substring(2, 15) +
                 Math.random().toString(36).substring(2, 15)

    if (!this.sharingInfo) {
      this.sharingInfo = {}
    }

    this.sharingInfo.shareCode = code
    this.sharingInfo.isPublic = true

    return code
  }

  isShared(): boolean {
    return !!(this.sharingInfo?.shareCode && this.sharingInfo?.isPublic)
  }

  canBeAccessedBy(userId: string, userRoles?: string[]): boolean {
    if (this.isShared()) return true

    const sharing = this.sharingInfo
    if (!sharing) return false

    // Check user-specific access
    if (sharing.allowedUsers?.includes(userId)) {
      return true
    }

    // Check role-based access
    if (userRoles && sharing.allowedRoles) {
      return userRoles.some(role => sharing.allowedRoles!.includes(role))
    }

    return false
  }

  getThumbnailUrl(): string | null {
    return this.thumbnailInfo?.path || null
  }

  getPreviewUrl(): string | null {
    return this.previewInfo?.url || null
  }

  isExpired(): boolean {
    const expiresAt = this.sharingInfo?.expiresAt
    if (!expiresAt) return false
    return new Date() > expiresAt
  }

  isDownloadLimitExceeded(): boolean {
    const limit = this.sharingInfo?.downloadLimit
    const count = this.usageMetadata?.downloadCount || 0
    return limit ? count >= limit : false
  }

  getPrimaryResource(): ResourceRef | null {
    if (!this.resources) return null
    return this.resources.find(r => r.resourceType === 'attachment') || null
  }

  getPreviewResource(): ResourceRef | null {
    if (!this.resources) return null
    return this.resources.find(r => r.resourceType === 'preview') || null
  }

  getThumbnailResource(): ResourceRef | null {
    if (!this.resources) return null
    return this.resources.find(r => r.resourceType === 'thumbnail') || null
  }

  isIncludedInGrading(): boolean {
    return this.gradingInfo?.includedInGrading || false
  }

  getGradingScore(): number | null {
    return this.gradingInfo?.score || null
  }

  getMaxScore(): number | null {
    return this.gradingInfo?.maxScore || null
  }

  getScoreDisplay(): string {
    const score = this.getGradingScore()
    const maxScore = this.getMaxScore()
    if (score === null || maxScore === null) return '未评分'
    return `${score}/${maxScore}`
  }

  toJSON(): any {
    return {
      id: this.id,
      runId: this.runId,
      studentId: this.studentId,
      tenantId: this.tenantId,
      title: this.title,
      description: this.description,
      artifactType: this.artifactType,
      typeDisplay: this.getTypeDisplay(),
      status: this.status,
      statusDisplay: this.getStatusDisplay(),
      source: this.source,
      sourceDisplay: this.getSourceDisplay(),
      cellIndex: this.cellIndex,
      executionId: this.executionId,
      contentMetadata: this.contentMetadata,
      generationMetadata: this.generationMetadata,
      extractionMetadata: this.extractionMetadata,
      analysisMetadata: this.analysisMetadata,
      securityMetadata: this.securityMetadata,
      usageMetadata: this.usageMetadata,
      fileSize: this.fileSize,
      humanSize: this.getHumanSize(),
      fileHash: this.fileHash,
      mimeType: this.mimeType,
      filePath: this.filePath,
      checksums: this.checksums,
      thumbnailInfo: this.thumbnailInfo,
      previewInfo: this.previewInfo,
      sharingInfo: this.sharingInfo,
      gradingInfo: this.gradingInfo,
      customMetadata: this.customMetadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}