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

import { UserRole } from './user-role.entity'
import { RolePermission } from './role-permission.entity'

@Entity('roles')
@Index(['name'], { unique: true })
export class Role {
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

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>

  @Column({ type: 'integer', default: 0 })
  level: number

  @Column({ type: 'boolean', default: true })
  isSystem: boolean

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // Relationships
  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[]

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}