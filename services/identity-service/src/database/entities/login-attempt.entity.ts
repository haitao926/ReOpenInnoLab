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
@Index(['email'])
@Index(['ip_address'])
@Index(['created_at'])
@Index(['status'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress?: string

  @Column({
    type: 'enum',
    enum: ['success', 'failed', 'blocked'],
    default: 'failed'
  })
  status: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'failure_reason' })
  failureReason?: string

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string

  // Relationships
  @ManyToOne(() => User, (user) => user.loginAttempts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date
}