// 同步服务模块导出
export { SyncManager, syncManager, type SyncTask, type SyncResult, type SyncStatus, type SyncCallback } from './sync-manager'
export { OfflineManager, offlineManager } from './offline-manager'

import { SyncManager as SyncManagerClass } from './sync-manager'
import { OfflineManager as OfflineManagerClass, offlineManager } from './offline-manager'

// 统一的同步服务接口
export class SyncService {
  private syncManager = SyncManagerClass.getInstance()
  private offlineManager = offlineManager || new OfflineManagerClass()

  /**
   * 同步课程数据
   */
  async syncCourse(courseId: string, data?: any): Promise<void> {
    const task = {
      type: 'course' as const,
      entityId: courseId,
      action: data ? 'update' as const : 'fetch' as const,
      data,
      priority: 'high' as const
    }

    await this.syncManager.addTask(task)
  }

  /**
   * 同步章节数据
   */
  async syncChapter(courseId: string, chapterId: string, data?: any): Promise<void> {
    const task = {
      type: 'chapter' as const,
      entityId: `${courseId}:${chapterId}`,
      action: data ? 'update' as const : 'fetch' as const,
      data,
      priority: 'medium' as const
    }

    await this.syncManager.addTask(task)
  }

  /**
   * 同步活动数据
   */
  async syncActivity(courseId: string, chapterId: string, activityId: string, data?: any): Promise<void> {
    const task = {
      type: 'activity' as const,
      entityId: `${courseId}:${chapterId}:${activityId}`,
      action: data ? 'update' as const : 'fetch' as const,
      data,
      priority: 'medium' as const
    }

    await this.syncManager.addTask(task)
  }

  /**
   * 同步进度数据
   */
  async syncProgress(entityId: string, progress: number, data?: any): Promise<void> {
    const syncData = {
      progress,
      timestamp: Date.now(),
      ...data
    }

    // 如果离线，存储到本地
    if (!this.offlineManager.getIsOnline()) {
      await this.offlineManager.addPendingSync({
        type: 'progress',
        entityId,
        action: 'update',
        data: syncData
      })
      return
    }

    const task = {
      type: 'progress' as const,
      entityId,
      action: 'update' as const,
      data: syncData,
      priority: 'high' as const
    }

    await this.syncManager.addTask(task)
  }

  /**
   * 订阅数据更新
   */
  subscribe(entityType: string, entityId: string, callback: (result: any) => void): () => void {
    return this.syncManager.subscribe(entityType, entityId, callback)
  }

  /**
   * 强制同步
   */
  async forceSync(entityType: string, entityId: string): Promise<any> {
    return this.syncManager.forceSync(entityType, entityId)
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return this.syncManager.getSyncStatus()
  }

  /**
   * 获取离线状态
   */
  isOnline(): boolean {
    return this.offlineManager.getIsOnline()
  }

  /**
   * 存储离线数据
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    return this.offlineManager.storeData(key, data)
  }

  /**
   * 获取离线数据
   */
  async getOfflineData(key: string): Promise<any> {
    return this.offlineManager.getData(key)
  }

  /**
   * 同步所有待同步数据
   */
  async syncAll(): Promise<void> {
    await this.offlineManager.syncAll()
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<void> {
    await this.offlineManager.cleanup()
  }
}

// 导出服务实例
export const syncService = new SyncService()