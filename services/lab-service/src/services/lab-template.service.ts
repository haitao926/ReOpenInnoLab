import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'
import { LabTemplate } from '../database/entities/lab-template.entity'
import { CreateLabTemplateDto } from '../dto/create-lab-template.dto'
import { LabIngestionService } from '../modules/lab-ingestion/lab-ingestion.service'
import { LabRenderService } from '../modules/lab-render/lab-render.service'
import { LabRuntimeControllerService } from '../modules/lab-runtime-controller/lab-runtime-controller.service'

@Injectable()
export class LabTemplateService {
  private readonly logger = new Logger(LabTemplateService.name)

  constructor(
    @InjectRepository(LabTemplate)
    private readonly labTemplateRepository: Repository<LabTemplate>,
    private readonly labIngestionService: LabIngestionService,
    private readonly labRenderService: LabRenderService,
    private readonly labRuntimeControllerService: LabRuntimeControllerService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create a new lab template from uploaded notebook
   */
  async createLabTemplate(
    createLabTemplateDto: CreateLabTemplateDto,
    notebookFile: Express.Multer.File,
    attachments: Express.Multer.File[] = [],
    tenantId: string,
    createdBy: string
  ): Promise<LabTemplate> {
    this.logger.log(`Creating new lab template: ${createLabTemplateDto.title}`)

    try {
      // 使用 ingestion 模块处理 Notebook 上传和解析
      const savedTemplate = await this.labIngestionService.ingestNotebook(
        createLabTemplateDto,
        notebookFile,
        attachments,
        tenantId,
        createdBy
      )

      // 启动异步预览渲染（如果启用）
      if (createLabTemplateDto.autoRenderPreview) {
        this.schedulePreviewGeneration(savedTemplate.id)
      }

      this.logger.log(`Successfully created lab template: ${savedTemplate.id}`)
      return savedTemplate

    } catch (error) {
      this.logger.error(`Failed to create lab template: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get lab template by ID
   */
  async getLabTemplate(id: string, tenantId: string): Promise<LabTemplate> {
    const template = await this.labTemplateRepository.findOne({
      where: { id, tenantId },
      relations: ['resourceRefs']
    })

    if (!template) {
      throw new NotFoundException(`Lab template with ID ${id} not found`)
    }

    return template
  }

  /**
   * Get lab templates with pagination and filtering
   */
  async getLabTemplates(
    tenantId: string,
    options: {
      page?: number
      limit?: number
      search?: string
      labType?: string
      difficultyLevel?: string
      gradeBand?: string
      tags?: string[]
      courseActivityId?: string
    } = {}
  ): Promise<{ templates: LabTemplate[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      labType,
      difficultyLevel,
      gradeBand,
      tags,
      courseActivityId
    } = options

    const queryBuilder = this.labTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.resourceRefs', 'resourceRefs')
      .where('template.tenantId = :tenantId', { tenantId })

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(template.title ILIKE :search OR template.description ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    if (labType) {
      queryBuilder.andWhere('template.labType = :labType', { labType })
    }

    if (difficultyLevel) {
      queryBuilder.andWhere('template.difficultyLevel = :difficultyLevel', { difficultyLevel })
    }

    if (gradeBand) {
      queryBuilder.andWhere('template.gradeBand = :gradeBand', { gradeBand })
    }

    if (courseActivityId) {
      queryBuilder.andWhere('template.courseActivityId = :courseActivityId', { courseActivityId })
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('template.tags @> :tags', { tags: JSON.stringify(tags) })
    }

    // Get total count
    const total = await queryBuilder.getCount()

    // Apply pagination and ordering
    const templates = await queryBuilder
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    return { templates, total, page, limit }
  }

  /**
   * Update lab template
   */
  async updateLabTemplate(
    id: string,
    updateData: Partial<CreateLabTemplateDto>,
    tenantId: string,
    updatedBy: string
  ): Promise<LabTemplate> {
    const template = await this.getLabTemplate(id, tenantId)

    const updatedTemplate = this.labTemplateRepository.merge(template, {
      ...updateData,
      runtimeSpec: updateData.packageManifest
        ? this.buildRuntimeSpec(updateData as CreateLabTemplateDto)
        : template.runtimeSpec,
      updatedBy,
      updatedAt: new Date()
    })

    return await this.labTemplateRepository.save(updatedTemplate)
  }

  /**
   * Delete lab template
   */
  async deleteLabTemplate(id: string, tenantId: string): Promise<void> {
    const template = await this.getLabTemplate(id, tenantId)

    // Delete from storage first
    if (template.notebookUrl) {
      await this.storageService.deleteFile(template.notebookUrl)
    }

    // Delete resource references
    await this.resourceRefRepository.delete({ labTemplateId: id })

    // Delete template
    await this.labTemplateRepository.remove(template)
  }

  /**
   * Validate notebook file
   */
  private validateNotebookFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Notebook file is required')
    }

    const allowedMimeTypes = [
      'application/x-ipynb+json',
      'application/json',
      'text/plain'
    ]

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only .ipynb files are allowed')
    }

    // Validate file content is a valid JSON notebook
    try {
      const content = JSON.parse(file.buffer.toString('utf-8'))
      if (!content.cells || !Array.isArray(content.cells)) {
        throw new BadRequestException('Invalid notebook format')
      }
    } catch (error) {
      throw new BadRequestException('Invalid notebook JSON format')
    }

    // Check file size (max 50MB)
    const maxSize = this.configService.get<number>('MAX_NOTEBOOK_SIZE', 50 * 1024 * 1024)
    if (file.size > maxSize) {
      throw new BadRequestException(`Notebook file too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
    }
  }

  /**
   * Calculate file checksum
   */
  private calculateFileChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  /**
   * Find duplicate template by checksum
   */
  private async findDuplicateTemplate(checksum: string, tenantId: string): Promise<LabTemplate | null> {
    return await this.labTemplateRepository.findOne({
      where: { notebookChecksum: checksum, tenantId }
    })
  }

  /**
   * Build runtime specification from DTO
   */
  private buildRuntimeSpec(dto: CreateLabTemplateDto): Record<string, any> {
    return {
      packages: dto.packageManifest || {
        pip: [],
        pip_optional: [],
        npm: [],
        conda: [],
        system: []
      },
      kernel: dto.labType === 'jupyter' ? 'python3' : dto.labType,
      resources: {
        cpu: '1',
        memory: '2Gi'
      }
    }
  }

  /**
   * Build grading matrix
   */
  private buildGradingMatrix(dto: CreateLabTemplateDto): Record<string, any> {
    return {
      difficultyLevel: dto.difficultyLevel,
      autoGrading: false,
      rubrics: [],
      maxScore: 100
    }
  }

  /**
   * Create resource reference
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
   * Upload attachments
   */
  private async uploadAttachments(
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

      const checksum = this.calculateFileChecksum(attachment.buffer)
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
   * Schedule preview generation
   */
  private schedulePreviewGeneration(templateId: string): void {
    // This would typically be handled by a job queue (Bull, Agenda, etc.)
    // For now, we'll trigger it asynchronously
    setTimeout(async () => {
      try {
        await this.previewService.generatePreview(templateId)
      } catch (error) {
        this.logger.error(`Failed to generate preview for template ${templateId}: ${error.message}`)
      }
    }, 1000)
  }
}