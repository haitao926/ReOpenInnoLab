// 开源浦育 ReOpenInnoLab - WebSocket服务

export interface WebSocketConfig {
  url: string
  reconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
  protocols?: string[]
}

export interface ChannelConfig {
  channelId: string
  type: 'lesson' | 'classroom' | 'chat' | 'system'
  lessonId?: string
  classId?: string
  userId?: string
  role?: 'teacher' | 'student' | 'observer'
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export type WebSocketEventHandler = (data: any) => void

// 教室消息类型
export type ClassroomMessageType =
  | 'lesson_started'
  | 'lesson_paused'
  | 'lesson_resumed'
  | 'lesson_ended'
  | 'student_joined'
  | 'student_left'
  | 'student_status_updated'
  | 'section_changed'
  | 'question_asked'
  | 'answer_submitted'
  | 'poll_created'
  | 'poll_responded'
  | 'annotation_created'
  | 'experiment_started'
  | 'experiment_completed'
  | 'resource_shared'
  | 'chat_message'
  | 'hand_raised'
  | 'screen_shared'
  | 'ai_suggestion'
  | 'progress_update'

// 教室消息数据接口
export interface ClassroomMessageData {
  lessonId?: string
  studentId?: string
  sectionId?: string
  timestamp: number
  data: any
}

export class WebSocketService {
  private config: WebSocketConfig
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map()
  private messageQueue: WebSocketMessage[] = []
  private isConnecting = false
  private isDestroyed = false

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectInterval: 1000,
      heartbeatInterval: 30000,
      ...config,
    }
  }

  // 连接WebSocket
  async connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.isConnecting = true

    try {
      this.ws = new WebSocket(this.config.url)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      // 等待连接完成
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        if (this.ws) {
          this.ws.onopen = () => {
            clearTimeout(timeout)
            this.handleOpen()
            resolve()
          }

          this.ws.onerror = (error) => {
            clearTimeout(timeout)
            reject(error)
          }
        }
      })
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  // 断开连接
  disconnect(): void {
    this.isDestroyed = true
    this.clearHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // 发送消息
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // 连接未就绪时，将消息加入队列
      this.messageQueue.push(message)
    }
  }

  // 连接到特定频道
  async connectToChannel(channelConfig: ChannelConfig): Promise<void> {
    const params = new URLSearchParams({
      channel: channelConfig.channelId,
      type: channelConfig.type
    })

    if (channelConfig.lessonId) params.append('lessonId', channelConfig.lessonId)
    if (channelConfig.classId) params.append('classId', channelConfig.classId)
    if (channelConfig.userId) params.append('userId', channelConfig.userId)
    if (channelConfig.role) params.append('role', channelConfig.role)

    const url = `${this.config.url.split('?')[0]}?${params.toString()}`

    // 更新配置
    this.config.url = url

    // 如果已有连接，先断开
    if (this.ws) {
      this.disconnect()
    }

    return this.connect()
  }

  // 发送频道消息
  sendToChannel(channelId: string, type: string, data: any): void {
    this.send(type, {
      channelId,
      ...data
    })
  }

  // 发送教室消息
  sendClassroomMessage(lessonId: string, type: ClassroomMessageType, data: any): void {
    this.sendToChannel(`lesson_${lessonId}`, type, data)
  }

  // 离开频道
  leaveChannel(): void {
    this.send('leave_channel', { timestamp: Date.now() })
    this.disconnect()
  }

  // 注册事件处理器
  on(type: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, [])
    }
    this.eventHandlers.get(type)!.push(handler)
  }

  // 移除事件处理器
  off(type: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 处理连接打开
  private handleOpen(): void {
    console.log('WebSocket连接已建立')
    this.isConnecting = false
    this.reconnectAttempts = 0

    // 发送队列中的消息
    this.flushMessageQueue()

    // 开始心跳
    this.startHeartbeat()

    // 触发连接事件
    this.emit('connected', null)
  }

  // 处理消息接收
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.emit(message.type, message.data)
    } catch (error) {
      console.error('WebSocket消息解析失败:', error)
    }
  }

  // 处理连接关闭
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket连接已关闭:', event.code, event.reason)
    this.isConnecting = false
    this.clearHeartbeat()

    this.emit('disconnected', { code: event.code, reason: event.reason })

    // 自动重连
    if (!this.isDestroyed && event.code !== 1000) {
      this.attemptReconnect()
    }
  }

  // 处理连接错误
  private handleError(error: Event): void {
    console.error('WebSocket连接错误:', error)
    this.isConnecting = false
    this.emit('error', error)
  }

  // 触发事件
  private emit(type: string, data: any): void {
    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`WebSocket事件处理器错误 (${type}):`, error)
        }
      })
    }
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts!) {
      console.error('WebSocket重连次数已达上限')
      return
    }

    this.reconnectAttempts++
    console.log(`WebSocket重连中 (${this.reconnectAttempts}/${this.config.reconnectAttempts})`)

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect().catch(error => {
          console.error('WebSocket重连失败:', error)
        })
      }
    }, this.config.reconnectInterval! * this.reconnectAttempts)
  }

  // 开始心跳
  private startHeartbeat(): void {
    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat', { timestamp: Date.now() })
    }, this.config.heartbeatInterval)
  }

  // 清除心跳
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 清空消息队列
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      this.ws!.send(JSON.stringify(message))
    }
  }

  // 生成消息ID
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取连接状态
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  // 是否已连接
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 创建全局WebSocket服务实例
export const websocketService = new WebSocketService({
  url: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws`,
  reconnectAttempts: 5,
  reconnectInterval: 2000,
  heartbeatInterval: 30000
})

// WebSocket管理器 - 处理多个频道连接
export class WebSocketManager {
  private connections: Map<string, WebSocketService> = new Map()

  async connectToChannel(channelConfig: ChannelConfig): Promise<WebSocketService> {
    const key = `${channelConfig.channelId}_${channelConfig.type}`

    // 如果已存在连接，返回现有连接
    if (this.connections.has(key)) {
      const service = this.connections.get(key)!
      if (service.isConnected) {
        return service
      } else {
        // 连接已断开，重新创建
        this.connections.delete(key)
      }
    }

    // 创建新连接
    const service = new WebSocketService({
      url: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws`,
      reconnectAttempts: 3,
      reconnectInterval: 1000
    })

    try {
      await service.connectToChannel(channelConfig)
      this.connections.set(key, service)
      return service
    } catch (error) {
      console.error(`Failed to connect to channel ${key}:`, error)
      throw error
    }
  }

  disconnectFromChannel(channelId: string, type: string): void {
    const key = `${channelId}_${type}`
    const service = this.connections.get(key)
    if (service) {
      service.leaveChannel()
      this.connections.delete(key)
    }
  }

  disconnectAll(): void {
    this.connections.forEach(service => {
      service.leaveChannel()
    })
    this.connections.clear()
  }

  getConnection(channelId: string, type: string): WebSocketService | null {
    const key = `${channelId}_${type}`
    return this.connections.get(key) || null
  }
}

// 创建全局WebSocket管理器实例
export const wsManager = new WebSocketManager()