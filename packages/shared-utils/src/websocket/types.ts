// WebSocket消息类型
export interface WebSocketMessage {
  type: string
  data: any
  timestamp?: number
  id?: string
  userId?: string
  roomId?: string
}

// 课程事件
export interface LessonEvent {
  type: 'lesson:start' | 'lesson:end' | 'lesson:pause' | 'lesson:resume' |
        'lesson:next' | 'lesson:previous' | 'section:start' | 'section:end' |
        'section:update' | 'annotation:add' | 'annotation:update'
  data: {
    lessonId: string
    sectionId?: string
    sectionIndex?: number
    section?: any
    title?: string
    reason?: string
    startNotes?: string
    endNotes?: string
    summary?: any
    annotation?: any
  }
  timestamp: Date
}

// 学生事件
export interface StudentEvent {
  type: 'student:join' | 'student:leave' | 'student:status' |
        'student:interaction' | 'student:progress' | 'student:hand_raise' |
        'student:question' | 'student:note' | 'student:feedback'
  data: {
    lessonId: string
    studentId?: string
    status?: any
    interaction?: any
    progress?: any
    raised?: boolean
    question?: string
    note?: string
    feedback?: any
    sectionIndex?: number
    timestamp?: Date
  }
  timestamp: Date
}

// 教师事件
export interface TeacherEvent {
  type: 'teacher:annotation' | 'teacher:tip' | 'teacher:highlight' |
        'teacher:poll' | 'teacher:breakout' | 'teacher:screen_share'
  data: {
    lessonId: string
    annotation?: any
    tip?: string
    highlight?: any
    poll?: any
    breakout?: any
    screenShare?: boolean
  }
  timestamp: Date
}

// 系统事件
export interface SystemEvent {
  type: 'system:notification' | 'system:warning' | 'system:error' |
        'system:maintenance' | 'system:announcement'
  data: {
    title: string
    message: string
    level: 'info' | 'warning' | 'error'
    timestamp?: Date
    actions?: Array<{
      label: string
      action: string
      data?: any
    }>
  }
  timestamp: Date
}

// 连接状态
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error'

// 房间信息
export interface RoomInfo {
  id: string
  type: 'lesson' | 'study_group' | 'discussion'
  name: string
  description?: string
  participantCount: number
  maxParticipants?: number
  isPrivate: boolean
  createdBy: string
  createdAt: Date
}

// 用户信息
export interface UserInfo {
  id: string
  name: string
  avatar?: string
  role: 'teacher' | 'student' | 'assistant'
  isOnline: boolean
  lastSeen: Date
  permissions: string[]
}

// 消息类型枚举
export enum MessageType {
  // 连接相关
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  PING = 'ping',
  PONG = 'pong',

  // 房间相关
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_INFO = 'room_info',
  ROOM_LIST = 'room_list',

  // 课程相关
  LESSON_EVENT = 'lesson_event',
  LESSON_UPDATE = 'lesson_update',
  LESSON_STATUS = 'lesson_status',

  // 学生相关
  STUDENT_EVENT = 'student_event',
  STUDENT_STATUS = 'student_status',
  STUDENT_PROGRESS = 'student_progress',

  // 教师相关
  TEACHER_EVENT = 'teacher_event',
  TEACHER_COMMAND = 'teacher_command',

  // 互动相关
  INTERACTION = 'interaction',
  QUESTION = 'question',
  ANSWER = 'answer',
  POLL = 'poll',
  VOTE = 'vote',

  // 系统相关
  NOTIFICATION = 'notification',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// WebSocket错误类型
export interface WebSocketError {
  code: number
  message: string
  type: 'connection' | 'authentication' | 'authorization' | 'rate_limit' | 'server_error'
  details?: any
  timestamp: Date
}

// 重连配置
export interface ReconnectConfig {
  enabled: boolean
  maxAttempts: number
  interval: number // 毫秒
  backoff: 'linear' | 'exponential'
  maxInterval: number // 毫秒
}

// 消息队列项
export interface QueuedMessage {
  id: string
  type: string
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
  priority: 'low' | 'normal' | 'high'
}

// 消息确认
export interface MessageAck {
  messageId: string
  success: boolean
  error?: string
  timestamp: Date
}

// 广播选项
export interface BroadcastOptions {
  room?: string
  roles?: string[]
  excludeSelf?: boolean
  priority?: 'low' | 'normal' | 'high'
  persist?: boolean
}

// 事件监听器
export type EventListener<T = any> = (data: T) => void

// WebSocket配置
export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectConfig?: ReconnectConfig
  heartbeatInterval?: number
  heartbeatTimeout?: number
  messageQueueSize?: number
  compression?: boolean
  binaryType?: BinaryType
}

// 连接指标
export interface ConnectionMetrics {
  connectTime: Date
  lastPing: Date
  lastPong: Date
  messagesReceived: number
  messagesSent: number
  reconnectCount: number
  latency: number // 毫秒
  uptime: number // 秒
}