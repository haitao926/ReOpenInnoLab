import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { LabRun } from '../../database/entities/lab-run.entity'
import { LabAgentSession } from '../../database/entities/lab-agent-session.entity'
import { LabDeviceAgent } from '../../database/entities/lab-device-agent.entity'
import { LabDevicePolicy } from '../../database/entities/lab-device-policy.entity'

@Injectable()
export class LabRuntimeControllerService {
  private readonly logger = new Logger(LabRuntimeControllerService.name)

  constructor(
    @InjectRepository(LabRun)
    private readonly labRunRepository: Repository<LabRun>,
    @InjectRepository(LabAgentSession)
    private readonly labAgentSessionRepository: Repository<LabAgentSession>,
    @InjectRepository(LabDeviceAgent)
    private readonly labDeviceAgentRepository: Repository<LabDeviceAgent>,
    @InjectRepository(LabDevicePolicy)
    private readonly labDevicePolicyRepository: Repository<LabDevicePolicy>
  ) {}

  /**
   * 创建实验运行
   * 对应设计文档第3.3节：runtime-controller 模块
   */
  async createLabRun(
    templateId: string,
    classroomId: string,
    ownerId: string,
    tenantId: string
  ): Promise<LabRun> {
    this.logger.log(`Creating lab run for template: ${templateId}, classroom: ${classroomId}`)

    try {
      const labRun = this.labRunRepository.create({
        id: uuidv4(),
        templateId,
        classroomId,
        ownerId,
        tenantId,
        state: 'initializing',
        startedAt: new Date()
      })

      const savedRun = await this.labRunRepository.save(labRun)

      // 发送 lab.runtime.started 事件
      this.emitLabRuntimeStartedEvent(savedRun.id, tenantId)

      this.logger.log(`Successfully created lab run: ${savedRun.id}`)
      return savedRun

    } catch (error) {
      this.logger.error(`Failed to create lab run: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * 派发实验到设备代理
   * 对应设计文档第5.3节：课堂派发
   */
  async dispatchToAgents(
    labRunId: string,
    classroomId: string,
    templateId: string
  ): Promise<LabAgentSession[]> {
    this.logger.log(`Dispatching lab run ${labRunId} to agents in classroom ${classroomId}`)

    try {
      // 1. 查找可用的设备代理
      const availableAgents = await this.findAvailableAgents(classroomId)

      if (availableAgents.length === 0) {
        throw new Error('No available agents found in classroom')
      }

      // 2. 获取适用的设备策略
      const policy = await this.getApplicablePolicy(availableAgents[0].tenantId)

      // 3. 为每个代理创建会话
      const sessions: LabAgentSession[] = []

      for (const agent of availableAgents) {
        const session = await this.createAgentSession(agent, labRunId, templateId, policy)
        sessions.push(session)

        // 4. 发送 StartLab 指令 (这里简化处理)
        await this.sendStartLabCommand(session, templateId, policy)
      }

      // 5. 更新 lab run 状态
      await this.labRunRepository.update(labRunId, {
        state: 'running'
      })

      this.logger.log(`Successfully dispatched lab run ${labRunId} to ${sessions.length} agents`)
      return sessions

    } catch (error) {
      this.logger.error(`Failed to dispatch lab run ${labRunId}: ${error.message}`, error.stack)

      // 更新 lab run 状态为失败
      await this.labRunRepository.update(labRunId, {
        state: 'failed'
      })

      throw error
    }
  }

  /**
   * 查找可用的设备代理
   * 对应设计文档第5.3节：过滤 trust_level=trusted & last_seen_at<30s
   */
  private async findAvailableAgents(classroomId: string): Promise<LabDeviceAgent[]> {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)

    return await this.labDeviceAgentRepository.find({
      where: {
        classroomId,
        trustLevel: 'trusted',
        status: 'online',
        lastSeenAt: thirtySecondsAgo
      },
      order: {
        lastSeenAt: 'DESC'
      }
    })
  }

  /**
   * 获取适用的设备策略
   */
  private async getApplicablePolicy(tenantId: string): Promise<LabDevicePolicy | null> {
    const now = new Date()

    return await this.labDevicePolicyRepository.findOne({
      where: {
        tenantId,
        isActive: true,
        effectiveFrom: now,
        effectiveTo: null
      },
      order: {
        priority: 'DESC'
      }
    })
  }

  /**
   * 创建代理会话
   */
  private async createAgentSession(
    agent: LabDeviceAgent,
    labRunId: string,
    templateId: string,
    policy: LabDevicePolicy | null
  ): Promise<LabAgentSession> {
    const sessionToken = this.generateSessionToken()

    const session = this.labAgentSessionRepository.create({
      id: uuidv4(),
      agentId: agent.id,
      labRunId,
      sessionToken,
      state: 'initializing',
      notebookChecksum: '', // 这里需要从模板获取
      notebookUrl: '', // 这里需要从模板获取
      packageManifest: policy ? this.buildPackageManifest(policy) : { pip: [], npm: [], conda: [], system: [] },
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
      offlineCachePath: `~/.reopenlabs/cache/${labRunId}`,
      runtimeStats: {},
      syncStatus: 'pending'
    })

    return await this.labAgentSessionRepository.save(session)
  }

  /**
   * 发送 StartLab 指令
   * 对应设计文档第6.3节：Proto 草案
   */
  private async sendStartLabCommand(
    session: LabAgentSession,
    templateId: string,
    policy: LabDevicePolicy | null
  ): Promise<void> {
    this.logger.log(`Sending StartLab command to agent ${session.agentId}, session ${session.id}`)

    const startLabCommand = {
      session_id: session.id,
      lab_run_id: session.labRunId,
      notebook_url: session.notebookUrl,
      notebook_checksum: session.notebookChecksum,
      attachments: [], // 这里需要从模板获取附件列表
      policy: policy ? {
        cpu_quota: policy.quotaCpu,
        memory_quota: policy.quotaMemory,
        allowed_packages: policy.allowedPackages,
        security_settings: policy.securitySettings,
        idle_timeout: policy.idleTimeout,
        max_session_duration: policy.maxSessionDuration
      } : null
    }

    // 这里应该通过 gRPC 或 WebSocket 发送给代理
    // 现在只是记录日志
    this.logger.log(`StartLab command: ${JSON.stringify(startLabCommand, null, 2)}`)
  }

  /**
   * 处理心跳
   * 对应设计文档第6.3节：HeartbeatPayload
   */
  async handleHeartbeat(agentId: string, sessionId: string, payload: any): Promise<void> {
    this.logger.log(`Received heartbeat from agent ${agentId}, session ${sessionId}`)

    try {
      // 1. 更新代理最后心跳时间
      await this.labDeviceAgentRepository.update(agentId, {
        lastSeenAt: new Date()
      })

      // 2. 更新会话心跳时间
      await this.labAgentSessionRepository.update(sessionId, {
        lastHeartbeatAt: new Date(),
        runtimeStats: {
          cpu_usage: payload.cpu_usage,
          memory_usage: payload.memory_usage,
          log_tail: payload.log_tail
        }
      })

      // 3. 记录心跳事件
      await this.recordAgentEvent(sessionId, 'heartbeat', payload)

      // 4. 发送 lab.runtime.heartbeat 事件
      this.emitLabRuntimeHeartbeatEvent(sessionId, agentId)

    } catch (error) {
      this.logger.error(`Failed to handle heartbeat: ${error.message}`, error.stack)
    }
  }

  /**
   * 停止实验运行
   */
  async stopLabRun(labRunId: string): Promise<void> {
    this.logger.log(`Stopping lab run: ${labRunId}`)

    try {
      // 1. 查找所有相关的代理会话
      const sessions = await this.labAgentSessionRepository.find({
        where: { labRunId }
      })

      // 2. 发送停止指令给每个代理
      for (const session of sessions) {
        await this.sendStopLabCommand(session.id)
      }

      // 3. 更新 lab run 状态
      await this.labRunRepository.update(labRunId, {
        state: 'completed',
        completedAt: new Date()
      })

      // 4. 发送 lab.runtime.completed 事件
      this.emitLabRuntimeCompletedEvent(labRunId)

      this.logger.log(`Successfully stopped lab run: ${labRunId}`)

    } catch (error) {
      this.logger.error(`Failed to stop lab run ${labRunId}: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * 发送 StopLab 指令
   */
  private async sendStopLabCommand(sessionId: string): Promise<void> {
    this.logger.log(`Sending StopLab command to session: ${sessionId}`)

    const stopLabCommand = {
      session_id: sessionId,
      reason: 'user_requested'
    }

    // 这里应该通过 gRPC 或 WebSocket 发送给代理
    this.logger.log(`StopLab command: ${JSON.stringify(stopLabCommand, null, 2)}`)
  }

  /**
   * 记录代理事件
   */
  private async recordAgentEvent(
    sessionId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    // 这里应该创建 lab_agent_event 记录
    this.logger.log(`Recording agent event: ${eventType} for session ${sessionId}`)
  }

  /**
   * 构建包清单
   */
  private buildPackageManifest(policy: LabDevicePolicy): any {
    return {
      required: policy.allowedPackages.pip || [],
      optional: [],
      pip_packages: policy.allowedPackages.pip || [],
      npm_packages: policy.allowedPackages.npm || [],
      conda_packages: policy.allowedPackages.conda || []
    }
  }

  /**
   * 生成会话令牌
   */
  private generateSessionToken(): string {
    return uuidv4()
  }

  /**
   * 发送事件 (简化实现)
   */
  private emitLabRuntimeStartedEvent(labRunId: string, tenantId: string): void {
    this.logger.log(`Emitting lab.runtime.started event for run: ${labRunId}`)
  }

  private emitLabRuntimeHeartbeatEvent(sessionId: string, agentId: string): void {
    this.logger.log(`Emitting lab.runtime.heartbeat event for session: ${sessionId}`)
  }

  private emitLabRuntimeCompletedEvent(labRunId: string): void {
    this.logger.log(`Emitting lab.runtime.completed event for run: ${labRunId}`)
  }
}