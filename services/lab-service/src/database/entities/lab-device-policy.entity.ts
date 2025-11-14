import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany } from 'typeorm'
import { Tenant } from './tenant.entity'
import { LabDeviceAgent } from './lab-device-agent.entity'

export enum GradeBand {
  PRIMARY = 'primary',
  MIDDLE = 'middle',
  HIGH = 'high',
  UNIVERSITY = 'university'
}

@Entity('lab_device_policies')
@Index(['tenantId', 'gradeBand'])
@Index(['effectiveFrom', 'effectiveTo'])
export class LabDevicePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @Column({ name: 'policy_name', type: 'varchar', length: 255 })
  policyName: string

  @Column({ name: 'policy_description', type: 'text', nullable: true })
  policyDescription: string

  @Column({
    name: 'grade_band',
    type: 'enum',
    enum: GradeBand
  })
  @Index()
  gradeBand: GradeBand

  @Column({ name: 'quota_cpu', type: 'decimal', precision: 5, scale: 2, default: 2.0 })
  quotaCpu: number // CPU cores

  @Column({ name: 'quota_memory', type: 'decimal', precision: 10, scale: 2, default: 4096.0 })
  quotaMemory: number // MB

  @Column({ name: 'quota_disk', type: 'decimal', precision: 10, scale: 2, default: 10240.0 })
  quotaDisk: number // MB

  @Column({ name: 'quota_network', type: 'decimal', precision: 10, scale: 2, default: 1024.0 })
  quotaNetwork: number // MB per session

  @Column({
    name: 'allowed_packages_json',
    type: 'jsonb',
    default: {
      pip: ['*'], // Allow all by default, restrict per policy
      npm: ['*'],
      conda: ['*']
    }
  })
  allowedPackages: {
    pip: string[] // Package patterns, e.g., ['numpy', 'pandas', 'scikit-*']
    npm: string[]
    conda: string[]
    blocked: string[] // Explicitly blocked packages
  }

  @Column({ name: 'security_settings', type: 'jsonb', default: {} })
  securitySettings: {
    allow_network_access: boolean
    allow_file_system_access: boolean
    allow subprocess_execution: boolean
    allow_shell_commands: boolean
    allowed_domains: string[] // Whitelisted domains
    blocked_commands: string[] // Blocked shell commands
    max_execution_time: number // seconds per cell
    scan_uploads: boolean
    require_approval: boolean
  }

  @Column({ name: 'auto_start', type: 'boolean', default: false })
  autoStart: boolean

  @Column({ name: 'idle_timeout', type: 'int', default: 1800 }) // 30 minutes
  idleTimeout: number

  @Column({ name: 'max_session_duration', type: 'int', default: 7200 }) // 2 hours
  maxSessionDuration: number

  @Column({ name: 'effective_from', type: 'timestamp' })
  @Index()
  effectiveFrom: Date

  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  @Index()
  effectiveTo: Date

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean

  @Column({ name: 'priority', type: 'int', default: 0 })
  priority: number // Higher priority policies override lower ones

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relationships
  @ManyToOne(() => Tenant, tenant => tenant.labDevicePolicies)
  tenant: Tenant

  @OneToMany(() => LabDeviceAgent, agent => agent.policy)
  agents: LabDeviceAgent[]

  // Helper methods
  isEffective(date: Date = new Date(): boolean {
    return this.isActive &&
           date >= this.effectiveFrom &&
           (!this.effectiveTo || date <= this.effectiveTo)
  }

  isPackageAllowed(packageManager: 'pip' | 'npm' | 'conda', packageName: string): boolean {
    if (!this.allowedPackages) return true

    const allowedList = this.allowedPackages[packageManager] || []
    const blockedList = this.allowedPackages.blocked || []

    // Check if explicitly blocked
    if (blockedList.some(pattern => this.matchPattern(packageName, pattern))) {
      return false
    }

    // Check if allowed (if wildcard present, allow all)
    if (allowedList.includes('*')) {
      return true
    }

    // Check specific patterns
    return allowedList.some(pattern => this.matchPattern(packageName, pattern))
  }

  private matchPattern(packageName: string, pattern: string): boolean {
    if (pattern === '*') return true
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return packageName.startsWith(prefix)
    }
    return packageName === pattern
  }

  getSecuritySetting(key: keyof LabDevicePolicy['securitySettings'], defaultValue: any = false): any {
    return this.securitySettings?.[key] ?? defaultValue
  }
}