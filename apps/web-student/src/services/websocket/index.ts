// WebSocket服务模块导出
export {
  WebSocketService,
  webSocketService,
  type WebSocketStatus,
  type WebSocketCallback,
  type ClassroomSyncData,
  type ActivityProgressData,
  type LabStatusData
} from './websocket-service'

export {
  ClassroomSyncService,
  classroomSyncService
} from './classroom-sync'

import { WebSocketService, webSocketService } from './websocket-service'
import { ClassroomSyncService, classroomSyncService } from './classroom-sync'

// 统一的实时通信服务
export class RealtimeService {
  private wsService = new WebSocketService()
  private classroomService = new ClassroomSyncService()

  /**
   * 初始化实时通信
   */
  async initialize(url: string, token?: string): Promise<void> {
    try {
      await this.wsService.connect(url, token)
      console.log('Realtime service initialized')
    } catch (error) {
      console.error('Failed to initialize realtime service:', error)
      throw error
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.classroomService.leaveClassroom()
    this.wsService.disconnect()
  }

  /**
   * 加入课堂
   */
  async joinClassroom(classroomId: string, userId: string): Promise<void> {
    return this.classroomService.joinClassroom(classroomId, userId)
  }

  /**
   * 离开课堂
   */
  leaveClassroom(): void {
    this.classroomService.leaveClassroom()
  }

  /**
   * 发送活动进度
   */
  sendActivityProgress(courseId: string, chapterId: string, activityId: string, progress: number, data?: any): void {
    this.classroomService.sendActivityProgress(courseId, chapterId, activityId, progress, data)
  }

  /**
   * 发送实验状态
   */
  sendLabStatus(labId: string, status: 'starting' | 'running' | 'stopped' | 'error', data?: any): void {
    this.classroomService.sendLabStatus(labId, status, data)
  }

  /**
   * 举手
   */
  raiseHand(reason?: string): void {
    this.classroomService.raiseHand(reason)
  }

  /**
   * 放下举手
   */
  lowerHand(): void {
    this.classroomService.lowerHand()
  }

  /**
   * 提问
   */
  askQuestion(question: string, isPublic = true): void {
    this.classroomService.askQuestion(question, isPublic)
  }

  /**
   * 订阅课堂事件
   */
  onClassroomEvent(event: string, callback: (data: any) => void): () => void {
    return this.classroomService.onClassroomEvent(event, callback)
  }

  /**
   * 订阅WebSocket消息
   */
  onMessage(type: string, callback: (message: any) => void): () => void {
    return this.wsService.subscribe(type, callback)
  }

  /**
   * 发送自定义消息
   */
  sendMessage(message: any): boolean {
    return this.wsService.send(message)
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      websocket: this.wsService.getConnectionStatus(),
      classroom: this.classroomService.isClassroomConnected()
    }
  }

  /**
   * 检查是否连接
   */
  isConnected(): boolean {
    const status = this.getConnectionStatus()
    return status.websocket.connected
  }
}

// 导出服务实例
export const realtimeService = new RealtimeService()