import request from '@/utils/request'
import type {
  ExperienceTemplate,
  CreateExperienceTemplateDto,
  ExperienceRun,
  CreateExperienceRunDto,
  ExperienceReport,
  ExperienceEventDto
} from '@/types/experience'

export interface ExperienceTemplateListResponse {
  templates: ExperienceTemplate[]
  total: number
  page: number
  limit: number
}

export interface ExperienceRunListResponse {
  runs: ExperienceRun[]
  total: number
  page: number
  limit: number
}

/**
 * Experience API Service
 */
export class ExperienceApiService {
  private static readonly BASE_URL = '/api/v1/experiences'

  // ========== Templates ==========

  /**
   * Create experience template
   */
  static async createExperienceTemplate(
    data: CreateExperienceTemplateDto
  ): Promise<ExperienceTemplate> {
    return request({
      url: `${this.BASE_URL}/templates`,
      method: 'POST',
      data
    })
  }

  /**
   * Update experience template
   */
  static async updateExperienceTemplate(
    id: string,
    data: Partial<CreateExperienceTemplateDto>
  ): Promise<ExperienceTemplate> {
    return request({
      url: `${this.BASE_URL}/templates/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * Get experience template by ID
   */
  static async getExperienceTemplate(id: string): Promise<ExperienceTemplate> {
    return request({
      url: `${this.BASE_URL}/templates/${id}`,
      method: 'GET'
    })
  }

  /**
   * Get experience templates with filtering and pagination
   */
  static async getExperienceTemplates(
    params: {
      page?: number
      limit?: number
      search?: string
      type?: string
      status?: 'draft' | 'published' | 'archived'
      tags?: string[]
      gradeLevel?: string
      subject?: string
      createdBy?: string
    } = {}
  ): Promise<ExperienceTemplateListResponse> {
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
      ? `${this.BASE_URL}/templates?${queryParams.toString()}`
      : `${this.BASE_URL}/templates`

    return request({
      url,
      method: 'GET'
    })
  }

  /**
   * Delete experience template
   */
  static async deleteExperienceTemplate(id: string): Promise<void> {
    return request({
      url: `${this.BASE_URL}/templates/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * Duplicate experience template
   */
  static async duplicateExperienceTemplate(id: string): Promise<ExperienceTemplate> {
    return request({
      url: `${this.BASE_URL}/templates/${id}/duplicate`,
      method: 'POST'
    })
  }

  /**
   * Publish experience template
   */
  static async publishExperienceTemplate(id: string): Promise<ExperienceTemplate> {
    return request({
      url: `${this.BASE_URL}/templates/${id}/publish`,
      method: 'POST'
    })
  }

  /**
   * Archive experience template
   */
  static async archiveExperienceTemplate(id: string): Promise<ExperienceTemplate> {
    return request({
      url: `${this.BASE_URL}/templates/${id}/archive`,
      method: 'POST'
    })
  }

  // ========== Runs ==========

  /**
   * Create experience run
   */
  static async createExperienceRun(data: CreateExperienceRunDto): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs`,
      method: 'POST',
      data
    })
  }

  /**
   * Get experience run by ID
   */
  static async getExperienceRun(id: string): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs/${id}`,
      method: 'GET'
    })
  }

  /**
   * Get experience runs list
   */
  static async getExperienceRuns(
    params: {
      page?: number
      limit?: number
      lessonId?: string
      classId?: string
      status?: string
      instructorId?: string
    } = {}
  ): Promise<ExperienceRunListResponse> {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach(key => {
      const value = params[key as keyof typeof params]
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })

    const url = queryParams.toString()
      ? `${this.BASE_URL}/runs?${queryParams.toString()}`
      : `${this.BASE_URL}/runs`

    return request({
      url,
      method: 'GET'
    })
  }

  /**
   * Start experience run
   */
  static async startExperienceRun(id: string): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/start`,
      method: 'POST'
    })
  }

  /**
   * Pause experience run
   */
  static async pauseExperienceRun(id: string, reason?: string): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/pause`,
      method: 'POST',
      data: { reason }
    })
  }

  /**
   * Resume experience run
   */
  static async resumeExperienceRun(id: string): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/resume`,
      method: 'POST'
    })
  }

  /**
   * End experience run
   */
  static async endExperienceRun(id: string): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/end`,
      method: 'POST'
    })
  }

  /**
   * Extend experience run duration
   */
  static async extendExperienceRun(id: string, additionalMinutes: number): Promise<ExperienceRun> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/extend`,
      method: 'POST',
      data: { additionalMinutes }
    })
  }

  /**
   * Send reminder to participants
   */
  static async sendReminder(id: string, message?: string): Promise<void> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/reminder`,
      method: 'POST',
      data: { message }
    })
  }

  // ========== Events & Analytics ==========

  /**
   * Submit experience event
   */
  static async submitExperienceEvent(runId: string, data: ExperienceEventDto): Promise<void> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/events`,
      method: 'POST',
      data
    })
  }

  /**
   * Get experience run analytics
   */
  static async getExperienceRunAnalytics(id: string): Promise<any> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/analytics`,
      method: 'GET'
    })
  }

  /**
   * Get experience run timeline
   */
  static async getExperienceRunTimeline(id: string): Promise<any> {
    return request({
      url: `${this.BASE_URL}/runs/${id}/timeline`,
      method: 'GET'
    })
  }

  /**
   * Get participant responses
   */
  static async getParticipantResponses(runId: string, studentId?: string): Promise<any> {
    const url = studentId
      ? `${this.BASE_URL}/runs/${runId}/participants/${studentId}/responses`
      : `${this.BASE_URL}/runs/${runId}/responses`

    return request({
      url,
      method: 'GET'
    })
  }

  // ========== Reports ==========

  /**
   * Generate experience report
   */
  static async generateExperienceReport(runId: string): Promise<ExperienceReport> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/report`,
      method: 'POST'
    })
  }

  /**
   * Get experience report
   */
  static async getExperienceReport(runId: string): Promise<ExperienceReport> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/report`,
      method: 'GET'
    })
  }

  /**
   * Export experience data
   */
  static async exportExperienceData(runId: string, format: 'csv' | 'json' | 'xlsx'): Promise<Blob> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/export`,
      method: 'GET',
      params: { format },
      responseType: 'blob'
    })
  }

  // ========== Helper Methods ==========

  /**
   * Validate experience HTML content
   */
  static async validateExperienceContent(html: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    return request({
      url: `${this.BASE_URL}/validate/html`,
      method: 'POST',
      data: { html }
    })
  }

  /**
   * Test postMessage schema
   */
  static async testMessageSchema(schema: any): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    return request({
      url: `${this.BASE_URL}/validate/message-schema`,
      method: 'POST',
      data: { schema }
    })
  }

  /**
   * Generate AI content suggestions
   */
  static async generateAISuggestions(
    type: string,
    context: any
  ): Promise<{
    questions?: any[]
    hints?: string[]
    instructions?: string
  }> {
    return request({
      url: `${this.BASE_URL}/ai/suggestions`,
      method: 'POST',
      data: { type, context }
    })
  }

  /**
   * Get experience statistics
   */
  static async getExperienceStats(filters?: {
    dateRange?: { start: string; end: string }
    instructorId?: string
    classId?: string
    type?: string
  }): Promise<{
    totalTemplates: number
    totalRuns: number
    totalParticipants: number
    averageCompletionRate: number
    averageScore: number
    popularTypes: Array<{ type: string; count: number }>
    recentActivity: any[]
  }> {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters]
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([k, v]) => {
              queryParams.append(`${key}[${k}]`, String(v))
            })
          } else {
            queryParams.append(key, String(value))
          }
        }
      })
    }

    const url = queryParams.toString()
      ? `${this.BASE_URL}/stats?${queryParams.toString()}`
      : `${this.BASE_URL}/stats`

    return request({
      url,
      method: 'GET'
    })
  }

  /**
   * Get experience run participants
   */
  static async getExperienceRunParticipants(runId: string): Promise<any[]> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/participants`,
      method: 'GET'
    })
  }

  /**
   * Get experience run statistics
   */
  static async getExperienceRunStatistics(runId: string): Promise<any> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/statistics`,
      method: 'GET'
    })
  }

  /**
   * Get experience run results
   */
  static async getExperienceRunResults(runId: string): Promise<any> {
    return request({
      url: `${this.BASE_URL}/runs/${runId}/results`,
      method: 'GET'
    })
  }

  /**
   * Export experience run data
   */
  static async exportExperienceRunData(runId: string, options: {
    format: 'xlsx' | 'csv' | 'json'
    content: {
      includeSummary: boolean
      includeDetails: boolean
      includeTimestamps: boolean
    }
  }): Promise<string> {
    const response = await request({
      url: `${this.BASE_URL}/runs/${runId}/export`,
      method: 'POST',
      data: options
    })
    return response.downloadUrl
  }
}

export default ExperienceApiService
