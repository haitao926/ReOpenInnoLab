// 实验服务模块导出
export { AgentCommunicationService, agentCommunicationService } from './agent-communication'
export { AgentClientService, agentClientService, type AgentConnectionConfig } from './agent-client'

// 统一的实验服务
export class LabService {
  private agentClient = agentClientService

  /**
   * 初始化实验服务
   */
  async initialize(config: AgentConnectionConfig): Promise<void> {
    try {
      await this.agentClient.initialize(config)
      console.log('Lab service initialized')
    } catch (error) {
      console.error('Failed to initialize lab service:', error)
      throw error
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.agentClient.disconnect()
  }

  /**
   * 检查Agent连接状态
   */
  isAgentConnected(): boolean {
    return this.agentClient.isAgentConnected()
  }

  /**
   * 创建实验会话
   */
  async createSession(
    activityId: string,
    config: any,
    studentId?: string
  ): Promise<any> {
    return this.agentClient.createLabSession(activityId, config, studentId)
  }

  /**
   * 停止会话
   */
  async stopSession(sessionId: string): Promise<boolean> {
    return this.agentClient.stopLabSession(sessionId)
  }

  /**
   * 重启会话
   */
  async restartSession(sessionId: string): Promise<boolean> {
    return this.agentClient.restartLabSession(sessionId)
  }

  /**
   * 获取会话详情
   */
  async getSessionDetails(sessionId: string): Promise<any> {
    return this.agentClient.getSessionDetails(sessionId)
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(): Promise<any[]> {
    return this.agentClient.getAllSessions()
  }

  /**
   * 获取Agent状态
   */
  async getAgentStatus(): Promise<any> {
    return this.agentClient.getAgentStatus()
  }

  /**
   * 获取资源使用情况
   */
  async getResourceUsage(sessionId?: string): Promise<any> {
    return this.agentClient.getResourceUsage(sessionId)
  }

  /**
   * 获取性能统计
   */
  async getPerformanceStats(): Promise<any> {
    return this.agentClient.getPerformanceStats()
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<any> {
    return this.agentClient.performHealthCheck()
  }

  /**
   * 获取错误日志
   */
  async getErrorLogs(limit?: number): Promise<any[]> {
    return this.agentClient.getErrorLogs(limit)
  }

  /**
   * Ping测试
   */
  async ping(): Promise<number> {
    return this.agentClient.ping()
  }

  /**
   * 获取版本信息
   */
  async getVersion(): Promise<any> {
    return this.agentClient.getVersion()
  }

  /**
   * 清理会话
   */
  async cleanupSessions(): Promise<any> {
    return this.agentClient.cleanupSessions()
  }

  /**
   * 执行自定义命令
   */
  async executeCommand(command: string, params?: any, timeout?: number): Promise<any> {
    return this.agentClient.executeCommand(command, params, timeout)
  }

  /**
   * 订阅事件
   */
  subscribe(type: string, handler: (message: any) => void): () => void {
    return this.agentClient.subscribe(type, handler)
  }

  /**
   * 队列命令
   */
  queueCommand(command: string, params?: any): void {
    this.agentClient.queueCommand(command, params)
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return this.agentClient.getConnectionStatus()
  }

  /**
   * 综合健康检查
   */
  async comprehensiveHealthCheck(): Promise<{
    agent: any
    connectivity: number
    resources: any
    performance: any
    overall: 'healthy' | 'warning' | 'unhealthy'
  }> {
    const results = {
      agent: null as any,
      connectivity: 0,
      resources: null as any,
      performance: null as any,
      overall: 'healthy' as 'healthy' | 'warning' | 'unhealthy'
    }

    try {
      // 连接性测试
      results.connectivity = await this.ping()

      // Agent状态
      results.agent = await this.getAgentStatus()

      // 资源使用
      results.resources = await this.getResourceUsage()

      // 性能统计
      results.performance = await this.getPerformanceStats()

      // 健康检查
      const healthCheck = await this.performHealthCheck()

      // 综合评估
      if (results.connectivity > 1000) {
        results.overall = 'warning'
      }

      if (healthCheck && healthCheck.status === 'unhealthy') {
        results.overall = 'unhealthy'
      }

    } catch (error) {
      console.error('Comprehensive health check failed:', error)
      results.overall = 'unhealthy'
    }

    return results
  }

  /**
   * 批量操作
   */
  async batchOperation(operations: Array<{
    type: 'stop' | 'restart' | 'cleanup'
    sessionIds?: string[]
  }>): Promise<any> {
    const results = {
      success: [],
      failed: [] as any[]
    }

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'stop':
            if (operation.sessionIds) {
              for (const sessionId of operation.sessionIds) {
                const success = await this.stopSession(sessionId)
                if (success) {
                  results.success.push({ type: 'stop', sessionId })
                } else {
                  results.failed.push({ type: 'stop', sessionId, error: 'Stop failed' })
                }
              }
            }
            break

          case 'restart':
            if (operation.sessionIds) {
              for (const sessionId of operation.sessionIds) {
                const success = await this.restartSession(sessionId)
                if (success) {
                  results.success.push({ type: 'restart', sessionId })
                } else {
                  results.failed.push({ type: 'restart', sessionId, error: 'Restart failed' })
                }
              }
            }
            break

          case 'cleanup':
            const cleanupResult = await this.cleanupSessions()
            results.success.push({ type: 'cleanup', result: cleanupResult })
            break
        }
      } catch (error) {
        results.failed.push({ type: operation.type, error })
      }
    }

    return results
  }

  /**
   * 监控会话状态
   */
  async monitorSession(sessionId: string, interval = 5000): Promise<(() => void)> {
    let monitoring = true
    const intervalId = setInterval(async () => {
      if (!monitoring) return

      try {
        const details = await this.getSessionDetails(sessionId)
        // 可以在这里处理会话状态变化
        console.log(`Session ${sessionId} status:`, details.status)
      } catch (error) {
        console.error(`Failed to monitor session ${sessionId}:`, error)
      }
    }, interval)

    // 返回停止监控的函数
    return () => {
      monitoring = false
      clearInterval(intervalId)
    }
  }

  /**
   * 自动清理
   */
  async autoCleanup(options: {
    maxAge?: number // 最大会话年龄（毫秒）
    maxSessions?: number // 最大会话数量
    idleThreshold?: number // 空闲阈值（毫秒）
  } = {}): Promise<any> {
    try {
      const sessions = await this.getAllSessions()
      const now = Date.now()
      const maxAge = options.maxAge || 24 * 60 * 60 * 1000 // 24小时
      const maxSessions = options.maxSessions || 50
      const idleThreshold = options.idleThreshold || 2 * 60 * 60 * 1000 // 2小时

      const sessionsToCleanup = sessions.filter(session => {
        const age = now - new Date(session.start_time).getTime()
        const lastActivity = session.end_time ?
          new Date(session.end_time).getTime() : now

        return age > maxAge ||
               (now - lastActivity) > idleThreshold ||
               sessions.length > maxSessions
      })

      if (sessionsToCleanup.length > 0) {
        const results = await this.batchOperation([
          {
            type: 'stop',
            sessionIds: sessionsToCleanup.map(s => s.id)
          }
        ])

        return {
          cleaned: sessionsToCleanup.length,
          results
        }
      }

      return { cleaned: 0 }

    } catch (error) {
      console.error('Auto cleanup failed:', error)
      throw error
    }
  }
}

// 导出服务实例
export const labService = new LabService()