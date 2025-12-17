import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LabTemplate } from '../database/entities/lab-template.entity'
import { StorageService } from './storage.service'

const execAsync = promisify(exec)

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name)
  private readonly tempDir: string

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(LabTemplate)
    private readonly labTemplateRepository: Repository<LabTemplate>,
    private readonly storageService: StorageService
  ) {
    this.tempDir = this.configService.get<string>('PREVIEW_TEMP_DIR') || '/tmp/lab-previews'
    this.ensureTempDir()
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      this.logger.error('Failed to create temp directory:', error)
    }
  }

  async generateNotebookPreview(notebookBuffer: Buffer): Promise<{
    htmlContent: string
    previewPath: string
    cellMap: any
    metadata: any
  }> {
    const tempId = uuidv4()
    const notebookPath = join(this.tempDir, `${tempId}.ipynb`)
    const htmlPath = join(this.tempDir, `${tempId}.html`)
    const cellMapPath = join(this.tempDir, `${tempId}-cellmap.json`)

    try {
      // Write notebook to temp file
      await writeFile(notebookPath, notebookBuffer)

      // Parse notebook to extract cell map
      const notebookContent = JSON.parse(notebookBuffer.toString('utf-8'))
      const cellMap = this.generateCellMap(notebookContent)
      await writeFile(cellMapPath, JSON.stringify(cellMap, null, 2))

      // Generate HTML preview using nbconvert
      const htmlContent = await this.convertNotebookToHtml(notebookPath, htmlPath)

      // Extract metadata
      const metadata = this.extractNotebookMetadata(notebookContent)

      this.logger.log(`Generated preview for notebook: ${tempId}`)

      return {
        htmlContent,
        previewPath: htmlPath,
        cellMap,
        metadata,
      }
    } catch (error) {
      this.logger.error('Failed to generate notebook preview:', error)
      throw error
    }
  }

  private async convertNotebookToHtml(notebookPath: string, outputPath: string): Promise<string> {
    try {
      // Method 1: Try using node-nbconvert if available
      try {
        const { nbconvert } = require('@paperman-ai/nbviewer')
        const result = await nbconvert(notebookPath, {
          template: 'basic',
          outputFormat: 'html',
          noInput: false,
          noPrompt: false,
        })

        await writeFile(outputPath, result.html)
        return result.html
      } catch (error) {
        this.logger.warn('node-nbconvert not available, trying system nbconvert')
      }

      // Method 2: Try system nbconvert command
      try {
        const command = `jupyter nbconvert --to html --template basic --output "${outputPath}" "${notebookPath}"`
        await execAsync(command)

        const htmlContent = await readFile(outputPath, 'utf-8')
        return htmlContent
      } catch (error) {
        this.logger.warn('System nbconvert not available, using fallback')
      }

      // Method 3: Fallback to simple HTML generation
      return this.generateSimpleNotebookPreview(notebookPath, outputPath)
    } catch (error) {
      this.logger.error('All notebook conversion methods failed:', error)
      throw error
    }
  }

  private async generateSimpleNotebookPreview(notebookPath: string, outputPath: string): Promise<string> {
    const notebookContent = JSON.parse(await readFile(notebookPath, 'utf-8'))

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notebook Preview</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .cell { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .code-cell { background-color: #f8f9fa; }
        .markdown-cell { background-color: #ffffff; }
        .input { background-color: #f6f8fa; padding: 10px; border-radius: 3px; margin: 10px 0; font-family: monospace; white-space: pre-wrap; }
        .output { background-color: #f1f3f4; padding: 10px; border-radius: 3px; margin: 10px 0; }
        .error { color: #d73a49; }
        .metadata { font-size: 0.9em; color: #666; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="metadata">
        <h2>Notebook Information</h2>
        <p><strong>Format:</strong> ${notebookContent.nbformat || 'Unknown'}.${notebookContent.nbformat_minor || '0'}</p>
        <p><strong>Cells:</strong> ${notebookContent.cells?.length || 0}</p>
        <p><strong>Language:</strong> ${notebookContent.metadata?.kernelspec?.language || notebookContent.metadata?.language_info?.name || 'Unknown'}</p>
        <p><strong>Kernel:</strong> ${notebookContent.metadata?.kernelspec?.display_name || 'Unknown'}</p>
    </div>
`

    if (notebookContent.cells && Array.isArray(notebookContent.cells)) {
      notebookContent.cells.forEach((cell: any, index: number) => {
        const cellType = cell.cell_type || 'unknown'
        const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '')

        html += `<div class="cell ${cellType}-cell" id="cell-${index}">`
        html += `<h4>Cell ${index + 1} (${cellType})</h4>`

        if (source.trim()) {
          html += `<div class="input">${this.escapeHtml(source)}</div>`
        }

        if (cell.outputs && Array.isArray(cell.outputs)) {
          html += '<div class="outputs">'
          cell.outputs.forEach((output: any, outputIndex: number) => {
            html += `<div class="output" id="output-${index}-${outputIndex}">`

            if (output.output_type === 'stream') {
              const text = Array.isArray(output.text) ? output.text.join('') : output.text || ''
              html += `<pre>${this.escapeHtml(text)}</pre>`
            } else if (output.output_type === 'error') {
              const traceback = Array.isArray(output.traceback) ? output.traceback.join('\n') : output.traceback || ''
              html += `<pre class="error">${this.escapeHtml(traceback)}</pre>`
            } else if (output.data) {
              if (output.data['text/html']) {
                const htmlContent = Array.isArray(output.data['text/html'])
                  ? output.data['text/html'].join('')
                  : output.data['text/html']
                html += htmlContent
              } else if (output.data['text/plain']) {
                const text = Array.isArray(output.data['text/plain'])
                  ? output.data['text/plain'].join('')
                  : output.data['text/plain']
                html += `<pre>${this.escapeHtml(text)}</pre>`
              }
            }

            html += '</div>'
          })
          html += '</div>'
        }

        html += '</div>'
      })
    }

    html += `
</body>
</html>`

    await writeFile(outputPath, html)
    return html
  }

  private generateCellMap(notebookContent: any): any {
    const cellMap: any = {
      cells: [],
      metadata: {
        totalCells: 0,
        codeCells: 0,
        markdownCells: 0,
        rawCells: 0,
      },
    }

    if (notebookContent.cells && Array.isArray(notebookContent.cells)) {
      notebookContent.cells.forEach((cell: any, index: number) => {
        const cellType = cell.cell_type || 'unknown'
        const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '')

        const cellInfo = {
          index,
          type: cellType,
          lineCount: source.split('\n').length,
          characterCount: source.length,
          hasOutput: !!(cell.outputs && cell.outputs.length > 0),
          executionCount: cell.execution_count || null,
          metadata: cell.metadata || {},
        }

        cellMap.cells.push(cellInfo)
        cellMap.metadata.totalCells++

        switch (cellType) {
          case 'code':
            cellMap.metadata.codeCells++
            break
          case 'markdown':
            cellMap.metadata.markdownCells++
            break
          case 'raw':
            cellMap.metadata.rawCells++
            break
        }
      })
    }

    return cellMap
  }

  private extractNotebookMetadata(notebookContent: any): any {
    const metadata: any = {
      format: {
        nbformat: notebookContent.nbformat || 'unknown',
        nbformatMinor: notebookContent.nbformat_minor || '0',
      },
      kernelspec: notebookContent.metadata?.kernelspec || null,
      languageInfo: notebookContent.metadata?.language_info || null,
      authors: notebookContent.metadata?.authors || [],
      title: notebookContent.metadata?.title || null,
      custom: notebookContent.metadata || {},
    }

    // Add cell statistics
    if (notebookContent.cells && Array.isArray(notebookContent.cells)) {
      const cellStats = {
        total: notebookContent.cells.length,
        code: notebookContent.cells.filter((c: any) => c.cell_type === 'code').length,
        markdown: notebookContent.cells.filter((c: any) => c.cell_type === 'markdown').length,
        raw: notebookContent.cells.filter((c: any) => c.cell_type === 'raw').length,
      }
      metadata.cellStats = cellStats
    }

    return metadata
  }

  async generateMarkdownPreview(markdownBuffer: Buffer): Promise<{
    htmlContent: string
    previewPath: string
    metadata: any
  }> {
    const tempId = uuidv4()
    const markdownPath = join(this.tempDir, `${tempId}.md`)
    const htmlPath = join(this.tempDir, `${tempId}.html`)

    try {
      const markdownContent = markdownBuffer.toString('utf-8')
      await writeFile(markdownPath, markdownContent)

      // Simple markdown to HTML conversion
      const htmlContent = this.convertMarkdownToHtml(markdownContent)
      await writeFile(htmlPath, htmlContent)

      const metadata = {
        title: this.extractTitleFromMarkdown(markdownContent),
        wordCount: markdownContent.split(/\s+/).length,
        lineCount: markdownContent.split('\n').length,
        characterCount: markdownContent.length,
      }

      this.logger.log(`Generated preview for markdown: ${tempId}`)

      return {
        htmlContent,
        previewPath: htmlPath,
        metadata,
      }
    } catch (error) {
      this.logger.error('Failed to generate markdown preview:', error)
      throw error
    }
  }

  private convertMarkdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion (basic implementation)
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Preview</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <p>${html}</p>
</body>
</html>`
  }

  private extractTitleFromMarkdown(markdown: string): string {
    const match = markdown.match(/^# (.+)$/m)
    return match ? match[1] : 'Untitled'
  }

  async generateCodePreview(codeBuffer: Buffer, language: string = 'text'): Promise<{
    htmlContent: string
    previewPath: string
    metadata: any
  }> {
    const tempId = uuidv4()
    const codePath = join(this.tempDir, `${tempId}.${this.getFileExtension(language)}`)
    const htmlPath = join(this.tempDir, `${tempId}.html`)

    try {
      const codeContent = codeBuffer.toString('utf-8')
      await writeFile(codePath, codeContent)

      const htmlContent = this.convertCodeToHtml(codeContent, language)
      await writeFile(htmlPath, htmlContent)

      const metadata = {
        language,
        lineCount: codeContent.split('\n').length,
        characterCount: codeContent.length,
        wordCount: codeContent.split(/\s+/).length,
      }

      this.logger.log(`Generated preview for code: ${tempId}`)

      return {
        htmlContent,
        previewPath: htmlPath,
        metadata,
      }
    } catch (error) {
      this.logger.error('Failed to generate code preview:', error)
      throw error
    }
  }

  private convertCodeToHtml(code: string, language: string): string {
    const escapedCode = this.escapeHtml(code)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Preview (${language})</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background-color: #f8f9fa; }
        pre {
            background-color: #ffffff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            overflow-x: auto;
            white-space: pre-wrap;
            line-height: 1.4;
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            margin: -20px -20px 20px -20px;
            border-radius: 5px 5px 0 0;
        }
        .line-numbers {
            color: #666;
            margin-right: 20px;
            user-select: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h3>Code Preview - ${language.toUpperCase()}</h3>
    </div>
    <pre><code>${escapedCode}</code></pre>
</body>
</html>`
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      r: 'R',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      markdown: 'md',
      shell: 'sh',
      powershell: 'ps1',
    }
    return extensions[language.toLowerCase()] || 'txt'
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }

  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    try {
      const fs = require('fs')
      const path = require('path')

      const files = await fs.promises.readdir(this.tempDir)
      const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000
      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        const stats = await fs.promises.stat(filePath)

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.promises.unlink(filePath)
          deletedCount++
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} temp files older than ${olderThanHours} hours`)
    } catch (error) {
      this.logger.error('Failed to cleanup temp files:', error)
    }
  }

  async generateThumbnail(htmlContent: string, outputPath: string): Promise<void> {
    // This is a placeholder for thumbnail generation
    // In a real implementation, you might use puppeteer or similar
    this.logger.log(`Thumbnail generation requested for: ${outputPath}`)

    // For now, just create a placeholder SVG
    const svg = `
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="200" fill="#f8f9fa"/>
  <rect x="10" y="10" width="280" height="180" fill="white" stroke="#ddd" stroke-width="1"/>
  <text x="150" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666">
    Preview Available
  </text>
</svg>`

    await writeFile(outputPath, svg)
  }

  /**
   * Generate preview for a lab template
   */
  async generatePreview(templateId: string): Promise<void> {
    this.logger.log(`Starting preview generation for template: ${templateId}`)

    try {
      // Get lab template
      const template = await this.labTemplateRepository.findOne({
        where: { id: templateId }
      })

      if (!template) {
        throw new Error(`Lab template ${templateId} not found`)
      }

      // Update status to processing
      await this.labTemplateRepository.update(templateId, {
        status: 'processing',
        metadata: {
          ...template.metadata,
          previewGenerationStarted: new Date().toISOString()
        }
      })

      // Download notebook from storage
      const notebookBuffer = await this.storageService.downloadFile(template.notebookUrl)

      // Generate preview
      const previewResult = await this.generateNotebookPreview(notebookBuffer)

      // Upload preview files to storage
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

      // Generate and upload thumbnail
      const thumbnailSvg = await this.generateThumbnailSvg(previewResult.htmlContent)
      const thumbnailUrl = await this.storageService.uploadPreview(
        Buffer.from(thumbnailSvg),
        `${templateId}/thumbnail.svg`,
        template.tenantId
      )

      // Update template with preview URLs
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

      // Cleanup temp files
      await this.cleanupTempFiles([
        previewResult.previewPath,
        join(this.tempDir, `${templateId}-cellmap.json`)
      ])

      this.logger.log(`Successfully generated preview for template: ${templateId}`)

    } catch (error) {
      this.logger.error(`Failed to generate preview for template ${templateId}: ${error.message}`, error.stack)

      // Update template status to failed
      await this.labTemplateRepository.update(templateId, {
        status: 'preview_failed',
        metadata: {
          previewError: error.message,
          previewFailedAt: new Date().toISOString()
        }
      })

      throw error
    }
  }

  /**
   * Generate thumbnail SVG
   */
  private async generateThumbnailSvg(htmlContent: string): Promise<string> {
    // Extract title from HTML content
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
    const title = titleMatch ? titleMatch[1] : 'Notebook Preview'

    // Extract cell count from HTML content
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

  <!-- Background -->
  <rect width="300" height="200" fill="#f8f9fa"/>

  <!-- Notebook header -->
  <rect width="300" height="40" fill="url(#header)"/>
  <text x="150" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white" font-weight="bold">
    Jupyter Notebook
  </text>

  <!-- Content area -->
  <rect x="10" y="50" width="280" height="140" fill="white" stroke="#E2E8F0" stroke-width="1" rx="5"/>

  <!-- Title -->
  <text x="150" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#1E293B" font-weight="600">
    ${this.truncateText(title, 35)}
  </text>

  <!-- Cell count indicator -->
  <rect x="20" y="90" width="60" height="20" fill="#EEF2FF" rx="3"/>
  <text x="50" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#4F46E5">
    ${cellCount} cells
  </text>

  <!-- Code cell indicator -->
  <rect x="90" y="90" width="50" height="20" fill="#F5F3FF" rx="3"/>
  <text x="115" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6D28D9">
    Code
  </text>

  <!-- Markdown cell indicator -->
  <rect x="150" y="90" width="60" height="20" fill="#ECFDF3" rx="3"/>
  <text x="180" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#047857">
    Text
  </text>

  <!-- Preview status -->
  <circle cx="20" cy="170" r="4" fill="#10B981"/>
  <text x="30" y="174" font-family="Arial, sans-serif" font-size="10" fill="#475569">
    Preview Ready
  </text>

  <!-- Timestamp -->
  <text x="270" y="174" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#94A3B8">
    ${new Date().toLocaleDateString()}
  </text>
</svg>`
  }

  /**
   * Truncate text to fit in specified width
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Cleanup specific temp files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await unlink(filePath)
      } catch (error) {
        // Ignore file not found errors
        if (error.code !== 'ENOENT') {
          this.logger.warn(`Failed to delete temp file ${filePath}: ${error.message}`)
        }
      }
    }
  }
}
