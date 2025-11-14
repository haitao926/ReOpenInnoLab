import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { LabDeviceAgent } from './lab-device-agent.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string

  @Column({ name: 'username', type: 'varchar', length: 100 })
  username: string

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string

  @Column({ name: 'role', type: 'varchar', length: 50 })
  role: string

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relationships
  @OneToMany(() => LabDeviceAgent, agent => agent.student)
  labDeviceAgents: LabDeviceAgent[]
}