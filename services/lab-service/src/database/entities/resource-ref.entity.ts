import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator'

export enum ResourceType {
  ATTACHMENT = 'attachment',
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
  CHECKSUM = 'checksum',
  METADATA = 'metadata',
  BACKUP = 'backup',
}

export enum StorageBackend {
  LOCAL = 'local',
  MINIO = 'minio',
  S3 = 's3',
  AZURE_BLOB = 'azure_blob',
  GCS = 'gcs',
}

@Entity('resource_refs')
@Index(['entityType', 'entityId'])
@Index(['resourceType'])
@Index(['storageBackend'])
@Index(['createdAt'])
export class ResourceRef {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  @IsString()
  entityType: string // e.g., 'lab_template', 'lab_run', 'lab_artifact'

  @Column({ type: 'uuid', name: 'entity_id' })
  @IsUUID()
  entityId: string

  @Column({
    type: 'enum',
    enum: ResourceType,
    name: 'resource_type',
  })
  @IsEnum(ResourceType)
  resourceType: ResourceType

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  @IsString()
  filePath: string

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'file_name' })
  @IsOptional()
  @IsString()
  fileName?: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mime_type' })
  @IsOptional()
  @IsString()
  mimeType?: string

  @Column({ type: 'integer', nullable: true, name: 'file_size' })
  @IsOptional()
  fileSize?: number // bytes

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'checksum_sha256' })
  @IsOptional()
  @IsString()
  checksumSha256?: string

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'checksum_md5' })
  @IsOptional()
  @IsString()
  checksumMd5?: string

  @Column({
    type: 'enum',
    enum: StorageBackend,
    default: StorageBackend.MINIO,
  })
  @IsEnum(StorageBackend)
  storageBackend: StorageBackend

  @Column({ type: 'jsonb', name: 'storage_metadata', nullable: true })
  @IsOptional()
  storageMetadata?: {
    bucket?: string
    key?: string
    region?: string
    versionId?: string
    etag?: string
    presignedUrl?: string
    url?: string
    custom?: Record<string, any>
  }

  @Column({ type: 'jsonb', name: 'processing_metadata', nullable: true })
  @IsOptional()
  processingMetadata?: {
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    error?: string
    startedAt?: Date
    completedAt?: Date
    retries?: number
    custom?: Record<string, any>
  }

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  @IsOptional()
  expiresAt?: Date

  @Column({ type: 'jsonb', name: 'access_control', nullable: true })
  @IsOptional()
  accessControl?: {
    isPublic?: boolean
    allowedRoles?: string[]
    allowedUsers?: string[]
    signedUrl?: boolean
    downloadLimit?: number
    downloadCount?: number
    custom?: Record<string, any>
  }

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get isExpired(): boolean {
    if (!this.expiresAt) return false
    return new Date() > this.expiresAt
  }

  get isPublic(): boolean {
    return this.accessControl?.isPublic || false
  }

  get isExpiredSoon(): boolean {
    if (!this.expiresAt) return false
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    return this.expiresAt <= oneHourFromNow
  }

  get getHumanSize(): string {
    if (!this.fileSize) return 'Unknown size'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = this.fileSize
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  get getFileExtension(): string {
    if (!this.fileName) return ''
    const lastDot = this.fileName.lastIndexOf('.')
    return lastDot !== -1 ? this.fileName.substring(lastDot + 1).toLowerCase() : ''
  }

  // Helper methods
  getStorageKey(): string {
    if (this.storageMetadata?.key) {
      return this.storageMetadata.key
    }
    return this.filePath
  }

  getStorageBucket(): string {
    if (this.storageMetadata?.bucket) {
      return this.storageMetadata.bucket
    }
    // Default bucket based on resource type
    const bucketMap = {
      [ResourceType.ATTACHMENT]: 'lab-attachments',
      [ResourceType.PREVIEW]: 'lab-previews',
      [ResourceType.THUMBNAIL]: 'lab-thumbnails',
      [ResourceType.CHECKSUM]: 'lab-checksums',
      [ResourceType.METADATA]: 'lab-metadata',
      [ResourceType.BACKUP]: 'lab-backups',
    }
    return bucketMap[this.resourceType] || 'lab-default'
  }

  isProcessing(): boolean {
    return this.processingMetadata?.status === 'processing'
  }

  isProcessingComplete(): boolean {
    return this.processingMetadata?.status === 'completed'
  }

  isProcessingFailed(): boolean {
    return this.processingMetadata?.status === 'failed'
  }

  getProcessingProgress(): number {
    return this.processingMetadata?.progress || 0
  }

  updateProcessingStatus(status: 'pending' | 'processing' | 'completed' | 'failed', metadata?: any): void {
    if (!this.processingMetadata) {
      this.processingMetadata = {}
    }

    this.processingMetadata.status = status

    if (status === 'processing' && !this.processingMetadata.startedAt) {
      this.processingMetadata.startedAt = new Date()
    }

    if (status === 'completed') {
      this.processingMetadata.completedAt = new Date()
      if (metadata?.progress !== undefined) {
        this.processingMetadata.progress = metadata.progress
      }
    }

    if (status === 'failed' && metadata?.error) {
      this.processingMetadata.error = metadata.error
    }

    if (metadata) {
      this.processingMetadata = {
        ...this.processingMetadata,
        ...metadata,
      }
    }
  }

  canAccess(userId?: string, userRoles?: string[]): boolean {
    if (this.isPublic) return true

    const access = this.accessControl
    if (!access) return false

    // Check user-specific access
    if (userId && access.allowedUsers?.includes(userId)) {
      return true
    }

    // Check role-based access
    if (userRoles && access.allowedRoles) {
      return userRoles.some(role => access.allowedRoles.includes(role))
    }

    return false
  }

  incrementDownloadCount(): void {
    if (!this.accessControl) {
      this.accessControl = {}
    }
    this.accessControl.downloadCount = (this.accessControl.downloadCount || 0) + 1
  }

  isDownloadLimitExceeded(): boolean {
    const limit = this.accessControl?.downloadLimit
    const count = this.accessControl?.downloadCount || 0
    return limit ? count >= limit : false
  }

  generateStorageUrl(baseDomain?: string): string {
    if (this.storageMetadata?.url) {
      return this.storageMetadata.url
    }

    if (this.storageBackend === StorageBackend.MINIO && baseDomain) {
      return `https://${this.getStorageBucket()}.${baseDomain}/${this.getStorageKey()}`
    }

    return ''
  }

  toJSON(): any {
    return {
      id: this.id,
      entityType: this.entityType,
      entityId: this.entityId,
      resourceType: this.resourceType,
      filePath: this.filePath,
      fileName: this.fileName,
      mimeType: this.mimeType,
      fileSize: this.fileSize,
      humanSize: this.getHumanSize,
      checksumSha256: this.checksumSha256,
      checksumMd5: this.checksumMd5,
      storageBackend: this.storageBackend,
      storageMetadata: this.storageMetadata,
      processingMetadata: this.processingMetadata,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired,
      isExpiredSoon: this.isExpiredSoon,
      accessControl: this.accessControl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}