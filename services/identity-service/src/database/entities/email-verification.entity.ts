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

@Entity('email_verifications')
@Index(['token'])
@Index(['userId'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 255 })
  token: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date

  @Column({ type: 'boolean', default: false })
  isVerified: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  newEmail?: string

  // Relationships
  @ManyToOne(() => User, (user) => user.emailVerifications, { onDelete: 'CASCADE' })
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
    return !this.isVerified && !this.isExpired
  }
}