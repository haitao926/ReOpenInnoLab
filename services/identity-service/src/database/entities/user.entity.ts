import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  Index,
} from 'typeorm'
import { IsEmail, IsEnum, IsOptional } from 'class-validator'

import { UserRole } from './user-role.entity'
import { RefreshToken } from './refresh-token.entity'
import { EmailVerification } from './email-verification.entity'
import { PasswordReset } from './password-reset.entity'
import { LoginAttempt } from './login-attempt.entity'
import { UserSession } from './user-session.entity'
import { OauthAccount } from './oauth-account.entity'
import { TwoFactorAuth } from './two-factor-auth.entity'

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
}

export enum UserType {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['status'])
@Index(['type'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  username?: string

  @Column({ type: 'varchar', length: 255 })
  @IsEmail()
  email: string

  @Column({ type: 'varchar', length: 255 })
  password: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  firstName?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  lastName?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  phone?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  avatar?: string

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @IsEnum(UserStatus)
  status: UserStatus

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.STUDENT,
  })
  @IsEnum(UserType)
  type: UserType

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  department?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  grade?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  school?: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  bio?: string

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  preferences?: Record<string, any>

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastLoginAt?: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  lastLoginIp?: string

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  passwordChangedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  emailVerifiedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  suspendedAt?: Date

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  suspendedReason?: string

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  deletedAt?: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  deletedBy?: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  deleteReason?: string

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lockedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lockedUntil?: Date

  @Column({ type: 'integer', default: 0 })
  failedLoginAttempts: number

  // Relationships
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[]

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[]

  @OneToMany(() => EmailVerification, (verification) => verification.user)
  emailVerifications: EmailVerification[]

  @OneToMany(() => PasswordReset, (reset) => reset.user)
  passwordResets: PasswordReset[]

  @OneToMany(() => LoginAttempt, (attempt) => attempt.user)
  loginAttempts: LoginAttempt[]

  @OneToMany(() => UserSession, (session) => session.user)
  userSessions: UserSession[]

  @OneToMany(() => OauthAccount, (oauth) => oauth.user)
  oauthAccounts: OauthAccount[]

  @OneToMany(() => TwoFactorAuth, (twoFactor) => twoFactor.user)
  twoFactorAuths: TwoFactorAuth[]

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt?: Date

  // Virtual fields
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`
    }
    return this.firstName || this.lastName || this.username || this.email
  }

  get displayName(): string {
    return this.fullName || this.username || this.email
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.lockedUntil
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date()
  }

  // Helper methods
  isRole(roleName: string): boolean {
    return this.userRoles?.some(ur => ur.role?.name === roleName) || false
  }

  hasPermission(permissionName: string): boolean {
    return this.userRoles?.some(ur =>
      ur.role?.rolePermissions?.some(rp => rp.permission?.name === permissionName)
    ) || false
  }

  canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`
    return this.hasPermission(permission) || this.hasPermission('*') || this.hasPermission(`${resource}:*`)
  }
}