import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator'

import { UserRole } from './user-role.entity'
import { RefreshToken } from './refresh-token.entity'
import { EmailVerification } from './email-verification.entity'
import { PasswordReset } from './password-reset.entity'
import { LoginAttempt } from './login-attempt.entity'
import { UserSession } from './user-session.entity'
import { OauthAccount } from './oauth-account.entity'
import { TwoFactorAuth } from './two-factor-auth.entity'
import { Tenant } from './tenant.entity'

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
  PARENT = 'parent',
  RESEARCHER = 'researcher',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['lastLoginAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @IsUUID()
  tenantId: string

  @Column({ type: 'varchar', length: 255 })
  @IsEmail()
  email: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  phone?: string

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({
    type: 'enum',
    enum: UserType,
    name: 'role_type',
    default: UserType.STUDENT,
  })
  @IsEnum(UserType)
  roleType: UserType

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  @IsOptional()
  lastLoginAt?: Date

  @Column({ type: 'jsonb', nullable: true, name: 'profile_json' })
  @IsOptional()
  profileJson?: Record<string, any>

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  @IsOptional()
  emailVerifiedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'phone_verified_at' })
  @IsOptional()
  phoneVerifiedAt?: Date

  // Relationships
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

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
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Virtual fields
  get displayName(): string {
    return this.name || this.email
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE
  }

  get isEmailVerified(): boolean {
    return !!this.emailVerifiedAt
  }

  get isPhoneVerified(): boolean {
    return !!this.phoneVerifiedAt
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

  // Get profile from JSON or return default
  getProfile(): Record<string, any> {
    return this.profileJson || {
      avatar: null,
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      preferences: {
        theme: 'auto',
        workspace_layout: 'default'
      }
    }
  }
}