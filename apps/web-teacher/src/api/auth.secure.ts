// 开源浦育 ReOpenInnoLab - 安全认证API
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { LoginRequest, RegisterRequest, User, AuthResponse, ChangePasswordRequest } from '@/types/user'

// 检查是否启用Mock API
const enableMock = import.meta.env.VITE_ENABLE_MOCK_API === 'true'

// 创建axios实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 从内存存储获取token，避免localStorage的安全风险
      const token = getAccessToken()
      const refreshToken = getRefreshToken()

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // 添加租户信息头（如果有）
      const tenantInfo = getTenantInfo()
      if (tenantInfo) {
        config.headers['X-Tenant-ID'] = tenantInfo.id
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
          const refreshToken = getRefreshToken()
          if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
            const response = await api.post('/auth/refresh', {
              refreshToken
            })

            // 处理后端的响应包装格式 {data: {...}, success: true, timestamp: "..."}
            const responseData = response.data.data || response.data
            const { accessToken, refreshToken: newRefreshToken, user } = responseData

            // 安全存储token到内存
            setAccessToken(accessToken)
            setRefreshToken(newRefreshToken)
            setUserInfo(user)

            // 重试原始请求
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return instance(originalRequest)
          } else {
            // 没有有效的refresh token，清除认证信息
            clearAuthData()
            redirectToLogin()
          }
        } catch (refreshError) {
          // 刷新失败，清除认证信息并跳转登录
          clearAuthData()
          redirectToLogin()
        }
      }

      return Promise.reject(error)
    }
  )

  return instance
}

const api = createApiInstance()

// 内存中的token存储，避免localStorage的XSS风险
let accessToken: string | null = null
let refreshToken: string | null = null
let userInfo: User | null = null
let tenantInfo: any = null

// 安全的token存储函数
export const setAccessToken = (token: string): void => {
  accessToken = token
  localStorage.setItem('access_token', token)
}

export const getAccessToken = (): string | null => {
  if (accessToken) {
    return accessToken
  }
  return localStorage.getItem('access_token')
}

export const setRefreshToken = (token: string): void => {
  refreshToken = token
  localStorage.setItem('refresh_token', token)
}

export const getRefreshToken = (): string | null => {
  if (refreshToken) {
    return refreshToken
  }
  return localStorage.getItem('refresh_token')
}

export const setUserInfo = (user: any): void => {
  const normalizedUser: User = {
    id: user.id,
    username: user.email,
    email: user.email,
    name: user.name,
    role: user.roleType,
    avatar: user.avatar || '',
    permissions: user.permissions || []
  }
  userInfo = normalizedUser
  localStorage.setItem('user_info', JSON.stringify(normalizedUser))
}

export const getUserInfo = (): User | null => {
  if (userInfo) {
    return userInfo
  }

  try {
    const stored = localStorage.getItem('user_info')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const setTenantInfo = (tenant: any): void => {
  tenantInfo = tenant
  localStorage.setItem('tenant_info', JSON.stringify(tenant))
}

export const getTenantInfo = (): any => {
  if (tenantInfo) {
    return tenantInfo
  }

  try {
    const stored = localStorage.getItem('tenant_info')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const clearAuthData = (): void => {
  accessToken = null
  refreshToken = null
  userInfo = null
  tenantInfo = null

  // 清除localStorage
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_info')
  localStorage.removeItem('user_permissions')
  localStorage.removeItem('tenant_info')
  localStorage.removeItem('at')
  localStorage.removeItem('rt')
  localStorage.removeItem('token_expires_at')
}

export const redirectToLogin = (): void => {
  // 延迟跳转，避免在响应拦截器中立即跳转导致的问题
  setTimeout(() => {
    window.location.href = '/login'
  }, 100)
}

// 认证API
export const authApi = {
  // 登录
  login: enableMock
    ? async (credentials: LoginRequest): Promise<AuthResponse> => {
        // Mock实现
        return {
          user: {
            id: 'mock-user-id',
            username: credentials.email || credentials.username,
            email: credentials.email || credentials.username,
            name: 'Mock User',
            role: 'teacher',
            avatar: '',
            permissions: ['read', 'write']
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: new Date(Date.now() + 3600 * 1000).toISOString(),
          permissions: ['read', 'write']
        }
      }
    : async (credentials: LoginRequest): Promise<AuthResponse> => {
        try {
          // 移除敏感信息日志
          const requestData = {
            email: credentials.email || credentials.username,
            password: credentials.password,
            rememberMe: credentials.remember ?? false
          }

          const response = await api.post('/auth/login', requestData)

          // 后端返回的数据结构: { data: { user, accessToken, refreshToken, expiresIn }, success: true, timestamp: "..." }
          const responseData = response.data.data || response.data
          const { accessToken: token, refreshToken: refreshTkn, user, expiresIn } = responseData

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

          // 安全存储认证信息到内存
          setAccessToken(token)
          setRefreshToken(refreshTkn)
          setUserInfo(user)

          const normalizedUser = getUserInfo()!

          return {
            user: normalizedUser,
            accessToken: token,
            refreshToken: refreshTkn,
            expiresIn: expiresAt,
            permissions: normalizedUser.permissions
          }
        } catch (error) {
          throw error
        }
      },

  // 注册
  register: enableMock
    ? async (userData: RegisterRequest): Promise<AxiosResponse<any>> => {
        // Mock实现
        return { data: { success: true } } as AxiosResponse<any>
      }
    : async (userData: RegisterRequest): Promise<AxiosResponse<any>> => {
        try {
          const response = await api.post('/auth/register', {
            email: userData.email,
            password: userData.password,
            name: userData.name || userData.email.split('@')[0],
            roleType: userData.role || 'student'
          })

          return response
        } catch (error) {
          throw error
        }
      },

  // 退出登录
  logout: enableMock
    ? async (): Promise<void> => {
        clearAuthData()
      }
    : async (): Promise<void> => {
        try {
          const currentRefreshToken = getRefreshToken()
          if (currentRefreshToken) {
            await api.post('/auth/logout', {
              refreshToken: currentRefreshToken,
              allDevices: false
            })
          }
        } catch (error) {
          // 即使退出失败也要清除本地数据
        } finally {
          clearAuthData()
        }
      },

  // 退出所有设备
  logoutAll: enableMock
    ? async (): Promise<void> => {
        clearAuthData()
      }
    : async (): Promise<void> => {
        try {
          const currentRefreshToken = getRefreshToken()
          if (currentRefreshToken) {
            await api.post('/auth/logout', {
              refreshToken: currentRefreshToken,
              allDevices: true
            })
          }
        } catch (error) {
          // 即使退出失败也要清除本地数据
        } finally {
          clearAuthData()
        }
      },

  // 获取用户信息
  getUserInfo: enableMock
    ? async (): Promise<{ user: User; permissions: string[] }> => {
        const mockUser = getUserInfo()
        return {
          user: mockUser || {
            id: 'mock-user-id',
            username: 'mock@reopenlab.dev',
            email: 'mock@reopenlab.dev',
            name: 'Mock User',
            role: 'teacher',
            avatar: '',
            permissions: ['read', 'write']
          },
          permissions: ['read', 'write']
        }
      }
    : async (): Promise<{ user: User; permissions: string[] }> => {
        const response = await api.get('/auth/profile')
        const userData = response.data.data || response.data

        const user: User = {
          id: userData.id,
          username: userData.email,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.roleType,
          avatar: userData.avatar || '',
          permissions: userData.permissions || []
        }

        return {
          user,
          permissions: userData.permissions || []
        }
      },

  // 更新用户信息
  updateUserInfo: (userData: Partial<User>): Promise<AxiosResponse<void>> => {
    if (enableMock) {
      return Promise.resolve({ data: undefined } as AxiosResponse<void>)
    }
    return api.put('/auth/profile', userData)
  },

  // 修改密码
  changePassword: (passwordData: ChangePasswordRequest): Promise<AxiosResponse<void>> => {
    if (enableMock) {
      return Promise.resolve({ data: undefined } as AxiosResponse<void>)
    }
    return api.put('/auth/password', passwordData)
  },

  // 刷新Token (内部使用，不对外暴露)
  _refreshToken: async (): Promise<{ accessToken: string; refreshToken: string; user: any }> => {
    const currentRefreshToken = getRefreshToken()
    if (!currentRefreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post('/auth/refresh', {
      refreshToken: currentRefreshToken
    })

    const responseData = response.data.data || response.data
    const { accessToken: token, refreshToken: newRefreshToken, user } = responseData

    setAccessToken(token)
    setRefreshToken(newRefreshToken)
    setUserInfo(user)

    return { accessToken: token, refreshToken: newRefreshToken, user }
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

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    const token = getAccessToken()
    if (!token) {
      return false
    }

    // 简单检查token格式和过期时间
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      const payload = JSON.parse(atob(parts[1]))
      const now = Date.now() / 1000

      return payload.exp > now
    } catch {
      return false
    }
  },

  // 获取当前用户权限
  getCurrentPermissions: (): string[] => {
    const user = getUserInfo()
    return user?.permissions || []
  },

  // 检查是否有特定权限
  hasPermission: (permission: string): boolean => {
    const permissions = getCurrentPermissions()
    return permissions.includes(permission) || permissions.includes('*')
  },

  // 检查是否有特定角色
  hasRole: (role: string): boolean => {
    const user = getUserInfo()
    return user?.role === role
  },
}

export default api