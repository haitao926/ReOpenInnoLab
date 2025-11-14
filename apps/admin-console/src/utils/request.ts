import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:8080/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    // Add request timestamp for monitoring
    config.metadata = { startTime: new Date() }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log API call duration for monitoring
    const endTime = new Date()
    const duration = endTime.getTime() - response.config.metadata.startTime.getTime()

    if (duration > 5000) {
      console.warn(`Slow API call: ${response.config.url} took ${duration}ms`)
    }

    return response
  },
  async (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        const refreshed = await authStore.refreshToken()
        if (refreshed && error.config) {
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${authStore.token}`
          return api.request(error.config)
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        authStore.clearAuth()
        window.location.href = '/login'
      }
    }

    if (error.response?.status === 403) {
      ElMessage.error('您没有权限执行此操作')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }

    return Promise.reject(error)
  }
)

// Add metadata type to axios config
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

export { api }