import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './user.entity'

@Entity('user_sessions')
@Index(['sessionToken'])
@Index(['userId'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 255 })
  sessionToken: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipAddress?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceName?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // Relationships
  @ManyToOne(() => User, (user) => user.userSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  // Helper methods
  get isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired
  }
}