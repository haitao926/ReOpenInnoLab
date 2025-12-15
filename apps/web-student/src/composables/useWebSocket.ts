import { ref, onMounted, onUnmounted } from 'vue'
import type { WebSocketMessage, LessonEvent } from '@shared-utils/websocket/types'

export interface UseWebSocketOptions {
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatTimeout?: number
}

export interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  lastMessage: WebSocketMessage | null
  lastError: Error | null
  reconnectAttempts: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    heartbeatTimeout = 5000
  } = options

  // 状态管理
  const socket = ref<WebSocket | null>(null)
  const state = ref<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    lastError: null,
    reconnectAttempts: 0
  })

  // 心跳检测
  let heartbeatTimer: NodeJS.Timeout | null = null
  let heartbeatTimeoutTimer: NodeJS.Timeout | null = null
  let reconnectTimer: NodeJS.Timeout | null = null

  // 事件监听器
  const messageListeners = new Set<(message: WebSocketMessage) => void>()
  const statusListeners = new Set<(status: WebSocketState['connectionStatus']) => void>()
  const errorListeners = new Set<(error: Error) => void>()

  // 获取WebSocket URL
  const getWebSocketUrl = (path: string = '') => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws${path}`
  }

  // 更新连接状态
  const updateConnectionStatus = (status: WebSocketState['connectionStatus']) => {
    state.value.connectionStatus = status
    state.value.isConnected = status === 'connected'
    state.value.isConnecting = status === 'connecting' || status === 'reconnecting'

    statusListeners.forEach(listener => listener(status))
  }

  // 发送心跳
  const sendHeartbeat = () => {
    if (socket.value && state.value.isConnected) {
      try {
        socket.value.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }))

        // 设置心跳超时
        heartbeatTimeoutTimer = setTimeout(() => {
          console.warn('心跳超时，断开连接')
          disconnect()
          if (autoReconnect) {
            attemptReconnect()
          }
        }, heartbeatTimeout)
      } catch (error) {
        console.error('发送心跳失败:', error)
      }
    }
  }

  // 开始心跳
  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatTimer = setInterval(sendHeartbeat, heartbeatInterval)
    // 立即发送一次心跳
    sendHeartbeat()
  }

  // 停止心跳
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer)
      heartbeatTimeoutTimer = null
    }
  }

  // 处理消息
  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      state.value.lastMessage = message

      // 处理心跳响应
      if (message.type === 'pong') {
        if (heartbeatTimeoutTimer) {
          clearTimeout(heartbeatTimeoutTimer)
          heartbeatTimeoutTimer = null
        }
        return
      }

      // 通知消息监听器
      messageListeners.forEach(listener => listener(message))
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  }

  // 处理连接打开
  const handleOpen = () => {
    console.log('WebSocket连接已建立')
    updateConnectionStatus('connected')
    state.value.reconnectAttempts = 0
    state.value.lastError = null

    // 开始心跳
    startHeartbeat()
  }

  // 处理连接关闭
  const handleClose = (event: CloseEvent) => {
    console.log('WebSocket连接已关闭:', event.code, event.reason)
    updateConnectionStatus('disconnected')
    stopHeartbeat()

    // 如果不是主动关闭，尝试重连
    if (event.code !== 1000 && autoReconnect) {
      attemptReconnect()
    }
  }

  // 处理连接错误
  const handleError = (event: Event) => {
    const error = new Error('WebSocket连接错误')
    console.error('WebSocket连接错误:', event)
    state.value.lastError = error
    updateConnectionStatus('disconnected')

    errorListeners.forEach(listener => listener(error))
  }

  // 尝试重连
  const attemptReconnect = () => {
    if (state.value.reconnectAttempts >= maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连')
      return
    }

    state.value.reconnectAttempts++
    updateConnectionStatus('reconnecting')

    console.log(`尝试重连 (${state.value.reconnectAttempts}/${maxReconnectAttempts})...`)

    reconnectTimer = setTimeout(() => {
      connect()
    }, reconnectInterval)
  }

  // 连接WebSocket
  const connect = async (path: string = '') => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    if (socket.value?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      updateConnectionStatus('connecting')
      const url = getWebSocketUrl(path)

      socket.value = new WebSocket(url)

      socket.value.onopen = handleOpen
      socket.value.onclose = handleClose
      socket.value.onerror = handleError
      socket.value.onmessage = handleMessage

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      updateConnectionStatus('disconnected')
      state.value.lastError = error as Error

      if (autoReconnect) {
        attemptReconnect()
      }
    }
  }

  // 断开连接
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    stopHeartbeat()

    if (socket.value) {
      socket.value.close(1000, 'User disconnect')
      socket.value = null
    }

    updateConnectionStatus('disconnected')
  }

  // 发送消息
  const sendMessage = (message: WebSocketMessage | any) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息')
      return false
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || Date.now()
      }

      socket.value.send(JSON.stringify(messageWithTimestamp))
      return true
    } catch (error) {
      console.error('发送WebSocket消息失败:', error)
      state.value.lastError = error as Error
      return false
    }
  }

  // 发送课程事件
  const sendLessonEvent = (event: LessonEvent) => {
    return sendMessage({
      type: 'lesson:event',
      data: event
    })
  }

  // 发送学生状态
  const sendStudentStatus = (status: any) => {
    return sendMessage({
      type: 'student:status',
      data: status
    })
  }

  // 添加消息监听器
  const onMessage = (listener: (message: WebSocketMessage) => void) => {
    messageListeners.add(listener)
    return () => messageListeners.delete(listener)
  }

  // 添加状态监听器
  const onStatusChange = (listener: (status: WebSocketState['connectionStatus']) => void) => {
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
    // 状态 - 返回ref而不是value
    isConnected: computed(() => state.value.isConnected),
    isConnecting: computed(() => state.value.isConnecting),
    connectionStatus: computed(() => state.value.connectionStatus),
    lastMessage: computed(() => state.value.lastMessage),
    lastError: computed(() => state.value.lastError),
    reconnectAttempts: computed(() => state.value.reconnectAttempts),

    // 方法
    connect,
    disconnect,
    sendMessage,
    sendLessonEvent,
    sendStudentStatus,
    onMessage,
    onStatusChange,
    onError,
    getConnectionState,
    cleanup,

    // 手动触发重连
    reconnect: () => {
      if (autoReconnect) {
        state.value.reconnectAttempts = 0
        attemptReconnect()
      }
    }
  }
}
