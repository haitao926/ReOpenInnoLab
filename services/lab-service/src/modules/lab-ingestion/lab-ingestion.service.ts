import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'

import { LabTemplate } from '../../database/entities/lab-template.entity'
import { ResourceRef } from '../../database/entities/resource-ref.entity'
import { CreateLabTemplateDto } from '../../dto/create-lab-template.dto'
import { StorageService } from '../../services/storage.service'

@Injectable()
export class LabIngestionService {
  private readonly logger = new Logger(LabIngestionService.name)

  constructor(
    @InjectRepository(LabTemplate)
    private readonly labTemplateRepository: Repository<LabTemplate>,
    @InjectRepository(ResourceRef)
    private readonly resourceRefRepository: Repository<ResourceRef>,
    private readonly storageService: StorageService
  ) {}

  /**
   * 处理 Notebook 上传和解析
   * 对应设计文档第3.3节：ingestion 模块
   */
  async ingestNotebook(
    createLabTemplateDto: CreateLabTemplateDto,
    notebookFile: Express.Multer.File,
    attachments: Express.Multer.File[] = [],
    tenantId: string,
    createdBy: string
  ): Promise<LabTemplate> {
    this.logger.log(`Starting notebook ingestion: ${createLabTemplateDto.title}`)

    try {
      // 1. 校验 Notebook 文件格式
      const notebookContent = this.validateAndParseNotebook(notebookFile)

      // 2. 提取 metadata
      const extractedMetadata = this.extractNotebookMetadata(notebookContent)

      // 3. 计算校验和
      const checksum = this.calculateChecksum(notebookFile.buffer)

      // 4. 检查重复
      await this.checkForDuplicate(checksum, tenantId)

      // 5. 上传到对象存储
      const notebookUrl = await this.storageService.uploadNotebook(
        notebookFile.buffer,
        notebookFile.originalname,
        tenantId
      )

      // 6. 创建模板记录
      const labTemplate = this.createTemplateRecord(
        createLabTemplateDto,
        notebookUrl,
        checksum,
        notebookFile.size,
        extractedMetadata,
        tenantId,
        createdBy
      )

      const savedTemplate = await this.labTemplateRepository.save(labTemplate)

      // 7. 创建资源引用记录
      await this.createResourceRef(
        savedTemplate.id,
        notebookFile.originalname,
        notebookUrl,
        checksum,
        notebookFile.size,
        'notebook',
        tenantId
      )

      // 8. 处理附件
      if (attachments.length > 0) {
        await this.processAttachments(savedTemplate.id, attachments, tenantId)
      }

      // 9. 发送事件 (这里简化处理，实际应该使用Kafka)
      this.emitLabUploadedEvent(savedTemplate)

      this.logger.log(`Successfully ingested notebook: ${savedTemplate.id}`)
      return savedTemplate

    } catch (error) {
      this.logger.error(`Failed to ingest notebook: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * 校验和解析 Notebook
   */
  private validateAndParseNotebook(file: Express.Multer.File): any {
    // 验证文件类型
    if (!file.originalname.endsWith('.ipynb')) {
      throw new Error('只支持 .ipynb 格式的文件')
    }

    // 验证文件大小
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error(`文件大小超过限制 (${maxSize / 1024 / 1024}MB)`)
    }

    // 解析 JSON
    let notebookContent
    try {
      notebookContent = JSON.parse(file.buffer.toString('utf-8'))
    } catch (error) {
      throw new Error('无效的 JSON 格式')
    }

    // 验证 notebook 结构
    if (!notebookContent.cells || !Array.isArray(notebookContent.cells)) {
      throw new Error('无效的 Notebook 格式：缺少 cells 数组')
    }

    // 验证版本
    if (!notebookContent.nbformat) {
      throw new Error('无效的 Notebook 格式：缺少 nbformat')
    }

    return notebookContent
  }

  /**
   * 提取 Notebook 元数据
   */
  private extractNotebookMetadata(notebookContent: any): Record<string, any> {
    const cells = notebookContent.cells || []

    const cellStats = {
      total: cells.length,
      code: cells.filter((cell: any) => cell.cell_type === 'code').length,
      markdown: cells.filter((cell: any) => cell.cell_type === 'markdown').length,
      raw: cells.filter((cell: any) => cell.cell_type === 'raw').length
    }

    // 提取语言信息
    const languageInfo = notebookContent.metadata?.language_info || {}
    const kernelSpec = notebookContent.metadata?.kernelspec || {}

    // 提取依赖包信息
    const dependencies = this.extractDependencies(cells)

    return {
      cellStats,
      languageInfo,
      kernelSpec,
      dependencies,
      nbformat: notebookContent.nbformat,
      nbformatMinor: notebookContent.nbformat_minor || 0,
      originalMetadata: notebookContent.metadata || {}
    }
  }

  /**
   * 从代码单元格中提取依赖包
   */
  private extractDependencies(cells: any[]): { pip: string[], npm: string[], conda: string[] } {
    const dependencies = { pip: [] as string[], npm: [] as string[], conda: [] as string[] }

    const pipPatterns = [
      /pip install ([^\n]+)/g,
      /pip3 install ([^\n]+)/g,
      /!pip install ([^\n]+)/g
    ]

    const condaPatterns = [
      /conda install ([^\n]+)/g,
      /!conda install ([^\n]+)/g
    ]

    const npmPatterns = [
      /npm install ([^\n]+)/g,
      /!npm install ([^\n]+)/g
    ]

    cells.forEach(cell => {
      if (cell.cell_type === 'code' && cell.source) {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

        // 提取 pip 依赖
        pipPatterns.forEach(pattern => {
          let match
          while ((match = pattern.exec(source)) !== null) {
            const packages = match[1].split(' ').map(pkg => pkg.trim().replace(/['"]/g, ''))
            dependencies.pip.push(...packages)
          }
        })

        // 提取 conda 依赖
        condaPatterns.forEach(pattern => {
          let match
          while ((match = pattern.exec(source)) !== null) {
            const packages = match[1].split(' ').map(pkg => pkg.trim().replace(/['"]/g, ''))
            dependencies.conda.push(...packages)
          }
        })

        // 提取 npm 依赖
        npmPatterns.forEach(pattern => {
          let match
          while ((match = pattern.exec(source)) !== null) {
            const packages = match[1].split(' ').map(pkg => pkg.trim().replace(/['"]/g, ''))
            dependencies.npm.push(...packages)
          }
        })
      }
    })

    // 去重
    dependencies.pip = [...new Set(dependencies.pip)]
    dependencies.conda = [...new Set(dependencies.conda)]
    dependencies.npm = [...new Set(dependencies.npm)]

    return dependencies
  }

  /**
   * 计算文件校验和
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  /**
   * 检查重复模板
   */
  private async checkForDuplicate(checksum: string, tenantId: string): Promise<void> {
    const existing = await this.labTemplateRepository.findOne({
      where: { notebookChecksum: checksum, tenantId }
    })

    if (existing) {
      throw new Error('已存在相同的 Notebook 模板')
    }
  }

  /**
   * 创建模板记录
   */
  private createTemplateRecord(
    dto: CreateLabTemplateDto,
    notebookUrl: string,
    checksum: string,
    fileSize: number,
    metadata: Record<string, any>,
    tenantId: string,
    createdBy: string
  ): LabTemplate {
    return this.labTemplateRepository.create({
      id: uuidv4(),
      tenantId,
      title: dto.title,
      description: dto.description,
      labType: dto.labType,
      difficultyLevel: dto.difficultyLevel,
      tags: dto.tags || [],
      notebookUrl,
      notebookChecksum: checksum,
      notebookSize: fileSize,
      runtimeSpec: {
        packages: {
          pip: metadata.dependencies.pip,
          pip_optional: [],
          npm: metadata.dependencies.npm,
          conda: metadata.dependencies.conda,
          system: []
        },
        kernel: metadata.kernelSpec?.display_name || 'python3',
        resources: {
          cpu: '1',
          memory: '2Gi'
        }
      },
      gradingMatrixJson: {
        difficultyLevel: dto.difficultyLevel,
        autoGrading: false,
        rubrics: [],
        maxScore: 100
      },
      courseActivityId: dto.courseActivityId,
      gradeBand: dto.gradeBand,
      metadata: {
        ...dto.metadata,
        ...metadata,
        originalFilename: dto.title,
        createdAt: new Date().toISOString()
      },
      createdBy,
      status: 'processing'
    })
  }

  /**
   * 创建资源引用记录
   */
  private async createResourceRef(
    labTemplateId: string,
    filename: string,
    url: string,
    checksum: string,
    size: number,
    type: string,
    tenantId: string
  ): Promise<void> {
    const resourceRef = this.resourceRefRepository.create({
      id: uuidv4(),
      labTemplateId,
      filename,
      url,
      checksum,
      size,
      type,
      tenantId
    })

    await this.resourceRefRepository.save(resourceRef)
  }

  /**
   * 处理附件文件
   */
  private async processAttachments(
    labTemplateId: string,
    attachments: Express.Multer.File[],
    tenantId: string
  ): Promise<void> {
    for (const attachment of attachments) {
      const url = await this.storageService.uploadAttachment(
        attachment.buffer,
        attachment.originalname,
        labTemplateId,
        tenantId
      )

      const checksum = this.calculateChecksum(attachment.buffer)
      await this.createResourceRef(
        labTemplateId,
        attachment.originalname,
        url,
        checksum,
        attachment.size,
        'attachment',
        tenantId
      )
    }
  }

  /**
   * 发送 lab.uploaded 事件
   * 简化实现，实际应该使用 Kafka
   */
  private emitLabUploadedEvent(template: LabTemplate): void {
    this.logger.log(`Emitting lab.uploaded event for template: ${template.id}`)

    // 这里应该发送到 Kafka
    // await this.kafkaService.emit('lab.uploaded', {
    //   templateId: template.id,
    //   tenantId: template.tenantId,
    //   title: template.title,
    //   timestamp: new Date().toISOString()
    // })
  }
}