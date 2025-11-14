// ===================
// 课堂同步服务
// ===================

import { webSocketService } from './websocket-service'

/**
 * 课堂同步服务
 * 处理课堂内的实时同步功能
 */
export class ClassroomSyncService {
  private static instance: ClassroomSyncService
  private classroomId: string | null = null
  private userId: string | null = null
  private isConnected = false
  private syncCallbacks = new Map<string, Set<Function>>()

  static getInstance(): ClassroomSyncService {
    if (!ClassroomSyncService.instance) {
      ClassroomSyncService.instance = new ClassroomSyncService()
    }
    return ClassroomSyncService.instance
  }

  /**
   * 加入课堂
   */
  async joinClassroom(classroomId: string, userId: string): Promise<void> {
    try {
      this.classroomId = classroomId
      this.userId = userId

      // 发送加入课堂消息
      webSocketService.sendClassroomSync({
        classroomId,
        userId,
        action: 'join',
        data: {
          timestamp: Date.now()
        }
      })

      this.isConnected = true
      console.log(`Joined classroom: ${classroomId}`)

    } catch (error) {
      console.error('Failed to join classroom:', error)
      throw error
    }
  }

  /**
   * 离开课堂
   */
  leaveClassroom(): void {
    if (this.classroomId && this.userId) {
      webSocketService.sendClassroomSync({
        classroomId: this.classroomId,
        userId: this.userId,
        action: 'leave'
      })
    }

    this.isConnected = false
    this.classroomId = null
    this.userId = null
    this.syncCallbacks.clear()
  }

  /**
   * 举手
   */
  raiseHand(reason?: string): void {
    if (!this.classroomActive()) return

    webSocketService.sendClassroomSync({
      classroomId: this.classroomId!,
      userId: this.userId!,
      action: 'raise_hand',
      data: { reason }
    })
  }

  /**
   * 放下举手
   */
  lowerHand(): void {
    if (!this.classroomActive()) return

    webSocketService.sendClassroomSync({
      classroomId: this.classroomId!,
      userId: this.userId!,
      action: 'lower_hand'
    })
  }

  /**
   * 提问
   */
  askQuestion(question: string, isPublic = true): void {
    if (!this.classroomActive()) return

    webSocketService.sendClassroomSync({
      classroomId: this.classroomId!,
      userId: this.userId!,
      action: 'ask_question',
      data: { question, isPublic, timestamp: Date.now() }
    })
  }

  /**
   * 发送活动进度
   */
  sendActivityProgress(courseId: string, chapterId: string, activityId: string, progress: number, data?: any): void {
    if (!this.isConnected) return

    webSocketService.sendActivityProgress({
      courseId,
      chapterId,
      activityId,
      progress,
      status: progress >= 100 ? 'completed' : 'in_progress',
      data
    })
  }

  /**
   * 发送实验状态
   */
  sendLabStatus(labId: string, status: 'starting' | 'running' | 'stopped' | 'error', data?: any): void {
    if (!this.isConnected) return

    webSocketService.sendLabStatus({
      labId,
      status,
      data
    })
  }

  /**
   * 订阅课堂事件
   */
  onClassroomEvent(event: string, callback: (data: any) => void): () => void {
    const key = `classroom:${event}`
    if (!this.syncCallbacks.has(key)) {
      this.syncCallbacks.set(key, new Set())
    }

    this.syncCallbacks.get(key)!.add(callback)

    // 订阅WebSocket消息
    const unsubscribe = webSocketService.subscribe(`classroom_${event}`, (message) => {
      this.handleClassroomEvent(event, message.data)
    })

    // 返回取消订阅函数
    return () => {
      const callbacks = this.syncCallbacks.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.syncCallbacks.delete(key)
        }
      }
      unsubscribe()
    }
  }

  /**
   * 获取连接状态
   */
  isClassroomConnected(): boolean {
    return this.isConnected && this.classroomId !== null
  }

  // 私有方法

  private classroomActive(): boolean {
    return this.isConnected && this.classroomId !== null && this.userId !== null
  }

  private handleClassroomEvent(event: string, data: any): void {
    const key = `classroom:${event}`
    const callbacks = this.syncCallbacks.get(key)

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in classroom event callback (${event}):`, error)
        }
      })
    }
  }
}

// 导出单例实例
export const classroomSyncService = ClassroomSyncService.getInstance()