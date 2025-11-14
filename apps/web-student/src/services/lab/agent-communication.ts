// ===================
// Agent通信服务
// ===================

/**
 * Agent通信服务
 * 处理与Lab Agent的WebSocket通信
 */
export class AgentCommunicationService {
  private static instance: AgentCommunicationService
  private ws: WebSocket | null = null
  private url: string = ''
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private messageHandlers = new Map<string, Set<MessageHandler>>()
  private pendingRequests = new Map<string, PendingRequest>()
  private commandQueue: AgentCommand[] = []

  static getInstance(): AgentCommunicationService {
    if (!AgentCommunicationService.instance) {
      AgentCommunicationService.instance = new AgentCommunicationService()
    }
    return AgentCommunicationService.instance
  }

  /**
   * 连接到Agent
   */
  async connect(url: string, token?: string): Promise<void> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    this.url = url
    const wsUrl = this.buildWebSocketUrl(url, token)

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('Agent WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processCommandQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = (event) => {
          console.log('Agent WebSocket disconnected:', event.code, event.reason)
          this.isConnected = false
          this.stopHeartbeat()
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('Agent WebSocket error:', error)
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
   * 发送命令
   */
  async sendCommand(command: string, params?: any, timeout = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('Agent not connected'))
        return
      }

      const requestId = this.generateRequestId()
      const commandMessage: AgentMessage = {
        id: requestId,
        type: 'command',
        command,
        params: params || {},
        timestamp: Date.now()
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        const request = this.pendingRequests.get(requestId)
        if (request) {
          this.pendingRequests.delete(requestId)
          reject(new Error(`Command timeout: ${command}`))
        }
      }, timeout)

      // 保存待处理的请求
      this.pendingRequests.set(requestId, {
        command,
        resolve,
        reject,
        timeoutId
      })

      try {
        this.ws.send(JSON.stringify(commandMessage))
      } catch (error) {
        this.pendingRequests.delete(requestId)
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  /**
   * 队列命令（如果未连接则排队）
   */
  queueCommand(command: string, params?: any): void {
    const cmd: AgentCommand = {
      command,
      params: params || {},
      timestamp: Date.now()
    }

    this.commandQueue.push(cmd)
  }

  /**
   * 获取状态
   */
  async getStatus(): Promise<AgentStatus> {
    return this.sendCommand('status')
  }

  /**
   * 获取版本信息
   */
  async getVersion(): Promise<AgentVersion> {
    return this.sendCommand('version')
  }

  /**
   * Ping测试
   */
  async ping(): Promise<PingResponse> {
    const start = Date.now()
    const response = await this.sendCommand('ping')
    return {
      ...response,
      latency: Date.now() - start
    }
  }

  /**
   * 获取资源使用情况
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    return this.sendCommand('resource_usage')
  }

  /**
   * 获取会话列表
   */
  async getSessions(): Promise<SessionList> {
    return this.sendCommand('list_sessions')
  }

  /**
   * 创建会话
   */
  async createSession(config: SessionConfig): Promise<SessionInfo> {
    return this.sendCommand('create_session', config)
  }

  /**
   * 停止会话
   */
  async stopSession(sessionId: string): Promise<SessionResult> {
    return this.sendCommand('stop_session', { session_id: sessionId })
  }

  /**
   * 重启会话
   */
  async restartSession(sessionId: string): Promise<SessionResult> {
    return this.sendCommand('restart_session', { session_id: sessionId })
  }

  /**
   * 获取会话详情
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetails> {
    return this.sendCommand('session_details', { session_id: sessionId })
  }

  /**
   * 清理会话
   */
  async cleanupSessions(): Promise<CleanupResult> {
    return this.sendCommand('cleanup_sessions')
  }

  /**
   * 获取性能统计
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    return this.sendCommand('performance_stats')
  }

  /**
   * 获取错误日志
   */
  async getErrorLogs(limit = 50): Promise<ErrorLogs> {
    return this.sendCommand('error_logs', { limit })
  }

  /**
   * 执行健康检查
   */
  async healthCheck(): Promise<HealthCheckResult> {
    return this.sendCommand('health_check')
  }

  /**
   * 重启Agent
   */
  async restartAgent(): Promise<RestartResult> {
    return this.sendCommand('restart')
  }

  /**
   * 获取配置信息
   */
  async getConfig(): Promise<AgentConfig> {
    return this.sendCommand('config')
  }

  /**
   * 订阅消息
   */
  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }

    this.messageHandlers.get(type)!.add(handler)

    // 返回取消订阅函数
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(type)
        }
      }
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      readyState: this.ws?.readyState ?? WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts,
      queuedCommands: this.commandQueue.length,
      pendingRequests: this.pendingRequests.size
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
      const message: AgentMessage = JSON.parse(event.data)
      this.processMessage(message)
    } catch (error) {
      console.error('Failed to parse agent message:', error)
    }
  }

  private processMessage(message: AgentMessage): void {
    // 处理命令响应
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!
      this.pendingRequests.delete(message.id)
      clearTimeout(request.timeoutId)

      if (message.error) {
        request.reject(new Error(message.error))
      } else {
        request.resolve(message.data)
      }
    }

    // 通知订阅者
    this.notifySubscribers(message.type, message)
  }

  private notifySubscribers(type: string, message: AgentMessage): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error('Error in agent message handler:', error)
        }
      })
    }

    // 通用消息监听器
    const allHandlers = this.messageHandlers.get('*')
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error('Error in universal agent message handler:', error)
        }
      })
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max agent reconnection attempts reached')
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)

    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Reconnecting to agent (attempt ${this.reconnectAttempts + 1})`)
      this.reconnectAttempts++

      this.connect(this.url)
        .then(() => {
          console.log('Agent reconnected successfully')
        })
        .catch((error) => {
          console.error('Agent reconnection failed:', error)
        })
    }, delay)
  }

  private processCommandQueue(): void {
    while (this.commandQueue.length > 0 && this.isConnected) {
      const command = this.commandQueue.shift()!
      this.sendCommand(command.command, command.params)
        .catch(error => {
          console.error('Failed to send queued command:', command.command, error)
        })
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected && this.ws) {
        try {
          this.ws.send(JSON.stringify({
            id: this.generateRequestId(),
            type: 'heartbeat',
            timestamp: Date.now()
          }))
        } catch (error) {
          console.error('Failed to send agent heartbeat:', error)
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

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ===================
// 类型定义
// ===================

export interface AgentMessage {
  id: string
  type: string
  command?: string
  params?: any
  data?: any
  error?: string
  timestamp: number
}

export interface AgentCommand {
  command: string
  params: any
  timestamp: number
}

export interface PendingRequest {
  command: string
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeoutId: number
}

export interface ConnectionStatus {
  connected: boolean
  readyState: number
  reconnectAttempts: number
  queuedCommands: number
  pendingRequests: number
}

export type MessageHandler = (message: AgentMessage) => void

// Agent响应类型
export interface AgentStatus {
  status: string
  uptime: number
  version: string
}

export interface AgentVersion {
  version: string
  build: string
  git_commit: string
  build_time: string
}

export interface PingResponse {
  type: string
  timestamp: string
  latency: number
}

export interface ResourceUsage {
  cpu: number
  memory: number
  disk: number
  network: number
}

export interface SessionList {
  sessions: SessionInfo[]
  total: number
  running: number
  stopped: number
}

export interface SessionInfo {
  id: string
  activity_id: string
  student_id: string
  status: string
  start_time: string
  end_time?: string
  url?: string
  resource_usage?: ResourceUsage
}

export interface SessionConfig {
  activity_id: string
  student_id: string
  experiment_type: string
  config?: any
}

export interface SessionResult {
  success: boolean
  session_id?: string
  error?: string
}

export interface SessionDetails extends SessionInfo {
  logs: any[]
  config: any
  metadata?: any
}

export interface CleanupResult {
  cleaned: number
  errors: string[]
}

export interface PerformanceStats {
  requests_per_second: number
  avg_response_time: number
  peak_memory: number
  uptime: number
}

export interface ErrorLogs {
  logs: Array<{
    timestamp: string
    level: string
    message: string
    data?: any
  }>
  total: number
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  checks: Array<{
    name: string
    status: 'pass' | 'fail'
    message?: string
  }>
}

export interface RestartResult {
  status: string
  eta?: string
}

export interface AgentConfig {
  max_sessions: number
  default_runtime: string
  resource_limits: {
    cpu: string
    memory: string
    disk: string
  }
  allowed_runtimes: string[]
  security_policies: string[]
}

// 导出单例实例
export const agentCommunicationService = AgentCommunicationService.getInstance()