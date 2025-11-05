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

@Entity('password_resets')
@Index(['token'])
@Index(['userId'])
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 255 })
  token: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date

  @Column({ type: 'boolean', default: false })
  isUsed: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipAddress?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  userAgent?: string

  // Relationships
  @ManyToOne(() => User, (user) => user.passwordResets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  // Helper methods
  get isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  get isValid(): boolean {
    return !this.isUsed && !this.isExpired
  }
}