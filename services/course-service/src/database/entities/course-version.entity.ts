import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { Course } from './course.entity'
import { CourseModule } from './course-module.entity'
import { ResourceRef } from './resource-ref.entity'

export enum VersionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('course_versions')
@Index(['courseId', 'version'], { unique: true })
@Index(['status'])
export class CourseVersion {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column({ type: 'uuid', name: 'course_id' })
  @IsUUID()
    courseId: string

  @Column({ type: 'varchar', length: 20 })
    version: string // 遵循语义化版本号，如 1.0.0

  @Column({ type: 'text', name: 'acl_jsonb' })
    aclJsonb: string // ACL 内容，JSON 格式

  @Column({ type: 'text', nullable: true, name: 'diff_summary' })
  @IsOptional()
    diffSummary?: string

  @Column({
    type: 'enum',
    enum: VersionStatus,
    default: VersionStatus.DRAFT
  })
  @IsEnum(VersionStatus)
    status: VersionStatus

  @Column({ type: 'jsonb', name: 'version_metadata', default: '{}' })
  @IsOptional()
    versionMetadata?: {
    changelog?: string
    breakingChanges?: boolean
    migrationNotes?: string
    compatibility?: string
  }

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  @IsOptional()
  @IsUUID()
    createdBy?: string

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  @IsOptional()
    publishedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'archived_at' })
  @IsOptional()
    archivedAt?: Date

  // Relationships
  @ManyToOne(() => Course, { nullable: false })
  @JoinColumn({ name: 'course_id' })
    course: Course

  @OneToMany(() => CourseModule, (module) => module.courseVersion)
    modules: CourseModule[]

  @OneToMany(() => ResourceRef, (resource) => resource.courseVersion)
    resources: ResourceRef[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date

  // Virtual fields
  get isPublished(): boolean {
    return this.status === VersionStatus.PUBLISHED
  }

  get isDraft(): boolean {
    return this.status === VersionStatus.DRAFT
  }

  get isArchived(): boolean {
    return this.status === VersionStatus.ARCHIVED
  }

  // Helper methods
  getAclContent(): any {
    try {
      return JSON.parse(this.aclJsonb)
    } catch (error) {
      console.error('Failed to parse ACL content:', error)
      return null
    }
  }

  setAclContent(content: any): void {
    this.aclJsonb = JSON.stringify(content)
  }

  compareVersion(otherVersion: string): number {
    // 语义化版本号比较
    const parseVersion = (v: string) => {
      const parts = v.split('.').map(Number)
      return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
    }

    const [major1, minor1, patch1] = parseVersion(this.version)
    const [major2, minor2, patch2] = parseVersion(otherVersion)

    if (major1 !== major2) return major1 - major2
    if (minor1 !== minor2) return minor1 - minor2
    return patch1 - patch2
  }

  isNewerThan(otherVersion: string): boolean {
    return this.compareVersion(otherVersion) > 0
  }

  isOlderThan(otherVersion: string): boolean {
    return this.compareVersion(otherVersion) < 0
  }

  getVersionType(): 'major' | 'minor' | 'patch' {
    const parts = this.version.split('.')
    if (parts.length >= 1 && parts[0] !== '0') return 'major'
    if (parts.length >= 2 && parts[1] !== '0') return 'minor'
    return 'patch'
  }

  getDisplayVersion(): string {
    return `v${this.version}`
  }

  getPublishedDisplay(): string {
    if (!this.publishedAt) return '未发布'
    return new Date(this.publishedAt).toLocaleDateString('zh-CN')
  }
}