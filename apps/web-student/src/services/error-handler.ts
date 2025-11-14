import { ElMessage, ElNotification } from 'element-plus'

// 错误类型定义
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

// 错误级别定义
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 标准化错误接口
export interface StandardError {
  type: ErrorType
  level: ErrorLevel
  code: string
  message: string
  details?: any
  timestamp: string
  context?: {
    userId?: string
    route?: string
    action?: string
    [key: string]: any
  }
  retryable: boolean
  fallbackAvailable: boolean
}

// 错误处理选项
export interface ErrorHandlerOptions {
  showMessage?: boolean
  showNotification?: boolean
  logToConsole?: boolean
  reportToServer?: boolean
  enableRetry?: boolean
  customMessage?: string
  customAction?: () => void
}

/**
 * 全局错误处理器
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorQueue: StandardError[] = []
  private maxQueueSize = 100

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  /**
   * 处理错误
   */
  async handleError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): Promise<StandardError> {
    const standardError = this.standardizeError(error, options)

    // 记录错误
    if (options.logToConsole !== false) {
      this.logError(standardError)
    }

    // 上报错误（如果启用）
    if (options.reportToServer && this.shouldReport(standardError)) {
      this.reportError(standardError)
    }

    // 显示用户友好的错误信息
    if (options.showMessage !== false) {
      this.showErrorMessage(standardError, options)
    }

    // 添加到错误队列
    this.addToQueue(standardError)

    // 执行自定义操作
    if (options.customAction) {
      options.customAction()
    }

    return standardError
  }

  /**
   * 标准化错误格式
   */
  private standardizeError(error: any, options: ErrorHandlerOptions): StandardError {
    const timestamp = new Date().toISOString()

    // 网络错误
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return {
        type: ErrorType.NETWORK,
        level: ErrorLevel.WARNING,
        code: 'NETWORK_001',
        message: options.customMessage || '网络连接失败，请检查网络设置',
        timestamp,
        retryable: true,
        fallbackAvailable: true,
        details: error
      }
    }

    // API错误
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 401) {
        return {
          type: ErrorType.PERMISSION,
          level: ErrorLevel.WARNING,
          code: 'AUTH_001',
          message: '登录已过期，请重新登录',
          timestamp,
          retryable: false,
          fallbackAvailable: true,
          details: data
        }
      }

      if (status === 403) {
        return {
          type: ErrorType.PERMISSION,
          level: ErrorLevel.ERROR,
          code: 'PERM_001',
          message: '权限不足，无法访问该资源',
          timestamp,
          retryable: false,
          fallbackAvailable: false,
          details: data
        }
      }

      if (status === 404) {
        return {
          type: ErrorType.API,
          level: ErrorLevel.WARNING,
          code: 'API_001',
          message: '请求的资源不存在',
          timestamp,
          retryable: false,
          fallbackAvailable: true,
          details: data
        }
      }

      if (status >= 500) {
        return {
          type: ErrorType.SYSTEM,
          level: ErrorLevel.ERROR,
          code: 'SYS_001',
          message: '服务器暂时无法响应，请稍后重试',
          timestamp,
          retryable: true,
          fallbackAvailable: true,
          details: data
        }
      }

      // 其他API错误
      return {
        type: ErrorType.API,
        level: ErrorLevel.WARNING,
        code: `API_${status}`,
        message: data?.message || `请求失败 (${status})`,
        timestamp,
        retryable: status < 500,
        fallbackAvailable: true,
        details: data
      }
    }

    // 验证错误
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return {
        type: ErrorType.VALIDATION,
        level: ErrorLevel.WARNING,
        code: 'VAL_001',
        message: '输入数据格式不正确',
        timestamp,
        retryable: false,
        fallbackAvailable: true,
        details: error
      }
    }

    // 未知错误
    return {
      type: ErrorType.UNKNOWN,
      level: ErrorLevel.ERROR,
      code: 'UNK_001',
      message: options.customMessage || '发生了未知错误，请重试',
      timestamp,
      retryable: true,
      fallbackAvailable: true,
      details: error
    }
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(error: StandardError, options: ErrorHandlerOptions) {
    if (options.showNotification && error.level === ErrorLevel.ERROR) {
      ElNotification({
        title: '错误',
        message: error.message,
        type: 'error',
        duration: 5000,
        showClose: true
      })
    } else {
      const messageType = error.level === ErrorLevel.CRITICAL ? 'error' :
                         error.level === ErrorLevel.ERROR ? 'error' :
                         error.level === ErrorLevel.WARNING ? 'warning' : 'info'

      ElMessage({
        message: error.message,
        type: messageType,
        duration: error.level === ErrorLevel.ERROR ? 5000 : 3000,
        showClose: true
      })
    }
  }

  /**
   * 记录错误到控制台
   */
  private logError(error: StandardError) {
    const logMethod = error.level === ErrorLevel.CRITICAL ? 'error' :
                     error.level === ErrorLevel.ERROR ? 'error' :
                     error.level === ErrorLevel.WARNING ? 'warn' : 'info'

    console[logMethod]('[Error Handler]', {
      type: error.type,
      code: error.code,
      message: error.message,
      details: error.details,
      context: error.context,
      timestamp: error.timestamp
    })
  }

  /**
   * 判断是否需要上报错误
   */
  private shouldReport(error: StandardError): boolean {
    // 只上报错误和严重错误
    return error.level === ErrorLevel.ERROR || error.level === ErrorLevel.CRITICAL
  }

  /**
   * 上报错误到服务器
   */
  private reportError(error: StandardError) {
    try {
      // 这里可以集成错误上报服务（如 Sentry）
      const reportData = {
        ...error,
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: new Error().stack
      }

      // 发送到错误收集服务
      fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      }).catch(() => {
        // 忽略上报失败
      })
    } catch (e) {
      // 忽略上报过程中的错误
    }
  }

  /**
   * 添加到错误队列
   */
  private addToQueue(error: StandardError) {
    this.errorQueue.push(error)
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }

  /**
   * 获取错误队列
   */
  getErrorQueue(): StandardError[] {
    return [...this.errorQueue]
  }

  /**
   * 清空错误队列
   */
  clearErrorQueue(): void {
    this.errorQueue = []
  }

  /**
   * 重试操作
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt === maxRetries) {
          throw error
        }

        const standardError = this.standardizeError(error, {})
        if (!standardError.retryable) {
          throw error
        }

        // 指数退避延迟
        const retryDelay = delay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, retryDelay))

        ElMessage.info(`操作失败，${retryDelay}ms后重试 (${attempt}/${maxRetries})`)
      }
    }

    throw lastError
  }
}

// 导出单例实例
export const errorHandler = GlobalErrorHandler.getInstance()

// 便捷的错误处理函数
export const handleError = (error: any, options?: ErrorHandlerOptions) => {
  return errorHandler.handleError(error, options)
}

export const retryOperation = <T>(
  operation: () => Promise<T>,
  maxRetries?: number,
  delay?: number
) => {
  return errorHandler.retryOperation(operation, maxRetries, delay)
}