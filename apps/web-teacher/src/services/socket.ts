// 开源浦育 ReOpenInnoLab - Socket.IO服务
import { io, Socket } from 'socket.io-client'

export interface SocketConfig {
  url?: string
  namespace?: string
  reconnectAttempts?: number
  timeout?: number
  autoConnect?: boolean
}

export interface ChannelConfig {
  channelId: string
  type: 'lesson' | 'classroom' | 'chat' | 'system'
  lessonId?: string
  classId?: string
  userId?: string
  role?: 'teacher' | 'student' | 'observer'
}

export interface SocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export type SocketEventHandler = (data: any) => void

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

// 课程事件类型
export interface LessonEvent {
  type: 'section_change' | 'lesson_state_change' | 'student_interaction' | 'annotation_added'
  data: any
  timestamp: string
}

export class SocketService {
  private socket: Socket | null = null
  private config: Required<SocketConfig>
  private eventHandlers = new Map<string, Set<SocketEventHandler>>()
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected'

  constructor(config: SocketConfig = {}) {
    this.config = {
      url: config.url || this.getDefaultUrl(),
      namespace: config.namespace || '/lesson',
      reconnectAttempts: config.reconnectAttempts || 5,
      timeout: config.timeout || 20000,
      autoConnect: config.autoConnect ?? true,
    }
  }

  private getDefaultUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.host
    return `${protocol}//${host}`
  }

  private getFullUrl(): string {
    return `${this.config.url}${this.config.namespace}`
  }

  // 连接到Socket.IO服务器
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.connectionState = 'connecting'
        const url = this.getFullUrl()

        this.socket = io(url, {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: this.config.autoConnect,
          timeout: this.config.timeout,
          reconnection: true,
          reconnectionAttempts: this.config.reconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        })

        // 连接成功
        this.socket.on('connect', () => {
          console.log('Socket.IO连接已建立')
          this.connectionState = 'connected'
          resolve()
        })

        // 连接断开
        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO连接已断开:', reason)
          this.connectionState = 'disconnected'
        })

        // 连接错误
        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO连接错误:', error)
          this.connectionState = 'disconnected'
          reject(error)
        })

        // 重连尝试
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`尝试重连 (${attemptNumber}/${this.config.reconnectAttempts})...`)
          this.connectionState = 'reconnecting'
        })

        // 重连成功
        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`重连成功，尝试次数: ${attemptNumber}`)
          this.connectionState = 'connected'
        })

        // 重连失败
        this.socket.on('reconnect_failed', () => {
          console.error('重连失败，达到最大重连次数')
          this.connectionState = 'disconnected'
        })

        // 设置事件监听器
        this.setupEventListeners()

      } catch (error) {
        this.connectionState = 'disconnected'
        reject(error)
      }
    })
  }

  // 设置事件监听器
  private setupEventListeners() {
    if (!this.socket) return

    // 用户加入课堂
    this.socket.on('user_joined', (data) => {
      this.emit('user_joined', data)
    })

    // 用户离开课堂
    this.socket.on('user_left', (data) => {
      this.emit('user_left', data)
    })

    // 环节切换反馈
    this.socket.on('section_changed', (data) => {
      this.emit('section_changed', data)
    })

    // 课程状态变更反馈
    this.socket.on('lesson_state_changed', (data) => {
      this.emit('lesson_state_changed', data)
    })

    // 学生交互接收
    this.socket.on('student_interaction_received', (data) => {
      this.emit('student_interaction_received', data)
    })

    // 批注反馈
    this.socket.on('annotation_received', (data) => {
      this.emit('annotation_received', data)
    })
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.connectionState = 'disconnected'
    this.eventHandlers.clear()
  }

  // 加入课程房间
  joinLesson(lessonId: string, userId: string, role: 'teacher' | 'student', classroomId: string): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket.IO未连接，无法加入课程')
      return false
    }

    this.socket.emit('join_lesson', {
      lessonId,
      userId,
      role,
      classroomId
    })
    return true
  }

  // 离开课程房间
  leaveLesson(lessonId: string, userId: string): boolean {
    if (!this.socket?.connected) {
      return false
    }

    this.socket.emit('leave_lesson', {
      lessonId,
      userId
    })
    return true
  }

  // 切换环节
  changeSection(lessonId: string, sectionIndex: number, section: any): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket.IO未连接，无法切换环节')
      return false
    }

    this.socket.emit('section_change', {
      lessonId,
      sectionIndex,
      section,
      timestamp: new Date().toISOString()
    })
    return true
  }

  // 改变课程状态
  changeLessonState(lessonId: string, state: 'started' | 'paused' | 'resumed' | 'ended', currentSection?: number): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket.IO未连接，无法改变课程状态')
      return false
    }

    this.socket.emit('lesson_state_change', {
      lessonId,
      state,
      timestamp: new Date().toISOString(),
      currentSection
    })
    return true
  }

  // 添加批注
  addAnnotation(lessonId: string, annotation: any): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket.IO未连接，无法添加批注')
      return false
    }

    this.socket.emit('annotation_added', {
      lessonId,
      annotation,
      timestamp: new Date().toISOString()
    })
    return true
  }

  // 监听事件
  on(event: string, handler: SocketEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    // 返回取消监听的函数
    return () => {
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.eventHandlers.delete(event)
        }
      }
    }
  }

  // 取消监听事件
  off(event: string, handler?: SocketEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event)
      return
    }

    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  // 触发事件
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`处理事件 ${event} 时出错:`, error)
        }
      })
    }
  }

  // 获取连接状态
  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  get connectionStateValue(): string {
    return this.connectionState
  }

  // 获取Socket实例
  getSocketInstance(): Socket | null {
    return this.socket
  }

  // 发送自定义消息
  send(event: string, data: any): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket.IO未连接，无法发送消息')
      return false
    }

    this.socket.emit(event, data)
    return true
  }

  // 清理资源
  destroy(): void {
    this.disconnect()
    this.eventHandlers.clear()
  }
}

// 创建默认实例
export const socketService = new SocketService()

// 导出类型
export { Socket }