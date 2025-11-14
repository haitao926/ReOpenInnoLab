import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { LabDeviceAgent } from './lab-device-agent.entity'
import { LabDevicePolicy } from './lab-device-policy.entity'

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_code', type: 'varchar', length: 100, unique: true })
  tenantCode: string

  @Column({ name: 'tenant_name', type: 'varchar', length: 255 })
  tenantName: string

  @Column({ name: 'domain', type: 'varchar', length: 255, nullable: true })
  domain: string

  @Column({ name: 'settings', type: 'jsonb', default: {} })
  settings: Record<string, any>

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relationships
  @OneToMany(() => LabDeviceAgent, agent => agent.tenant)
  labDeviceAgents: LabDeviceAgent[]

  @OneToMany(() => LabDevicePolicy, policy => policy.tenant)
  labDevicePolicies: LabDevicePolicy[]
}