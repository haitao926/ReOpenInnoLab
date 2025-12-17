import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { LabTemplate } from '../../database/entities/lab-template.entity'
import { PreviewService } from '../../services/preview.service'
import { StorageService } from '../../services/storage.service'

@Injectable()
export class LabRenderService {
  private readonly logger = new Logger(LabRenderService.name)

  constructor(
    @InjectRepository(LabTemplate)
    private readonly labTemplateRepository: Repository<LabTemplate>,
    private readonly previewService: PreviewService,
    private readonly storageService: StorageService
  ) {}

  /**
   * 渲染 Notebook 预览
   * 对应设计文档第3.3节：render 模块
   */
  async renderPreview(templateId: string): Promise<void> {
    this.logger.log(`Starting preview render for template: ${templateId}`)

    try {
      // 1. 获取模板
      const template = await this.labTemplateRepository.findOne({
        where: { id: templateId }
      })

      if (!template) {
        throw new Error(`Template ${templateId} not found`)
      }

      // 2. 更新状态为处理中
      await this.updateTemplateStatus(templateId, 'processing')

      // 3. 下载 Notebook 文件
      const notebookBuffer = await this.storageService.downloadFile(template.notebookUrl)

      // 4. 生成预览
      const previewResult = await this.previewService.generateNotebookPreview(notebookBuffer)

      // 5. 上传预览文件到对象存储
      const previewUrl = await this.storageService.uploadPreview(
        Buffer.from(previewResult.htmlContent),
        `${templateId}/preview.html`,
        template.tenantId
      )

      const cellMapUrl = await this.storageService.uploadPreview(
        Buffer.from(JSON.stringify(previewResult.cellMap, null, 2)),
        `${templateId}/cellmap.json`,
        template.tenantId
      )

      // 6. 生成缩略图
      const thumbnailUrl = await this.generateThumbnail(
        previewResult.htmlContent,
        templateId,
        template.tenantId
      )

      // 7. 更新模板记录
      await this.labTemplateRepository.update(templateId, {
        status: 'ready',
        previewUrl,
        cellMapUrl,
        thumbnailUrl,
        metadata: {
          ...template.metadata,
          ...previewResult.metadata,
          previewGenerated: new Date().toISOString(),
          previewSize: previewResult.htmlContent.length,
          cellCount: previewResult.cellMap.metadata.totalCells
        }
      })

      // 8. 发送 lab.rendered 事件
      this.emitLabRenderedEvent(templateId, template.tenantId)

      this.logger.log(`Successfully rendered preview for template: ${templateId}`)

    } catch (error) {
      this.logger.error(`Failed to render preview for template ${templateId}: ${error.message}`, error.stack)

      // 更新状态为失败
      await this.updateTemplateStatus(templateId, 'preview_failed')

      throw error
    }
  }

  /**
   * 重新渲染预览
   */
  async rerenderPreview(templateId: string): Promise<void> {
    this.logger.log(`Rerendering preview for template: ${templateId}`)

    // 重置状态
    await this.updateTemplateStatus(templateId, 'processing')

    // 重新渲染
    return this.renderPreview(templateId)
  }

  /**
   * 批量渲染预览
   */
  async batchRenderPreviews(templateIds: string[]): Promise<void> {
    this.logger.log(`Starting batch preview render for ${templateIds.length} templates`)

    const results = await Promise.allSettled(
      templateIds.map(id => this.renderPreview(id))
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    this.logger.log(`Batch render completed: ${successful} successful, ${failed} failed`)

    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason.message)

      this.logger.error(`Batch render errors: ${errors.join(', ')}`)
    }
  }

  /**
   * 更新模板状态
   */
  private async updateTemplateStatus(templateId: string, status: string): Promise<void> {
    await this.labTemplateRepository.update(templateId, { status })
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(
    htmlContent: string,
    templateId: string,
    tenantId: string
  ): Promise<string> {
    // 这里可以集成无头浏览器生成真实缩略图
    // 现在使用 SVG 占位符

    const thumbnailSvg = this.generateThumbnailSvg(htmlContent)

    return await this.storageService.uploadPreview(
      Buffer.from(thumbnailSvg),
      `${templateId}/thumbnail.svg`,
      tenantId
    )
  }

  /**
   * 生成 SVG 缩略图
   */
  private generateThumbnailSvg(htmlContent: string): string {
    // 提取标题
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
    const title = titleMatch ? titleMatch[1] : 'Notebook Preview'

    // 提取单元格数量
    const cellCountMatch = htmlContent.match(/Cells:\s*(\d+)/)
    const cellCount = cellCountMatch ? cellCountMatch[1] : '0'

    return `
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="header" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="300" height="200" fill="#f8f9fa"/>

  <!-- Notebook 头部 -->
  <rect width="300" height="40" fill="url(#header)"/>
  <text x="150" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white" font-weight="bold">
    Jupyter Notebook
  </text>

  <!-- 内容区域 -->
  <rect x="10" y="50" width="280" height="140" fill="white" stroke="#E2E8F0" stroke-width="1" rx="5"/>

  <!-- 标题 -->
  <text x="150" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#1E293B" font-weight="600">
    ${this.truncateText(title, 35)}
  </text>

  <!-- 单元格数量指示器 -->
  <rect x="20" y="90" width="60" height="20" fill="#EEF2FF" rx="3"/>
  <text x="50" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#4F46E5">
    ${cellCount} cells
  </text>

  <!-- 代码单元格指示器 -->
  <rect x="90" y="90" width="50" height="20" fill="#F5F3FF" rx="3"/>
  <text x="115" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6D28D9">
    Code
  </text>

  <!-- Markdown 单元格指示器 -->
  <rect x="150" y="90" width="60" height="20" fill="#ECFDF3" rx="3"/>
  <text x="180" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#047857">
    Text
  </text>

  <!-- 预览状态 -->
  <circle cx="20" cy="170" r="4" fill="#10B981"/>
  <text x="30" y="174" font-family="Arial, sans-serif" font-size="10" fill="#475569">
    Preview Ready
  </text>

  <!-- 时间戳 -->
  <text x="270" y="174" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#94A3B8">
    ${new Date().toLocaleDateString()}
  </text>
</svg>`
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * 发送 lab.rendered 事件
   * 简化实现，实际应该使用 Kafka
   */
  private emitLabRenderedEvent(templateId: string, tenantId: string): void {
    this.logger.log(`Emitting lab.rendered event for template: ${templateId}`)

    // 这里应该发送到 Kafka
    // await this.kafkaService.emit('lab.rendered', {
    //   templateId,
    //   tenantId,
    //   timestamp: new Date().toISOString()
    // })
  }

  /**
   * 清理预览文件
   */
  async cleanupPreviewFiles(templateId: string): Promise<void> {
    this.logger.log(`Cleaning up preview files for template: ${templateId}`)

    const template = await this.labTemplateRepository.findOne({
      where: { id: templateId }
    })

    if (!template) return

    // 删除预览文件
    const filesToDelete = []

    if (template.previewUrl) {
      filesToDelete.push(this.storageService.deleteFile(template.previewUrl))
    }

    if (template.cellMapUrl) {
      filesToDelete.push(this.storageService.deleteFile(template.cellMapUrl))
    }

    if (template.thumbnailUrl) {
      filesToDelete.push(this.storageService.deleteFile(template.thumbnailUrl))
    }

    await Promise.allSettled(filesToDelete)

    // 更新模板记录
    await this.labTemplateRepository.update(templateId, {
      previewUrl: null,
      cellMapUrl: null,
      thumbnailUrl: null
    })

    this.logger.log(`Successfully cleaned up preview files for template: ${templateId}`)
  }
}
