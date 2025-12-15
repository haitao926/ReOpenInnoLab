/**
 * 共享工具库 - 主入口
 */

// 日期工具
export * from './date'

// WebSocket 实用工具
export * from './websocket/types'
export { lessonSocket, LessonSocketService, type LessonRole } from './websocket/lessonSocket'

// 类型定义
export interface BaseResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 常量
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// 通用工具函数
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
