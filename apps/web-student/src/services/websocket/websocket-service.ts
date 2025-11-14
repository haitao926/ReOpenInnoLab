// ===================
// WebSocket服务
// ===================

/**
 * WebSocket通信服务
 * 处理实时通信和课堂同步
 */
export class WebSocketService {
  private static instance: WebSocketService
  private ws: WebSocket | null = null
  private url: string = ''
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private subscribers = new Map<string, Set<WebSocketCallback>>()
  private messageQueue: any[] = []
  private isConnected = false
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  /**
   * 连接WebSocket
   */
  connect(url: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.url = url
      const wsUrl = this.buildWebSocketUrl(url, token)

      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.flushMessageQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.isConnected = false
          this.stopHeartbeat()
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnected = false
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.isConnected = false
    this.reconnectAttempts = 0
  }

  /**
   * 发送消息
   */
  send(message: any): boolean {
    if (!this.isConnected || !this.ws) {
      // 如果未连接，加入队列
      this.messageQueue.push(message)
      return false
    }

    try {
      const messageData = {
        ...message,
        id: this.generateMessageId(),
        timestamp: Date.now()
      }

      this.ws.send(JSON.stringify(messageData))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      this.messageQueue.push(message)
      return false
    }
  }

  /**
   * 订阅消息
   */
  subscribe(type: string, callback: WebSocketCallback): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }

    this.subscribers.get(type)!.add(callback)

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(type)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(type)
        }
      }
    }
  }

  /**
   * 发送课堂同步消息
   */
  sendClassroomSync(data: ClassroomSyncData): void {
    this.send({
      type: 'classroom_sync',
      data
    })
  }

  /**
   * 发送活动进度消息
   */
  sendActivityProgress(data: ActivityProgressData): void {
    this.send({
      type: 'activity_progress',
      data
    })
  }

  /**
   * 发送实验状态消息
   */
  sendLabStatus(data: LabStatusData): void {
    this.send({
      type: 'lab_status',
      data
    })
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): WebSocketStatus {
    return {
      connected: this.isConnected,
      readyState: this.ws?.readyState ?? WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    }
  }

  // 私有方法

  private buildWebSocketUrl(url: string, token?: string): string {
    const wsUrl = url.startsWith('ws') ? url : `ws://${url}`

    if (token) {
      const separator = wsUrl.includes('?') ? '&' : '?'
      return `${wsUrl}${separator}token=${encodeURIComponent(token)}`
    }

    return wsUrl
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data)
      this.notifySubscribers(message.type, message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private notifySubscribers(type: string, message: any): void {
    const callbacks = this.subscribers.get(type)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in WebSocket callback:', error)
        }
      })
    }

    // 通用消息监听器
    const allCallbacks = this.subscribers.get('*')
    if (allCallbacks) {
      allCallbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in universal WebSocket callback:', error)
        }
      })
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)

    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts + 1})`)
      this.reconnectAttempts++

      this.connect(this.url)
        .then(() => {
          console.log('WebSocket reconnected successfully')
        })
        .catch((error) => {
          console.error('WebSocket reconnection failed:', error)
        })
    }, delay)
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected && this.ws) {
        try {
          this.ws.send(JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          }))
        } catch (error) {
          console.error('Failed to send heartbeat:', error)
        }
      }
    }, 30000) // 30秒心跳
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ===================
// 类型定义
// ===================

export interface WebSocketStatus {
  connected: boolean
  readyState: number
  reconnectAttempts: number
  queuedMessages: number
}

export interface ClassroomSyncData {
  classroomId: string
  userId: string
  action: 'join' | 'leave' | 'raise_hand' | 'lower_hand' | 'ask_question'
  data?: any
}

export interface ActivityProgressData {
  courseId: string
  chapterId: string
  activityId: string
  progress: number
  status: string
  data?: any
}

export interface LabStatusData {
  labId: string
  status: 'starting' | 'running' | 'stopped' | 'error'
  data?: any
}

export type WebSocketCallback = (message: any) => void

// 导出单例实例
export const webSocketService = WebSocketService.getInstance()