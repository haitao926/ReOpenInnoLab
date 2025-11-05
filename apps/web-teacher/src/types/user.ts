export interface User {
  id: string
  username: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'teacher' | 'student' | 'guest'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  last_login_at?: string
  profile?: {
    bio?: string
    phone?: string
    department?: string
    subject?: string
  }
}

export interface LoginRequest {
  username: string
  password: string
  role?: 'teacher' | 'student'
  remember?: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirm_password: string
  name: string
  role?: 'teacher' | 'student'
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
  permissions: string[]
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}