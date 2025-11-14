import { ref, onMounted, onUnmounted, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { WebSocketMessage, LessonEvent } from '@/types/websocket'

export interface UseSocketOptions {
  autoReconnect?: boolean
  reconnectAttempts?: number
  heartbeatInterval?: number
}

export interface SocketState {
  isConnected: boolean
  isConnecting: boolean
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  lastMessage: any
  lastError: Error | null
  reconnectAttempts: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options

  // 状态管理
  const socket = ref<Socket | null>(null)
  const state = ref<SocketState>({
    isConnected: false,
    isConnecting: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    lastError: null,
    reconnectAttempts: 0
  })

  // 事件监听器
  const messageListeners = new Set<(message: any) => void>()
  const statusListeners = new Set<(status: SocketState['connectionStatus']) => void>()
  const errorListeners = new Set<(error: Error) => void>()

  // 获取Socket.IO URL
  const getSocketUrl = (namespace: string = '') => {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.host
    return `${protocol}//${host}${namespace}`
  }

  // 更新连接状态
  const updateConnectionStatus = (status: SocketState['connectionStatus']) => {
    state.value.connectionStatus = status
    state.value.isConnected = status === 'connected'
    state.value.isConnecting = status === 'connecting' || status === 'reconnecting'

    statusListeners.forEach(listener => listener(status))
  }

  // 连接Socket.IO
  const connect = async (namespace: string = '/lesson') => {
    if (socket.value?.connected) {
      return
    }

    try {
      updateConnectionStatus('connecting')
      const url = getSocketUrl(namespace)

      socket.value = io(url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect,
        timeout: 20000,
        reconnection: autoReconnect,
        reconnectionAttempts: reconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      // 连接成功
      socket.value.on('connect', () => {
        console.log('Socket.IO连接已建立')
        updateConnectionStatus('connected')
        state.value.reconnectAttempts = 0
        state.value.lastError = null
      })

      // 连接断开
      socket.value.on('disconnect', (reason) => {
        console.log('Socket.IO连接已断开:', reason)
        updateConnectionStatus('disconnected')
      })

      // 连接错误
      socket.value.on('connect_error', (error) => {
        console.error('Socket.IO连接错误:', error)
        state.value.lastError = error
        updateConnectionStatus('disconnected')
        errorListeners.forEach(listener => listener(error))
      })

      // 重连尝试
      socket.value.on('reconnect_attempt', (attemptNumber) => {
        state.value.reconnectAttempts = attemptNumber
        updateConnectionStatus('reconnecting')
        console.log(`尝试重连 (${attemptNumber}/${reconnectAttempts})...`)
      })

      // 重连成功
      socket.value.on('reconnect', (attemptNumber) => {
        console.log(`重连成功，尝试次数: ${attemptNumber}`)
        updateConnectionStatus('connected')
        state.value.reconnectAttempts = 0
      })

      // 重连失败
      socket.value.on('reconnect_failed', () => {
        console.error('重连失败，达到最大重连次数')
        updateConnectionStatus('disconnected')
      })

      // 监听课程相关事件
      setupLessonEventListeners()

    } catch (error) {
      console.error('创建Socket.IO连接失败:', error)
      updateConnectionStatus('disconnected')
      state.value.lastError = error as Error
    }
  }

  // 设置课程事件监听器
  const setupLessonEventListeners = () => {
    if (!socket.value) return

    // 用户加入课堂
    socket.value.on('user_joined', (data) => {
      const message = {
        type: 'user_joined',
        data,
        timestamp: Date.now()
      }
      state.value.lastMessage = message
      messageListeners.forEach(listener => listener(message))
    })

    // 用户离开课堂
    socket.value.on('user_left', (data) => {
      const message = {
        type: 'user_left',
        data,
        timestamp: Date.now()
      }
      state.value.lastMessage = message
      messageListeners.forEach(listener => listener(message))
    })

    // 环节切换
    socket.value.on('section_changed', (data) => {
      const message = {
        type: 'section_changed',
        data,
        timestamp: Date.now()
      }
      state.value.lastMessage = message
      messageListeners.forEach(listener => listener(message))
    })

    // 课程状态变更
    socket.value.on('lesson_state_changed', (data) => {
      const message = {
        type: 'lesson_state_changed',
        data,
        timestamp: Date.now()
      }
      state.value.lastMessage = message
      messageListeners.forEach(listener => listener(message))
    })

    // 学生交互反馈
    socket.value.on('student_interaction_received', (data) => {
      const message = {
        type: 'student_interaction_received',
        data,
        timestamp: Date.now()
      }
      state.value.lastMessage = message
      messageListeners.forEach(listener => listener(message))
    })

    // 批注接收
    socket.value.on('annotation_received', (data) => {
      const message = {
        type: 'annotation_received',
        data,
        timestamp: Date.now()
      }
      state.value.lastMessage = message
      messageListeners.forEach(listener => listener(message))
    })
  }

  // 断开连接
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    updateConnectionStatus('disconnected')
  }

  // 加入课程房间
  const joinLesson = (lessonId: string, userId: string, role: 'teacher' | 'student', classroomId: string) => {
    if (!socket.value?.connected) {
      console.warn('Socket.IO未连接，无法加入课程')
      return false
    }

    socket.value.emit('join_lesson', {
      lessonId,
      userId,
      role,
      classroomId
    })
    return true
  }

  // 离开课程房间
  const leaveLesson = (lessonId: string, userId: string) => {
    if (!socket.value?.connected) {
      return false
    }

    socket.value.emit('leave_lesson', {
      lessonId,
      userId
    })
    return true
  }

  // 切换环节
  const changeSection = (lessonId: string, sectionIndex: number, section: any) => {
    if (!socket.value?.connected) {
      return false
    }

    socket.value.emit('section_change', {
      lessonId,
      sectionIndex,
      section,
      timestamp: new Date().toISOString()
    })
    return true
  }

  // 改变课程状态
  const changeLessonState = (lessonId: string, state: 'started' | 'paused' | 'resumed' | 'ended', currentSection?: number) => {
    if (!socket.value?.connected) {
      return false
    }

    socket.value.emit('lesson_state_change', {
      lessonId,
      state,
      timestamp: new Date().toISOString(),
      currentSection
    })
    return true
  }

  // 提交学生交互
  const submitStudentInteraction = (lessonId: string, studentId: string, type: string, data: any) => {
    if (!socket.value?.connected) {
      return false
    }

    socket.value.emit('student_interaction', {
      lessonId,
      studentId,
      type,
      data,
      timestamp: new Date().toISOString()
    })
    return true
  }

  // 添加批注
  const addAnnotation = (lessonId: string, annotation: any) => {
    if (!socket.value?.connected) {
      return false
    }

    socket.value.emit('annotation_added', {
      lessonId,
      annotation,
      timestamp: new Date().toISOString()
    })
    return true
  }

  // 添加消息监听器
  const onMessage = (listener: (message: any) => void) => {
    messageListeners.add(listener)
    return () => messageListeners.delete(listener)
  }

  // 添加状态监听器
  const onStatusChange = (listener: (status: SocketState['connectionStatus']) => void) => {
    statusListeners.add(listener)
    return () => statusListeners.delete(listener)
  }

  // 添加错误监听器
  const onError = (listener: (error: Error) => void) => {
    errorListeners.add(listener)
    return () => errorListeners.delete(listener)
  }

  // 获取连接状态
  const getConnectionState = () => ({
    isConnected: state.value.isConnected,
    isConnecting: state.value.isConnecting,
    connectionStatus: state.value.connectionStatus,
    reconnectAttempts: state.value.reconnectAttempts,
    lastError: state.value.lastError
  })

  // 清理资源
  const cleanup = () => {
    disconnect()
    messageListeners.clear()
    statusListeners.clear()
    errorListeners.clear()
  }

  // 生命周期
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    isConnected: computed(() => state.value.isConnected),
    isConnecting: computed(() => state.value.isConnecting),
    connectionStatus: computed(() => state.value.connectionStatus),
    lastMessage: computed(() => state.value.lastMessage),
    lastError: computed(() => state.value.lastError),
    reconnectAttempts: computed(() => state.value.reconnectAttempts),

    // 方法
    connect,
    disconnect,
    joinLesson,
    leaveLesson,
    changeSection,
    changeLessonState,
    submitStudentInteraction,
    addAnnotation,
    onMessage,
    onStatusChange,
    onError,
    getConnectionState,
    cleanup,

    // 获取socket实例（用于高级用法）
    getSocket: () => socket.value
  }
}