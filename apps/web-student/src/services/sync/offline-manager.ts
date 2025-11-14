// ===================
// 离线管理器
// ===================

/**
 * 离线数据管理器
 * 处理离线状态下的数据存储和同步
 */
export class OfflineManager {
  private static instance: OfflineManager
  private storageKey = 'reopeninnolab_offline_data'
  private isOnline = navigator.onLine
  private pendingSync: any[] = []

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }

  constructor() {
    this.init()
  }

  /**
   * 初始化离线管理器
   */
  private init(): void {
    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // 加载待同步数据
    this.loadPendingSync()

    // 检查网络状态
    this.checkNetworkStatus()
  }

  /**
   * 检查是否在线
   */
  getIsOnline(): boolean {
    return this.isOnline
  }

  /**
   * 存储数据到本地
   */
  async storeData(key: string, data: any): Promise<void> {
    try {
      const storageData = this.getStorageData()
      storageData[key] = {
        data,
        timestamp: Date.now(),
        version: this.generateVersion()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(storageData))
    } catch (error) {
      console.error('Failed to store offline data:', error)
      throw error
    }
  }

  /**
   * 从本地获取数据
   */
  async getData(key: string): Promise<any | null> {
    try {
      const storageData = this.getStorageData()
      const item = storageData[key]

      if (!item) {
        return null
      }

      // 检查数据是否过期（7天）
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天
      if (Date.now() - item.timestamp > maxAge) {
        this.removeData(key)
        return null
      }

      return item.data
    } catch (error) {
      console.error('Failed to get offline data:', error)
      return null
    }
  }

  /**
   * 删除本地数据
   */
  async removeData(key: string): Promise<void> {
    try {
      const storageData = this.getStorageData()
      delete storageData[key]
      localStorage.setItem(this.storageKey, JSON.stringify(storageData))
    } catch (error) {
      console.error('Failed to remove offline data:', error)
    }
  }

  /**
   * 添加待同步数据
   */
  async addPendingSync(action: any): Promise<void> {
    this.pendingSync.push({
      ...action,
      id: this.generateId(),
      timestamp: Date.now()
    })

    await this.savePendingSync()

    // 如果在线，立即尝试同步
    if (this.isOnline) {
      this.syncPendingData()
    }
  }

  /**
   * 获取待同步数据
   */
  getPendingSync(): any[] {
    return [...this.pendingSync]
  }

  /**
   * 清空已同步的数据
   */
  async clearSyncedData(syncIds: string[]): Promise<void> {
    this.pendingSync = this.pendingSync.filter(item => !syncIds.includes(item.id))
    await this.savePendingSync()
  }

  /**
   * 强制同步所有待同步数据
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    await this.syncPendingData()
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<void> {
    try {
      const storageData = this.getStorageData()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天
      const now = Date.now()

      // 清理过期数据
      for (const key in storageData) {
        if (now - storageData[key].timestamp > maxAge) {
          delete storageData[key]
        }
      }

      // 清理过期的待同步数据（超过30天）
      this.pendingSync = this.pendingSync.filter(item =>
        now - item.timestamp < 30 * 24 * 60 * 60 * 1000
      )

      localStorage.setItem(this.storageKey, JSON.stringify(storageData))
      await this.savePendingSync()

    } catch (error) {
      console.error('Failed to cleanup offline data:', error)
    }
  }

  // 私有方法

  private getStorageData(): any {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to parse storage data:', error)
      return {}
    }
  }

  private loadPendingSync(): void {
    try {
      const data = localStorage.getItem(`${this.storageKey}_pending`)
      this.pendingSync = data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load pending sync:', error)
      this.pendingSync = []
    }
  }

  private async savePendingSync(): Promise<void> {
    try {
      localStorage.setItem(`${this.storageKey}_pending`, JSON.stringify(this.pendingSync))
    } catch (error) {
      console.error('Failed to save pending sync:', error)
    }
  }

  private async syncPendingData(): Promise<void> {
    if (this.pendingSync.length === 0) {
      return
    }

    const syncIds: string[] = []
    const errors: any[] = []

    for (const item of this.pendingSync) {
      try {
        await this.performSync(item)
        syncIds.push(item.id)
      } catch (error) {
        console.error('Sync failed for item:', item, error)
        errors.push({ item, error })
      }
    }

    // 清理成功同步的数据
    if (syncIds.length > 0) {
      await this.clearSyncedData(syncIds)
    }

    // 如果有错误，可以考虑重试或通知用户
    if (errors.length > 0) {
      console.warn(`${errors.length} items failed to sync`)
    }
  }

  private async performSync(item: any): Promise<void> {
    // 这里应该调用实际的API进行同步
    console.log('Syncing item:', item)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟偶发失败
    if (Math.random() < 0.1) {
      throw new Error('Simulated sync failure')
    }
  }

  private handleOnline(): void {
    this.isOnline = true
    console.log('Network is online')
    this.syncPendingData()

    // 触发在线事件
    this.dispatchCustomEvent('online')
  }

  private handleOffline(): void {
    this.isOnline = false
    console.log('Network is offline')

    // 触发离线事件
    this.dispatchCustomEvent('offline')
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      // 尝试访问一个可靠的端点来检查网络状态
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })

      this.isOnline = true
    } catch (error) {
      this.isOnline = false
    }
  }

  private dispatchCustomEvent(type: string): void {
    const event = new CustomEvent(`offline-manager:${type}`, {
      detail: { isOnline: this.isOnline }
    })
    window.dispatchEvent(event)
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateVersion(): string {
    return `v${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
}

// 导出单例实例
export const offlineManager = OfflineManager.getInstance()