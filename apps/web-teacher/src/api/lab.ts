import request from '@/utils/request'

export interface CreateLabTemplateDto {
  title: string
  description: string
  labType: 'jupyter' | 'python' | 'r' | 'markdown'
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tags?: string[]
  packageManifest?: {
    pip: string[]
    pip_optional: string[]
    npm: string[]
    conda: string[]
    system: string[]
  }
  metadata?: {
    gradeLevel?: string
    subject?: string
    topics?: string[]
    estimatedDuration?: string
    learningObjectives?: string[]
    prerequisites?: string[]
  }
  courseActivityId?: string
  gradeBand?: string
  autoRenderPreview?: boolean
}

export interface LabTemplate {
  id: string
  tenantId: string
  title: string
  description: string
  labType: string
  difficultyLevel: string
  tags: string[]
  notebookUrl: string
  notebookChecksum: string
  notebookSize: number
  previewUrl?: string
  cellMapUrl?: string
  thumbnailUrl?: string
  runtimeSpec: Record<string, any>
  gradingMatrixJson: Record<string, any>
  courseActivityId?: string
  gradeBand?: string
  status: 'processing' | 'ready' | 'preview_failed'
  metadata: Record<string, any>
  createdBy: string
  createdAt: string
  updatedAt: string
  resourceRefs?: Array<{
    id: string
    filename: string
    url: string
    checksum: string
    size: number
    type: string
  }>
}

export interface LabTemplateListResponse {
  templates: LabTemplate[]
  total: number
  page: number
  limit: number
}

export interface UploadResponse {
  url: string
  etag: string
}

/**
 * Lab API Service
 */
export class LabApiService {
  private static readonly BASE_URL = '/api/v1/labs/templates'

  /**
   * Upload notebook and create lab template
   */
  static async createLabTemplate(
    data: CreateLabTemplateDto,
    notebookFile: File,
    attachments: File[] = []
  ): Promise<LabTemplate> {
    const formData = new FormData()

    // Append form data
    Object.keys(data).forEach(key => {
      const value = data[key as keyof CreateLabTemplateDto]
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value.toString())
        }
      }
    })

    // Append notebook file
    formData.append('notebook', notebookFile)

    // Append attachment files
    attachments.forEach((file, index) => {
      formData.append(`attachments`, file)
    })

    return request({
      url: attachments.length > 0 ? `${this.BASE_URL}/with-attachments` : this.BASE_URL,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * Update lab template
   */
  static async updateLabTemplate(
    id: string,
    data: Partial<CreateLabTemplateDto>
  ): Promise<LabTemplate> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * Get lab template by ID
   */
  static async getLabTemplate(id: string): Promise<LabTemplate> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'GET'
    })
  }

  /**
   * Get lab templates with filtering and pagination
   */
  static async getLabTemplates(params: {
    page?: number
    limit?: number
    search?: string
    labType?: string
    difficultyLevel?: string
    gradeBand?: string
    tags?: string[]
    courseActivityId?: string
  } = {}): Promise<LabTemplateListResponse> {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach(key => {
      const value = params[key as keyof typeof params]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item))
        } else {
          queryParams.append(key, value.toString())
        }
      }
    })

    const url = queryParams.toString()
      ? `${this.BASE_URL}?${queryParams.toString()}`
      : this.BASE_URL

    return request({
      url,
      method: 'GET'
    })
  }

  /**
   * Delete lab template
   */
  static async deleteLabTemplate(id: string): Promise<void> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * Update lab template binding to course activity
   */
  static async updateBinding(
    id: string,
    courseActivityId: string,
    gradeBand?: string
  ): Promise<LabTemplate> {
    return request({
      url: `${this.BASE_URL}/${id}/binding`,
      method: 'POST',
      data: {
        courseActivityId,
        gradeBand
      }
    })
  }

  /**
   * Validate notebook file before upload
   */
  static validateNotebookFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check file extension
    if (!file.name.endsWith('.ipynb')) {
      errors.push('只支持 .ipynb 格式的文件')
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      errors.push('文件大小不能超过 50MB')
    }

    // Check MIME type
    const allowedTypes = [
      'application/x-ipynb+json',
      'application/json',
      'text/plain'
    ]
    if (!allowedTypes.includes(file.type)) {
      errors.push('不支持的文件类型')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Read notebook file content
   */
  static async readNotebookFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const notebook = JSON.parse(content)

          // Validate notebook structure
          if (!notebook.cells || !Array.isArray(notebook.cells)) {
            reject(new Error('无效的 Notebook 格式：缺少 cells 数组'))
            return
          }

          resolve(notebook)
        } catch (error) {
          reject(new Error('无法解析 Notebook 文件：无效的 JSON 格式'))
        }
      }

      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Extract notebook metadata
   */
  static extractNotebookMetadata(notebook: any): {
    cellCount: number
    codeCells: number
    markdownCells: number
    kernelSpec?: any
    languageInfo?: any
  } {
    const cells = notebook.cells || []

    const cellCount = cells.length
    const codeCells = cells.filter((cell: any) => cell.cell_type === 'code').length
    const markdownCells = cells.filter((cell: any) => cell.cell_type === 'markdown').length

    return {
      cellCount,
      codeCells,
      markdownCells,
      kernelSpec: notebook.metadata?.kernelspec,
      languageInfo: notebook.metadata?.language_info
    }
  }
}

export default LabApiService