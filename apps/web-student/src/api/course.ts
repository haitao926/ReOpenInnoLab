import { apiRequest, withCache, type PaginatedResponse } from './client'
import type { Course, Chapter, Activity } from '@/types/course'

// 获取今日课程
export const getTodayCourses = async (): Promise<Course[]> => {
  return withCache('today-courses', async () => {
    const response = await apiRequest.get<Course[]>('/courses/today')
    return response.data
  }, 5 * 60 * 1000) // 缓存5分钟
}

// 获取课程详情
export const getCourseById = async (courseId: string): Promise<Course> => {
  return withCache(`course-${courseId}`, async () => {
    const response = await apiRequest.get<Course>(`/courses/${courseId}`)
    return response.data
  }, 10 * 60 * 1000) // 缓存10分钟
}

// 获取课程章节列表
export const getCourseChapters = async (courseId: string): Promise<Chapter[]> => {
  return withCache(`course-chapters-${courseId}`, async () => {
    const response = await apiRequest.get<Chapter[]>(`/courses/${courseId}/chapters`)
    return response.data
  }, 15 * 60 * 1000) // 缓存15分钟
}

// 获取章节详情
export const getChapterById = async (courseId: string, chapterId: string): Promise<Chapter> => {
  const response = await apiRequest.get<Chapter>(`/courses/${courseId}/chapters/${chapterId}`)
  return response.data
}

// 完成章节
export const completeChapter = async (courseId: string, chapterId: string): Promise<void> => {
  await apiRequest.post(`/courses/${courseId}/chapters/${chapterId}/complete`)
}

// 更新章节进度
export const updateChapterProgress = async (
  courseId: string,
  chapterId: string,
  progress: number
): Promise<void> => {
  await apiRequest.patch(`/courses/${courseId}/chapters/${chapterId}/progress`, { progress })
}

// 获取章节活动列表
export const getChapterActivities = async (courseId: string, chapterId: string): Promise<Activity[]> => {
  const response = await apiRequest.get<Activity[]>(`/courses/${courseId}/chapters/${chapterId}/activities`)
  return response.data
}

// 获取活动详情
export const getActivityById = async (
  courseId: string,
  chapterId: string,
  activityId: string
): Promise<Activity> => {
  const response = await apiRequest.get<Activity>(
    `/courses/${courseId}/chapters/${chapterId}/activities/${activityId}`
  )
  return response.data
}

// 开始活动
export const startActivity = async (
  courseId: string,
  chapterId: string,
  activityId: string
): Promise<void> => {
  await apiRequest.post(`/courses/${courseId}/chapters/${chapterId}/activities/${activityId}/start`)
}

// 完成活动
export const completeActivity = async (
  courseId: string,
  chapterId: string,
  activityId: string,
  data?: any
): Promise<void> => {
  await apiRequest.post(`/courses/${courseId}/chapters/${chapterId}/activities/${activityId}/complete`, data)
}

// 获取课程进度统计
export const getCourseProgress = async (courseId: string): Promise<{
  totalChapters: number
  completedChapters: number
  overallProgress: number
  estimatedTimeRemaining: number
}> => {
  const response = await apiRequest.get(`/courses/${courseId}/progress`)
  return response.data
}

// 获取学习历史
export const getLearningHistory = async (options?: {
  courseId?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<any>> => {
  const response = await apiRequest.get('/learning/history', { params: options })
  return response.data
}

// 添加学习笔记
export const addNote = async (
  courseId: string,
  chapterId: string,
  note: {
    content: string
    position?: number
    tags?: string[]
  }
): Promise<void> => {
  await apiRequest.post(`/courses/${courseId}/chapters/${chapterId}/notes`, note)
}

// 获取章节笔记
export const getChapterNotes = async (courseId: string, chapterId: string): Promise<any[]> => {
  const response = await apiRequest.get(`/courses/${courseId}/chapters/${chapterId}/notes`)
  return response.data
}

// 添加书签
export const addBookmark = async (
  courseId: string,
  chapterId: string,
  bookmark: {
    position?: number
    note?: string
  }
): Promise<void> => {
  await apiRequest.post(`/courses/${courseId}/chapters/${chapterId}/bookmarks`, bookmark)
}

// 获取书签列表
export const getBookmarks = async (courseId?: string): Promise<any[]> => {
  const response = await apiRequest.get('/bookmarks', {
    params: courseId ? { courseId } : {}
  })
  return response.data
}

// 获取推荐课程
export const getRecommendedCourses = async (limit?: number): Promise<Course[]> => {
  const response = await apiRequest.get<Course[]>('/courses/recommended', {
    params: { limit: limit || 5 }
  })
  return response.data
}

// 搜索课程
export const searchCourses = async (query: string, options?: {
  subject?: string
  difficulty?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<Course>> => {
  const response = await apiRequest.get<PaginatedResponse<Course>>('/courses/search', {
    params: { query, ...options }
  })
  return response.data
}