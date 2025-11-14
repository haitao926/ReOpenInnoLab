import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 导入类型定义
import type {
  LabSession,
  LabResourceUsage,
  LabLog,
  LabAgentStatus,
  ExperimentConfig,
  ActivityContext,
  ActivityExecutionState
} from '@/types/course'

// 导入通信服务
import { communicationService } from '@/services/communication'

// 导入数据持久化服务
import { useOfflineData } from '@/services/persistence/offline-data.service'

// ===================
// 实验状态管理Store
// ===================

/**
 * 实验状态管理Store
 * 处理Jupyter实验环境的状态管理和生命周期
 */
export const useLabStore = defineStore('lab', () => {
  // 离线数据服务
  const offlineData = useOfflineData()

  // 基础状态
  const sessions = ref<Map<string, LabSession>>(new Map())
  const currentSession = ref<LabSession | null>(null)
  const agentStatus = ref<LabAgentStatus | null>(null)
  const logs = ref<Map<string, LabLog[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // WebSocket连接状态
  const websocketConnected = ref(false)
  const heartbeatInterval = ref<number | null>(null)

  // ===================
  // 计算属性
  // ===================

  const hasActiveSession = computed(() => {
    return currentSession.value !== null
  })

  const sessionCount = computed(() => {
    return sessions.value.size
  })

  const runningSessions = computed(() => {
    return Array.from(sessions.value.values()).filter(
      session => session.status === 'running'
    )
  })

  const currentSessionId = computed(() => {
    return currentSession.value?.id || null
  })

  const isAgentOnline = computed(() => {
    return agentStatus.value?.status === 'online'
  })

  const resourceUsage = computed(() => {
    return currentSession.value?.resourceUsage || {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0
    }
  })

  const recentLogs = computed(() => {
    if (!currentSession.value) return []

    const sessionLogs = logs.value.get(currentSession.value.id) || []
    return sessionLogs.slice(-20) // 最近20条日志
  })

  // ===================
  // 基础操作
  // ===================

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const resetState = () => {
    // 清理所有会话
    sessions.value.forEach(session => {
      if (session.status === 'running') {
        stopSession(session.id)
      }
    })

    sessions.value.clear()
    currentSession.value = null
    agentStatus.value = null
    logs.value.clear()
    clearError()

    // 清理心跳
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  // ===================
  // 会话管理
  // ===================

  /**
   * 创建实验会话
   */
  const createSession = async (
    activityId: string,
    activityContext: ActivityContext
  ): Promise<LabSession | null> => {
    setLoading(true)
    clearError()

    try {
      const config = activityContext.activity.experimentConfig
      if (!config) {
        throw new Error('实验配置不存在')
      }

      // 创建会话对象
      const session: LabSession = {
        id: generateSessionId(),
        activityId,
        studentId: 'current_student', // 应该从用户store获取
        status: 'initializing',
        startTime: new Date(),
        logs: [],
        resourceUsage: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        }
      }

      // 添加到会话列表
      sessions.value.set(session.id, session)
      currentSession.value = session

      // 初始化日志
      logs.value.set(session.id, [])
      addLog(session.id, 'info', '开始初始化实验环境')

      // 启动实验环境
      await startLabEnvironment(session, config, activityContext)

      return session

    } catch (err) {
      console.error('Failed to create lab session:', err)
      setError(err instanceof Error ? err.message : '创建实验会话失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 启动实验环境
   */
  const startLabEnvironment = async (
    session: LabSession,
    config: ExperimentConfig,
    context: ActivityContext
  ): Promise<void> => {
    try {
      addLog(session.id, 'info', '启动实验环境...')

      // 发送启动请求到服务器
      await communicationService.updateStatus(
        'lab',
        session.id,
        'starting',
        {
          config,
          context
        }
      )

      // 模拟启动过程
      session.status = 'starting'
      addLog(session.id, 'info', `启动${config.experimentType}实验环境`)

      // 根据实验类型进行不同的初始化
      switch (config.experimentType) {
        case 'jupyter':
          await startJupyterEnvironment(session, config.jupyterConfig!)
          break
        case 'ai':
          await startAIEnvironment(session, config.aiConfig!)
          break
        case 'simulation':
          await startSimulationEnvironment(session, config.simulationConfig!)
          break
      }

      // 标记为运行中
      session.status = 'running'
      session.url = generateSessionUrl(session.id, config.experimentType)
      addLog(session.id, 'info', '实验环境启动成功')

      // 发送状态更新
      await communicationService.sendLabStatus(session.id, 'running', {
        url: session.url,
        config
      })

      // 开始监控
      startMonitoring(session)

      ElMessage.success('实验环境已启动')

    } catch (err) {
      console.error('Failed to start lab environment:', err)
      session.status = 'error'
      addLog(session.id, 'error', `启动失败: ${err instanceof Error ? err.message : '未知错误'}`)
      throw err
    }
  }

  /**
   * 停止实验会话
   */
  const stopSession = async (sessionId: string): Promise<boolean> => {
    const session = sessions.value.get(sessionId)
    if (!session) {
      return false
    }

    try {
      addLog(sessionId, 'info', '正在停止实验环境...')

      // 发送停止请求
      await communicationService.sendLabStatus(sessionId, 'stopped')

      // 更新状态
      session.status = 'stopped'
      session.endTime = new Date()

      addLog(sessionId, 'info', '实验环境已停止')

      // 如果是当前会话，清除当前状态
      if (currentSession.value?.id === sessionId) {
        currentSession.value = null
      }

      // 停止监控
      stopMonitoring(sessionId)

      ElMessage.info('实验环境已停止')
      return true

    } catch (err) {
      console.error('Failed to stop lab session:', err)
      addLog(sessionId, 'error', `停止失败: ${err instanceof Error ? err.message : '未知错误'}`)
      return false
    }
  }

  /**
   * 重启实验会话
   */
  const restartSession = async (sessionId: string): Promise<boolean> => {
    const session = sessions.value.get(sessionId)
    if (!session) {
      return false
    }

    try {
      addLog(sessionId, 'info', '重启实验环境...')

      // 先停止
      await stopSession(sessionId)

      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 重新启动
      session.status = 'initializing'
      session.startTime = new Date()
      session.endTime = undefined

      addLog(sessionId, 'info', '实验环境重启完成')
      return true

    } catch (err) {
      console.error('Failed to restart lab session:', err)
      addLog(sessionId, 'error', `重启失败: ${err instanceof Error ? err.message : '未知错误'}`)
      return false
    }
  }

  /**
   * 获取会话
   */
  const getSession = (sessionId: string): LabSession | undefined => {
    return sessions.value.get(sessionId)
  }

  /**
   * 设置当前会话
   */
  const setCurrentSession = (sessionId: string): boolean => {
    const session = sessions.value.get(sessionId)
    if (session) {
      currentSession.value = session
      return true
    }
    return false
  }

  // ===================
  // 日志管理
  // ===================

  /**
   * 添加日志
   */
  const addLog = (sessionId: string, level: LabLog['level'], message: string, data?: any): void => {
    const log: LabLog = {
      timestamp: new Date(),
      level,
      message,
      data
    }

    if (!logs.value.has(sessionId)) {
      logs.value.set(sessionId, [])
    }

    const sessionLogs = logs.value.get(sessionId)!
    sessionLogs.push(log)

    // 限制日志数量
    if (sessionLogs.length > 1000) {
      sessionLogs.splice(0, sessionLogs.length - 1000)
    }

    // 更新会话的日志
    const session = sessions.value.get(sessionId)
    if (session) {
      session.logs = sessionLogs
    }
  }

  /**
   * 清空日志
   */
  const clearLogs = (sessionId: string): void => {
    logs.value.set(sessionId, [])
    const session = sessions.value.get(sessionId)
    if (session) {
      session.logs = []
    }
  }

  /**
   * 获取会话日志
   */
  const getSessionLogs = (sessionId: string): LabLog[] => {
    return logs.value.get(sessionId) || []
  }

  // ===================
  // Agent管理
  // ===================

  /**
   * 更新Agent状态
   */
  const updateAgentStatus = (status: LabAgentStatus): void => {
    agentStatus.value = status

    // 如果Agent离线，标记相关会话为错误
    if (status.status === 'offline') {
      sessions.value.forEach(session => {
        if (session.status === 'running') {
          session.status = 'error'
          addLog(session.id, 'error', 'Lab Agent离线')
        }
      })
    }
  }

  /**
   * 更新资源使用情况
   */
  const updateResourceUsage = (sessionId: string, usage: LabResourceUsage): void => {
    const session = sessions.value.get(sessionId)
    if (session) {
      session.resourceUsage = usage
    }
  }

  // ===================
  // 监控和心跳
  // ===================

  /**
   * 开始监控会话
   */
  const startMonitoring = (session: LabSession): void => {
    // 开始心跳检测
    if (!heartbeatInterval.value) {
      heartbeatInterval.value = window.setInterval(() => {
        checkSessionHealth(session.id)
      }, 10000) // 每10秒检查一次
    }

    // 订阅实时状态更新
    communicationService.onDataUpdate('lab', session.id, (result) => {
      if (result.success && result.data) {
        handleStatusUpdate(session.id, result.data)
      }
    })
  }

  /**
   * 停止监控会话
   */
  const stopMonitoring = (sessionId: string): void => {
    // 如果没有其他运行的会话，停止心跳
    const hasRunningSessions = Array.from(sessions.value.values()).some(
      s => s.status === 'running' && s.id !== sessionId
    )

    if (!hasRunningSessions && heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  /**
   * 检查会话健康状态
   */
  const checkSessionHealth = async (sessionId: string): Promise<void> => {
    const session = sessions.value.get(sessionId)
    if (!session || session.status !== 'running') {
      return
    }

    try {
      // 发送心跳
      await communicationService.sendLabStatus(sessionId, 'running', {
        heartbeat: true,
        timestamp: Date.now()
      })

    } catch (error) {
      console.error('Health check failed for session:', sessionId)
      addLog(sessionId, 'error', '健康检查失败')
    }
  }

  /**
   * 处理状态更新
   */
  const handleStatusUpdate = (sessionId: string, data: any): void => {
    const session = sessions.value.get(sessionId)
    if (!session) return

    if (data.status) {
      session.status = data.status
    }

    if (data.resourceUsage) {
      session.resourceUsage = data.resourceUsage
    }

    if (data.logs && Array.isArray(data.logs)) {
      data.logs.forEach((log: any) => {
        addLog(sessionId, log.level || 'info', log.message, log.data)
      })
    }
  }

  // ===================
  // 辅助方法
  // ===================

  const generateSessionId = (): string => {
    return `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const generateSessionUrl = (sessionId: string, experimentType: string): string => {
    const baseUrl = import.meta.env.VITE_LAB_BASE_URL || 'http://localhost:8888'

    switch (experimentType) {
      case 'jupyter':
        return `${baseUrl}/lab?token=${sessionId}`
      case 'ai':
        return `${baseUrl}/ai/${sessionId}`
      case 'simulation':
        return `${baseUrl}/simulation/${sessionId}`
      default:
        return `${baseUrl}/lab/${sessionId}`
    }
  }

  const startJupyterEnvironment = async (session: LabSession, config: any): Promise<void> => {
    addLog(session.id, 'info', '启动Jupyter环境...')
    // 具体的Jupyter启动逻辑
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟启动时间
    session.containerId = `jupyter_${session.id}`
    addLog(session.id, 'info', 'Jupyter环境已就绪')
  }

  const startAIEnvironment = async (session: LabSession, config: any): Promise<void> => {
    addLog(session.id, 'info', `启动AI环境: ${config.modelProvider}/${config.modelName}`)
    // 具体的AI环境启动逻辑
    await new Promise(resolve => setTimeout(resolve, 1500)) // 模拟启动时间
    addLog(session.id, 'info', 'AI环境已就绪')
  }

  const startSimulationEnvironment = async (session: LabSession, config: any): Promise<void> => {
    addLog(session.id, 'info', `启动仿真环境: ${config.simulationUrl}`)
    // 具体的仿真环境启动逻辑
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟启动时间
    addLog(session.id, 'info', '仿真环境已就绪')
  }

  // ===================
  // 导出
  // ===================

  return {
    // 状态
    sessions,
    currentSession,
    agentStatus,
    logs,
    loading,
    error,
    websocketConnected,

    // 计算属性
    hasActiveSession,
    sessionCount,
    runningSessions,
    currentSessionId,
    isAgentOnline,
    resourceUsage,
    recentLogs,

    // 基础操作
    setLoading,
    setError,
    clearError,
    resetState,

    // 会话管理
    createSession,
    stopSession,
    restartSession,
    getSession,
    setCurrentSession,

    // 日志管理
    addLog,
    clearLogs,
    getSessionLogs,

    // Agent管理
    updateAgentStatus,
    updateResourceUsage,

    // 监控
    startMonitoring,
    stopMonitoring
  }
})