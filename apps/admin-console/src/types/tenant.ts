export type TenantStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'trial' | 'expired'
export type TenantPlan = 'starter' | 'basic' | 'pro' | 'enterprise' | 'custom'

export interface Tenant {
  id: string
  code: string
  name: string
  displayName?: string
  description?: string
  domain?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail: string
  contactPhone?: string
  contactPerson?: string
  address?: string
  country?: string
  industry?: string
  employeeCount?: number
  status: TenantStatus
  plan: TenantPlan
  trialEndsAt?: string
  subscriptionEndsAt?: string
  monthlyPrice?: number
  features: Record<string, boolean>
  quotas: Record<string, number>
  usage: Record<string, number>
  metadata?: Record<string, any>
  createdBy?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  users?: any[]
}

export interface CreateTenantRequest {
  code: string
  name: string
  displayName?: string
  description?: string
  domain?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail: string
  contactPhone?: string
  contactPerson?: string
  address?: string
  country?: string
  industry?: string
  employeeCount?: number
  plan: TenantPlan
  trialEndsAt?: string
  features?: Record<string, boolean>
  quotas?: Record<string, number>
  metadata?: Record<string, any>
}

export interface UpdateTenantRequest {
  name?: string
  displayName?: string
  description?: string
  domain?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  address?: string
  country?: string
  industry?: string
  employeeCount?: number
  plan?: TenantPlan
  features?: Record<string, boolean>
  quotas?: Record<string, number>
  metadata?: Record<string, any>
}

export interface TenantQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: TenantStatus | TenantStatus[]
  plan?: TenantPlan | TenantPlan[]
  industry?: string
  country?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'plan' | 'status'
  sortOrder?: 'ASC' | 'DESC'
}

export interface TenantListResponse {
  items: Tenant[]
  total: number
  page: number
  pageSize: number
}

export interface TenantStatistics {
  totalTenants: number
  activeTenants: number
  trialTenants: number
  expiredTenants: number
  planDistribution: Record<TenantPlan, number>
  statusDistribution: Record<TenantStatus, number>
  recentSignups: number
  topIndustries: Array<{ industry: string; count: number }>
  topCountries: Array<{ country: string; count: number }>
}

export interface TenantQuotaCheck {
  canAdd: boolean
  resource: string
  required: number
  currentUsage?: number
  quota?: number
}

export interface TenantUsageUpdate {
  increment: number
}

export interface TenantStatusUpdate {
  status: TenantStatus
  reason?: string
}

export interface TenantApproval {
  reason?: string
}

export interface TenantRejection {
  reason: string
}