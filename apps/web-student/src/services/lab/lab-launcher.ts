// ===================
// 实验启动管理器
// ===================

import { labService } from './index'
import type { LabSession, ExperimentConfig, ActivityContext } from '@/types/course'

/**
 * 实验启动管理器
 * 处理实验环境的完整启动流程
 */
export class LabLauncher {
  private static instance: LabLauncher
  private launchQueue: LaunchTask[] = []
  private processing = false
  private activeLaunches = new Map<string, LaunchSession>()

  static getInstance(): LabLauncher {
    if (!LabLauncher.instance) {
      LabLauncher.instance = new LabLauncher()
    }
    return LabLauncher.instance
  }

  /**
   * 启动实验
   */
  async launchLab(
    activityId: string,
    config: ExperimentConfig,
    context: ActivityContext,
    options?: LaunchOptions
  ): Promise<LabSession> {
    const taskId = this.generateTaskId()
    const task: LaunchTask = {
      id: taskId,
      activityId,
      config,
      context,
      options: options || {},
      status: 'pending',
      createdAt: Date.now()
    }

    return new Promise((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject
      this.launchQueue.push(task)
      this.processQueue()
    })
  }

  /**
   * 停止实验
   */
  async stopLab(sessionId: string): Promise<boolean> {
    try {
      const success = await labService.stopSession(sessionId)

      if (this.activeLaunches.has(sessionId)) {
        const launch = this.activeLaunches.get(sessionId)!
        launch.status = 'stopped'
        launch.endTime = Date.now()
        launch.resolve = undefined
        launch.reject = undefined
        this.activeLaunches.delete(sessionId)
      }

      return success
    } catch (error) {
      console.error('Failed to stop lab:', error)
      return false
    }
  }

  /**
   * 重启实验
   */
  async restartLab(sessionId: string): Promise<LabSession | null> {
    try {
      const success = await labService.restartSession(sessionId)

      if (success && this.activeLaunches.has(sessionId)) {
        const launch = this.activeLaunches.get(sessionId)!
        launch.status = 'restarting'
        launch.startTime = Date.now()

        // 模拟重启完成
        setTimeout(() => {
          launch.status = 'running'
        }, 2000)
      }

      return success ? this.activeLaunches.get(sessionId)?.session : null
    } catch (error) {
      console.error('Failed to restart lab:', error)
      return null
    }
  }

  /**
   * 获取启动状态
   */
  getLaunchStatus(sessionId?: string): LaunchStatus {
    if (sessionId && this.activeLaunches.has(sessionId)) {
      const launch = this.activeLaunches.get(sessionId)!
      return {
        taskId: launch.taskId,
        status: launch.status,
        progress: launch.progress,
        stage: launch.stage,
        startTime: launch.startTime,
        endTime: launch.endTime,
        error: launch.error
      }
    }

    return {
      queueLength: this.launchQueue.length,
      processing: this.processing,
      activeLaunches: this.activeLaunches.size
    }
  }

  /**
   * 获取所有活动的启动
   */
  getActiveLaunches(): Map<string, LaunchSession> {
    return new Map(this.activeLaunches)
  }

  /**
   * 清理完成的启动
   */
  cleanupCompletedLaunches(maxAge = 24 * 60 * 60 * 1000): void {
    const now = Date.now()

    for (const [sessionId, launch] of this.activeLaunches.entries()) {
      if ((launch.status === 'completed' || launch.status === 'failed' || launch.status === 'stopped') &&
          launch.endTime && (now - launch.endTime) > maxAge) {
        this.activeLaunches.delete(sessionId)
      }
    }
  }

  // 私有方法

  private async processQueue(): Promise<void> {
    if (this.processing || this.launchQueue.length === 0) {
      return
    }

    this.processing = true

    try {
      while (this.launchQueue.length > 0) {
        const task = this.launchQueue.shift()!
        await this.processLaunchTask(task)
      }
    } catch (error) {
      console.error('Error processing launch queue:', error)
    } finally {
      this.processing = false
    }
  }

  private async processLaunchTask(task: LaunchTask): Promise<void> {
    const { activityId, config, context, options } = task
    const sessionId = this.generateSessionId()

    try {
      // 创建启动会话
      const launch: LaunchSession = {
        taskId: task.id,
        sessionId,
        activityId,
        status: 'initializing',
        progress: 0,
        stage: 'validation',
        startTime: Date.now(),
        config: config,
        context: context,
        options: options
      }

      this.activeLaunches.set(sessionId, launch)

      // 执行启动流程
      await this.executeLaunchSequence(launch)

      // 启动成功
      launch.status = 'completed'
      launch.progress = 100
      launch.endTime = Date.now()

      if (task.resolve && launch.session) {
        task.resolve(launch.session)
      }

    } catch (error) {
      console.error('Launch failed:', error)

      const launch = this.activeLaunches.get(sessionId)!
      launch.status = 'failed'
      launch.progress = 0
      launch.endTime = Date.now()
      launch.error = error instanceof Error ? error.message : 'Unknown error'

      if (task.reject) {
        task.reject(error instanceof Error ? error : new Error('Launch failed'))
      }

      // 清理失败的启动
      this.activeLaunches.delete(sessionId)
    }
  }

  private async executeLaunchSequence(launch: LaunchSession): Promise<void> {
    const { config, context } = launch
    const stages = this.getLaunchStages(config.experimentType)

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      launch.stage = stage.name
      launch.progress = Math.round((i / stages.length) * 100)

      try {
        await stage.execute(launch)
        launch.stageDetails = stage.name
      } catch (error) {
        throw new Error(`Stage "${stage.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // 小延迟以便UI更新
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  private getLaunchStages(experimentType: string): LaunchStage[] {
    const commonStages: LaunchStage[] = [
      {
        name: 'validation',
        execute: this.validateConfig.bind(this)
      },
      {
        name: 'resource_check',
        execute: this.checkResources.bind(this)
      },
      {
        name: 'session_creation',
        execute: this.createSession.bind(this)
      },
      {
        name: 'environment_setup',
        execute: this.setupEnvironment.bind(this)
      },
      {
        name: 'service_start',
        execute: this.startServices.bind(this)
      },
      {
        name: 'verification',
        execute: this.verifyLaunch.bind(this)
      }
    ]

    // 根据实验类型添加特定阶段
    switch (experimentType) {
      case 'jupyter':
        return [
          ...commonStages.slice(0, 2),
          {
            name: 'jupyter_setup',
            execute: this.setupJupyter.bind(this)
          },
          ...commonStages.slice(2)
        ]

      case 'ai':
        return [
          ...commonStages.slice(0, 2),
          {
            name: 'ai_model_init',
            execute: this.initializeAIModel.bind(this)
          },
          ...commonStages.slice(2)
        ]

      case 'simulation':
        return [
          ...commonStages.slice(0, 2),
          {
            name: 'simulation_load',
            execute: this.loadSimulation.bind(this)
          },
          ...commonStages.slice(2)
        ]

      default:
        return commonStages
    }
  }

  // 启动阶段实现

  private async validateConfig(launch: LaunchSession): Promise<void> {
    await this.validateExperimentConfig(launch.config)
    await this.validateActivityContext(launch.context)
  }

  private async checkResources(launch: LaunchSession): Promise<void> {
    // 检查Agent状态
    const agentStatus = await labService.getAgentStatus()
    if (!agentStatus || agentStatus.status !== 'online') {
      throw new Error('Lab Agent is not available')
    }

    // 检查资源限制
    const resourceUsage = await labService.getResourceUsage()
    if (resourceUsage && (resourceUsage.cpu > 80 || resourceUsage.memory > 80)) {
      throw new Error('Insufficient resources available')
    }
  }

  private async createSession(launch: LaunchSession): Promise<void> {
    const session = await labService.createSession(
      launch.activityId,
      launch.config,
      launch.options.studentId
    )

    launch.session = session
  }

  private async setupEnvironment(launch: LaunchSession): Promise<void> {
    // 根据实验类型设置环境
    switch (launch.config.experimentType) {
      case 'jupyter':
        await this.setupJupyterEnvironment(launch)
        break
      case 'ai':
        await this.setupAIEnvironment(launch)
        break
      case 'simulation':
        await this.setupSimulationEnvironment(launch)
        break
    }
  }

  private async startServices(launch: LaunchSession): Promise<void> {
    // 启动必要的服务
    if (launch.options.enableMonitoring !== false) {
      await this.startMonitoring(launch)
    }

    if (launch.options.enableLogging !== false) {
      await this.startLogging(launch)
    }
  }

  private async verifyLaunch(launch: LaunchSession): Promise<void> {
    // 验证实验环境是否正常工作
    const healthCheck = await labService.performHealthCheck()

    if (healthCheck && healthCheck.status !== 'healthy') {
      throw new Error('Lab health check failed')
    }

    // Ping测试
    const latency = await labService.ping()
    if (latency > 5000) {
      console.warn('High latency detected:', latency + 'ms')
    }
  }

  // 特定实验类型的设置方法

  private async setupJupyter(launch: LaunchSession): Promise<void> {
    // Jupyter特定设置
    const jupyterConfig = launch.config.jupyterConfig
    if (!jupyterConfig) {
      throw new Error('Jupyter configuration not found')
    }

    // 发送Jupyter设置命令
    await labService.executeCommand('setup_jupyter', {
      notebook_id: jupyterConfig.notebookId,
      runtime: jupyterConfig.runtime,
      kernel_spec: jupyterConfig.kernelSpec
    })
  }

  private async setupJupyterEnvironment(launch: LaunchSession): Promise<void> {
    // Jupyter环境设置
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  private async initializeAIModel(launch: LaunchSession): Promise<void> {
    const aiConfig = launch.config.aiConfig
    if (!aiConfig) {
      throw new Error('AI configuration not found')
    }

    // 发送AI模型初始化命令
    await labService.executeCommand('initialize_ai', {
      model_provider: aiConfig.modelProvider,
      model_name: aiConfig.modelName,
      system_prompt: aiConfig.systemPrompt,
      parameters: aiConfig.parameters
    })
  }

  private async setupAIEnvironment(launch: LaunchSession): Promise<void> {
    // AI环境设置
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  private async loadSimulation(launch: LaunchSession): Promise<void> {
    const simConfig = launch.config.simulationConfig
    if (!simConfig) {
      throw new Error('Simulation configuration not found')
    }

    // 发送仿真加载命令
    await labService.executeCommand('load_simulation', {
      simulation_url: simConfig.simulationUrl,
      parameters: simConfig.parameters,
      fullscreen: simConfig.fullscreen
    })
  }

  private async setupSimulationEnvironment(launch: LaunchSession): Promise<void> {
    // 仿真环境设置
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  // 通用方法

  private async startMonitoring(launch: LaunchSession): Promise<void> {
    if (launch.session) {
      const stopMonitoring = await labService.monitorSession(launch.session.id)
      launch.stopMonitoring = stopMonitoring
    }
  }

  private async startLogging(launch: LaunchSession): Promise<void> {
    // 启用日志记录
    console.log('Logging enabled for session:', launch.sessionId)
  }

  private async validateExperimentConfig(config: ExperimentConfig): Promise<void> {
    if (!config.experimentType) {
      throw new Error('Experiment type is required')
    }

    // 验证特定类型的配置
    switch (config.experimentType) {
      case 'jupyter':
        if (!config.jupyterConfig) {
          throw new Error('Jupyter configuration is required')
        }
        break
      case 'ai':
        if (!config.aiConfig) {
          throw new Error('AI configuration is required')
        }
        break
      case 'simulation':
        if (!config.simulationConfig) {
          throw new Error('Simulation configuration is required')
        }
        break
    }
  }

  private async validateActivityContext(context: ActivityContext): Promise<void> {
    if (!context.activityId) {
      throw new Error('Activity ID is required')
    }
    if (!context.activity) {
      throw new Error('Activity information is required')
    }
  }

  private generateTaskId(): string {
    return `launch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ===================
// 类型定义
// ===================

export interface LaunchTask {
  id: string
  activityId: string
  config: ExperimentConfig
  context: ActivityContext
  options: LaunchOptions
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: number
  resolve?: (session: LabSession) => void
  reject?: (error: Error) => void
}

export interface LaunchSession {
  taskId: string
  sessionId: string
  activityId: string
  status: 'initializing' | 'setting_up' | 'running' | 'completed' | 'failed' | 'stopped' | 'restarting'
  progress: number
  stage: string
  stageDetails?: string
  startTime: number
  endTime?: number
  config: ExperimentConfig
  context: ActivityContext
  options: LaunchOptions
  session?: LabSession
  error?: string
  resolve?: (session: LabSession) => void
  reject?: (error: Error) => void
  stopMonitoring?: () => void
}

export interface LaunchOptions {
  studentId?: string
  enableMonitoring?: boolean
  enableLogging?: boolean
  timeout?: number
  priority?: 'high' | 'normal' | 'low'
}

export interface LaunchStatus {
  taskId?: string
  status?: string
  progress?: number
  stage?: string
  startTime?: number
  endTime?: number
  error?: string
  queueLength?: number
  processing?: boolean
  activeLaunches?: number
}

export interface LaunchStage {
  name: string
  execute: (launch: LaunchSession) => Promise<void>
}

// 导出单例实例
export const labLauncher = LabLauncher.getInstance()