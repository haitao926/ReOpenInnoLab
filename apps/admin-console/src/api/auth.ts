import { api } from '@/utils/request'
import type {
  LoginRequest,
  LoginResponse,
  User,
  ChangePasswordRequest,
  UserUpdateRequest
} from '@/types/user'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // Map username to email for backend compatibility
    const loginData = {
      email: data.username,
      password: data.password,
      rememberMe: data.rememberMe,
      captcha: data.captcha
    }
    const response = await api.post('/auth/login', loginData)

    // Handle backend response format: { success: boolean, data: { user, accessToken, refreshToken, expiresIn } }
    const responseData = response.data
    if (responseData.success && responseData.data) {
      return {
        token: responseData.data.accessToken,
        refreshToken: responseData.data.refreshToken,
        expiresIn: responseData.data.expiresIn,
        user: responseData.data.user,
        permissions: []
      }
    }
    throw new Error('登录响应格式错误')
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  getCurrentUser: async (): Promise<{ user: User; permissions: string[] }> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  refreshToken: async (): Promise<{ token: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh')

    // Handle backend response format: { success: boolean, data: { accessToken, expiresIn } }
    const responseData = response.data
    if (responseData.success && responseData.data) {
      return {
        token: responseData.data.accessToken,
        refreshToken: '' // Backend doesn't return new refresh token
      }
    }
    throw new Error('刷新令牌响应格式错误')
  },

  updateProfile: async (data: UserUpdateRequest): Promise<User> => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/auth/change-password', data)
  },

  verifyMFA: async (code: string): Promise<boolean> => {
    const response = await api.post('/auth/verify-mfa', { code })
    return response.data.valid
  },

  enableMFA: async (): Promise<{ secret: string; qrCode: string }> => {
    const response = await api.post('/auth/enable-mfa')
    return response.data
  },

  disableMFA: async (code: string): Promise<void> => {
    await api.post('/auth/disable-mfa', { code })
  }
}