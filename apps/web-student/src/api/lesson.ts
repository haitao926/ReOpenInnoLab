import type { Lesson, LessonSection, StudentProgress, AssignmentSubmission } from '@/types/lesson'
import type { WebSocketMessage } from '@shared-utils/websocket/types'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class LessonAPI {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token')
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // 获取课程详情
  async getLesson(lessonId: string): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}`)
  }

  // 获取课程列表
  async getLessons(params?: {
    courseId?: string
    classroomId?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ lessons: Lesson[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams(params as any).toString()
    const query = searchParams ? `?${searchParams}` : ''
    return this.request(`/lessons${query}`)
  }

  // 获取学生的课程进度
  async getStudentProgress(lessonId: string): Promise<StudentProgress> {
    return this.request<StudentProgress>(`/lessons/${lessonId}/progress`)
  }

  // 保存学生进度
  async saveStudentProgress(progress: StudentProgress): Promise<void> {
    return this.request(`/lessons/${progress.lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progress),
    })
  }

  // 同步学生活动数据
  async syncStudentActivity(type: string, data: any): Promise<void> {
    return this.request('/student-activity', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    })
  }

  // 提交作业
  async submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'>): Promise<AssignmentSubmission> {
    return this.request<AssignmentSubmission>('/assignments', {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  }

  // 获取作业提交记录
  async getAssignmentSubmission(lessonId: string, sectionId: string): Promise<AssignmentSubmission | null> {
    try {
      return this.request<AssignmentSubmission>(`/lessons/${lessonId}/sections/${sectionId}/assignment`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  // 获取课程统计信息
  async getLessonStats(lessonId: string): Promise<{
    totalStudents: number
    activeStudents: number
    averageProgress: number
    completionRate: number
    interactions: {
      total: number
      questions: number
      handRaises: number
      notes: number
    }
  }> {
    return this.request(`/lessons/${lessonId}/stats`)
  }

  // 发送实时消息到后端（用于WebSocket消息持久化）
  async sendWebSocketMessage(message: WebSocketMessage): Promise<void> {
    return this.request('/ws/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    })
  }

  // 获取课堂参与学生列表
  async getLessonParticipants(lessonId: string): Promise<Array<{
    id: string
    name: string
    avatar?: string
    status: 'online' | 'offline' | 'away'
    joinedAt: Date
    lastActivity: Date
    progress: number
  }>> {
    return this.request(`/lessons/${lessonId}/participants`)
  }

  // 加入课堂
  async joinLesson(lessonId: string): Promise<void> {
    return this.request(`/lessons/${lessonId}/join`, {
      method: 'POST',
    })
  }

  // 离开课堂
  async leaveLesson(lessonId: string): Promise<void> {
    return this.request(`/lessons/${lessonId}/leave`, {
      method: 'POST',
    })
  }

  // 举手
  async raiseHand(lessonId: string, raised: boolean): Promise<void> {
    return this.request(`/lessons/${lessonId}/hand`, {
      method: 'POST',
      body: JSON.stringify({ raised }),
    })
  }

  // 提问
  async askQuestion(lessonId: string, question: string): Promise<void> {
    return this.request(`/lessons/${lessonId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    })
  }

  // 记录笔记
  async saveNote(lessonId: string, content: string, sectionId?: string): Promise<void> {
    return this.request(`/lessons/${lessonId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ sectionId, content }),
    })
  }

  // 获取笔记
  async getNotes(lessonId: string, sectionId?: string): Promise<Array<{
    id: string
    content: string
    sectionId?: string
    createdAt: Date
    updatedAt: Date
  }>> {
    const query = sectionId ? `?sectionId=${sectionId}` : ''
    return this.request(`/lessons/${lessonId}/notes${query}`)
  }

  // 上传文件（如作业附件）
  async uploadFile(lessonId: string, file: File, type: 'assignment' | 'note' | 'general'): Promise<{
    id: string
    filename: string
    url: string
    size: number
    type: string
  }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${this.baseURL}/lessons/${lessonId}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  // 获取课程环节详情
  async getSection(lessonId: string, sectionId: string): Promise<LessonSection> {
    return this.request<LessonSection>(`/lessons/${lessonId}/sections/${sectionId}`)
  }

  // 完成环节
  async completeSection(lessonId: string, sectionId: string, data?: any): Promise<void> {
    return this.request(`/lessons/${lessonId}/sections/${sectionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // 获取环节资源
  async getSectionResources(lessonId: string, sectionId: string): Promise<Array<{
    id: string
    title: string
    type: 'document' | 'video' | 'image' | 'link' | 'interactive'
    url: string
    size?: number
    duration?: number
    description?: string
  }>> {
    return this.request(`/lessons/${lessonId}/sections/${sectionId}/resources`)
  }

  // 记录学习分析数据
  async recordAnalytics(lessonId: string, data: {
    eventType: string
    sectionId?: string
    data: any
    timestamp: Date
  }): Promise<void> {
    return this.request(`/lessons/${lessonId}/analytics`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// 创建单例实例
export const lessonApi = new LessonAPI()

// 导出类型
export type { LessonAPI }
