import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Role } from './role.entity'
import { Permission } from './permission.entity'

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  roleId: string

  @Column({ type: 'uuid' })
  permissionId: string

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any>

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // Relationships
  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date
}