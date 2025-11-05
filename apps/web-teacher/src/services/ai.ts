// 开源浦育 ReOpenInnoLab - AI服务
export interface AIProvider {
  name: string
  apiKey: string
  baseUrl: string
  model: string
}

export interface AIServiceConfig {
  providers: Record<string, AIProvider>
  defaultProvider: string
  requestTimeout?: number
  maxRetries?: number
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface AIResponse {
  content: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  model?: string
  finish_reason?: string
}

export class AIService {
  private config: AIServiceConfig
  private conversationHistory: Map<string, AIMessage[]> = new Map()

  constructor(config: AIServiceConfig) {
    this.config = {
      requestTimeout: 30000,
      maxRetries: 3,
      ...config,
    }
  }

  // 发送消息到AI
  async sendMessage(
    message: string,
    conversationId?: string,
    options?: {
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<AIResponse> {
    const conversationIdKey = conversationId || 'default'
    const history = this.conversationHistory.get(conversationIdKey) || []

    try {
      const provider = this.config.providers[this.config.defaultProvider]
      if (!provider) {
        throw new Error(`AI provider ${this.config.defaultProvider} not found`)
      }

      // 构建消息数组
      const messages: AIMessage[] = []

      // 添加系统提示
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
          timestamp: Date.now(),
        })
      }

      // 添加历史消息
      messages.push(...history)

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
      })

      // 调用AI API
      const response = await this.callAIProvider(provider, messages, options)

      // 保存对话历史
      history.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
      })

      history.push({
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      })

      // 限制历史记录长度
      if (history.length > 20) {
        history.splice(0, history.length - 20)
      }

      this.conversationHistory.set(conversationIdKey, history)

      return response
    } catch (error) {
      console.error('AI服务错误:', error)
      throw error
    }
  }

  // 调用AI提供商API
  private async callAIProvider(
    provider: AIProvider,
    messages: AIMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model,
      finish_reason: data.choices[0]?.finish_reason,
    }
  }

  // 清空对话历史
  clearConversationHistory(conversationId?: string): void {
    const key = conversationId || 'default'
    this.conversationHistory.delete(key)
  }

  // 获取对话历史
  getConversationHistory(conversationId?: string): AIMessage[] {
    const key = conversationId || 'default'
    return this.conversationHistory.get(key) || []
  }

  // 更新配置
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // 检查AI服务是否可用
  async checkHealth(): Promise<boolean> {
    try {
      const provider = this.config.providers[this.config.defaultProvider]
      if (!provider) return false

      // 在开发环境下，如果使用mock provider，直接返回true
      if (import.meta.env.DEV && provider.baseUrl.includes('localhost:8080')) {
        console.log('AI服务: 开发环境mock模式，跳过健康检查')
        return true
      }

      const response = await fetch(`${provider.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }
}