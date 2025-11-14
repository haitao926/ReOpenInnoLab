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

@Entity('two_factor_auth')
@Index(['user_id'], { unique: true })
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'varchar', length: 255 })
  secret: string

  @Column({ type: 'text', array: true, nullable: true })
  backupCodes?: string[]

  @Column({ type: 'boolean', name: 'is_enabled', default: false })
  isEnabled: boolean

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt?: Date

  // Relationships
  @ManyToOne(() => User, (user) => user.twoFactorAuths, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Helper methods
  isVerified(): boolean {
    return !!this.verifiedAt
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase())
    }
    this.backupCodes = codes
    return codes
  }

  verifyBackupCode(code: string): boolean {
    return this.backupCodes?.includes(code.toUpperCase()) || false
  }

  consumeBackupCode(code: string): boolean {
    if (!this.verifyBackupCode(code)) {
      return false
    }

    // Remove the used backup code
    this.backupCodes = (this.backupCodes || []).filter(c => c !== code.toUpperCase())
    return true
  }
}