// ===================
// 通信服务整合
// ===================

import { syncService } from './sync'
import { realtimeService } from './websocket'

/**
 * 统一的通信服务
 * 整合同步服务和实时通信服务
 */
export class CommunicationService {
  private static instance: CommunicationService

  static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService()
    }
    return CommunicationService.instance
  }

  /**
   * 初始化通信服务
   */
  async initialize(config: CommunicationConfig): Promise<void> {
    try {
      // 初始化实时通信
      if (config.websocket) {
        await realtimeService.initialize(
          config.websocket.url,
          config.websocket.token
        )
      }

      // 清理过期数据
      await syncService.cleanup()

      console.log('Communication service initialized')
    } catch (error) {
      console.error('Failed to initialize communication service:', error)
      throw error
    }
  }

  /**
   * 断开所有连接
   */
  disconnect(): void {
    realtimeService.disconnect()
  }

  // ===================
  // 同步相关方法
  // ===================

  /**
   * 同步课程数据
   */
  async syncCourse(courseId: string, data?: any): Promise<void> {
    return syncService.syncCourse(courseId, data)
  }

  /**
   * 同步章节数据
   */
  async syncChapter(courseId: string, chapterId: string, data?: any): Promise<void> {
    return syncService.syncChapter(courseId, chapterId, data)
  }

  /**
   * 同步活动数据
   */
  async syncActivity(courseId: string, chapterId: string, activityId: string, data?: any): Promise<void> {
    return syncService.syncActivity(courseId, chapterId, activityId, data)
  }

  /**
   * 同步进度数据
   */
  async syncProgress(entityId: string, progress: number, data?: any): Promise<void> {
    return syncService.syncProgress(entityId, progress, data)
  }

  /**
   * 强制同步
   */
  async forceSync(entityType: string, entityId: string): Promise<any> {
    return syncService.forceSync(entityType, entityId)
  }

  /**
   * 获取离线数据
   */
  async getOfflineData(key: string): Promise<any> {
    return syncService.getOfflineData(key)
  }

  /**
   * 存储离线数据
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    return syncService.storeOfflineData(key, data)
  }

  /**
   * 同步所有待同步数据
   */
  async syncAll(): Promise<void> {
    return syncService.syncAll()
  }

  // ===================
  // 实时通信相关方法
  // ===================

  /**
   * 加入课堂
   */
  async joinClassroom(classroomId: string, userId: string): Promise<void> {
    return realtimeService.joinClassroom(classroomId, userId)
  }

  /**
   * 离开课堂
   */
  leaveClassroom(): void {
    realtimeService.leaveClassroom()
  }

  /**
   * 发送活动进度（实时）
   */
  sendActivityProgress(courseId: string, chapterId: string, activityId: string, progress: number, data?: any): void {
    realtimeService.sendActivityProgress(courseId, chapterId, activityId, progress, data)
  }

  /**
   * 发送实验状态（实时）
   */
  sendLabStatus(labId: string, status: 'starting' | 'running' | 'stopped' | 'error', data?: any): void {
    realtimeService.sendLabStatus(labId, status, data)
  }

  /**
   * 举手
   */
  raiseHand(reason?: string): void {
    realtimeService.raiseHand(reason)
  }

  /**
   * 放下举手
   */
  lowerHand(): void {
    realtimeService.lowerHand()
  }

  /**
   * 提问
   */
  askQuestion(question: string, isPublic = true): void {
    realtimeService.askQuestion(question, isPublic)
  }

  /**
   * 订阅课堂事件
   */
  onClassroomEvent(event: string, callback: (data: any) => void): () => void {
    return realtimeService.onClassroomEvent(event, callback)
  }

  /**
   * 订阅数据更新
   */
  onDataUpdate(entityType: string, entityId: string, callback: (result: any) => void): () => void {
    return syncService.subscribe(entityType, entityId, callback)
  }

  // ===================
  // 状态和工具方法
  // ===================

  /**
   * 获取连接状态
   */
  getStatus(): CommunicationStatus {
    return {
      online: syncService.isOnline(),
      realtime: realtimeService.isConnected(),
      sync: syncService.getSyncStatus(),
      websocket: realtimeService.getConnectionStatus().websocket
    }
  }

  /**
   * 检查是否在线
   */
  isOnline(): boolean {
    return syncService.isOnline()
  }

  /**
   * 检查实时连接是否正常
   */
  isRealtimeConnected(): boolean {
    return realtimeService.isConnected()
  }

  /**
   * 发送综合进度更新
   */
  async updateProgress(
    courseId: string,
    chapterId: string,
    activityId: string,
    progress: number,
    data?: any
  ): Promise<void> {
    const entityId = `${courseId}:${chapterId}:${activityId}`

    // 同步到服务器
    await this.syncProgress(entityId, progress, data)

    // 实时通知
    if (this.isRealtimeConnected()) {
      this.sendActivityProgress(courseId, chapterId, activityId, progress, data)
    }
  }

  /**
   * 发送综合状态更新
   */
  async updateStatus(
    entityType: 'course' | 'chapter' | 'activity' | 'lab',
    entityId: string,
    status: any,
    data?: any
  ): Promise<void> {
    // 同步到服务器
    await this.sync(entityType, entityId, { status, ...data })

    // 实时通知
    if (this.isRealtimeConnected()) {
      if (entityType === 'lab') {
        this.sendLabStatus(entityId, status, data)
      }
    }
  }

  /**
   * 订阅数据变化事件
   */
  onDataChange(callback: (event: DataChangeEvent) => void): () => void {
    const unsubscribers: (() => void)[] = []

    // 订阅WebSocket消息
    unsubscribers.push(
      realtimeService.onMessage('*', (message) => {
        callback({
          type: 'realtime',
          entityType: message.type,
          entityId: message.entityId,
          data: message.data,
          timestamp: Date.now()
        })
      })
    )

    // 返回取消所有订阅的函数
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }

  // 私有方法

  private async sync(entityType: string, entityId: string, data: any): Promise<void> {
    switch (entityType) {
      case 'course':
        await this.syncCourse(entityId, data)
        break
      case 'chapter':
        const [courseId, chapterId] = entityId.split(':')
        await this.syncChapter(courseId, chapterId, data)
        break
      case 'activity':
        const [cId, chId, actId] = entityId.split(':')
        await this.syncActivity(cId, chId, actId, data)
        break
      default:
        console.warn('Unknown entity type for sync:', entityType)
    }
  }
}

// ===================
// 类型定义
// ===================

export interface CommunicationConfig {
  websocket?: {
    url: string
    token?: string
  }
  sync?: {
    autoSync?: boolean
    syncInterval?: number
  }
}

export interface CommunicationStatus {
  online: boolean
  realtime: boolean
  sync: {
    queueLength: number
    processing: boolean
    pendingTasks: number
    failedTasks: number
  }
  websocket: {
    connected: boolean
    readyState: number
    reconnectAttempts: number
    queuedMessages: number
  }
}

export interface DataChangeEvent {
  type: 'sync' | 'realtime'
  entityType: string
  entityId: string
  data: any
  timestamp: number
}

// 导出服务实例
export const communicationService = CommunicationService.getInstance()