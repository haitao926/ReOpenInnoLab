import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { IsEnum } from 'class-validator'

import { Tenant } from './tenant.entity'

export enum AuthProviderType {
  LOCAL = 'local',
  OAUTH_GOOGLE = 'oauth_google',
  OAUTH_MICROSOFT = 'oauth_microsoft',
  OAUTH_GITHUB = 'oauth_github',
  SAML = 'saml',
  LDAP = 'ldap',
}

@Entity('auth_providers')
@Index(['tenantId', 'providerName'], { unique: true })
export class AuthProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string

  @Column({ type: 'varchar', length: 50, name: 'provider_name' })
  providerName: string

  @Column({
    type: 'enum',
    enum: AuthProviderType,
    name: 'provider_type',
  })
  @IsEnum(AuthProviderType)
  providerType: AuthProviderType

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>

  @Column({ type: 'boolean', name: 'is_enabled', default: false })
  is_enabled: boolean

  // Relationships
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date

  // Helper methods
  getConfig(): Record<string, any> {
    return this.config || {}
  }

  isEnabled(): boolean {
    return this.is_enabled
  }

  // Type-specific configuration helpers
  getOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
    return {
      clientId: this.config?.client_id || '',
      clientSecret: this.config?.client_secret || '',
      redirectUri: this.config?.redirect_uri || '',
    }
  }

  getLocalConfig(): {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    }
  } {
    return {
      passwordPolicy: {
        minLength: this.config?.password_policy?.min_length || 8,
        requireUppercase: this.config?.password_policy?.require_uppercase || true,
        requireLowercase: this.config?.password_policy?.require_lowercase || true,
        requireNumbers: this.config?.password_policy?.require_numbers || true,
        requireSpecialChars: this.config?.password_policy?.require_special_chars || false,
      }
    }
  }
}