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
import { IsString, IsOptional } from 'class-validator'

import { User } from './user.entity'

@Entity('refresh_tokens')
@Index(['token'])
@Index(['userId'])
@Index(['expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  token: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ type: 'timestamp' })
  revokedAt?: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  deviceName?: string

  @Column({ type: 'varchar', length: 45, nullable: true })
  @IsOptional()
  deviceIp?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  devicePlatform?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  deviceBrowser?: string

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>

  // Relationships
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
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
    return !this.isRevoked && !this.isExpired
  }
}