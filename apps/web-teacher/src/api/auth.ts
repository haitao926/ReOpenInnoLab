// 开源浦育 ReOpenInnoLab - 认证API
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { LoginRequest, RegisterRequest, User, AuthResponse, ChangePasswordRequest } from '@/types/user'

// 创建axios实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
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
    (error) => {
      if (error.response?.status === 401) {
        // Token过期，清除本地存储并跳转到登录页
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('user_permissions')
        window.location.href = '/login'
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
  login: (credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/auth/login', credentials)
  },

  // 注册
  register: (userData: RegisterRequest): Promise<AxiosResponse<any>> => {
    return api.post('/auth/register', userData)
  },

  // 退出登录
  logout: (): Promise<AxiosResponse<void>> => {
    return api.post('/auth/logout')
  },

  // 获取用户信息
  getUserInfo: (): Promise<AxiosResponse<{ user: User; permissions: string[] }>> => {
    return api.get('/auth/me')
  },

  // 更新用户信息
  updateUserInfo: (userData: Partial<User>): Promise<AxiosResponse<User>> => {
    return api.put('/auth/profile', userData)
  },

  // 修改密码
  changePassword: (passwordData: ChangePasswordRequest): Promise<AxiosResponse<void>> => {
    return api.put('/auth/password', passwordData)
  },

  // 刷新Token
  refreshToken: (): Promise<AxiosResponse<{ access_token: string }>> => {
    return api.post('/auth/refresh')
  },

  // 获取权限列表
  getPermissions: (): Promise<AxiosResponse<{ permissions: string[] }>> => {
    return api.get('/auth/permissions')
  },
}

export default api