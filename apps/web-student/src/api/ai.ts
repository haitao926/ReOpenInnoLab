import { apiRequest, withCache, type ApiResponse } from './client'

// AI对话消息
export interface AIMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    model?: string
    tokens?: number
    duration?: number
  }
}

// AI建议
export interface AISuggestion {
  id: string
  type: 'study' | 'content' | 'activity' | 'resource'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
  action?: {
    type: 'link' | 'function' | 'navigation'
    target: string
    label: string
  }
  createdAt: string
  expiresAt?: string
}

// 学习路径推荐
export interface LearningPath {
  id: string
  title: string
  description: string
  steps: Array<{
    id: string
    title: string
    description: string
    type: 'course' | 'chapter' | 'activity' | 'resource'
    targetId: string
    estimatedTime: number
    completed: boolean
  }>
  totalEstimatedTime: number
  progress: number
  createdAt: string
}

// 开始AI对话
export const startAIConversation = async (context?: {
  courseId?: string
  chapterId?: string
  activityId?: string
}): Promise<{ conversationId: string; welcomeMessage: AIMessage }> => {
  const response = await apiRequest.post<{ conversationId: string; welcomeMessage: AIMessage }>('/ai/conversation', context)
  return response.data
}

// 发送消息给AI
export const sendAIMessage = async (
  conversationId: string,
  message: string,
  context?: {
    courseId?: string
    chapterId?: string
    activityId?: string
  }
): Promise<AIMessage> => {
  const response = await apiRequest.post<AIMessage>(`/ai/conversation/${conversationId}/message`, {
    message,
    context
  })
  return response.data
}

// 获取对话历史
export const getAIConversationHistory = async (
  conversationId: string,
  limit?: number
): Promise<AIMessage[]> => {
  const response = await apiRequest.get<AIMessage[]>(`/ai/conversation/${conversationId}/history`, {
    params: { limit }
  })
  return response.data
}

// 结束对话
export const endAIConversation = async (conversationId: string): Promise<void> => {
  await apiRequest.delete(`/ai/conversation/${conversationId}`)
}

// 获取AI建议
export const getAISuggestions = async (context?: {
  courseId?: string
  chapterId?: string
  type?: string
}): Promise<AISuggestion[]> => {
  const cacheKey = `ai-suggestions-${context?.courseId || 'default'}-${context?.chapterId || 'default'}-${context?.type || 'default'}`
  return withCache(cacheKey, async () => {
    const response = await apiRequest.get<AISuggestion[]>('/ai/suggestions', { params: context })
    return response.data
  }, 3 * 60 * 1000) // 缓存3分钟
}

// 采纳AI建议
export const acceptAISuggestion = async (suggestionId: string): Promise<void> => {
  await apiRequest.post(`/ai/suggestions/${suggestionId}/accept`)
}

// 忽略AI建议
export const dismissAISuggestion = async (suggestionId: string): Promise<void> => {
  await apiRequest.post(`/ai/suggestions/${suggestionId}/dismiss`)
}

// 获取学习路径推荐
export const getLearningPaths = async (courseId?: string): Promise<LearningPath[]> => {
  const response = await apiRequest.get<LearningPath[]>('/ai/learning-paths', {
    params: { courseId }
  })
  return response.data
}

// 创建个性化学习路径
export const createLearningPath = async (options: {
  goals: string[]
  currentLevel: string
  preferredLearningStyle?: string
  timeAvailability?: number
  subjects?: string[]
}): Promise<LearningPath> => {
  const response = await apiRequest.post<LearningPath>('/ai/learning-paths', options)
  return response.data
}

// 更新学习路径进度
export const updateLearningPathProgress = async (
  pathId: string,
  stepId: string,
  completed: boolean
): Promise<void> => {
  await apiRequest.patch(`/ai/learning-paths/${pathId}/steps/${stepId}`, { completed })
}

// 获取智能内容推荐
export const getContentRecommendations = async (context: {
  courseId?: string
  chapterId?: string
  currentProgress?: number
  learningStyle?: string
}): Promise<any[]> => {
  const response = await apiRequest.get<any[]>('/ai/content-recommendations', { params: context })
  return response.data
}

// 获取智能答疑
export const askQuestion = async (question: string, context?: {
  courseId?: string
  chapterId?: string
  subject?: string
}): Promise<{
  answer: string
  relatedTopics: string[]
  confidence: number
  sources?: any[]
}> => {
  const response = await apiRequest.post<{
    answer: string
    relatedTopics: string[]
    confidence: number
    sources?: any[]
  }>('/ai/ask', { question, context })
  return response.data
}

// 获取学习反思问题
export const getReflectionQuestions = async (context: {
  courseId?: string
  chapterId?: string
  completedActivities?: string[]
}): Promise<{
  questions: Array<{
    id: string
    question: string
    type: 'open' | 'scale' | 'choice'
    options?: string[]
  }>
  estimatedTime: number
}> => {
  const response = await apiRequest.get<{
    questions: Array<{
      id: string
      question: string
      type: 'open' | 'scale' | 'choice'
      options?: string[]
    }>
    estimatedTime: number
  }>('/ai/reflection-questions', { params: context })
  return response.data
}

// 提交学习反思
export const submitReflection = async (data: {
  context: {
    courseId?: string
    chapterId?: string
  }
  responses: Array<{
    questionId: string
    answer: string | number
  }>
}): Promise<{
  summary: string
  insights: string[]
  recommendations: string[]
}> => {
  const response = await apiRequest.post<{
    summary: string
    insights: string[]
    recommendations: string[]
  }>('/ai/reflection', data)
  return response.data
}

// 获取学习状态分析
export const getLearningAnalytics = async (timeRange?: 'week' | 'month' | 'semester'): Promise<{
  progress: {
    completedCourses: number
    completedChapters: number
    completedActivities: number
    totalStudyTime: number
  }
  strengths: string[]
  improvementAreas: string[]
  recommendations: string[]
  trends: Array<{
    date: string
    studyTime: number
    progress: number
  }>
}> => {
  const response = await apiRequest.get<{
    progress: {
      completedCourses: number
      completedChapters: number
      completedActivities: number
      totalStudyTime: number
    }
    strengths: string[]
    improvementAreas: string[]
    recommendations: string[]
    trends: Array<{
      date: string
      studyTime: number
      progress: number
    }>
  }>('/ai/analytics', { params: { timeRange } })
  return response.data
}