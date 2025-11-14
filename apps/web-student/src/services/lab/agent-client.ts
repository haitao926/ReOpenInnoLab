// ===================
// Agent客户端服务
// ===================

import { agentCommunicationService, type AgentStatus } from './agent-communication'
import type { LabSession, ExperimentConfig } from '@/types/course'

/**
 * Agent客户端服务
 * 提供高级的Agent操作接口
 */
export class AgentClientService {
  private static instance: AgentClientService
  private isConnected = false
  private connectionConfig: AgentConnectionConfig | null = null

  static getInstance(): AgentClientService {
    if (!AgentClientService.instance) {
      AgentClientService.instance = new AgentClientService()
    }
    return AgentClientService.instance
  }

  /**
   * 初始化Agent客户端
   */
  async initialize(config: AgentConnectionConfig): Promise<void> {
    try {
      this.connectionConfig = config

      await agentCommunicationService.connect(config.url, config.token)
      this.isConnected = true

      console.log('Agent client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize agent client:', error)
      this.isConnected = false
      throw error
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    agentCommunicationService.disconnect()
    this.isConnected = false
    this.connectionConfig = null
  }

  /**
   * 检查连接状态
   */
  isAgentConnected(): boolean {
    return this.isConnected && agentCommunicationService.getConnectionStatus().connected
  }

  /**
   * 创建实验会话
   */
  async createLabSession(
    activityId: string,
    config: ExperimentConfig,
    studentId: string = 'current_student'
  ): Promise<LabSession> {
    if (!this.isAgentConnected()) {
      throw new Error('Agent not connected')
    }

    try {
      const sessionConfig = {
        activity_id: activityId,
        student_id: studentId,
        experiment_type: config.experimentType,
        config: {
          environment: config.environment,
          dependencies: config.dependencies,
          resources: config.resources,
          expectedOutputs: config.expectedOutputs,
          jupyterConfig: config.jupyterConfig,
          aiConfig: config.aiConfig,
          simulationConfig: config.simulationConfig
        }
      }

      const sessionInfo = await agentCommunicationService.createSession(sessionConfig)

      // 转换为LabSession格式
      const session: LabSession = {
        id: sessionInfo.id,
        activityId,
        studentId,
        status: 'running',
        startTime: new Date(sessionInfo.start_time),
        url: sessionInfo.url,
        containerId: sessionInfo.container_id,
        resourceUsage: sessionInfo.resource_usage || {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        },
        logs: []
      }

      return session

    } catch (error) {
      console.error('Failed to create lab session:', error)
      throw error
    }
  }

  /**
   * 停止实验会话
   */
  async stopLabSession(sessionId: string): Promise<boolean> {
    if (!this.isAgentConnected()) {
      return false
    }

    try {
      const result = await agentCommunicationService.stopSession(sessionId)
      return result.success
    } catch (error) {
      console.error('Failed to stop lab session:', error)
      return false
    }
  }

  /**
   * 重启实验会话
   */
  async restartLabSession(sessionId: string): Promise<boolean> {
    if (!this.isAgentConnected()) {
      return false
    }

    try {
      const result = await agentCommunicationService.restartSession(sessionId)
      return result.success
    } catch (error) {
      console.error('Failed to restart lab session:', error)
      return false
    }
  }

  /**
   * 获取会话详情
   */
  async getSessionDetails(sessionId: string): Promise<any> {
    if (!this.isAgentConnected()) {
      throw new Error('Agent not connected')
    }

    return agentCommunicationService.getSessionDetails(sessionId)
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(): Promise<any[]> {
    if (!this.isAgentConnected()) {
      return []
    }

    try {
      const sessionList = await agentCommunicationService.getSessions()
      return sessionList.sessions || []
    } catch (error) {
      console.error('Failed to get sessions:', error)
      return []
    }
  }

  /**
   * 获取Agent状态
   */
  async getAgentStatus(): Promise<AgentStatus | null> {
    if (!this.isAgentConnected()) {
      return null
    }

    try {
      return await agentCommunicationService.getStatus()
    } catch (error) {
      console.error('Failed to get agent status:', error)
      return null
    }
  }

  /**
   * 获取资源使用情况
   */
  async getResourceUsage(sessionId?: string): Promise<any> {
    if (!this.isAgentConnected()) {
      return null
    }

    try {
      if (sessionId) {
        const details = await agentCommunicationService.getSessionDetails(sessionId)
        return details.resource_usage
      } else {
        return await agentCommunicationService.getResourceUsage()
      }
    } catch (error) {
      console.error('Failed to get resource usage:', error)
      return null
    }
  }

  /**
   * 获取性能统计
   */
  async getPerformanceStats(): Promise<any> {
    if (!this.isAgentConnected()) {
      return null
    }

    try {
      return await agentCommunicationService.getPerformanceStats()
    } catch (error) {
      console.error('Failed to get performance stats:', error)
      return null
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<any> {
    if (!this.isAgentConnected()) {
      return null
    }

    try {
      return await agentCommunicationService.healthCheck()
    } catch (error) {
      console.error('Failed to perform health check:', error)
      return null
    }
  }

  /**
   * 获取错误日志
   */
  async getErrorLogs(limit = 50): Promise<any[]> {
    if (!this.isAgentConnected()) {
      return []
    }

    try {
      const result = await agentCommunicationService.getErrorLogs(limit)
      return result.logs || []
    } catch (error) {
      console.error('Failed to get error logs:', error)
      return []
    }
  }

  /**
   * Ping测试
   */
  async ping(): Promise<number> {
    if (!this.isAgentConnected()) {
      throw new Error('Agent not connected')
    }

    try {
      const response = await agentCommunicationService.ping()
      return response.latency
    } catch (error) {
      console.error('Ping failed:', error)
      throw error
    }
  }

  /**
   * 获取版本信息
   */
  async getVersion(): Promise<any> {
    if (!this.isAgentConnected()) {
      return null
    }

    try {
      return await agentCommunicationService.getVersion()
    } catch (error) {
      console.error('Failed to get version:', error)
      return null
    }
  }

  /**
   * 清理会话
   */
  async cleanupSessions(): Promise<any> {
    if (!this.isAgentConnected()) {
      return null
    }

    try {
      return await agentCommunicationService.cleanupSessions()
    } catch (error) {
      console.error('Failed to cleanup sessions:', error)
      return null
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      client: this.isConnected,
      communication: agentCommunicationService.getConnectionStatus()
    }
  }

  /**
   * 订阅事件
   */
  subscribe(type: string, handler: (message: any) => void): () => void {
    return agentCommunicationService.subscribe(type, handler)
  }

  /**
   * 队列命令（离线时使用）
   */
  queueCommand(command: string, params?: any): void {
    agentCommunicationService.queueCommand(command, params)
  }

  /**
   * 执行自定义命令
   */
  async executeCommand(command: string, params?: any, timeout = 30000): Promise<any> {
    if (!this.isAgentConnected()) {
      throw new Error('Agent not connected')
    }

    return agentCommunicationService.sendCommand(command, params, timeout)
  }
}

// ===================
// 类型定义
// ===================

export interface AgentConnectionConfig {
  url: string
  token?: string
  heartbeatInterval?: number
  autoReconnect?: boolean
  maxReconnectAttempts?: number
}

// 导出单例实例
export const agentClientService = AgentClientService.getInstance()