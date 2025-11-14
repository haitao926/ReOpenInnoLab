import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { LabArtifact } from '../../database/entities/lab-artifact.entity'
import { LabRun } from '../../database/entities/lab-run.entity'
import { LabAgentSession } from '../../database/entities/lab-agent-session.entity'
import { LabAgentEvent } from '../../database/entities/lab-agent-event.entity'
import { StorageService } from '../../services/storage.service'

@Injectable()
export class LabArtifactService {
  private readonly logger = new Logger(LabArtifactService.name)

  constructor(
    @InjectRepository(LabArtifact)
    private readonly labArtifactRepository: Repository<LabArtifact>,
    @InjectRepository(LabRun)
    private readonly labRunRepository: Repository<LabRun>,
    @InjectRepository(LabAgentSession)
    private readonly labAgentSessionRepository: Repository<LabAgentSession>,
    @InjectRepository(LabAgentEvent)
    private readonly labAgentEventRepository: Repository<LabAgentEvent>,
    private readonly storageService: StorageService
  ) {}

  /**
   * 处理实验产出
   * 对应设计文档第3.3节：artifact 模块
   */
  async processArtifact(
    sessionId: string,
    artifactType: string,
    artifactData: Buffer | string,
    metadata: Record<string, any> = {}
  ): Promise<LabArtifact> {
    this.logger.log(`Processing artifact for session: ${sessionId}, type: ${artifactType}`)

    try {
      // 1. 获取会话信息
      const session = await this.labAgentSessionRepository.findOne({
        where: { id: sessionId },
        relations: ['labRun']
      })

      if (!session) {
        throw new Error(`Session ${sessionId} not found`)
      }

      // 2. 存储产出到对象存储
      let storageUrl: string
      let checksum: string
      let size: number

      if (Buffer.isBuffer(artifactData)) {
        const uploadResult = await this.storageService.uploadArtifact(
          artifactData,
          `${session.labRunId}/${artifactType}-${Date.now()}`,
          session.labRun.tenantId
        )
        storageUrl = uploadResult.url
        checksum = this.calculateChecksum(artifactData)
        size = artifactData.length
      } else {
        const buffer = Buffer.from(artifactData, 'utf-8')
        const uploadResult = await this.storageService.uploadArtifact(
          buffer,
          `${session.labRunId}/${artifactType}-${Date.now()}`,
          session.labRun.tenantId
        )
        storageUrl = uploadResult.url
        checksum = this.calculateChecksum(buffer)
        size = buffer.length
      }

      // 3. 创建产出记录
      const artifact = this.labArtifactRepository.create({
        id: uuidv4(),
        labRunId: session.labRunId,
        agentSessionId: sessionId,
        artifactType,
        storagePath: storageUrl,
        checksum,
        size,
        metadata: {
          ...metadata,
          tenantId: session.labRun.tenantId,
          createdAt: new Date().toISOString()
        }
      })

      const savedArtifact = await this.labArtifactRepository.save(artifact)

      // 4. 更新 lab run 的统计信息
      await this.updateLabRunStats(session.labRunId)

      // 5. 发送事件
      this.emitArtifactProcessedEvent(savedArtifact.id, session.labRunId)

      this.logger.log(`Successfully processed artifact: ${savedArtifact.id}`)
      return savedArtifact

    } catch (error) {
      this.logger.error(`Failed to process artifact: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * 处理日志产出
   */
  async processLog(
    sessionId: string,
    logContent: string,
    level: 'info' | 'warn' | 'error' = 'info',
    metadata: Record<string, any> = {}
  ): Promise<LabArtifact> {
    return this.processArtifact(sessionId, 'log', logContent, {
      ...metadata,
      level,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 处理 Notebook 产出
   */
  async processNotebook(
    sessionId: string,
    notebookContent: string,
    executionState: Record<string, any> = {}
  ): Promise<LabArtifact> {
    return this.processArtifact(sessionId, 'notebook', notebookContent, {
      ...executionState,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 处理输出文件产出
   */
  async processOutputFile(
    sessionId: string,
    fileName: string,
    fileContent: Buffer,
    mimeType: string = 'application/octet-stream'
  ): Promise<LabArtifact> {
    return this.processArtifact(sessionId, 'output_file', fileContent, {
      fileName,
      mimeType,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 处理图表/可视化产出
   */
  async processVisualization(
    sessionId: string,
    chartData: any,
    chartType: string,
    metadata: Record<string, any> = {}
  ): Promise<LabArtifact> {
    const content = JSON.stringify({
      chartType,
      data: chartData,
      ...metadata
    })

    return this.processArtifact(sessionId, 'visualization', content, {
      chartType,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 获取实验运行的所有产出
   */
  async getLabRunArtifacts(
    labRunId: string,
    artifactType?: string
  ): Promise<LabArtifact[]> {
    const where: any = { labRunId }
    if (artifactType) {
      where.artifactType = artifactType
    }

    return await this.labArtifactRepository.find({
      where,
      order: {
        createdAt: 'ASC'
      }
    })
  }

  /**
   * 获取产出内容
   */
  async getArtifactContent(artifactId: string): Promise<Buffer> {
    const artifact = await this.labArtifactRepository.findOne({
      where: { id: artifactId }
    })

    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`)
    }

    return await this.storageService.downloadFile(artifact.storagePath)
  }

  /**
   * 批量处理代理事件
   * 对应设计文档第5.4节：本地执行的事件处理
   */
  async processAgentEvents(sessionId: string, events: any[]): Promise<void> {
    this.logger.log(`Processing ${events.length} events for session: ${sessionId}`)

    try {
      for (const event of events) {
        await this.processAgentEvent(sessionId, event)
      }
    } catch (error) {
      this.logger.error(`Failed to process agent events: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * 处理单个代理事件
   */
  private async processAgentEvent(sessionId: string, event: any): Promise<void> {
    const { eventType, payload } = event

    switch (eventType) {
      case 'log':
        await this.processLog(sessionId, payload.message, payload.level, payload.metadata)
        break

      case 'artifact':
        await this.processArtifact(sessionId, payload.artifactType, payload.content, payload.metadata)
        break

      case 'output':
        await this.processOutputFile(
          sessionId,
          payload.fileName,
          Buffer.from(payload.content),
          payload.mimeType
        )
        break

      case 'visualization':
        await this.processVisualization(sessionId, payload.data, payload.chartType, payload.metadata)
        break

      case 'notebook':
        await this.processNotebook(sessionId, payload.content, payload.executionState)
        break

      case 'sync':
        await this.handleSyncEvent(sessionId, payload)
        break

      default:
        this.logger.warn(`Unknown event type: ${eventType}`)
    }
  }

  /**
   * 处理离线同步事件
   * 对应设计文档第5.4节：断网缓存和批量同步
   */
  private async handleSyncEvent(sessionId: string, payload: any): Promise<void> {
    this.logger.log(`Handling sync event for session: ${sessionId}`)

    try {
      const { cachedArtifacts, offlineMetadata } = payload

      // 处理缓存的产出
      if (cachedArtifacts && Array.isArray(cachedArtifacts)) {
        for (const cachedArtifact of cachedArtifacts) {
          await this.processArtifact(
            sessionId,
            cachedArtifact.type,
            cachedArtifact.content,
            {
              ...cachedArtifact.metadata,
              syncFromOffline: true,
              originalTimestamp: cachedArtifact.timestamp
            }
          )
        }
      }

      // 更新会话同步状态
      await this.labAgentSessionRepository.update(sessionId, {
        syncStatus: 'synced',
        metadata: {
          lastSyncAt: new Date().toISOString(),
          offlineMetadata
        }
      })

      this.logger.log(`Successfully synced offline artifacts for session: ${sessionId}`)

    } catch (error) {
      this.logger.error(`Failed to handle sync event: ${error.message}`, error.stack)

      // 更新同步状态为失败
      await this.labAgentSessionRepository.update(sessionId, {
        syncStatus: 'failed'
      })

      throw error
    }
  }

  /**
   * 更新实验运行统计
   */
  private async updateLabRunStats(labRunId: string): Promise<void> {
    const artifacts = await this.labArtifactRepository.find({
      where: { labRunId }
    })

    const stats = {
      totalArtifacts: artifacts.length,
      logCount: artifacts.filter(a => a.artifactType === 'log').length,
      notebookCount: artifacts.filter(a => a.artifactType === 'notebook').length,
      outputFileCount: artifacts.filter(a => a.artifactType === 'output_file').length,
      visualizationCount: artifacts.filter(a => a.artifactType === 'visualization').length,
      totalSize: artifacts.reduce((sum, a) => sum + (a.size || 0), 0)
    }

    await this.labRunRepository.update(labRunId, {
      metadata: { stats }
    })
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  /**
   * 发送事件 (简化实现)
   */
  private emitArtifactProcessedEvent(artifactId: string, labRunId: string): void {
    this.logger.log(`Emitting artifact processed event: ${artifactId} for run: ${labRunId}`)
  }

  /**
   * 清理产出文件
   */
  async cleanupArtifacts(labRunId: string): Promise<void> {
    this.logger.log(`Cleaning up artifacts for lab run: ${labRunId}`)

    try {
      const artifacts = await this.labArtifactRepository.find({
        where: { labRunId }
      })

      // 删除存储文件
      const deletePromises = artifacts.map(artifact =>
        this.storageService.deleteFile(artifact.storagePath)
      )

      await Promise.allSettled(deletePromises)

      // 删除数据库记录
      await this.labArtifactRepository.delete({ labRunId })

      this.logger.log(`Successfully cleaned up ${artifacts.length} artifacts for run: ${labRunId}`)

    } catch (error) {
      this.logger.error(`Failed to cleanup artifacts: ${error.message}`, error.stack)
    }
  }

  /**
   * 归档产出
   */
  async archiveArtifacts(labRunId: string): Promise<string> {
    this.logger.log(`Archiving artifacts for lab run: ${labRunId}`)

    try {
      const artifacts = await this.getLabRunArtifacts(labRunId)

      // 创建归档清单
      const manifest = {
        labRunId,
        archivedAt: new Date().toISOString(),
        artifactCount: artifacts.length,
        artifacts: artifacts.map(a => ({
          id: a.id,
          type: a.artifactType,
          size: a.size,
          checksum: a.checksum,
          createdAt: a.createdAt
        }))
      }

      // 上传归档清单
      const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2))
      const archiveResult = await this.storageService.uploadArtifact(
        manifestBuffer,
        `${labRunId}/archive-manifest.json`,
        'archive'
      )

      this.logger.log(`Successfully archived artifacts for run: ${labRunId}`)
      return archiveResult.url

    } catch (error) {
      this.logger.error(`Failed to archive artifacts: ${error.message}`, error.stack)
      throw error
    }
  }
}