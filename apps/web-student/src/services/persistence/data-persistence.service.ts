import { ref, reactive } from 'vue'

/**
 * 数据持久化策略
 */
export enum PersistenceStrategy {
  LOCAL_STORAGE = 'localStorage',
  INDEXED_DB = 'indexedDB',
  SESSION_STORAGE = 'sessionStorage',
  MEMORY = 'memory'
}

/**
 * 数据过期策略
 */
export enum ExpiryStrategy {
  NEVER = 'never',
  ON_RESTART = 'on_restart',
  TIME_BASED = 'time_based',
  ON_VERSION_CHANGE = 'on_version_change'
}

/**
 * 持久化配置
 */
export interface PersistenceConfig {
  strategy: PersistenceStrategy
  expiry?: ExpiryStrategy
  expiryTime?: number // 毫秒
  version?: string
  encrypt?: boolean
  compress?: boolean
}

/**
 * 持久化数据项
 */
export interface PersistentDataItem<T = any> {
  key: string
  data: T
  timestamp: number
  expiry?: number
  version: string
  metadata?: Record<string, any>
}

/**
 * 数据持久化服务
 */
class DataPersistenceService {
  private static instance: DataPersistenceService
  private memoryStorage = new Map<string, PersistentDataItem>()
  private dbName = 'ReOpenInnoLabDB'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  public static getInstance(): DataPersistenceService {
    if (!DataPersistenceService.instance) {
      DataPersistenceService.instance = new DataPersistenceService()
    }
    return DataPersistenceService.instance
  }

  constructor() {
    this.initializeIndexedDB()
  }

  /**
   * 初始化IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('IndexedDB打开失败:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB初始化成功')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains('userData')) {
          const userStore = db.createObjectStore('userData', { keyPath: 'key' })
          userStore.createIndex('timestamp', 'timestamp', { unique: false })
          userStore.createIndex('expiry', 'expiry', { unique: false })
        }

        if (!db.objectStoreNames.contains('courseData')) {
          const courseStore = db.createObjectStore('courseData', { keyPath: 'key' })
          courseStore.createIndex('timestamp', 'timestamp', { unique: false })
          courseStore.createIndex('expiry', 'expiry', { unique: false })
        }

        if (!db.objectStoreNames.contains('labData')) {
          const labStore = db.createObjectStore('labData', { keyPath: 'key' })
          labStore.createIndex('timestamp', 'timestamp', { unique: false })
          labStore.createIndex('expiry', 'expiry', { unique: false })
        }

        if (!db.objectStoreNames.contains('cacheData')) {
          const cacheStore = db.createObjectStore('cacheData', { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
          cacheStore.createIndex('expiry', 'expiry', { unique: false })
        }
      }
    })
  }

  /**
   * 生成存储键
   */
  private generateKey(category: string, identifier: string): string {
    return `${category}:${identifier}`
  }

  /**
   * 计算过期时间
   */
  private calculateExpiryTime(config: PersistenceConfig): number | undefined {
    if (!config.expiry) return undefined

    switch (config.expiry) {
      case ExpiryStrategy.TIME_BASED:
        return config.expiryTime ? Date.now() + config.expiryTime : undefined
      case ExpiryStrategy.ON_VERSION_CHANGE:
        return config.version ? this.getVersionTimestamp(config.version) : undefined
      default:
        return undefined
    }
  }

  /**
   * 获取版本时间戳
   */
  private getVersionTimestamp(version: string): number {
    // 这里可以从版本映射中获取时间戳
    // 简化实现：使用当前时间作为版本变更时间
    return Date.now()
  }

  /**
   * 检查数据是否过期
   */
  private isExpired(item: PersistentDataItem): boolean {
    if (!item.expiry) return false
    return Date.now() > item.expiry
  }

  /**
   * 存储数据
   */
  async set<T>(
    key: string,
    data: T,
    config: PersistenceConfig = { strategy: PersistenceStrategy.LOCAL_STORAGE }
  ): Promise<void> {
    const item: PersistentDataItem<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiry: this.calculateExpiryTime(config),
      version: config.version || '1.0.0',
      metadata: {
        strategy: config.strategy,
        encrypted: config.encrypt || false,
        compressed: config.compress || false
      }
    }

    try {
      switch (config.strategy) {
        case PersistenceStrategy.LOCAL_STORAGE:
          await this.setLocalStorage(key, item)
          break
        case PersistenceStrategy.SESSION_STORAGE:
          await this.setSessionStorage(key, item)
          break
        case PersistenceStrategy.INDEXED_DB:
          await this.setIndexedDB(key, item)
          break
        case PersistenceStrategy.MEMORY:
          this.memoryStorage.set(key, item)
          break
        default:
          throw new Error(`不支持的持久化策略: ${config.strategy}`)
      }

      console.log(`[Persistence] 数据已保存: ${key} (${config.strategy})`)
    } catch (error) {
      console.error(`[Persistence] 保存数据失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 获取数据
   */
  async get<T>(
    key: string,
    config: PersistenceConfig = { strategy: PersistenceStrategy.LOCAL_STORAGE }
  ): Promise<T | null> {
    try {
      let item: PersistentDataItem<T> | null = null

      switch (config.strategy) {
        case PersistenceStrategy.LOCAL_STORAGE:
          item = await this.getLocalStorage<T>(key)
          break
        case PersistenceStrategy.SESSION_STORAGE:
          item = await this.getSessionStorage<T>(key)
          break
        case PersistenceStrategy.INDEXED_DB:
          item = await this.getIndexedDB<T>(key)
          break
        case PersistenceStrategy.MEMORY:
          item = this.memoryStorage.get(key) as PersistentDataItem<T> | null
          break
        default:
          throw new Error(`不支持的持久化策略: ${config.strategy}`)
      }

      if (!item) {
        console.log(`[Persistence] 数据不存在: ${key}`)
        return null
      }

      if (this.isExpired(item)) {
        console.log(`[Persistence] 数据已过期: ${key}`)
        await this.remove(key, config)
        return null
      }

      console.log(`[Persistence] 数据已读取: ${key} (${config.strategy})`)
      return item.data

    } catch (error) {
      console.error(`[Persistence] 读取数据失败: ${key}`, error)
      return null
    }
  }

  /**
   * 移除数据
   */
  async remove(
    key: string,
    config: PersistenceConfig = { strategy: PersistenceStrategy.LOCAL_STORAGE }
  ): Promise<void> {
    try {
      switch (config.strategy) {
        case PersistenceStrategy.LOCAL_STORAGE:
          localStorage.removeItem(key)
          break
        case PersistenceStrategy.SESSION_STORAGE:
          sessionStorage.removeItem(key)
          break
        case PersistenceStrategy.INDEXED_DB:
          await this.removeIndexedDB(key)
          break
        case PersistenceStrategy.MEMORY:
          this.memoryStorage.delete(key)
          break
      }

      console.log(`[Persistence] 数据已删除: ${key}`)
    } catch (error) {
      console.error(`[Persistence] 删除数据失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<void> {
    console.log('[Persistence] 开始清理过期数据...')

    // 清理localStorage过期数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (item.expiry && Date.now() > item.expiry) {
            localStorage.removeItem(key)
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
    }

    // 清理sessionStorage过期数据
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        try {
          const item = JSON.parse(sessionStorage.getItem(key) || '{}')
          if (item.expiry && Date.now() > item.expiry) {
            sessionStorage.removeItem(key)
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
    }

    // 清理IndexedDB过期数据
    if (this.db) {
      await this.cleanupIndexedDB()
    }

    console.log('[Persistence] 过期数据清理完成')
  }

  /**
   * 获取存储统计
   */
  getStorageStats(): {
    localStorage: { size: number; count: number }
    sessionStorage: { size: number; count: number }
    indexedDB: { size: number; count: number }
    memory: { size: number; count: number }
  } {
    const calculateSize = (storage: Storage) => {
      let size = 0
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          size += storage[key].length + key.length
        }
      }
      return size
    }

    return {
      localStorage: {
        size: calculateSize(localStorage),
        count: localStorage.length
      },
      sessionStorage: {
        size: calculateSize(sessionStorage),
        count: sessionStorage.length
      },
      indexedDB: {
        size: 0, // IndexedDB大小计算较复杂，这里简化处理
        count: this.memoryStorage.size
      },
      memory: {
        size: Array.from(this.memoryStorage.values())
          .reduce((total, item) => total + JSON.stringify(item).length, 0),
        count: this.memoryStorage.size
      }
    }
  }

  // Private methods for different storage strategies

  private async setLocalStorage<T>(key: string, item: PersistentDataItem<T>): Promise<void> {
    localStorage.setItem(key, JSON.stringify(item))
  }

  private async getLocalStorage<T>(key: string): Promise<PersistentDataItem<T> | null> {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }

  private async setSessionStorage<T>(key: string, item: PersistentDataItem<T>): Promise<void> {
    sessionStorage.setItem(key, JSON.stringify(item))
  }

  private async getSessionStorage<T>(key: string): Promise<PersistentDataItem<T> | null> {
    const value = sessionStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }

  private async setIndexedDB<T>(key: string, item: PersistentDataItem<T>): Promise<void> {
    if (!this.db) throw new Error('IndexedDB未初始化')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite')
      const store = transaction.objectStore('userData')
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getIndexedDB<T>(key: string): Promise<PersistentDataItem<T> | null> {
    if (!this.db) throw new Error('IndexedDB未初始化')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly')
      const store = transaction.objectStore('userData')
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  private async removeIndexedDB(key: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB未初始化')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite')
      const store = transaction.objectStore('userData')
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async cleanupIndexedDB(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData', 'courseData', 'labData', 'cacheData'], 'readwrite')

      transaction.oncomplete = () => {
        console.log('[Persistence] IndexedDB清理完成')
        resolve()
      }

      transaction.onerror = () => {
        console.error('[Persistence] IndexedDB清理失败:', transaction.error)
        reject(transaction.error)
      }

      // 清理每个存储中的过期数据
      ['userData', 'courseData', 'labData', 'cacheData'].forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.openCursor()

        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            const item = cursor.value
            if (item.expiry && Date.now() > item.expiry) {
              cursor.delete()
            }
            cursor.continue()
          }
        }
      })
    })
  }
}

/**
 * 数据持久化组合式API
 */
export function useDataPersistence() {
  const persistenceService = DataPersistenceService.getInstance()

  const set = <T>(key: string, data: T, config?: PersistenceConfig) => {
    return persistenceService.set(key, data, config)
  }

  const get = <T>(key: string, config?: PersistenceConfig) => {
    return persistenceService.get<T>(key, config)
  }

  const remove = (key: string, config?: PersistenceConfig) => {
    return persistenceService.remove(key, config)
  }

  const cleanup = () => {
    return persistenceService.cleanupExpiredData()
  }

  const getStats = () => {
    return persistenceService.getStorageStats()
  }

  return {
    set,
    get,
    remove,
    cleanup,
    getStats
  }
}

export { DataPersistenceService }