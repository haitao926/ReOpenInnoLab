import { useDataPersistence, PersistenceStrategy, ExpiryStrategy } from './data-persistence.service'
import type { User, Course, Lab, Activity } from '@/types'

/**
 * 离线数据服务
 * 专门处理应用核心数据的持久化
 */
class OfflineDataService {
  private static instance: OfflineDataService
  private persistence = useDataPersistence()

  public static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService()
    }
    return OfflineDataService.instance
  }

  /**
   * 用户数据持久化
   */
  // 保存用户信息
  async saveUser(user: User): Promise<void> {
    return this.persistence.set(
      'user:current',
      user,
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: 7 * 24 * 60 * 60 * 1000 // 7天
      }
    )
  }

  // 获取用户信息
  async getUser(): Promise<User | null> {
    return this.persistence.get<User>('user:current', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  // 清除用户信息
  async clearUser(): Promise<void> {
    return this.persistence.remove('user:current', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  /**
   * 认证数据持久化
   */
  // 保存认证令牌
  async saveAuthToken(token: string, refreshToken: string): Promise<void> {
    await this.persistence.set(
      'auth:token',
      { token, refreshToken },
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: 7 * 24 * 60 * 60 * 1000 // 7天
      }
    )
  }

  // 获取认证令牌
  async getAuthToken(): Promise<{ token: string; refreshToken: string } | null> {
    return this.persistence.get<{ token: string; refreshToken: string }>('auth:token', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  // 清除认证令牌
  async clearAuthToken(): Promise<void> {
    return this.persistence.remove('auth:token', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  /**
   * 课程数据持久化
   */
  // 保存课程列表
  async saveCourses(courses: Course[]): Promise<void> {
    return this.persistence.set(
      'courses:list',
      courses,
      {
        strategy: PersistenceStrategy.INDEXED_DB,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: 24 * 60 * 60 * 1000 // 24小时
      }
    )
  }

  // 获取课程列表
  async getCourses(): Promise<Course[] | null> {
    return this.persistence.get<Course[]>('courses:list', {
      strategy: PersistenceStrategy.INDEXED_DB
    })
  }

  // 保存当前课程
  async saveCurrentCourse(course: Course): Promise<void> {
    return this.persistence.set(
      'courses:current',
      course,
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: 7 * 24 * 60 * 60 * 1000 // 7天
      }
    )
  }

  // 获取当前课程
  async getCurrentCourse(): Promise<Course | null> {
    return this.persistence.get<Course>('courses:current', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  // 保存课程进度
  async saveCourseProgress(courseId: string, progress: number): Promise<void> {
    const key = `courses:progress:${courseId}`
    return this.persistence.set(
      key,
      { courseId, progress, lastUpdated: new Date().toISOString() },
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.NEVER
      }
    )
  }

  // 获取课程进度
  async getCourseProgress(courseId: string): Promise<number | null> {
    const key = `courses:progress:${courseId}`
    const data = await this.persistence.get<{ courseId: string; progress: number }>(key, {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
    return data?.progress || null
  }

  /**
   * 实验数据持久化
   */
  // 保存实验列表
  async saveLabs(labs: Lab[]): Promise<void> {
    return this.persistence.set(
      'labs:list',
      labs,
      {
        strategy: PersistenceStrategy.INDEXED_DB,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: 12 * 60 * 60 * 1000 // 12小时
      }
    )
  }

  // 获取实验列表
  async getLabs(): Promise<Lab[] | null> {
    return this.persistence.get<Lab[]>('labs:list', {
      strategy: PersistenceStrategy.INDEXED_DB
    })
  }

  // 保存实验状态
  async saveLabState(labId: string, state: any): Promise<void> {
    const key = `labs:state:${labId}`
    return this.persistence.set(
      key,
      { labId, state, lastUpdated: new Date().toISOString() },
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.NEVER
      }
    )
  }

  // 获取实验状态
  async getLabState(labId: string): Promise<any | null> {
    const key = `labs:state:${labId}`
    const data = await this.persistence.get<{ labId: string; state: any }>(key, {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
    return data?.state || null
  }

  /**
   * 活动数据持久化
   */
  // 保存活动状态
  async saveActivityState(activityId: string, state: any): Promise<void> {
    const key = `activities:state:${activityId}`
    return this.persistence.set(
      key,
      { activityId, state, lastUpdated: new Date().toISOString() },
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.NEVER
      }
    )
  }

  // 获取活动状态
  async getActivityState(activityId: string): Promise<any | null> {
    const key = `activities:state:${activityId}`
    const data = await this.persistence.get<{ activityId: string; state: any }>(key, {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
    return data?.state || null
  }

  /**
   * 学习统计持久化
   */
  // 保存学习统计
  async saveStudyStats(stats: {
    totalStudyTime: number
    todayStudyTime: number
    weekStudyTime: number
    streakDays: number
    completedActivities: number
    totalActivities: number
  }): Promise<void> {
    return this.persistence.set(
      'stats:study',
      stats,
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.NEVER
      }
    )
  }

  // 获取学习统计
  async getStudyStats(): Promise<{
    totalStudyTime: number
    todayStudyTime: number
    weekStudyTime: number
    streakDays: number
    completedActivities: number
    totalActivities: number
  } | null> {
    return this.persistence.get('stats:study', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  /**
   * 缓存管理
   */
  // 保存API响应缓存
  async saveApiCache(key: string, data: any, expiryMinutes: number = 30): Promise<void> {
    return this.persistence.set(
      `cache:api:${key}`,
      data,
      {
        strategy: PersistenceStrategy.SESSION_STORAGE,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: expiryMinutes * 60 * 1000
      }
    )
  }

  // 获取API响应缓存
  async getApiCache(key: string): Promise<any | null> {
    return this.persistence.get(`cache:api:${key}`, {
      strategy: PersistenceStrategy.SESSION_STORAGE
    })
  }

  /**
   * 用户偏好设置
   */
  // 保存用户偏好
  async saveUserPreferences(preferences: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
    autoSave: boolean
  }): Promise<void> {
    return this.persistence.set(
      'preferences:user',
      preferences,
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.NEVER
      }
    )
  }

  // 获取用户偏好
  async getUserPreferences(): Promise<{
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
    autoSave: boolean
  } | null> {
    return this.persistence.get('preferences:user', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
  }

  /**
   * 数据同步管理
   */
  // 标记数据需要同步
  async markForSync(entityType: string, entityId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    const key = `sync:queue:${entityType}:${entityId}`
    return this.persistence.set(
      key,
      {
        entityType,
        entityId,
        operation,
        timestamp: new Date().toISOString(),
        synced: false
      },
      {
        strategy: PersistenceStrategy.LOCAL_STORAGE,
        expiry: ExpiryStrategy.TIME_BASED,
        expiryTime: 7 * 24 * 60 * 60 * 1000 // 7天
      }
    )
  }

  // 获取需要同步的数据
  async getPendingSyncItems(): Promise<Array<{
    entityType: string
    entityId: string
    operation: 'create' | 'update' | 'delete'
    timestamp: string
    synced: boolean
  }>> {
    const items: Array<any> = []

    // 遍历localStorage中所有同步队列项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sync:queue:')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (!item.synced) {
            items.push(item)
          }
        } catch (error) {
          console.error('解析同步队列项失败:', error)
        }
      }
    }

    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  // 标记数据已同步
  async markAsSynced(entityType: string, entityId: string): Promise<void> {
    const key = `sync:queue:${entityType}:${entityId}`
    const item = await this.persistence.get(key)
    if (item) {
      item.synced = true
      await this.persistence.set(key, item, {
        strategy: PersistenceStrategy.LOCAL_STORAGE
      })
      // 清理已同步的项目
      await this.persistence.remove(key, {
        strategy: PersistenceStrategy.LOCAL_STORAGE
      })
    }
  }

  /**
   * 数据清理
   */
  // 清理所有过期数据
  async cleanup(): Promise<void> {
    return this.persistence.cleanup()
  }

  // 清理特定类型的数据
  async cleanupByType(type: 'user' | 'course' | 'lab' | 'activity' | 'cache'): Promise<void> {
    const patterns = {
      user: ['user:', 'auth:', 'preferences:'],
      course: ['courses:'],
      lab: ['labs:'],
      activity: ['activities:'],
      cache: ['cache:']
    }

    const keysToRemove = patterns[type] || []

    for (const pattern of keysToRemove) {
      // 清理localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith(pattern)) {
          localStorage.removeItem(key)
        }
      }

      // 清理sessionStorage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(pattern)) {
          sessionStorage.removeItem(key)
        }
      }
    }
  }

  /**
   * 离线数据同步
   */
  // 执行数据同步
  async syncAllData(): Promise<{
    success: number
    failed: number
    total: number
    errors: Array<{ item: any; error: string }>
  }> {
    console.log('[OfflineData] 开始执行离线数据同步...')

    const pendingItems = await this.getPendingSyncItems()
    const results = {
      success: 0,
      failed: 0,
      total: pendingItems.length,
      errors: [] as Array<{ item: any; error: string }>
    }

    if (pendingItems.length === 0) {
      console.log('[OfflineData] 没有需要同步的数据')
      return results
    }

    console.log(`[OfflineData] 发现 ${pendingItems.length} 个待同步项目`)

    for (const item of pendingItems) {
      try {
        await this.syncItem(item)
        await this.markAsSynced(item.entityType, item.entityId)
        results.success++
        console.log(`[OfflineData] 同步成功: ${item.entityType}/${item.entityId}`)
      } catch (error) {
        results.failed++
        results.errors.push({
          item,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`[OfflineData] 同步失败: ${item.entityType}/${item.entityId}`, error)
      }
    }

    console.log(`[OfflineData] 同步完成: 成功 ${results.success}, 失败 ${results.failed}`)
    return results
  }

  // 同步单个项目
  private async syncItem(item: {
    entityType: string
    entityId: string
    operation: 'create' | 'update' | 'delete'
  }): Promise<void> {
    switch (item.entityType) {
      case 'user':
        await this.syncUserData(item)
        break
      case 'course':
        await this.syncCourseData(item)
        break
      case 'lab':
        await this.syncLabData(item)
        break
      case 'activity':
        await this.syncActivityData(item)
        break
      case 'stats':
        await this.syncStatsData(item)
        break
      default:
        console.warn(`[OfflineData] 未知的实体类型: ${item.entityType}`)
    }
  }

  // 同步用户数据
  private async syncUserData(item: any): Promise<void> {
    // 这里应该调用真实的API来同步用户数据
    const userData = await this.getUser()
    if (userData) {
      console.log(`[OfflineData] 同步用户数据: ${userData.name}`)
      // TODO: 实现真实的API调用
      // await userApi.updateUser(userData)
    }
  }

  // 同步课程数据
  private async syncCourseData(item: any): Promise<void> {
    if (item.operation === 'update' && item.entityId.includes('progress')) {
      const progress = await this.getCourseProgress(item.entityId)
      if (progress !== null) {
        console.log(`[OfflineData] 同步课程进度: ${item.entityId} = ${progress}%`)
        // TODO: 实现真实的API调用
        // await courseApi.updateProgress(item.entityId, progress)
      }
    } else {
      const courseData = await this.getCurrentCourse()
      if (courseData && courseData.id === item.entityId) {
        console.log(`[OfflineData] 同步课程数据: ${courseData.title}`)
        // TODO: 实现真实的API调用
        // await courseApi.updateCourse(courseData)
      }
    }
  }

  // 同步实验数据
  private async syncLabData(item: any): Promise<void> {
    const labState = await this.getLabState(item.entityId)
    if (labState) {
      console.log(`[OfflineData] 同步实验数据: ${item.entityId}`)
      // TODO: 实现真实的API调用
      // await labApi.updateLabState(item.entityId, labState)
    }
  }

  // 同步活动数据
  private async syncActivityData(item: any): Promise<void> {
    const activityState = await this.getActivityState(item.entityId)
    if (activityState) {
      console.log(`[OfflineData] 同步活动数据: ${item.entityId}`)
      // TODO: 实现真实的API调用
      // await activityApi.updateActivityState(item.entityId, activityState)
    }
  }

  // 同步统计数据
  private async syncStatsData(item: any): Promise<void> {
    const stats = await this.getStudyStats()
    if (stats) {
      console.log(`[OfflineData] 同步学习统计: 学习时间 ${stats.totalStudyTime}秒`)
      // TODO: 实现真实的API调用
      // await statsApi.updateStudyStats(stats)
    }
  }

  // 检查同步状态
  async getSyncStatus(): Promise<{
    pendingCount: number
    lastSyncTime: string | null
    isOnline: boolean
  }> {
    const pendingItems = await this.getPendingSyncItems()
    const lastSyncTime = localStorage.getItem('sync:lastSyncTime')

    return {
      pendingCount: pendingItems.length,
      lastSyncTime: lastSyncTime || null,
      isOnline: navigator.onLine
    }
  }

  // 记录同步时间
  async recordSyncTime(): Promise<void> {
    localStorage.setItem('sync:lastSyncTime', new Date().toISOString())
  }

  // 清理已同步的数据
  async cleanupSyncedData(): Promise<void> {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sync:queue:')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (item.synced) {
            keysToRemove.push(key)
          }
        } catch (error) {
          console.error('解析同步队列项失败:', error)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`[OfflineData] 清理了 ${keysToRemove.length} 个已同步项目`)
  }

  /**
   * 数据迁移
   */
  // 迁移数据到新版本
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`[OfflineData] 开始数据迁移: ${fromVersion} -> ${toVersion}`)

    // 这里可以实现具体的迁移逻辑
    // 例如：数据结构变化、字段重命名等

    // 保存当前版本
    await this.persistence.set('system:version', toVersion, {
      strategy: PersistenceStrategy.LOCAL_STORAGE,
      expiry: ExpiryStrategy.NEVER
    })

    console.log(`[OfflineData] 数据迁移完成: ${fromVersion} -> ${toVersion}`)
  }

  // 获取当前数据版本
  async getDataVersion(): Promise<string> {
    const version = await this.persistence.get<string>('system:version', {
      strategy: PersistenceStrategy.LOCAL_STORAGE
    })
    return version || '1.0.0'
  }
}

/**
 * 离线数据服务组合式API
 */
export function useOfflineData() {
  const offlineDataService = OfflineDataService.getInstance()

  return {
    // 用户数据
    saveUser: offlineDataService.saveUser.bind(offlineDataService),
    getUser: offlineDataService.getUser.bind(offlineDataService),
    clearUser: offlineDataService.clearUser.bind(offlineDataService),

    // 认证数据
    saveAuthToken: offlineDataService.saveAuthToken.bind(offlineDataService),
    getAuthToken: offlineDataService.getAuthToken.bind(offlineDataService),
    clearAuthToken: offlineDataService.clearAuthToken.bind(offlineDataService),

    // 课程数据
    saveCourses: offlineDataService.saveCourses.bind(offlineDataService),
    getCourses: offlineDataService.getCourses.bind(offlineDataService),
    saveCurrentCourse: offlineDataService.saveCurrentCourse.bind(offlineDataService),
    getCurrentCourse: offlineDataService.getCurrentCourse.bind(offlineDataService),
    saveCourseProgress: offlineDataService.saveCourseProgress.bind(offlineDataService),
    getCourseProgress: offlineDataService.getCourseProgress.bind(offlineDataService),

    // 实验数据
    saveLabs: offlineDataService.saveLabs.bind(offlineDataService),
    getLabs: offlineDataService.getLabs.bind(offlineDataService),
    saveLabState: offlineDataService.saveLabState.bind(offlineDataService),
    getLabState: offlineDataService.getLabState.bind(offlineDataService),

    // 活动数据
    saveActivityState: offlineDataService.saveActivityState.bind(offlineDataService),
    getActivityState: offlineDataService.getActivityState.bind(offlineDataService),

    // 学习统计
    saveStudyStats: offlineDataService.saveStudyStats.bind(offlineDataService),
    getStudyStats: offlineDataService.getStudyStats.bind(offlineDataService),

    // 缓存管理
    saveApiCache: offlineDataService.saveApiCache.bind(offlineDataService),
    getApiCache: offlineDataService.getApiCache.bind(offlineDataService),

    // 用户偏好
    saveUserPreferences: offlineDataService.saveUserPreferences.bind(offlineDataService),
    getUserPreferences: offlineDataService.getUserPreferences.bind(offlineDataService),

    // 同步管理
    markForSync: offlineDataService.markForSync.bind(offlineDataService),
    getPendingSyncItems: offlineDataService.getPendingSyncItems.bind(offlineDataService),
    markAsSynced: offlineDataService.markAsSynced.bind(offlineDataService),
    syncAllData: offlineDataService.syncAllData.bind(offlineDataService),
    getSyncStatus: offlineDataService.getSyncStatus.bind(offlineDataService),
    recordSyncTime: offlineDataService.recordSyncTime.bind(offlineDataService),
    cleanupSyncedData: offlineDataService.cleanupSyncedData.bind(offlineDataService),

    // 数据清理
    cleanup: offlineDataService.cleanup.bind(offlineDataService),
    cleanupByType: offlineDataService.cleanupByType.bind(offlineDataService),

    // 数据迁移
    migrateData: offlineDataService.migrateData.bind(offlineDataService),
    getDataVersion: offlineDataService.getDataVersion.bind(offlineDataService)
  }
}

export { OfflineDataService }