// ===================
// 同步管理器
// ===================

/**
 * 通用同步管理器
 * 处理客户端与服务器之间的数据同步
 */
export class SyncManager {
  private static instance: SyncManager
  private syncQueue: SyncTask[] = []
  private processing = false
  private subscribers = new Map<string, Set<SyncCallback>>()
  private retryCount = new Map<string, number>()
  private maxRetries = 3

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * 添加同步任务
   */
  async addTask(task: SyncTask): Promise<void> {
    // 检查是否已有相同的任务在队列中
    const existingIndex = this.syncQueue.findIndex(t =>
      t.type === task.type &&
      t.entityId === task.entityId &&
      t.action === task.action
    )

    if (existingIndex >= 0) {
      // 合并任务数据
      this.syncQueue[existingIndex] = { ...this.syncQueue[existingIndex], ...task }
    } else {
      // 添加新任务
      this.syncQueue.push({
        ...task,
        id: this.generateTaskId(),
        timestamp: Date.now(),
        status: 'pending'
      })
    }

    // 立即处理队列
    this.processQueue()
  }

  /**
   * 订阅同步事件
   */
  subscribe(entityType: string, entityId: string, callback: SyncCallback): () => void {
    const key = `${entityType}:${entityId}`
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }

    this.subscribers.get(key)!.add(callback)

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(key)
        }
      }
    }
  }

  /**
   * 强制同步实体
   */
  async forceSync(entityType: string, entityId: string): Promise<any> {
    const task: SyncTask = {
      id: this.generateTaskId(),
      type: entityType as any,
      entityId,
      action: 'fetch',
      priority: 'high',
      timestamp: Date.now(),
      status: 'pending'
    }

    return new Promise((resolve, reject) => {
      // 临时订阅解决Promise
      const unsubscribe = this.subscribe(entityType, entityId, (result) => {
        unsubscribe()
        if (result.success) {
          resolve(result.data)
        } else {
          reject(new Error(result.error))
        }
      })

      this.addTask(task)
    })
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return {
      queueLength: this.syncQueue.length,
      processing: this.processing,
      pendingTasks: this.syncQueue.filter(t => t.status === 'pending').length,
      failedTasks: this.syncQueue.filter(t => t.status === 'failed').length
    }
  }

  // 私有方法

  private async processQueue(): Promise<void> {
    if (this.processing || this.syncQueue.length === 0) {
      return
    }

    this.processing = true

    try {
      // 按优先级排序
      this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      })

      // 处理队列中的任务
      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift()!
        await this.processTask(task)
      }
    } catch (error) {
      console.error('Error processing sync queue:', error)
    } finally {
      this.processing = false
    }
  }

  private async processTask(task: SyncTask): Promise<void> {
    try {
      task.status = 'processing'

      let result: any

      switch (task.action) {
        case 'create':
          result = await this.handleCreate(task)
          break
        case 'update':
          result = await this.handleUpdate(task)
          break
        case 'delete':
          result = await this.handleDelete(task)
          break
        case 'fetch':
          result = await this.handleFetch(task)
          break
        default:
          throw new Error(`Unknown sync action: ${task.action}`)
      }

      task.status = 'completed'
      this.notifySubscribers(task, { success: true, data: result })

      // 清除重试计数
      this.retryCount.delete(task.id)

    } catch (error) {
      console.error(`Sync task failed:`, task, error)
      task.status = 'failed'

      // 检查是否需要重试
      const retryCount = this.retryCount.get(task.id) || 0
      if (retryCount < this.maxRetries) {
        this.retryCount.set(task.id, retryCount + 1)
        task.status = 'pending'
        this.syncQueue.push(task) // 重新加入队列

        // 延迟重试
        setTimeout(() => {
          this.processQueue()
        }, Math.pow(2, retryCount) * 1000) // 指数退避
      } else {
        // 达到最大重试次数，通知失败
        this.notifySubscribers(task, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        this.retryCount.delete(task.id)
      }
    }
  }

  private async handleCreate(task: SyncTask): Promise<any> {
    console.log('Creating:', task.type, task.entityId, task.data)
    // 实际实现中这里会调用API
    await this.simulateApiCall()
    return { id: task.entityId, ...task.data }
  }

  private async handleUpdate(task: SyncTask): Promise<any> {
    console.log('Updating:', task.type, task.entityId, task.data)
    // 实际实现中这里会调用API
    await this.simulateApiCall()
    return { id: task.entityId, ...task.data }
  }

  private async handleDelete(task: SyncTask): Promise<any> {
    console.log('Deleting:', task.type, task.entityId)
    // 实际实现中这里会调用API
    await this.simulateApiCall()
    return { deleted: true }
  }

  private async handleFetch(task: SyncTask): Promise<any> {
    console.log('Fetching:', task.type, task.entityId)
    // 实际实现中这里会调用API
    await this.simulateApiCall()
    return { id: task.entityId, data: 'mock_data' }
  }

  private async simulateApiCall(): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))

    // 模拟偶发失败
    if (Math.random() < 0.1) { // 10%失败率
      throw new Error('Simulated API failure')
    }
  }

  private notifySubscribers(task: SyncTask, result: SyncResult): void {
    const key = `${task.type}:${task.entityId}`
    const callbacks = this.subscribers.get(key)

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(result)
        } catch (error) {
          console.error('Error in sync callback:', error)
        }
      })
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ===================
// 类型定义
// ===================

export interface SyncTask {
  id: string
  type: 'course' | 'chapter' | 'activity' | 'progress' | 'user'
  entityId: string
  action: 'create' | 'update' | 'delete' | 'fetch'
  data?: any
  priority?: 'high' | 'medium' | 'low'
  timestamp: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  retryCount?: number
}

export interface SyncResult {
  success: boolean
  data?: any
  error?: string
}

export interface SyncStatus {
  queueLength: number
  processing: boolean
  pendingTasks: number
  failedTasks: number
}

export type SyncCallback = (result: SyncResult) => void

// 导出单例实例
export const syncManager = SyncManager.getInstance()