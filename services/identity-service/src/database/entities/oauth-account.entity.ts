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

@Entity('oauth_accounts')
@Index(['provider', 'providerAccountId'], { unique: true })
@Index(['userId'])
export class OauthAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 50 })
  provider: string

  @Column({ type: 'varchar', length: 255 })
  providerAccountId: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerUsername?: string

  @Column({ type: 'jsonb', nullable: true })
  providerProfile?: Record<string, any>

  @Column({ type: 'varchar', length: 500, nullable: true })
  accessToken?: string

  @Column({ type: 'timestamp', nullable: true })
  accessTokenExpiresAt?: Date

  @Column({ type: 'varchar', length: 500, nullable: true })
  refreshToken?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // Relationships
  @ManyToOne(() => User, (user) => user.oauthAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}