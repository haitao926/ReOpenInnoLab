import type { AxiosResponse } from 'axios'
import { apiClient, ApiResponse, createApiResponse, handleApiError, retryRequest, withCache } from './client'

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  courseCount?: number
  studentCount?: number
}

export interface SubjectFilterResponse {
  subjects: Subject[]
  totalCount: number
  defaultSubject?: string
}

const enableMock = import.meta.env.VITE_ENABLE_MOCK_API === 'true'

class SubjectService {
  private baseUrl = '/subjects'

  /**
   * 获取教师可教授的学科列表（带缓存）
   * @param teacherId 教师ID
   * @param useCache 是否使用缓存
   * @returns 学科列表
   */
  async getTeacherSubjects(teacherId?: string, useCache = true): Promise<ApiResponse<SubjectFilterResponse>> {
    if (enableMock) {
      const data = this.getDefaultSubjects()
      return createApiResponse(data, 'mock subjects')
    }

    const url = teacherId ? `${this.baseUrl}/teacher/${teacherId}` : `${this.baseUrl}/teacher/me`
    const cacheKey = `subjects-teacher-${teacherId || 'me'}`

    const requestFn = async (): Promise<ApiResponse<SubjectFilterResponse>> => {
      const response = await apiClient.get<ApiResponse<SubjectFilterResponse>>(url)

      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || '获取教师学科列表失败')
      }
    }

    try {
      const result = useCache
        ? await withCache(cacheKey, requestFn, 10 * 60 * 1000) // 10分钟缓存
        : await requestFn()

      return result
    } catch (error) {
      // 静默处理API错误，使用默认数据降级
      // console.error('获取教师学科列表失败:', error) // 临时注释以减少控制台噪音
      // const errorMessage = handleApiError(error, '获取教师学科列表失败')
      // console.warn('使用默认学科列表作为降级方案')
      return createApiResponse(this.getDefaultSubjects(), '使用默认学科列表')
    }
  }

  /**
   * 获取所有可用学科列表
   * @param includeInactive 是否包含非活跃学科
   * @returns 学科列表
   */
  async getAllSubjects(includeInactive = false): Promise<Subject[]> {
    if (enableMock) {
      return this.getDefaultSubjects().subjects
    }

    try {
      const response = await apiClient.get<ApiResponse<Subject[]>>(
        `${this.baseUrl}/all`,
        {
          params: { includeInactive }
        }
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取学科列表失败')
      }
    } catch (error) {
      console.error('获取学科列表失败:', error)
      const errorMessage = handleApiError(error, '获取学科列表失败')
      console.warn('使用默认学科列表作为降级方案:', errorMessage)
      return this.getDefaultSubjects().subjects
    }
  }

  /**
   * 根据学科ID获取学科详情
   * @param subjectId 学科ID
   * @returns 学科详情
   */
  async getSubjectById(subjectId: string): Promise<Subject | null> {
    if (enableMock) {
      const subjects = this.getDefaultSubjects().subjects
      return subjects.find(subject => subject.id === subjectId) || null
    }

    try {
      const response = await apiClient.get<ApiResponse<Subject>>(
        `${this.baseUrl}/${subjectId}`
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取学科详情失败')
      }
    } catch (error) {
      console.error('获取学科详情失败:', error)
      handleApiError(error, '获取学科详情失败')
      return null
    }
  }

  /**
   * 搜索学科
   * @param query 搜索关键词
   * @param limit 返回数量限制
   * @returns 匹配的学科列表
   */
  async searchSubjects(query: string, limit = 10): Promise<Subject[]> {
    if (enableMock) {
      const subjects = this.getDefaultSubjects().subjects
      if (!query.trim()) return subjects.slice(0, limit)
      return subjects.filter(subject =>
        subject.name.includes(query) || subject.code.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit)
    }

    try {
      const response = await apiClient.get<ApiResponse<Subject[]>>(
        `${this.baseUrl}/search`,
        {
          params: { query, limit }
        }
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '搜索学科失败')
      }
    } catch (error) {
      console.error('搜索学科失败:', error)
      handleApiError(error, '搜索学科失败')
      return []
    }
  }

  /**
   * 获取默认学科列表（降级方案）
   * @returns 默认学科列表
   */
  private getDefaultSubjects(): SubjectFilterResponse {
    const defaultSubjects: Subject[] = [
      {
        id: 'my-subjects',
        name: '我的学科',
        code: 'MY_SUBJECTS',
        description: '我的主教学科',
        color: '#6366f1',
        icon: 'Collection',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'ai',
        name: '人工智能',
        code: 'AI',
        description: '人工智能与机器学习',
        color: '#8b5cf6',
        icon: 'Cpu',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'it',
        name: '信息技术',
        code: 'IT',
        description: '信息技术基础',
        color: '#3b82f6',
        icon: 'Monitor',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'physics',
        name: '物理',
        code: 'PHYSICS',
        description: '物理学基础',
        color: '#06b6d4',
        icon: 'Compass',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'chemistry',
        name: '化学',
        code: 'CHEMISTRY',
        description: '化学基础',
        color: '#10b981',
        icon: 'Science',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'math',
        name: '数学',
        code: 'MATH',
        description: '数学基础',
        color: '#f59e0b',
        icon: 'Calculate',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'biology',
        name: '生物',
        code: 'BIOLOGY',
        description: '生物学基础',
        color: '#22c55e',
        icon: 'Leaf',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'language',
        name: '语文',
        code: 'LANGUAGE',
        description: '语言文学',
        color: '#ef4444',
        icon: 'Reading',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'english',
        name: '英语',
        code: 'ENGLISH',
        description: '英语语言',
        color: '#ec4899',
        icon: 'ChatLineRound',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      },
      {
        id: 'all',
        name: '全部学科',
        code: 'ALL',
        description: '所有学科',
        color: '#64748b',
        icon: 'Grid',
        isActive: true,
        courseCount: 0,
        studentCount: 0
      }
    ]

    return {
      subjects: defaultSubjects,
      totalCount: defaultSubjects.length,
      defaultSubject: 'my-subjects'
    }
  }

  /**
   * 获取学科统计数据
   * @param subjectId 学科ID
   * @param teacherId 教师ID
   * @returns 学科统计数据
   */
  async getSubjectStats(subjectId: string, teacherId?: string): Promise<{
    courseCount: number
    studentCount: number
    avgCompletion: number
    recentActivity: number
  }> {
    if (enableMock) {
      return {
        courseCount: Math.floor(Math.random() * 10),
        studentCount: Math.floor(Math.random() * 200),
        avgCompletion: Number((70 + Math.random() * 20).toFixed(1)),
        recentActivity: Math.floor(Math.random() * 100)
      }
    }

    try {
      const response = await apiClient.get<ApiResponse<{
        courseCount: number
        studentCount: number
        avgCompletion: number
        recentActivity: number
      }>>(`${this.baseUrl}/${subjectId}/stats`, {
        params: { teacherId }
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取学科统计数据失败')
      }
    } catch (error) {
      console.error('获取学科统计数据失败:', error)
      handleApiError(error, '获取学科统计数据失败')
      return {
        courseCount: 0,
        studentCount: 0,
        avgCompletion: 0,
        recentActivity: 0
      }
    }
  }

  /**
   * 设置教师的学科偏好
   * @param teacherId 教师ID
   * @param subjectIds 学科ID列表
   * @returns 设置结果
   */
  async setTeacherSubjectPreference(
    teacherId: string,
    subjectIds: string[]
  ): Promise<boolean> {
    if (enableMock) {
      localStorage.setItem(`mock-subject-preference-${teacherId}`, JSON.stringify(subjectIds))
      return true
    }

    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/teacher/${teacherId}/preferences`,
        { subjectIds }
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '设置教师学科偏好失败')
      }
    } catch (error) {
      console.error('设置教师学科偏好失败:', error)
      handleApiError(error, '设置教师学科偏好失败')
      return false
    }
  }

  /**
   * 获取教师的学科偏好
   * @param teacherId 教师ID
   * @returns 学科偏好列表
   */
  async getTeacherSubjectPreference(teacherId: string): Promise<string[]> {
    if (enableMock) {
      const saved = localStorage.getItem(`mock-subject-preference-${teacherId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length) return parsed
        } catch (error) {
          console.warn('解析mock学科偏好失败:', error)
        }
      }
      return ['my-subjects']
    }

    try {
      const response = await apiClient.get<ApiResponse<{ subjectIds: string[] }>>(
        `${this.baseUrl}/teacher/${teacherId}/preferences`
      )

      if (response.data.success) {
        return response.data.data.subjectIds
      } else {
        throw new Error(response.data.message || '获取教师学科偏好失败')
      }
    } catch (error) {
      console.error('获取教师学科偏好失败:', error)
      handleApiError(error, '获取教师学科偏好失败')
      return ['my-subjects'] // 默认偏好
    }
  }

  /**
   * 批量获取多个学科的详细信息
   * @param subjectIds 学科ID列表
   * @returns 学科详细信息列表
   */
  async getBatchSubjects(subjectIds: string[]): Promise<Subject[]> {
    if (enableMock) {
      const subjects = this.getDefaultSubjects().subjects
      if (!subjectIds.length) return subjects
      return subjects.filter(subject => subjectIds.includes(subject.id))
    }

    try {
      const response = await apiClient.post<ApiResponse<Subject[]>>(
        `${this.baseUrl}/batch`,
        { subjectIds }
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '批量获取学科信息失败')
      }
    } catch (error) {
      console.error('批量获取学科信息失败:', error)
      handleApiError(error, '批量获取学科信息失败')
      return []
    }
  }

  /**
   * 获取学科推荐（用于智能推荐）
   * @param teacherId 教师ID
   * @param limit 推荐数量限制
   * @returns 推荐学科列表
   */
  async getRecommendedSubjects(teacherId?: string, limit = 5): Promise<Subject[]> {
    if (enableMock) {
      return this.getDefaultSubjects().subjects.slice(0, limit)
    }

    try {
      const url = teacherId ? `${this.baseUrl}/recommendations/${teacherId}` : `${this.baseUrl}/recommendations/me`
      const response = await apiClient.get<ApiResponse<Subject[]>>(url, {
        params: { limit }
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取学科推荐失败')
      }
    } catch (error) {
      // 静默处理API错误，使用默认推荐学科
      // console.error('获取学科推荐失败:', error) // 临时注释以减少控制台噪音
      // handleApiError(error, '获取学科推荐失败')
      // 返回默认推荐学科
      return this.getDefaultSubjects().subjects.slice(0, limit)
    }
  }

  /**
   * 清除学科缓存
   * @param teacherId 教师ID
   */
  clearSubjectCache(teacherId?: string): void {
    const cacheKey = `subjects-teacher-${teacherId || 'me'}`
    // 注意：实际实现需要导入缓存管理器，这里仅作接口定义
    if (enableMock) {
      localStorage.removeItem(cacheKey)
    }
    console.log(`清除学科缓存: ${cacheKey}`)
  }

  /**
   * 预加载学科数据
   * @param teacherId 教师ID
   */
  async preloadSubjectData(teacherId?: string): Promise<void> {
    if (enableMock) {
      console.log('使用mock数据预加载学科信息')
      return
    }

    try {
      // 预加载教师学科列表
      await this.getTeacherSubjects(teacherId, true)

      // 预加载推荐学科
      await this.getRecommendedSubjects(teacherId, 5)

      console.log('学科数据预加载完成')
    } catch (error) {
      console.warn('学科数据预加载失败:', error)
    }
  }
}

export const subjectService = new SubjectService()
export default subjectService
