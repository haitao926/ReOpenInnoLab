import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { CourseVersion } from './course-version.entity'

export enum ResourceKind {
  LAB = 'lab',
  EXPERIENCE = 'experience',
  ASSIGNMENT = 'assignment',
  MEDIA = 'media',
  DOCUMENT = 'document',
  LINK = 'link',
  AI_MODEL = 'ai_model',
  SIMULATION = 'simulation',
}

@Entity('resource_refs')
@Index(['courseVersionId'])
@Index(['kind'])
@Index(['checksum'])
export class ResourceRef {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column({ type: 'uuid', name: 'course_version_id', nullable: true })
  @IsOptional()
  @IsUUID()
    courseVersionId?: string

  @Column({ type: 'varchar', length: 500, name: 'resource_uri' })
    resourceUri: string

  @Column({
    type: 'enum',
    enum: ResourceKind,
    name: 'kind'
  })
  @IsEnum(ResourceKind)
    kind: ResourceKind

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
    title?: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
    description?: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  @IsOptional()
    checksum?: string // 用于验证资源完整性

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'storage_path' })
  @IsOptional()
    storagePath?: string // 实际存储路径

  @Column({ type: 'integer', nullable: true, name: 'file_size' })
  @IsOptional()
    fileSize?: number // 文件大小（字节）

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mime_type' })
  @IsOptional()
    mimeType?: string

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
    metadata?: {
    version?: string
    tags?: string[]
    author?: string
    license?: string
    language?: string
    accessibility?: Record<string, any>
    custom?: Record<string, any>
  }

  @Column({ type: 'timestamp', nullable: true, name: 'last_accessed_at' })
  @IsOptional()
    lastAccessedAt?: Date

  @Column({ type: 'integer', nullable: true, name: 'access_count', default: 0 })
  @IsOptional()
    accessCount: number

  // Relationships
  @ManyToOne(() => CourseVersion, { nullable: true })
  @JoinColumn({ name: 'course_version_id' })
    courseVersion?: CourseVersion

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date

  // Virtual fields
  get isLocal(): boolean {
    return Boolean(this.storagePath && this.resourceUri && !this.resourceUri.startsWith('http'))
  }

  get isExternal(): boolean {
    return Boolean(this.resourceUri && (
           this.resourceUri.startsWith('http://') ||
           this.resourceUri.startsWith('https://')
    ))
  }

  get isVideo(): boolean {
    return Boolean(
      this.mimeType?.startsWith('video/') ||
      this.metadata?.tags?.includes('video')
    )
  }

  get isAudio(): boolean {
    return Boolean(
      this.mimeType?.startsWith('audio/') ||
      this.metadata?.tags?.includes('audio')
    )
  }

  get isImage(): boolean {
    return Boolean(
      this.mimeType?.startsWith('image/') ||
      this.metadata?.tags?.includes('image')
    )
  }

  get isDocument(): boolean {
    return Boolean([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ].includes(this.mimeType || '') ||
           this.metadata?.tags?.includes('document'))
  }

  // Helper methods
  getKindDisplay(): string {
    const kindMap: Record<ResourceKind, string> = {
      [ResourceKind.LAB]: '实验',
      [ResourceKind.EXPERIENCE]: '体验',
      [ResourceKind.ASSIGNMENT]: '作业',
      [ResourceKind.MEDIA]: '媒体',
      [ResourceKind.DOCUMENT]: '文档',
      [ResourceKind.LINK]: '链接',
      [ResourceKind.AI_MODEL]: 'AI模型',
      [ResourceKind.SIMULATION]: '模拟'
    }
    return kindMap[this.kind] || this.kind
  }

  getFileSizeDisplay(): string {
    if (!this.fileSize) return '未知大小'

    const kb = this.fileSize / 1024
    const mb = kb / 1024
    const gb = mb / 1024

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`
    }
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`
    }
    if (kb >= 1) {
      return `${kb.toFixed(2)} KB`
    }
    return `${this.fileSize} B`
  }

  getAccessCountDisplay(): string {
    if (this.accessCount === 0) return '未访问'
    if (this.accessCount === 1) return '访问1次'
    return `访问${this.accessCount}次`
  }

  getLastAccessedDisplay(): string {
    if (!this.lastAccessedAt) return '从未访问'
    return new Date(this.lastAccessedAt).toLocaleDateString('zh-CN')
  }

  updateLastAccessed(): void {
    this.lastAccessedAt = new Date()
    this.accessCount = (this.accessCount || 0) + 1
  }

  getDownloadUrl(): string {
    if (this.isExternal) {
      return this.resourceUri
    }
    return `/api/v1/resources/${this.id}/download`
  }

  getPreviewUrl(): string {
    if (this.isExternal && this.isVideo) {
      return this.resourceUri
    }
    if (this.isImage) {
      return `/api/v1/resources/${this.id}/preview`
    }
    return `/api/v1/resources/${this.id}/view`
  }

  isAccessibleBy(userRoles: string[]): boolean {
    // 检查访问权限
    const requiredRoles = this.metadata?.custom?.requiredRoles || []
    if (requiredRoles.length === 0) {
      return true // 没有特定权限要求
    }

    return requiredRoles.some(role => userRoles.includes(role))
  }

  isAccessibleInContext(context: {
    userRole: string
    courseStatus: string
    isEnrolled: boolean
  }): boolean {
    // 基于上下文的访问控制
    if (!context.isEnrolled) {
      // 未注册用户只能访问公开资源
      return this.metadata?.custom?.public === true
    }

    if (context.courseStatus === 'archived') {
      // 已归档课程的资源限制访问
      return this.metadata?.custom?.accessibleWhenArchived !== false
    }

    return this.isAccessibleBy([context.userRole])
  }
}