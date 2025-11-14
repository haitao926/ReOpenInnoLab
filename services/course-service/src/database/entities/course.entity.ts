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

import { CourseVersion } from './course-version.entity'
import { Tenant } from './tenant.entity'

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

export enum DeliveryMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
  HYBRID = 'hybrid',
  BLENDED = 'blended',
}

export enum GradeBand {
  K1 = 'k1',
  K2 = 'k2',
  K3 = 'k3',
  G1 = 'g1',
  G2 = 'g2',
  G3 = 'g3',
  G4 = 'g4',
  G5 = 'g5',
  G6 = 'g6',
  G7 = 'g7',
  G8 = 'g8',
  G9 = 'g9',
  G10 = 'g10',
  G11 = 'g11',
  G12 = 'g12',
  HIGHER_ED = 'higher_ed',
  ADULT = 'adult',
}

@Entity('courses')
@Index(['tenantId', 'code'], { unique: true })
@Index(['status'])
@Index(['subject'])
@Index(['gradeBand'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @IsUUID()
    tenantId: string

  @Column({ type: 'varchar', length: 50 })
    code: string

  @Column({ type: 'varchar', length: 255 })
    title: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
    description?: string

  @Column({
    type: 'enum',
    enum: GradeBand,
    name: 'grade_band'
  })
  @IsEnum(GradeBand)
    gradeBand: GradeBand

  @Column({ type: 'varchar', length: 100, name: 'subject' })
    subject: string

  @Column({
    type: 'enum',
    enum: DeliveryMode,
    name: 'delivery_mode',
    default: DeliveryMode.HYBRID
  })
  @IsEnum(DeliveryMode)
    deliveryMode: DeliveryMode

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT
  })
  @IsEnum(CourseStatus)
    status: CourseStatus

  @Column({ type: 'integer', name: 'estimated_hours', nullable: true })
  @IsOptional()
    estimatedHours?: number

  @Column({ type: 'integer', name: 'credit_hours', nullable: true })
  @IsOptional()
    creditHours?: number

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
    thumbnail?: string

  @Column({ type: 'jsonb', name: 'metadata', default: '{}' })
  @IsOptional()
    metadata?: Record<string, any>

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  @IsOptional()
  @IsUUID()
    createdBy?: string

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  @IsOptional()
  @IsUUID()
    updatedBy?: string

  // Relationships
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant

  @OneToMany(() => CourseVersion, (version) => version.course)
    versions: CourseVersion[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date

  // Virtual fields
  get isPublished(): boolean {
    return this.status === CourseStatus.PUBLISHED
  }

  get isActive(): boolean {
    return [CourseStatus.DRAFT, CourseStatus.PUBLISHED].includes(this.status)
  }

  // Helper methods
  getLatestVersion(): CourseVersion | undefined {
    if (!this.versions || this.versions.length === 0) {
      return undefined
    }
    return this.versions
      .sort((a, b) => b.version.localeCompare(a.version))[0]
  }

  getPublishedVersion(): CourseVersion | undefined {
    if (!this.versions || this.versions.length === 0) {
      return undefined
    }
    return this.versions
      .filter(v => v.isPublished)
      .sort((a, b) => b.version.localeCompare(a.version))[0]
  }

  getGradeBandDisplay(): string {
    const gradeMap: Record<GradeBand, string> = {
      [GradeBand.K1]: '幼儿园小班',
      [GradeBand.K2]: '幼儿园中班',
      [GradeBand.K3]: '幼儿园大班',
      [GradeBand.G1]: '一年级',
      [GradeBand.G2]: '二年级',
      [GradeBand.G3]: '三年级',
      [GradeBand.G4]: '四年级',
      [GradeBand.G5]: '五年级',
      [GradeBand.G6]: '六年级',
      [GradeBand.G7]: '七年级',
      [GradeBand.G8]: '八年级',
      [GradeBand.G9]: '九年级',
      [GradeBand.G10]: '高一',
      [GradeBand.G11]: '高二',
      [GradeBand.G12]: '高三',
      [GradeBand.HIGHER_ED]: '高等教育',
      [GradeBand.ADULT]: '成人教育'
    }
    return gradeMap[this.gradeBand] || this.gradeBand
  }

  getDeliveryModeDisplay(): string {
    const modeMap: Record<DeliveryMode, string> = {
      [DeliveryMode.ONLINE]: '在线',
      [DeliveryMode.OFFLINE]: '线下',
      [DeliveryMode.HYBRID]: '混合',
      [DeliveryMode.BLENDED]: '融合'
    }
    return modeMap[this.deliveryMode] || this.deliveryMode
  }
}