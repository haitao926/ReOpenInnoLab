import { apiClient } from './client'
import type {
  CreateCourseDto,
  CreateCourseWithContentDto,
  UpdateCourseDto
} from '@reopeninnolab/course-service'

// 课程API响应类型
export interface CourseResponse {
  id: string
  title: string
  description: string
  code: string
  subject: string
  gradeBand: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  thumbnail?: string
  metadata?: any
  tenantId: string
  createdAt: string
  updatedAt: string
  versions?: CourseVersionResponse[]
}

export interface CourseVersionResponse {
  id: string
  courseId: string
  version: string
  aclJsonb: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  versionMetadata?: any
  publishedAt?: string
  createdAt: string
}

export interface CourseListResponse {
  courses: CourseResponse[]
  total: number
  page: number
  limit: number
}

export interface CourseStats {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  totalVersions: number
  totalModules: number
  totalActivities: number
}

export interface CourseListOptions {
  page?: number
  limit?: number
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  subject?: string
  gradeBand?: string
  search?: string
}

export interface CreateVersionRequest {
  aclContent: any
  versionMetadata?: any
}

/**
 * 课程API客户端
 */
export class CourseApi {
  private baseUrl = '/courses'

  /**
   * 获取课程列表
   */
  async getCourses(options: CourseListOptions = {}): Promise<CourseListResponse> {
    const params = new URLSearchParams()

    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.status) params.append('status', options.status)
    if (options.subject) params.append('subject', options.subject)
    if (options.gradeBand) params.append('gradeBand', options.gradeBand)
    if (options.search) params.append('search', options.search)

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    const response = await apiClient.get<CourseListResponse>(url)
    return response.data
  }

  /**
   * 获取课程详情
   */
  async getCourseById(id: string): Promise<CourseResponse> {
    const response = await apiClient.get<CourseResponse>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * 创建课程（仅基本信息）
   */
  async createCourse(data: CreateCourseDto): Promise<CourseResponse> {
    const response = await apiClient.post<CourseResponse>(this.baseUrl, data)
    return response.data
  }

  /**
   * 创建带内容的完整课程
   */
  async createCourseWithContent(data: CreateCourseWithContentDto): Promise<{
    course: CourseResponse
    versionId: string
  }> {
    const response = await apiClient.post<{
      course: CourseResponse
      versionId: string
    }>(`${this.baseUrl}/with-content`, data)
    return response.data
  }

  /**
   * 更新课程
   */
  async updateCourse(id: string, data: UpdateCourseDto): Promise<CourseResponse> {
    const response = await apiClient.put<CourseResponse>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * 发布课程
   */
  async publishCourse(id: string): Promise<CourseResponse> {
    const response = await apiClient.post<CourseResponse>(`${this.baseUrl}/${id}/publish`)
    return response.data
  }

  /**
   * 归档课程
   */
  async archiveCourse(id: string): Promise<CourseResponse> {
    const response = await apiClient.post<CourseResponse>(`${this.baseUrl}/${id}/archive`)
    return response.data
  }

  /**
   * 删除课程
   */
  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * 获取课程最新版本
   */
  async getLatestVersion(courseId: string): Promise<CourseVersionResponse> {
    const response = await apiClient.get<CourseVersionResponse>(
      `${this.baseUrl}/${courseId}/versions/latest`
    )
    return response.data
  }

  /**
   * 获取课程已发布版本
   */
  async getPublishedVersion(courseId: string): Promise<CourseVersionResponse> {
    const response = await apiClient.get<CourseVersionResponse>(
      `${this.baseUrl}/${courseId}/versions/published`
    )
    return response.data
  }

  /**
   * 创建课程版本
   */
  async createVersion(courseId: string, data: CreateVersionRequest): Promise<CourseVersionResponse> {
    const response = await apiClient.post<CourseVersionResponse>(
      `${this.baseUrl}/${courseId}/versions`,
      data
    )
    return response.data
  }

  /**
   * 获取课程统计信息
   */
  async getCourseStats(): Promise<CourseStats> {
    const response = await apiClient.get<CourseStats>(`${this.baseUrl}/stats`)
    return response.data
  }
}

// 单例实例
export const courseApi = new CourseApi()