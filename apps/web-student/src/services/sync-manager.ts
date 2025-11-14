import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { errorHandler, retryOperation } from './error-handler'

// 同步状态
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  OFFLINE = 'offline'
}

// 同步任务类型
export interface SyncTask {
  id: string
  type: 'course' | 'chapter' | 'progress' | 'activity' | 'user'
  action: 'create' | 'update' | 'delete'
  data: any
  priority: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  retryCount: number
  maxRetries: number
  status: SyncStatus
  error?: string
}

/**
 * 数据同步管理器
 * 用于处理离线数据同步和错误恢复
 */
export class SyncManager {
  private static instance: SyncManager
  private syncQueue: SyncTask[] = []
  private isOnline = navigator.onLine
  private syncInProgress = false
  private syncInterval: number | null = null

  // 响应式状态
  private _syncStatus = ref<SyncStatus>(SyncStatus.IDLE)
  private _lastSyncTime = ref<number>(0)
  private _pendingCount = ref<number>(0)

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  constructor() {
    this.init()
  }

  private init() {
    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // 启动定期同步
    this.startPeriodicSync()

    // 从localStorage恢复同步队列
    this.restoreSyncQueue()
  }

  // 公开的响应式状态
  get syncStatus() {
    return computed(() => this._syncStatus.value)
  }

  get lastSyncTime() {
    return computed(() => this._lastSyncTime.value)
  }

  get pendingCount() {
    return computed(() => this._pendingCount.value)
  }

  /**
   * 添加同步任务
   */
  addTask(task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount' | 'maxRetries' | 'status'>): string {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateTaskId(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: task.priority === 'critical' ? 5 : 3,
      status: this.isOnline ? SyncStatus.SYNCING : SyncStatus.OFFLINE
    }

    // 按优先级插入
    this.insertTaskByPriority(syncTask)

    // 保存到localStorage
    this.saveSyncQueue()

    // 更新待处理计数
    this.updatePendingCount()

    // 如果在线且当前没有同步进行中，立即处理
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue()
    }

    return syncTask.id
  }

  /**
   * 立即同步所有待处理任务
   */
  async syncNow(): Promise<boolean> {
    if (!this.isOnline) {
      ElMessage.warning('当前离线，无法同步数据')
      return false
    }

    if (this.syncInProgress) {
      ElMessage.info('正在同步中，请稍候')
      return false
    }

    return await this.processSyncQueue()
  }

  /**
   * 清空同步队列
   */
  clearQueue(): void {
    this.syncQueue = []
    this.saveSyncQueue()
    this.updatePendingCount()
    ElMessage.success('同步队列已清空')
  }

  /**
   * 获取同步队列状态
   */
  getQueueStatus(): {
    total: number
    byStatus: Record<SyncStatus, number>
    byType: Record<string, number>
    byPriority: Record<string, number>
  } {
    const byStatus = {
      [SyncStatus.IDLE]: 0,
      [SyncStatus.SYNCING]: 0,
      [SyncStatus.SUCCESS]: 0,
      [SyncStatus.ERROR]: 0,
      [SyncStatus.OFFLINE]: 0
    }

    const byType: Record<string, number> = {}
    const byPriority: Record<string, number> = {}

    this.syncQueue.forEach(task => {
      byStatus[task.status]++
      byType[task.type] = (byType[task.type] || 0) + 1
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
    })

    return {
      total: this.syncQueue.length,
      byStatus,
      byType,
      byPriority
    }
  }

  /**
   * 处理同步队列
   */
  private async processSyncQueue(): Promise<boolean> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return true
    }

    this.syncInProgress = true
    this._syncStatus.value = SyncStatus.SYNCING

    try {
      const tasksToProcess = this.syncQueue.filter(task =>
        task.status === SyncStatus.SYNCING || task.status === SyncStatus.ERROR
      )

      for (const task of tasksToProcess) {
        await this.processTask(task)
      }

      // 清理已完成的任务
      this.cleanupCompletedTasks()

      this._lastSyncTime.value = Date.now()
      this._syncStatus.value = SyncStatus.SUCCESS

      return true
    } catch (error) {
      console.error('同步失败:', error)
      this._syncStatus.value = SyncStatus.ERROR
      return false
    } finally {
      this.syncInProgress = false
      this.saveSyncQueue()
      this.updatePendingCount()
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: SyncTask): Promise<void> {
    try {
      await this.executeTask(task)
      task.status = SyncStatus.SUCCESS
    } catch (error) {
      task.retryCount++
      task.error = error instanceof Error ? error.message : String(error)

      if (task.retryCount >= task.maxRetries) {
        task.status = SyncStatus.ERROR
        await errorHandler.handleError(error, {
          showMessage: true,
          customMessage: `同步失败: ${task.type} ${task.action}`,
          reportToServer: true
        })
      } else {
        task.status = SyncStatus.SYNCING
      }
    }
  }

  /**
   * 执行具体的同步任务
   */
  private async executeTask(task: SyncTask): Promise<void> {
    const apiMap = {
      course: () => this.syncCourse(task),
      chapter: () => this.syncChapter(task),
      progress: () => this.syncProgress(task),
      activity: () => this.syncActivity(task),
      user: () => this.syncUser(task)
    }

    const syncFunction = apiMap[task.type]
    if (!syncFunction) {
      throw new Error(`未知的同步任务类型: ${task.type}`)
    }

    await retryOperation(syncFunction, task.maxRetries, 1000)
  }

  // 各种类型的同步方法
  private async syncCourse(task: SyncTask): Promise<void> {
    // 实现课程同步逻辑
    console.log('同步课程数据:', task.data)
  }

  private async syncChapter(task: SyncTask): Promise<void> {
    // 实现章节同步逻辑
    console.log('同步章节数据:', task.data)
  }

  private async syncProgress(task: SyncTask): Promise<void> {
    // 实现进度同步逻辑
    console.log('同步进度数据:', task.data)
  }

  private async syncActivity(task: SyncTask): Promise<void> {
    // 实现活动同步逻辑
    console.log('同步活动数据:', task.data)
  }

  private async syncUser(task: SyncTask): Promise<void> {
    // 实现用户同步逻辑
    console.log('同步用户数据:', task.data)
  }

  /**
   * 按优先级插入任务
   */
  private insertTaskByPriority(task: SyncTask): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const taskPriority = priorityOrder[task.priority]

    let insertIndex = this.syncQueue.length
    for (let i = 0; i < this.syncQueue.length; i++) {
      const existingPriority = priorityOrder[this.syncQueue[i].priority]
      if (taskPriority < existingPriority) {
        insertIndex = i
        break
      }
    }

    this.syncQueue.splice(insertIndex, 0, task)
  }

  /**
   * 清理已完成的任务
   */
  private cleanupCompletedTasks(): void {
    const now = Date.now()
    this.syncQueue = this.syncQueue.filter(task => {
      // 保留最近1小时内的成功任务，以便调试
      if (task.status === SyncStatus.SUCCESS) {
        return now - task.timestamp < 60 * 60 * 1000
      }
      // 保留错误和离线任务
      return task.status !== SyncStatus.SUCCESS
    })
  }

  /**
   * 更新待处理计数
   */
  private updatePendingCount(): void {
    this._pendingCount.value = this.syncQueue.filter(task =>
      task.status === SyncStatus.SYNCING ||
      task.status === SyncStatus.ERROR ||
      task.status === SyncStatus.OFFLINE
    ).length
  }

  /**
   * 启动定期同步
   */
  private startPeriodicSync(): void {
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
        this.processSyncQueue()
      }
    }, 30000) // 每30秒检查一次
  }

  /**
   * 处理网络连接
   */
  private handleOnline(): void {
    this.isOnline = true
    ElMessage.success('网络已连接')

    // 网络恢复时立即同步
    if (this.syncQueue.length > 0) {
      this.syncQueue.forEach(task => {
        if (task.status === SyncStatus.OFFLINE) {
          task.status = SyncStatus.SYNCING
        }
      })
      this.processSyncQueue()
    }
  }

  private handleOffline(): void {
    this.isOnline = false
    this._syncStatus.value = SyncStatus.OFFLINE
    ElMessage.warning('网络连接已断开，数据将在恢复后同步')

    // 将进行中的任务标记为离线
    this.syncQueue.forEach(task => {
      if (task.status === SyncStatus.SYNCING) {
        task.status = SyncStatus.OFFLINE
      }
    })
  }

  /**
   * 保存同步队列到localStorage
   */
  private saveSyncQueue(): void {
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('保存同步队列失败:', error)
    }
  }

  /**
   * 从localStorage恢复同步队列
   */
  private restoreSyncQueue(): void {
    try {
      const saved = localStorage.getItem('sync_queue')
      if (saved) {
        this.syncQueue = JSON.parse(saved)
        this.updatePendingCount()
      }
    } catch (error) {
      console.error('恢复同步队列失败:', error)
      this.syncQueue = []
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 销毁同步管理器
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
  }
}

// 导出单例实例
export const syncManager = SyncManager.getInstance()