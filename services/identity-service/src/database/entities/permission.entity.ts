import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { IsOptional } from 'class-validator'

import { RolePermission } from './role-permission.entity'

@Entity('permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string

  @Column({ type: 'varchar', length: 100 })
  resource: string

  @Column({ type: 'varchar', length: 50 })
  action: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string

  // Relationships
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date
}