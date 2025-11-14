export interface AIRequest {
  content: string | object
  systemPrompt?: string
  taskType?: TaskType
  maxTokens?: number
  tenantId?: string
  userId?: string
  enableReasoning?: boolean
}

export interface AIResponse {
  content: string
  reasoning_content?: string // 推理模式特有的思维链内容
  provider: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  finishReason?: string
  metadata: {
    requestId: string
    timestamp: string
    processingTime: number
    reasoningEnabled?: boolean
    taskType?: string
  }
}

export interface AIProvider {
  name: string
  apiKey: string
  baseUrl: string
  model: string
  maxTokens?: number
  temperature?: number
  timeout?: number
  retryAttempts?: number
  supportsReasoning?: boolean
  reasoningModel?: boolean
  systemPrompt?: string
}

export type TaskType =
  | 'courseDesign'
  | 'contentGeneration'
  | 'labGuidance'
  | 'assignmentGrading'
  | 'learningAnalytics'
  | 'realtimeQA'
  | 'complexProblemSolving'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamChunk {
  type: 'reasoning' | 'content' | 'metadata'
  content: string
  done?: boolean
}