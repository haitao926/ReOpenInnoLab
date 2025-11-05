import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { IsString, IsOptional, MaxLength } from 'class-validator'

import { RolePermission } from './role-permission.entity'

@Entity('permissions')
@Index(['name'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @MaxLength(100)
  name: string

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @MaxLength(255)
  displayName: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  category?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  resource?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  action?: string

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>

  @Column({ type: 'boolean', default: true })
  isSystem: boolean

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // Relationships
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}