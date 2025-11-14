import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm'
import { IsEnum, IsOptional } from 'class-validator'

import { Course } from './course.entity'

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum TenantPlan {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
@Index(['code'], { unique: true })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column({ type: 'varchar', length: 50, unique: true })
    code: string

  @Column({ type: 'varchar', length: 255 })
    name: string

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE
  })
  @IsEnum(TenantStatus)
    status: TenantStatus

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.BASIC
  })
  @IsEnum(TenantPlan)
    plan: TenantPlan

  @Column({ type: 'jsonb', default: '{}' })
  @IsOptional()
    metadata?: Record<string, any>

  // Relationships
  @OneToMany(() => Course, (course) => course.tenant)
    courses: Course[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date

  // Virtual fields
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE
  }

  // Helper methods
  getBranding(): Record<string, any> {
    return this.metadata?.branding || {
      logo: null,
      primary_color: '#4F46E5',
      secondary_color: '#10B981'
    }
  }

  getFeatures(): Record<string, any> {
    return this.metadata?.features || {
      ai_assistant: false,
      virtual_lab: false,
      analytics: false
    }
  }

  getLimits(): Record<string, any> {
    const defaultLimits = {
      max_courses: 10,
      max_students_per_course: 50,
      storage_gb: 10,
      max_teachers: 5
    }

    switch (this.plan) {
      case TenantPlan.PRO:
        return {
          max_courses: 100,
          max_students_per_course: 200,
          storage_gb: 100,
          max_teachers: 20
        }
      case TenantPlan.ENTERPRISE:
        return {
          max_courses: 1000,
          max_students_per_course: 1000,
          storage_gb: 1000,
          max_teachers: 100
        }
      default:
        return defaultLimits
    }
  }

  canCreateCourse(): boolean {
    const limits = this.getLimits()
    return (this.courses?.length || 0) < limits.max_courses
  }

  canAddTeacher(currentTeacherCount: number): boolean {
    const limits = this.getLimits()
    return currentTeacherCount < limits.max_teachers
  }

  hasFeature(feature: string): boolean {
    const features = this.getFeatures()
    return features[feature] === true
  }
}