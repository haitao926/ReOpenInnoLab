export interface User {
  id: string
  username: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  tenantId?: string
  permissions?: string[]
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface UserRole {
  id: string
  name: string
  displayName: string
  permissions: string[]
}

export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
  captcha?: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: User
  permissions: string[]
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface UserCreateRequest {
  username: string
  email: string
  name: string
  password: string
  role: string
  tenantId?: string
  permissions?: string[]
}

export interface UserUpdateRequest {
  email?: string
  name?: string
  avatar?: string
  role?: string
  permissions?: string[]
  isActive?: boolean
}

export interface UserListQuery {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  tenantId?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  pageSize: number
}