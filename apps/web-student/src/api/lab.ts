import { apiRequest, withCache, type ApiResponse } from './client'

// 虚拟实验室状态
export interface LabAgentStatus {
  id: string
  status: 'offline' | 'starting' | 'online' | 'busy' | 'error'
  lastHeartbeat: string
  version: string
  capabilities: string[]
  resources: {
    cpu: number
    memory: number
    storage: number
  }
}

// 实验会话
export interface LabSession {
  id: string
  name: string
  type: 'jupyter' | 'terminal' | 'ide' | 'custom'
  status: 'starting' | 'running' | 'stopped' | 'error'
  url?: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  resources?: {
    cpu: number
    memory: number
    storage: number
  }
}

// 实验模板
export interface LabTemplate {
  id: string
  name: string
  description: string
  type: 'jupyter' | 'terminal' | 'ide' | 'custom'
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  requirements: string[]
  resources: {
    cpu: number
    memory: number
    storage: number
  }
  tags: string[]
  createdAt: string
  updatedAt: string
}

// 实验环境配置
export interface LabEnvironment {
  id: string
  name: string
  templateId: string
  config: {
    image?: string
    packages?: string[]
    envVars?: Record<string, string>
    mountPoints?: Array<{
      source: string
      target: string
      readonly: boolean
    }>
  }
  status: 'active' | 'inactive' | 'error'
  createdAt: string
  updatedAt: string
}

// 获取本地Agent状态
export const getLocalAgentStatus = async (): Promise<LabAgentStatus> => {
  const response = await apiRequest.get<LabAgentStatus>('/lab/agent/status')
  return response.data
}

// 启动本地Agent
export const startLocalAgent = async (): Promise<void> => {
  await apiRequest.post('/lab/agent/start')
}

// 停止本地Agent
export const stopLocalAgent = async (): Promise<void> => {
  await apiRequest.post('/lab/agent/stop')
}

// 重启本地Agent
export const restartLocalAgent = async (): Promise<void> => {
  await apiRequest.post('/lab/agent/restart')
}

// 获取Agent心跳
export const pingAgent = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await apiRequest.get<{ status: string; timestamp: string }>('/lab/agent/ping')
  return response.data
}

// 获取实验会话列表
export const getLabSessions = async (status?: string): Promise<LabSession[]> => {
  const response = await apiRequest.get<LabSession[]>('/lab/sessions', {
    params: { status }
  })
  return response.data
}

// 创建实验会话
export const createLabSession = async (data: {
  templateId: string
  name: string
  config?: Record<string, any>
}): Promise<LabSession> => {
  const response = await apiRequest.post<LabSession>('/lab/sessions', data)
  return response.data
}

// 获取实验会话详情
export const getLabSession = async (sessionId: string): Promise<LabSession> => {
  const response = await apiRequest.get<LabSession>(`/lab/sessions/${sessionId}`)
  return response.data
}

// 启动实验会话
export const startLabSession = async (sessionId: string): Promise<LabSession> => {
  const response = await apiRequest.post<LabSession>(`/lab/sessions/${sessionId}/start`)
  return response.data
}

// 停止实验会话
export const stopLabSession = async (sessionId: string): Promise<void> => {
  await apiRequest.post(`/lab/sessions/${sessionId}/stop`)
}

// 删除实验会话
export const deleteLabSession = async (sessionId: string): Promise<void> => {
  await apiRequest.delete(`/lab/sessions/${sessionId}`)
}

// 获取实验模板列表
export const getLabTemplates = async (filters?: {
  category?: string
  difficulty?: string
  type?: string
  tags?: string[]
}): Promise<LabTemplate[]> => {
  const cacheKey = `lab-templates-${JSON.stringify(filters || {})}`
  return withCache(cacheKey, async () => {
    const response = await apiRequest.get<LabTemplate[]>('/lab/templates', {
      params: filters
    })
    return response.data
  }, 30 * 60 * 1000) // 缓存30分钟
}

// 获取实验模板详情
export const getLabTemplate = async (templateId: string): Promise<LabTemplate> => {
  const response = await apiRequest.get<LabTemplate>(`/lab/templates/${templateId}`)
  return response.data
}

// 获取实验环境列表
export const getLabEnvironments = async (): Promise<LabEnvironment[]> => {
  const response = await apiRequest.get<LabEnvironment[]>('/lab/environments')
  return response.data
}

// 创建实验环境
export const createLabEnvironment = async (data: {
  name: string
  templateId: string
  config: Record<string, any>
}): Promise<LabEnvironment> => {
  const response = await apiRequest.post<LabEnvironment>('/lab/environments', data)
  return response.data
}

// 更新实验环境
export const updateLabEnvironment = async (
  envId: string,
  data: Partial<LabEnvironment>
): Promise<LabEnvironment> => {
  const response = await apiRequest.patch<LabEnvironment>(`/lab/environments/${envId}`, data)
  return response.data
}

// 删除实验环境
export const deleteLabEnvironment = async (envId: string): Promise<void> => {
  await apiRequest.delete(`/lab/environments/${envId}`)
}

// 上传文件到实验环境
export const uploadFileToLab = async (
  sessionId: string,
  file: File,
  path?: string
): Promise<{ url: string; size: number }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (path) {
    formData.append('path', path)
  }

  const response = await apiRequest.post<{ url: string; size: number }>(
    `/lab/sessions/${sessionId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

// 下载实验环境文件
export const downloadFileFromLab = async (
  sessionId: string,
  path: string
): Promise<Blob> => {
  const response = await apiRequest.get(`/lab/sessions/${sessionId}/download`, {
    params: { path },
    responseType: 'blob'
  })
  return response.data
}

// 执行实验命令
export const executeLabCommand = async (
  sessionId: string,
  command: string,
  workingDirectory?: string
): Promise<{
  output: string
  error?: string
  exitCode: number
  executionTime: number
}> => {
  const response = await apiRequest.post<{
    output: string
    error?: string
    exitCode: number
    executionTime: number
  }>(`/lab/sessions/${sessionId}/execute`, {
    command,
    workingDirectory
  })
  return response.data
}

// 获取实验日志
export const getLabLogs = async (
  sessionId: string,
  options?: {
    lines?: number
    follow?: boolean
    since?: string
  }
): Promise<string[]> => {
  const response = await apiRequest.get<string[]>(`/lab/sessions/${sessionId}/logs`, {
    params: options
  })
  return response.data
}

// 获取实验统计信息
export const getLabStatistics = async (timeRange?: 'day' | 'week' | 'month'): Promise<{
  totalSessions: number
  activeSessions: number
  totalUsageTime: number
  averageSessionTime: number
  popularTemplates: Array<{
    templateId: string
    name: string
    usageCount: number
  }>
  resourceUsage: {
    totalCpu: number
    totalMemory: number
    totalStorage: number
  }
}> => {
  const response = await apiRequest.get<{
    totalSessions: number
    activeSessions: number
    totalUsageTime: number
    averageSessionTime: number
    popularTemplates: Array<{
      templateId: string
      name: string
      usageCount: number
    }>
    resourceUsage: {
      totalCpu: number
      totalMemory: number
      totalStorage: number
    }
  }>('/lab/statistics', {
    params: { timeRange }
  })
  return response.data
}

// 启动活动
export const startActivity = async (activityId: string): Promise<{
  sessionId: string
  status: string
}> => {
  const response = await apiRequest.post<{
    sessionId: string
    status: string
  }>(`/activities/${activityId}/start`)
  return response.data
}

// 检查实验环境健康状态
export const checkLabHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  agentStatus: string
  activeEnvironments: number
  availableResources: {
    cpu: number
    memory: number
    storage: number
  }
  lastCheck: string
}> => {
  const response = await apiRequest.get<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    agentStatus: string
    activeEnvironments: number
    availableResources: {
      cpu: number
      memory: number
      storage: number
    }
    lastCheck: string
  }>('/lab/health')
  return response.data
}