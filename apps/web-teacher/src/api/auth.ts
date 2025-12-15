// 开源浦育 ReOpenInnoLab - 认证API
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { LoginRequest, RegisterRequest, User, AuthResponse, ChangePasswordRequest } from '@/types/user'
import { mockApi } from './mock'

// 检查是否启用Mock API
const enableMock = import.meta.env.VITE_ENABLE_MOCK_API === 'true'

// 创建axios实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // 添加租户信息头（如果有）
      const tenantInfo = localStorage.getItem('tenant_info')
      if (tenantInfo) {
        const tenant = JSON.parse(tenantInfo)
        config.headers['X-Tenant-ID'] = tenant.id
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // 防止登录接口本身的401错误触发无限循环
      if (originalRequest.url && originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error)
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
            const response = await api.post('/auth/refresh', {
              refreshToken
            })

            const { accessToken, refreshToken: newRefreshToken, user } = response.data

            localStorage.setItem('auth_token', accessToken)
            localStorage.setItem('access_token', accessToken) // 保持向后兼容
            localStorage.setItem('refresh_token', newRefreshToken)
            localStorage.setItem('user_info', JSON.stringify(user))

            // 重试原始请求
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return instance(originalRequest)
          } else {
            // 没有有效的refresh token，清除认证信息
            localStorage.removeItem('auth_token')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user_info')
            localStorage.removeItem('user_permissions')
            window.location.href = '/login'
          }
        } catch (refreshError) {
          // 刷新失败，清除认证信息并跳转登录
          localStorage.removeItem('auth_token')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user_info')
          localStorage.removeItem('user_permissions')
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )

  return instance
}

const api = createApiInstance()

// 认证API
export const authApi = {
  // 登录
  login: enableMock
    ? mockApi.login
    : async (credentials: LoginRequest): Promise<AuthResponse> => {
      try {
        console.log('Login request credentials:', credentials);

        const requestData = {
          email: credentials.email || credentials.username,
          password: credentials.password,
          rememberMe: credentials.remember ?? false
        };

        console.log('Login request data:', requestData);

        const response = await api.post('/auth/login', requestData)

        // 后端返回的数据结构: { data: { user, accessToken, refreshToken, expiresIn }, success: true }
        const { accessToken, refreshToken, user, expiresIn } = response.data.data || response.data
        let expiresAt: string

        if (typeof expiresIn === 'string') {
          expiresAt = expiresIn
        } else if (typeof expiresIn === 'number') {
          expiresAt = new Date(expiresIn).toISOString()
        } else if (expiresIn instanceof Date) {
          expiresAt = expiresIn.toISOString()
        } else {
          // 默认设置为1小时后过期
          expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        }

        const normalizedUser: User = {
          id: user.id,
          username: user.email,
          email: user.email,
          name: user.name,
          role: user.roleType,
          avatar: user.avatar || '',
          permissions: user.permissions || []
        }

        // 保存认证信息
        localStorage.setItem('auth_token', accessToken)
        localStorage.setItem('access_token', accessToken) // 保持向后兼容
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('user_info', JSON.stringify(normalizedUser))
        localStorage.setItem('user_permissions', JSON.stringify(normalizedUser.permissions || []))
        localStorage.setItem('token_expires_at', expiresAt)

        return {
          user: normalizedUser,
          accessToken,
          refreshToken,
          expiresIn: expiresAt,
          permissions: normalizedUser.permissions
        }
      } catch (error) {
        throw error
      }
    },

  // 注册
  register: enableMock
    ? mockApi.register
    : async (userData: RegisterRequest): Promise<AxiosResponse<any>> => {
      try {
        const response = await api.post('/auth/register', {
          email: userData.email,
          password: userData.password,
          name: userData.name || userData.email.split('@')[0],
          roleType: userData.role || 'user'
        })

        return response
      } catch (error) {
        throw error
      }
    },

  // 退出登录
  logout: enableMock
    ? async () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('user_permissions')
      localStorage.removeItem('token_expires_at')
      return { data: undefined } as AxiosResponse<void>
    }
    : async (): Promise<void> => {
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          await api.post('/auth/logout', {
            refreshToken,
            revokeAll: false
          })
        }
      } catch (error) {
        // 即使退出失败也要清除本地数据
      } finally {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('user_permissions')
        localStorage.removeItem('token_expires_at')
      }
    },

  // 获取用户信息
  getUserInfo: enableMock
    ? mockApi.getUserInfo
    : async (): Promise<{ user: User; permissions: string[] }> => {
      const response = await api.get('/auth/profile')
      return {
        user: {
          id: response.data.id,
          username: response.data.email,
          email: response.data.email,
          name: response.data.name,
          role: response.data.roleType,
          avatar: '',
          permissions: response.data.permissions
        },
        permissions: response.data.permissions
      }
    },

  // 更新用户信息
  updateUserInfo: (userData: Partial<User>): Promise<AxiosResponse<void>> => {
    if (enableMock) {
      return Promise.reject(new Error('Mock API 不支持此功能'))
    }
    return api.put('/auth/profile', userData)
  },

  // 修改密码
  changePassword: (passwordData: ChangePasswordRequest): Promise<AxiosResponse<void>> => {
    if (enableMock) {
      return Promise.reject(new Error('Mock API 不支持此功能'))
    }
    return api.put('/auth/password', passwordData)
  },

  // 验证Token
  verifyToken: enableMock
    ? async () => ({ valid: true })
    : async (): Promise<{ valid: boolean }> => {
      try {
        await api.get('/auth/verify')
        return { valid: true }
      } catch (error) {
        return { valid: false }
      }
    },
}

export default api
