import { ref, reactive, computed } from 'vue'

/**
 * 加载任务类型
 */
export interface LoadingTask {
  id: string
  name: string
  description?: string
  progress: number
  total?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  error?: string
  cancelable: boolean
  onCancel?: () => void
  retryable?: boolean
  onRetry?: () => Promise<void>
  category?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 加载配置
 */
export interface LoadingConfig {
  enableProgress: boolean
  enableTimeout: boolean
  timeoutMs: number
  maxConcurrentTasks: number
  enableAutoRetry: boolean
  maxRetries: number
}

/**
 * 全局加载管理器
 */
class LoadingManagerService {
  private static instance: LoadingManagerService
  private tasks = ref<LoadingTask[]>([])
  private config: LoadingConfig
  private globalLoading = ref(false)
  private globalProgress = ref(0)
  private globalMessage = ref('')

  public static getInstance(): LoadingManagerService {
    if (!LoadingManagerService.instance) {
      LoadingManagerService.instance = new LoadingManagerService()
    }
    return LoadingManagerService.instance
  }

  constructor() {
    this.config = reactive({
      enableProgress: true,
      enableTimeout: true,
      timeoutMs: 30000, // 30秒超时
      maxConcurrentTasks: 5,
      enableAutoRetry: false,
      maxRetries: 3
    })

    this.updateGlobalState()
  }

  /**
   * 创建加载任务
   */
  createTask(options: Partial<LoadingTask>): string {
    const task: LoadingTask = {
      id: this.generateTaskId(),
      name: options.name || '加载中...',
      description: options.description,
      progress: 0,
      total: options.total,
      status: 'pending',
      startTime: new Date(),
      cancelable: options.cancelable !== false,
      onCancel: options.onCancel,
      retryable: options.retryable || false,
      onRetry: options.onRetry,
      category: options.category || 'default',
      priority: options.priority || 'medium',
      ...options
    }

    // 检查并发任务限制
    const runningTasks = this.tasks.value.filter(t => t.status === 'running')
    if (runningTasks.length >= this.config.maxConcurrentTasks) {
      // 取消最低优先级的任务
      const lowestPriorityTask = runningTasks
        .filter(t => t.cancelable)
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })[0]

      if (lowestPriorityTask) {
        this.cancelTask(lowestPriorityTask.id)
      }
    }

    this.tasks.value.push(task)

    // 设置超时
    if (this.config.enableTimeout) {
      setTimeout(() => {
        if (task.status === 'running') {
          this.failTask(task.id, '任务超时')
        }
      }, this.config.timeoutMs)
    }

    this.updateGlobalState()
    return task.id
  }

  /**
   * 开始任务
   */
  startTask(id: string): void {
    const task = this.findTask(id)
    if (task && task.status === 'pending') {
      task.status = 'running'
      task.startTime = new Date()
      this.updateGlobalState()
    }
  }

  /**
   * 更新任务进度
   */
  updateProgress(id: string, progress: number, current?: number, total?: number): void {
    const task = this.findTask(id)
    if (task) {
      task.progress = Math.max(0, Math.min(100, progress))
      if (current !== undefined) task.progress = current
      if (total !== undefined) task.total = total

      if (task.total && task.total > 0) {
        task.progress = Math.round((task.progress / task.total) * 100)
      }

      this.updateGlobalState()
    }
  }

  /**
   * 更新任务描述
   */
  updateDescription(id: string, description: string): void {
    const task = this.findTask(id)
    if (task) {
      task.description = description
    }
  }

  /**
   * 完成任务
   */
  completeTask(id: string): void {
    const task = this.findTask(id)
    if (task) {
      task.status = 'completed'
      task.progress = 100
      task.endTime = new Date()
      this.updateGlobalState()

      // 延迟移除已完成的任务
      setTimeout(() => {
        this.removeTask(id)
      }, 2000)
    }
  }

  /**
   * 任务失败
   */
  failTask(id: string, error: string): void {
    const task = this.findTask(id)
    if (task) {
      task.status = 'failed'
      task.error = error
      task.endTime = new Date()
      this.updateGlobalState()
    }
  }

  /**
   * 取消任务
   */
  cancelTask(id: string): void {
    const task = this.findTask(id)
    if (task && task.cancelable) {
      task.status = 'cancelled'
      task.endTime = new Date()
      if (task.onCancel) {
        task.onCancel()
      }
      this.updateGlobalState()

      // 延迟移除已取消的任务
      setTimeout(() => {
        this.removeTask(id)
      }, 1000)
    }
  }

  /**
   * 重试任务
   */
  async retryTask(id: string): Promise<void> {
    const task = this.findTask(id)
    if (task && task.retryable && task.onRetry) {
      task.status = 'pending'
      task.progress = 0
      task.error = undefined
      task.startTime = new Date()
      task.endTime = undefined

      try {
        this.startTask(id)
        await task.onRetry()
        this.completeTask(id)
      } catch (error) {
        this.failTask(id, error instanceof Error ? error.message : '重试失败')
      }
    }
  }

  /**
   * 移除任务
   */
  removeTask(id: string): void {
    const index = this.tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      this.tasks.value.splice(index, 1)
      this.updateGlobalState()
    }
  }

  /**
   * 清除所有任务
   */
  clearAllTasks(): void {
    this.tasks.value = []
    this.updateGlobalState()
  }

  /**
   * 清除已完成的任务
   */
  clearCompletedTasks(): void {
    this.tasks.value = this.tasks.value.filter(t =>
      t.status !== 'completed' && t.status !== 'cancelled'
    )
    this.updateGlobalState()
  }

  /**
   * 获取任务
   */
  findTask(id: string): LoadingTask | undefined {
    return this.tasks.value.find(t => t.id === id)
  }

  /**
   * 获取运行中的任务
   */
  getRunningTasks(): LoadingTask[] {
    return this.tasks.value.filter(t => t.status === 'running')
  }

  /**
   * 获取失败的任务
   */
  getFailedTasks(): LoadingTask[] {
    return this.tasks.value.filter(t => t.status === 'failed')
  }

  /**
   * 获取特定类别的任务
   */
  getTasksByCategory(category: string): LoadingTask[] {
    return this.tasks.value.filter(t => t.category === category)
  }

  /**
   * 更新全局状态
   */
  private updateGlobalState(): void {
    const runningTasks = this.getRunningTasks()
    const totalTasks = this.tasks.value.filter(t =>
      t.status === 'running' || t.status === 'pending'
    )

    this.globalLoading.value = runningTasks.length > 0

    if (runningTasks.length > 0 && this.config.enableProgress) {
      // 计算总体进度
      const totalProgress = runningTasks.reduce((sum, task) => {
        return sum + (task.total ? (task.progress / task.total) : task.progress / 100)
      }, 0)
      this.globalProgress.value = Math.round((totalProgress / runningTasks.length) * 100)

      // 设置全局消息
      if (runningTasks.length === 1) {
        const task = runningTasks[0]
        this.globalMessage.value = task.description || task.name
      } else {
        this.globalMessage.value = `正在执行 ${runningTasks.length} 个任务`
      }
    } else {
      this.globalProgress.value = 0
      this.globalMessage.value = ''
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取任务列表
   */
  getTasks(): LoadingTask[] {
    return this.tasks.value
  }

  /**
   * 获取全局加载状态
   */
  getGlobalLoading() {
    return {
      loading: this.globalLoading,
      progress: this.globalProgress,
      message: this.globalMessage
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoadingConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 获取配置
   */
  getConfig(): LoadingConfig {
    return { ...this.config }
  }

  /**
   * 创建包装器函数
   */
  async wrapAsync<T>(
    name: string,
    asyncFn: () => Promise<T>,
    options: Partial<LoadingTask> = {}
  ): Promise<T> {
    const taskId = this.createTask({
      name,
      ...options
    })

    try {
      this.startTask(taskId)
      const result = await asyncFn()
      this.completeTask(taskId)
      return result
    } catch (error) {
      this.failTask(taskId, error instanceof Error ? error.message : '执行失败')
      throw error
    }
  }

  /**
   * 批量执行任务
   */
  async batchExecute<T>(
    tasks: Array<{
      name: string
      fn: () => Promise<T>
      options?: Partial<LoadingTask>
    }>
  ): Promise<T[]> {
    const batchId = this.createTask({
      name: `批量执行 (${tasks.length} 个任务)`,
      total: tasks.length,
      category: 'batch'
    })

    try {
      const results: T[] = []

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        this.updateProgress(batchId, i, undefined, tasks.length)
        this.updateDescription(batchId, `执行: ${task.name}`)

        const result = await this.wrapAsync(task.name, task.fn, {
          ...task.options,
          category: 'batch-item'
        })

        results.push(result)
      }

      this.updateProgress(batchId, tasks.length)
      this.completeTask(batchId)
      return results
    } catch (error) {
      this.failTask(batchId, error instanceof Error ? error.message : '批量执行失败')
      throw error
    }
  }
}

/**
 * 加载管理组合式API
 */
export function useLoadingManager() {
  const loadingManager = LoadingManagerService.getInstance()

  const tasks = computed(() => loadingManager.getTasks())
  const runningTasks = computed(() => loadingManager.getRunningTasks())
  const failedTasks = computed(() => loadingManager.getFailedTasks())
  const globalLoading = computed(() => loadingManager.getGlobalLoading())

  const createTask = (options: Partial<LoadingTask>) => {
    return loadingManager.createTask(options)
  }

  const startTask = (id: string) => {
    loadingManager.startTask(id)
  }

  const updateProgress = (id: string, progress: number, current?: number, total?: number) => {
    loadingManager.updateProgress(id, progress, current, total)
  }

  const completeTask = (id: string) => {
    loadingManager.completeTask(id)
  }

  const failTask = (id: string, error: string) => {
    loadingManager.failTask(id, error)
  }

  const cancelTask = (id: string) => {
    loadingManager.cancelTask(id)
  }

  const retryTask = (id: string) => {
    return loadingManager.retryTask(id)
  }

  const removeTask = (id: string) => {
    loadingManager.removeTask(id)
  }

  const clearAllTasks = () => {
    loadingManager.clearAllTasks()
  }

  const clearCompletedTasks = () => {
    loadingManager.clearCompletedTasks()
  }

  const wrapAsync = <T>(name: string, asyncFn: () => Promise<T>, options?: Partial<LoadingTask>) => {
    return loadingManager.wrapAsync(name, asyncFn, options)
  }

  return {
    // 状态
    tasks,
    runningTasks,
    failedTasks,
    globalLoading,

    // 方法
    createTask,
    startTask,
    updateProgress,
    completeTask,
    failTask,
    cancelTask,
    retryTask,
    removeTask,
    clearAllTasks,
    clearCompletedTasks,
    wrapAsync,
    updateConfig: loadingManager.updateConfig.bind(loadingManager),
    getConfig: loadingManager.getConfig.bind(loadingManager)
  }
}

export { LoadingManagerService }