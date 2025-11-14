import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './user.entity'

@Entity('user_sessions')
@Index(['user_id'])
@Index(['token_hash'])
@Index(['expires_at'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'varchar', length: 255, name: 'token_hash' })
  tokenHash: string

  @Column({ type: 'varchar', length: 255, name: 'refresh_token_hash', nullable: true })
  refreshTokenHash?: string

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress?: string

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean

  // Relationships
  @ManyToOne(() => User, (user) => user.userSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  // Helper methods
  get isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired
  }
}