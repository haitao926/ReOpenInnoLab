import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 创建axios实例
const createApiClient = (): AxiosInstance => {
  const baseURL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:8080/api/v1'

  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 添加认证token
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // 添加请求ID用于调试
      config.headers['X-Request-ID'] = Math.random().toString(36).substring(2)

      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      })

      return config
    },
    (error) => {
      console.error('[API Request Error]', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
      return response
    },
    async (error) => {
      console.error('[API Response Error]', error)

      // 统一错误处理
      if (error.response) {
        const { status, data } = error.response
        const errorMessage = data?.message || `请求失败 (${status})`

        // 根据状态码显示不同的错误提示
        switch (status) {
          case 401:
            // 未授权，清除token并跳转到登录页
            localStorage.removeItem('auth_token')
            window.location.href = '/login'
            break
          case 403:
            console.error('权限不足:', errorMessage)
            break
          case 404:
            console.error('资源不存在:', errorMessage)
            break
          case 500:
            console.error('服务器错误:', errorMessage)
            break
          default:
            console.error('请求错误:', errorMessage)
        }
      } else if (error.request) {
        console.error('网络错误:', error.message)
      } else {
        console.error('未知错误:', error.message)
      }

      return Promise.reject(error)
    }
  )

  return client
}

// API客户端实例
export const apiClient = createApiClient()

// 通用请求方法
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get(url, config)
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post(url, data, config)
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put(url, data, config)
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch(url, data, config)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete(url, config)
  }
}

// API工具函数
export const createApiError = (message: string, code?: string | number, details?: any) => {
  const error = new Error(message) as any
  error.code = code || 'API_ERROR'
  error.details = details
  return error
}

export const handleApiError = (error: any, fallbackMessage?: string) => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return fallbackMessage || '操作失败，请重试'
}

// 响应数据包装
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
  total?: number
  page?: number
  pageSize?: number
}

export const createApiResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message: message || '操作成功'
})

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / pageSize)

  return {
    success: true,
    data,
    message: message || '获取成功',
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

// 重试机制
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error as Error

      if (i === maxRetries) {
        throw lastError
      }

      // 指数退避延迟
      const retryDelay = delay * Math.pow(2, i)
      console.warn(`请求失败，${retryDelay}ms后重试 (${i + 1}/${maxRetries + 1})`, error.message)

      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw lastError
}

// 缓存机制
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export const withCache = <T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5分钟默认缓存时间
): Promise<T> => {
  const cached = cache.get(key)

  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`[Cache Hit] ${key}`)
    return Promise.resolve(cached.data)
  }

  console.log(`[Cache Miss] ${key}`)
  return requestFn().then(data => {
    cache.set(key, { data, timestamp: Date.now(), ttl })
    return data
  })
}

// 取消令牌管理
export class CancelTokenManager {
  private tokens = new Map<string, AbortController>()

  createToken(key: string): AbortSignal {
    // 取消之前的令牌
    this.cancelToken(key)

    const controller = new AbortController()
    this.tokens.set(key, controller)

    return controller.signal
  }

  cancelToken(key: string): void {
    const token = this.tokens.get(key)
    if (token) {
      token.abort()
      this.tokens.delete(key)
    }
  }

  cancelAllTokens(): void {
    this.tokens.forEach((token) => token.abort())
    this.tokens.clear()
  }
}

export const cancelTokenManager = new CancelTokenManager()

// 导出默认实例
export default apiClient