/**
 * 统一的API配置
 * 用于确保三个前端应用使用相同的API基础配置
 */

// API基础配置
export const API_CONFIG = {
  // 统一的基础URL
  BASE_URL: process.env.NODE_ENV === 'development'
    ? '/api/v1'  // 开发环境使用Vite代理
    : (process.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'),

  // 超时时间
  TIMEOUT: 30000,

  // 重试次数
  RETRY_COUNT: 3,

  // 重试延迟
  RETRY_DELAY: 1000,

  // 刷新token端点
  REFRESH_ENDPOINT: '/auth/refresh',

  // 登录端点
  LOGIN_ENDPOINT: '/auth/login',

  // 登出端点
  LOGOUT_ENDPOINT: '/auth/logout',

  // 用户信息端点
  USER_INFO_ENDPOINT: '/auth/me'
}

// 环境特定配置
export const ENV_CONFIG = {
  development: {
    BASE_URL: '/api/v1',
    ENABLE_LOGGING: true,
    ENABLE_MOCK: false
  },
  production: {
    BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
    ENABLE_LOGGING: false,
    ENABLE_MOCK: false
  },
  test: {
    BASE_URL: 'http://localhost:8080/api/v1',
    ENABLE_LOGGING: true,
    ENABLE_MOCK: true
  }
}

// 获取当前环境的配置
export function getCurrentEnvConfig() {
  const env = process.env.NODE_ENV || 'development'
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development
}

// 日志工具
export class ApiLogger {
  static log(message: string, data?: any) {
    const config = getCurrentEnvConfig()
    if (config.ENABLE_LOGGING) {
      console.log(`[API] ${message}`, data)
    }
  }

  static error(message: string, error?: any) {
    const config = getCurrentEnvConfig()
    if (config.ENABLE_LOGGING) {
      console.error(`[API ERROR] ${message}`, error)
    }
  }

  static warn(message: string, data?: any) {
    const config = getCurrentEnvConfig()
    if (config.ENABLE_LOGGING) {
      console.warn(`[API WARNING] ${message}`, data)
    }
  }
}

// 响应数据类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

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
      roleType: string
      permissions?: string[]
    }
    accessToken: string
    refreshToken: string
    expiresIn: number | string
  }
}

export interface RefreshTokenResponse {
  success: boolean
  data: {
    accessToken: string
    expiresIn: number
  }
}

// 请求映射工具
export class RequestMapper {
  // 将前端登录数据映射到后端格式
  static mapLoginData(data: any) {
    return {
      email: data.email || data.username, // 支持两种字段名
      password: data.password,
      rememberMe: data.rememberMe || data.remember || false,
      captcha: data.captcha,
      role: data.role || 'user'
    }
  }

  // 将后端响应映射到前端格式
  static mapLoginResponse(response: LoginResponse) {
    const { data } = response
    return {
      user: data.user,
      token: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      permissions: data.user.permissions || []
    }
  }

  // 将刷新token响应映射到前端格式
  static mapRefreshTokenResponse(response: RefreshTokenResponse) {
    const { data } = response
    return {
      token: data.accessToken,
      expiresIn: data.expiresIn
    }
  }
}

// 错误处理工具
export class ErrorHandler {
  static getErrorMessage(error: any): string {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }

    if (error?.response?.status) {
      const status = error.response.status
      switch (status) {
        case 400:
          return '请求参数错误'
        case 401:
          return '登录已过期，请重新登录'
        case 403:
          return '权限不足'
        case 404:
          return '请求的资源不存在'
        case 429:
          return '请求过于频繁，请稍后重试'
        case 500:
          return '服务器内部错误'
        case 502:
        case 503:
          return '服务暂时不可用'
        default:
          return `请求失败 (${status})`
      }
    }

    if (error?.message) {
      return error.message
    }

    return '网络错误，请检查网络连接'
  }
}

export default {
  API_CONFIG,
  ENV_CONFIG,
  getCurrentEnvConfig,
  ApiLogger,
  RequestMapper,
  ErrorHandler
}