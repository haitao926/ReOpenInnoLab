import { io, type Socket } from 'socket.io-client'
import { ref, readonly } from 'vue'
import type { ConnectionStatus, WebSocketMessage } from './types'

export type LessonRole = 'student' | 'teacher' | 'assistant'

interface LessonJoinContext {
  lessonId: string
  classroomId: string
  userId: string
  role: LessonRole
  metadata?: Record<string, any>
}

interface ConnectOptions {
  namespace?: string
  token?: string
  query?: Record<string, string>
}

const DEFAULT_NAMESPACE = '/lesson'

export class LessonSocketService {
  private socket: Socket | null = null
  private namespace = DEFAULT_NAMESPACE
  private joinContext: LessonJoinContext | null = null
  private messageListeners = new Set<(message: WebSocketMessage) => void>()
  private statusListeners = new Set<(status: ConnectionStatus) => void>()

  private connectionState = ref<ConnectionStatus>('disconnected')
  private reconnectAttempts = ref(0)
  private lastError = ref<string | null>(null)

  private buildSocketUrl(namespace: string): string {
    // @ts-ignore
    const baseUrl = (import.meta as any).env?.VITE_WS_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${baseUrl.replace(/\/$/, '')}${namespace}`
  }

  async connect(options: ConnectOptions = {}): Promise<void> {
    if (this.socket?.connected) {
      return
    }

    this.namespace = options.namespace || DEFAULT_NAMESPACE
    const url = this.buildSocketUrl(this.namespace)
    const token = options.token || localStorage.getItem('auth_token') || undefined

    return new Promise((resolve, reject) => {
      this.connectionState.value = 'connecting'
      const socketOptions: any = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        withCredentials: true,
        auth: token ? { token } : undefined
      }

      if (options.query) {
        socketOptions.query = options.query
      }

      this.socket = io(url, socketOptions)

      this.registerCoreListeners(resolve, reject)
      this.registerForwardingListeners()
    })
  }

  disconnect(): void {
    this.joinContext = null
    if (!this.socket) return

    this.socket.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
    this.connectionState.value = 'disconnected'
    this.reconnectAttempts.value = 0
  }

  joinLesson(context: LessonJoinContext): boolean {
    this.joinContext = context
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join lesson')
      return false
    }

    this.socket.emit('join_lesson', {
      lessonId: context.lessonId,
      classroomId: context.classroomId,
      userId: context.userId,
      role: context.role,
      metadata: context.metadata
    })
    return true
  }

  leaveLesson(): void {
    if (!this.socket || !this.joinContext) return

    this.socket.emit('leave_lesson', {
      lessonId: this.joinContext.lessonId,
      userId: this.joinContext.userId
    })
    this.joinContext = null
  }

  changeSection(lessonId: string, sectionIndex: number, section: any): boolean {
    if (!this.socket?.connected) return false

    this.socket.emit('section_change', {
      lessonId,
      sectionIndex,
      section,
      timestamp: new Date().toISOString()
    })
    return true
  }

  changeLessonState(lessonId: string, state: 'started' | 'paused' | 'resumed' | 'ended', currentSection?: number): boolean {
    if (!this.socket?.connected) return false

    this.socket.emit('lesson_state_change', {
      lessonId,
      state,
      currentSection,
      timestamp: new Date().toISOString()
    })
    return true
  }

  submitStudentInteraction(lessonId: string, studentId: string, type: string, data: any): boolean {
    if (!this.socket?.connected) return false

    this.socket.emit('student_interaction', {
      lessonId,
      studentId,
      type,
      data,
      timestamp: new Date().toISOString()
    })
    return true
  }

  addAnnotation(lessonId: string, annotation: any): boolean {
    if (!this.socket?.connected) return false

    this.socket.emit('annotation_added', {
      lessonId,
      annotation,
      timestamp: new Date().toISOString()
    })
    return true
  }

  emit(event: string, payload: any): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event)
      return false
    }

    this.socket.emit(event, payload)
    return true
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageListeners.add(handler)
    return () => this.messageListeners.delete(handler)
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(handler)
    return () => this.statusListeners.delete(handler)
  }

  get connectionStatus() {
    return readonly(this.connectionState)
  }

  get attempts() {
    return readonly(this.reconnectAttempts)
  }

  get error() {
    return readonly(this.lastError)
  }

  get rawSocket(): Socket | null {
    return this.socket
  }

  get isConnected() {
    return this.connectionState.value === 'connected'
  }

  private registerCoreListeners(resolve: () => void, reject: (error: Error) => void) {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.connectionState.value = 'connected'
      this.reconnectAttempts.value = 0
      this.lastError.value = null
      this.notifyStatus()
      resolve()

      if (this.joinContext) {
        this.joinLesson(this.joinContext)
      }
    })

    this.socket.on('disconnect', (reason) => {
      this.connectionState.value = 'disconnected'
      this.notifyStatus()
      console.warn('Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      this.connectionState.value = 'error'
      this.lastError.value = error.message
      this.notifyStatus()
      reject(error)
    });

    (this.socket as any).io?.on('reconnect_attempt', (attempt: number) => {
      this.connectionState.value = 'reconnecting'
      this.reconnectAttempts.value = attempt
      this.notifyStatus()
    });

    (this.socket as any).io?.on('reconnect', () => {
      this.connectionState.value = 'connected'
      this.reconnectAttempts.value = 0
      this.lastError.value = null
      this.notifyStatus()
      if (this.joinContext) {
        this.joinLesson(this.joinContext)
      }
    });

    (this.socket as any).io?.on('reconnect_failed', () => {
      this.connectionState.value = 'error'
      this.notifyStatus()
    })
  }

  private registerForwardingListeners() {
    if (!this.socket) return

    const forward = (type: string, data: any) => {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      }
      this.messageListeners.forEach(listener => listener(message))
    }

    const events = [
      'section_changed',
      'lesson_state_changed',
      'annotation_received',
      'student_interaction_received',
      'user_joined',
      'user_left',
      'lesson_event',
      'system_notification'
    ]

    events.forEach(eventName => {
      this.socket!.on(eventName, (data) => forward(eventName, data))
    })

    this.socket.onAny((event, ...args) => {
      if (!events.includes(event)) {
        forward(event, args[0])
      }
    })
  }

  private notifyStatus() {
    this.statusListeners.forEach(listener => listener(this.connectionState.value))
  }
}

export const lessonSocket = new LessonSocketService()
