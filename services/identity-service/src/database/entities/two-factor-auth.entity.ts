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

@Entity('two_factor_auths')
@Index(['userId'])
@Index(['secret'])
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 255 })
  secret: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  backupCodes?: string

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean

  @Column({ type: 'timestamp', nullable: true })
  enabledAt?: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  qrCode?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  // Relationships
  @ManyToOne(() => User, (user) => user.twoFactorAuths, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date
}