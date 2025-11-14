import { ref, reactive, computed } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

/**
 * 错误类型定义
 */
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  USER = 'user',
  TIMEOUT = 'timeout',
  OFFLINE = 'offline'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 错误信息接口
 */
export interface AppError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  title: string
  message: string
  details?: string
  timestamp: Date
  context?: {
    url?: string
    userId?: string
    action?: string
    data?: any
  }
  retryAction?: () => Promise<void>
  reported: boolean
  resolved: boolean
}

/**
 * 错误配置
 */
export interface ErrorHandlerConfig {
  enableNotifications: boolean
  enableLogging: boolean
  enableReporting: boolean
  maxErrors: number
  autoRetry: boolean
  retryAttempts: number
  retryDelay: number
}

/**
 * 全局错误处理器
 */
class ErrorHandlerService {
  private static instance: ErrorHandlerService
  private errors = ref<AppError[]>([])
  private config: ErrorHandlerConfig
  private retryCount = new Map<string, number>()

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService()
    }
    return ErrorHandlerService.instance
  }

  constructor() {
    this.config = reactive({
      enableNotifications: true,
      enableLogging: true,
      enableReporting: process.env.NODE_ENV === 'production',
      maxErrors: 50,
      autoRetry: true,
      retryAttempts: 3,
      retryDelay: 1000
    })

    this.setupGlobalErrorHandlers()
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    // 捕获未处理的Promise异常
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        title: '未处理的Promise异常',
        message: event.reason?.message || 'Promise执行失败',
        details: event.reason?.stack,
        context: {
          action: 'unhandledRejection',
          data: { reason: event.reason }
        }
      })
    })

    // 捕获JavaScript运行时错误
    window.addEventListener('error', (event) => {
      this.handleError({
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.HIGH,
        title: 'JavaScript运行时错误',
        message: event.message,
        details: `${event.filename}:${event.lineno}:${event.colno}`,
        context: {
          url: event.filename,
          action: 'runtimeError',
          data: { line: event.lineno, column: event.colno }
        }
      })
    })

    // 监听网络状态
    window.addEventListener('online', () => {
      this.clearErrorsByType(ErrorType.OFFLINE)
      ElMessage.success('网络已连接')
    })

    window.addEventListener('offline', () => {
      this.handleError({
        type: ErrorType.OFFLINE,
        severity: ErrorSeverity.HIGH,
        title: '网络连接断开',
        message: '请检查您的网络连接',
        context: { action: 'offline' }
      })
    })
  }

  /**
   * 处理错误
   */
  handleError(error: Partial<AppError>): string {
    const appError: AppError = {
      id: this.generateErrorId(),
      type: error.type || ErrorType.SYSTEM,
      severity: error.severity || ErrorSeverity.MEDIUM,
      title: error.title || '发生错误',
      message: error.message || '未知错误',
      details: error.details,
      timestamp: new Date(),
      context: {
        url: window.location.href,
        ...error.context
      },
      retryAction: error.retryAction,
      reported: false,
      resolved: false
    }

    // 添加到错误列表
    this.addError(appError)

    // 记录日志
    if (this.config.enableLogging) {
      this.logError(appError)
    }

    // 显示通知
    if (this.config.enableNotifications) {
      this.showErrorNotification(appError)
    }

    // 自动重试
    if (this.config.autoRetry && appError.retryAction) {
      this.autoRetry(appError)
    }

    return appError.id
  }

  /**
   * 添加错误到列表
   */
  private addError(error: AppError): void {
    this.errors.value.unshift(error)

    // 限制错误数量
    if (this.errors.value.length > this.config.maxErrors) {
      this.errors.value = this.errors.value.slice(0, this.config.maxErrors)
    }
  }

  /**
   * 记录错误日志
   */
  private logError(error: AppError): void {
    const logData = {
      id: error.id,
      type: error.type,
      severity: error.severity,
      title: error.title,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('【应用错误】', logData)
    } else {
      // 生产环境可以发送到日志服务
      console.error('应用错误:', logData)
    }
  }

  /**
   * 显示错误通知
   */
  private showErrorNotification(error: AppError): void {
    const getNotificationConfig = (error: AppError) => {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          return {
            type: 'error' as const,
            duration: 0, // 不自动关闭
            title: '严重错误',
            message: error.message
          }
        case ErrorSeverity.HIGH:
          return {
            type: 'error' as const,
            duration: 5000,
            title: '错误',
            message: error.message
          }
        case ErrorSeverity.MEDIUM:
          return {
            type: 'warning' as const,
            duration: 4000,
            title: '警告',
            message: error.message
          }
        case ErrorSeverity.LOW:
        default:
          return {
            type: 'info' as const,
            duration: 3000,
            title: '提示',
            message: error.message
          }
      }
    }

    const config = getNotificationConfig(error)

    if (error.severity === ErrorSeverity.CRITICAL) {
      ElNotification({
        ...config,
        message: `
          <div>
            <p>${config.message}</p>
            <p style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 8px;">
              错误ID: ${error.id}
            </p>
          </div>
        `,
        dangerouslyUseHTMLString: true,
        showClose: true
      })
    } else {
      ElMessage({
        ...config,
        grouping: true
      })
    }
  }

  /**
   * 自动重试
   */
  private async autoRetry(error: AppError): Promise<void> {
    if (!error.retryAction) return

    const errorKey = `${error.type}-${error.id}`
    const currentCount = this.retryCount.get(errorKey) || 0

    if (currentCount < this.config.retryAttempts) {
      this.retryCount.set(errorKey, currentCount + 1)

      setTimeout(async () => {
        try {
          ElMessage.info(`正在重试... (${currentCount + 1}/${this.config.retryAttempts})`)
          await error.retryAction!()
          this.resolveError(error.id)
          ElMessage.success('重试成功')
          this.retryCount.delete(errorKey)
        } catch (retryError) {
          if (currentCount + 1 >= this.config.retryAttempts) {
            ElMessage.error('重试失败，请手动处理')
          }
        }
      }, this.config.retryDelay * (currentCount + 1))
    }
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清除特定类型的错误
   */
  clearErrorsByType(type: ErrorType): void {
    this.errors.value = this.errors.value.filter(error => error.type !== type)
  }

  /**
   * 标记错误为已解决
   */
  resolveError(id: string): void {
    const error = this.errors.value.find(e => e.id === id)
    if (error) {
      error.resolved = true
    }
  }

  /**
   * 删除错误
   */
  removeError(id: string): void {
    const index = this.errors.value.findIndex(e => e.id === id)
    if (index !== -1) {
      this.errors.value.splice(index, 1)
    }
  }

  /**
   * 清除所有错误
   */
  clearAllErrors(): void {
    this.errors.value = []
    this.retryCount.clear()
  }

  /**
   * 报告错误
   */
  async reportError(id: string): Promise<void> {
    const error = this.errors.value.find(e => e.id === id)
    if (!error) return

    try {
      // 这里可以发送错误报告到服务器
      error.reported = true
      ElMessage.success('错误已报告')
    } catch (reportError) {
      ElMessage.error('报告失败')
    }
  }

  /**
   * 显示错误详情
   */
  showErrorDetails(id: string): void {
    const error = this.errors.value.find(e => e.id === id)
    if (!error) return

    ElMessageBox.alert(`
      <div style="text-align: left;">
        <h4>${error.title}</h4>
        <p><strong>错误信息:</strong> ${error.message}</p>
        ${error.details ? `<p><strong>详细信息:</strong><br><pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 12px;">${error.details}</pre></p>` : ''}
        <p><strong>错误类型:</strong> ${error.type}</p>
        <p><strong>严重程度:</strong> ${error.severity}</p>
        <p><strong>发生时间:</strong> ${error.timestamp.toLocaleString()}</p>
        ${error.context?.url ? `<p><strong>页面地址:</strong> ${error.context.url}</p>` : ''}
        <p><strong>错误ID:</strong> ${error.id}</p>
      </div>
    `, '错误详情', {
      dangerouslyUseHTMLString: true,
      type: error.severity === ErrorSeverity.CRITICAL ? 'error' : 'warning'
    })
  }

  /**
   * 获取错误列表
   */
  getErrors(): AppError[] {
    return this.errors.value
  }

  /**
   * 获取未解决的错误
   */
  getUnresolvedErrors(): AppError[] {
    return this.errors.value.filter(e => !e.resolved)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 获取配置
   */
  getConfig(): ErrorHandlerConfig {
    return { ...this.config }
  }
}

/**
 * 错误处理组合式API
 */
export function useErrorHandler() {
  const errorHandler = ErrorHandlerService.getInstance()

  const errors = computed(() => errorHandler.getErrors())
  const unresolvedErrors = computed(() => errorHandler.getUnresolvedErrors())
  const errorCount = computed(() => unresolvedErrors.value.length)

  const handleError = (error: Partial<AppError>) => {
    return errorHandler.handleError(error)
  }

  const resolveError = (id: string) => {
    errorHandler.resolveError(id)
  }

  const removeError = (id: string) => {
    errorHandler.removeError(id)
  }

  const clearAllErrors = () => {
    errorHandler.clearAllErrors()
  }

  const reportError = (id: string) => {
    return errorHandler.reportError(id)
  }

  const showErrorDetails = (id: string) => {
    errorHandler.showErrorDetails(id)
  }

  return {
    // 状态
    errors,
    unresolvedErrors,
    errorCount,

    // 方法
    handleError,
    resolveError,
    removeError,
    clearAllErrors,
    reportError,
    showErrorDetails,
    updateConfig: errorHandler.updateConfig.bind(errorHandler),
    getConfig: errorHandler.getConfig.bind(errorHandler)
  }
}

/**
 * 便捷错误处理函数
 */
export const createError = (
  type: ErrorType,
  title: string,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  retryAction?: () => Promise<void>
): Partial<AppError> => ({
  type,
  title,
  message,
  severity,
  retryAction
})

export const handleNetworkError = (error: any, retryAction?: () => Promise<void>) => {
  const errorHandler = ErrorHandlerService.getInstance()
  return errorHandler.handleError({
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    title: '网络错误',
    message: error.message || '网络连接失败',
    details: error.stack,
    retryAction
  })
}

export const handleApiError = (error: any, context?: any) => {
  const errorHandler = ErrorHandlerService.getInstance()
  return errorHandler.handleError({
    type: ErrorType.API,
    severity: ErrorSeverity.MEDIUM,
    title: 'API错误',
    message: error.message || 'API调用失败',
    details: error.response?.data ? JSON.stringify(error.response.data) : error.stack,
    context
  })
}

export const handleValidationError = (message: string, details?: string) => {
  const errorHandler = ErrorHandlerService.getInstance()
  return errorHandler.handleError({
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    title: '验证错误',
    message,
    details
  })
}

export { ErrorHandlerService }