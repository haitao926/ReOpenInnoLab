import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator'

import { UserRole } from './user-role.entity'
import { RolePermission } from './role-permission.entity'
import { Tenant } from './tenant.entity'

@Entity('roles')
@Index(['tenantId', 'name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  @IsOptional()
  @IsUUID()
  tenantId?: string

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @MaxLength(100)
  name: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem: boolean

  // Relationships
  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[]

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date
}