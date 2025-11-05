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

@Entity('login_attempts')
@Index(['userId'])
@Index(['ipAddress'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: true })
  userId?: string

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipAddress?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string

  @Column({ type: 'varchar', length: 20, default: 'failed' })
  status: string

  @Column({ type: 'text', nullable: true })
  failureReason?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  // Relationships
  @ManyToOne(() => User, (user) => user.loginAttempts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date
}