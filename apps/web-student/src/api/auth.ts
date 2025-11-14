import { apiRequest, type ApiResponse } from './client'

// 用户登录信息 - 匹配后端期望的email字段
export interface LoginRequest {
  email: string
  password: string
  captcha?: string
}

// 后端真实响应格式
export interface LoginResponse {
  success: boolean
  data: {
    user: {
      id: string
      username: string
      email: string
      name: string
      avatar?: string
      role: string
      studentInfo?: {
        studentId: string
        class: string
        grade: string
        major?: string
      }
    }
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

export interface User {
  id: string
  username: string
  email: string
  name: string
  avatar?: string
  role: string
  studentInfo?: {
    studentId: string
    class: string
    grade: string
    major?: string
  }
  createdAt: string
  updatedAt: string
}

// 登录 - 返回解包后的数据以兼容现有代码
export const login = async (credentials: LoginRequest): Promise<{
  user: any
  token: string
  refreshToken: string
  expiresIn: number
}> => {
  const response = await apiRequest.post<LoginResponse>('/auth/login', credentials)
  const { data } = response.data
  return {
    user: data.user,
    token: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn
  }
}

// 登出
export const logout = async (): Promise<void> => {
  await apiRequest.post('/auth/logout')
}

// 刷新token - 匹配后端响应格式
export const refreshToken = async (refreshToken: string): Promise<{ token: string; expiresIn: number }> => {
  const response = await apiRequest.post<{ success: boolean; data: { accessToken: string; expiresIn: number } }>('/auth/refresh', {
    refreshToken
  })
  return {
    token: response.data.data.accessToken,
    expiresIn: response.data.data.expiresIn
  }
}

// 获取当前用户信息
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiRequest.get<User>('/auth/me')
  return response.data
}

// 更新用户信息
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await apiRequest.patch<User>('/auth/profile', data)
  return response.data
}

// 修改密码
export const changePassword = async (data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<void> => {
  await apiRequest.post('/auth/change-password', data)
}

// 重置密码请求
export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiRequest.post('/auth/request-password-reset', { email })
}

// 重置密码
export const resetPassword = async (data: {
  token: string
  newPassword: string
  confirmPassword: string
}): Promise<void> => {
  await apiRequest.post('/auth/reset-password', data)
}

// 验证邮箱
export const verifyEmail = async (token: string): Promise<void> => {
  await apiRequest.post('/auth/verify-email', { token })
}

// 重新发送验证邮件
export const resendVerificationEmail = async (): Promise<void> => {
  await apiRequest.post('/auth/resend-verification')
}

// 获取验证码
export const getCaptcha = async (): Promise<{ captchaId: string; captchaImage: string }> => {
  const response = await apiRequest.get<{ captchaId: string; captchaImage: string }>('/auth/captcha')
  return response.data
}

// 检查用户名是否可用
export const checkUsername = async (username: string): Promise<{ available: boolean }> => {
  const response = await apiRequest.get<{ available: boolean }>(`/auth/check-username/${username}`)
  return response.data
}

// 检查邮箱是否可用
export const checkEmail = async (email: string): Promise<{ available: boolean }> => {
  const response = await apiRequest.get<{ available: boolean }>(`/auth/check-email/${email}`)
  return response.data
}

// 注册（如果支持）
export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
  name: string
  studentInfo?: {
    studentId: string
    class: string
    grade: string
    major?: string
  }
  captcha?: string
}

export const register = async (data: RegisterRequest): Promise<{
  user: any
  token: string
  refreshToken: string
  expiresIn: number
}> => {
  const response = await apiRequest.post<LoginResponse>('/auth/register', data)
  const { data: responseData } = response.data
  return {
    user: responseData.user,
    token: responseData.accessToken,
    refreshToken: responseData.refreshToken,
    expiresIn: responseData.expiresIn
  }
}

// 获取用户权限
export const getUserPermissions = async (): Promise<string[]> => {
  const response = await apiRequest.get<string[]>('/auth/permissions')
  return response.data
}

// 检查权限
export const hasPermission = async (permission: string): Promise<boolean> => {
  const response = await apiRequest.get<boolean>(`/auth/check-permission/${permission}`)
  return response.data
}