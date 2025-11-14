import type { Lesson, LessonSection } from '@/types/lesson'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003'

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

  // 创建课程实例
  async createLesson(data: {
    courseId: string
    classroomId: string
    title: string
    description?: string
    scheduledStartAt?: Date
    scheduledEndAt?: Date
    sections?: Array<{
      title: string
      type: string
      order: number
      duration: number
    }>
  }): Promise<Lesson> {
    return this.request<Lesson>('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新课程实例
  async updateLesson(lessonId: string, data: Partial<Lesson>): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 开始课程
  async startLesson(lessonId: string, data?: {
    startNotes?: string
  }): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}/start`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // 暂停课程
  async pauseLesson(lessonId: string, data?: {
    reason?: string
  }): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}/pause`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // 恢复课程
  async resumeLesson(lessonId: string): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}/resume`, {
      method: 'POST',
    })
  }

  // 结束课程
  async endLesson(lessonId: string, data?: {
    endReason?: string
    endNotes?: string
  }): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}/end`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // 设置当前环节
  async setCurrentSection(lessonId: string, sectionId: string): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${lessonId}/current-section`, {
      method: 'POST',
      body: JSON.stringify({ sectionId }),
    })
  }

  // 获取课程环节列表
  async getLessonSections(lessonId: string): Promise<LessonSection[]> {
    return this.request<LessonSection[]>(`/lessons/${lessonId}/sections`)
  }

  // 获取课程统计信息
  async getLessonStats(lessonId: string): Promise<{
    participantCount: number
    activeStudents: number
    averageProgress: number
    interactions: {
      total: number
      questions: number
      handRaises: number
      notes: number
    }
    sectionStats: Array<{
      sectionId: string
      title: string
      averageTime: number
      completionRate: number
    }>
  }> {
    return this.request(`/lessons/${lessonId}/stats`)
  }

  // 获取参与学生列表
  async getLessonParticipants(lessonId: string): Promise<Array<{
    id: string
    name: string
    avatar?: string
    status: 'online' | 'offline' | 'away'
    joinedAt: Date
    lastActivity: Date
    progress: number
    currentSection: number
    handRaised: boolean
  }>> {
    return this.request(`/lessons/${lessonId}/participants`)
  }

  // 保存批注
  async saveLessonAnnotations(lessonId: string, annotations: Array<{
    content: string
    type: 'note' | 'highlight' | 'drawing'
    sectionId?: string
    position?: {
      x: number
      y: number
    }
    timestamp: Date
  }>): Promise<void> {
    return this.request(`/lessons/${lessonId}/annotations`, {
      method: 'POST',
      body: JSON.stringify({ annotations }),
    })
  }

  // 获取批注
  async getLessonAnnotations(lessonId: string, sectionId?: string): Promise<Array<{
    id: string
    content: string
    type: 'note' | 'highlight' | 'drawing'
    sectionId?: string
    position?: {
      x: number
      y: number
    }
    createdAt: Date
    createdBy: string
  }>> {
    const query = sectionId ? `?sectionId=${sectionId}` : ''
    return this.request(`/lessons/${lessonId}/annotations${query}`)
  }

  // 记录环节事件
  async recordSectionEvent(lessonId: string, data: {
    type: 'section_start' | 'section_end' | 'section_pause'
    sectionIndex: number
    timestamp: Date
    data?: any
  }): Promise<void> {
    return this.request(`/lessons/${lessonId}/section-events`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 生成课程报告
  async generateLessonReport(lessonId: string): Promise<{
    id: string
    lessonId: string
    summary: {
      totalParticipants: number
      totalDuration: number
      completionRate: number
      averageScore?: number
    }
    sectionReports: Array<{
      sectionId: string
      title: string
      averageTime: number
      completionRate: number
      interactionCount: number
    }>
    participantReports: Array<{
      studentId: string
      name: string
      totalTime: number
      progress: number
      interactionCount: number
      score?: number
    }>
    insights: Array<{
      type: 'strength' | 'concern' | 'recommendation'
      title: string
      description: string
    }>
    generatedAt: Date
  }> {
    return this.request(`/lessons/${lessonId}/report`, {
      method: 'POST',
    })
  }

  // 广播消息到所有学生
  async broadcastToStudents(lessonId: string, message: {
    type: string
    data: any
  }): Promise<void> {
    return this.request(`/lessons/${lessonId}/broadcast`, {
      method: 'POST',
      body: JSON.stringify(message),
    })
  }

  // 处理学生举手
  async handleHandRaise(lessonId: string, studentId: string, action: 'accept' | 'reject'): Promise<void> {
    return this.request(`/lessons/${lessonId}/hand-raise/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  }

  // 回答学生问题
  async answerStudentQuestion(lessonId: string, questionId: string, answer: string): Promise<void> {
    return this.request(`/lessons/${lessonId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    })
  }

  // 获取实时活动日志
  async getActivityLog(lessonId: string, limit?: number): Promise<Array<{
    id: string
    type: string
    studentId?: string
    studentName?: string
    data: any
    timestamp: Date
  }>> {
    const query = limit ? `?limit=${limit}` : ''
    return this.request(`/lessons/${lessonId}/activity-log${query}`)
  }
}

// 创建单例实例
export const lessonApi = new LessonAPI()

// 导出类型
export type { LessonAPI }