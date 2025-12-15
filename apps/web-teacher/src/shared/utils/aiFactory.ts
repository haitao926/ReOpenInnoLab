import { defineComponent, h } from 'vue'
import type { AIContext, AIConfig } from '@/shared/types/ai'
import AIAssistant from '@/shared/components/ai/AIAssistant.vue'

/**
 * AI 工厂函数
 */
export class AIFactory {
  private static instance: AIFactory
  private configs: Map<AIContext, AIConfig> = new Map()

  static getInstance(): AIFactory {
    if (!this.instance) {
      this.instance = new AIFactory()
    }
    return this.instance
  }

  constructor() {
    // 初始化默认配置
    this.initializeDefaultConfigs()
  }

  private initializeDefaultConfigs() {
    // 课程AI助手配置
    this.configs.set('course', {
      enabled: true,
      context: 'course',
      mode: 'panel',
      autoTrigger: true,
      suggestions: true,
      features: {
        chat: true,
        suggestions: true,
        autoGenerate: true,
        analysis: false
      },
      api: {
        endpoint: '/api/ai/course',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    })

    // 实验AI助手配置
    this.configs.set('experiment', {
      enabled: true,
      context: 'experiment',
      mode: 'float',
      autoTrigger: false,
      suggestions: true,
      features: {
        chat: true,
        suggestions: true,
        autoGenerate: false,
        analysis: true
      },
      api: {
        endpoint: '/api/ai/experiment',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1500
      }
    })

    // 作业AI助手配置
    this.configs.set('assignment', {
      enabled: true,
      context: 'assignment',
      mode: 'inline',
      autoTrigger: true,
      suggestions: false,
      features: {
        chat: false,
        suggestions: false,
        autoGenerate: true,
        analysis: true
      },
      api: {
        endpoint: '/api/ai/assignment',
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        maxTokens: 800
      }
    })

    // 实验室AI助手配置
    this.configs.set('lab', {
      enabled: true,
      context: 'lab',
      mode: 'float',
      autoTrigger: false,
      suggestions: true,
      features: {
        chat: true,
        suggestions: true,
        autoGenerate: false,
        analysis: true
      }
    })

    // 通用AI助手配置
    this.configs.set('general', {
      enabled: true,
      context: 'general',
      mode: 'float',
      autoTrigger: false,
      suggestions: false,
      features: {
        chat: true,
        suggestions: false,
        autoGenerate: false,
        analysis: false
      }
    })
  }

  /**
   * 创建AI助手组件
   */
  createAssistant(context: AIContext, options: Partial<AIConfig> = {}) {
    const config = { ...this.configs.get(context), ...options }

    return defineComponent({
      name: `AI${context.charAt(0).toUpperCase() + context.slice(1)}Assistant`,
      setup(props, { emit }) {
        return () => h(AIAssistant, {
          ...props,
          mode: config.mode,
          context: context,
          autoTrigger: config.autoTrigger,
          onAction: (action: any) => {
            emit('action', action)
          },
          onSuggestionApplied: (suggestion: any) => {
            emit('suggestion-applied', suggestion)
          }
        })
      }
    })
  }

  /**
   * 注册自定义配置
   */
  registerConfig(context: AIContext, config: AIConfig) {
    this.configs.set(context, config)
  }

  /**
   * 获取配置
   */
  getConfig(context: AIContext): AIConfig | undefined {
    return this.configs.get(context)
  }

  /**
   * 更新配置
   */
  updateConfig(context: AIContext, updates: Partial<AIConfig>) {
    const current = this.configs.get(context)
    if (current) {
      this.configs.set(context, { ...current, ...updates })
    }
  }

  /**
   * 获取所有配置
   */
  getAllConfigs(): Map<AIContext, AIConfig> {
    return new Map(this.configs)
  }
}

// 预定义的AI助手组件
export const AIAssistants = {
  Course: (options?: Partial<AIConfig>) => {
    return AIFactory.getInstance().createAssistant('course', options)
  },

  Experiment: (options?: Partial<AIConfig>) => {
    return AIFactory.getInstance().createAssistant('experiment', options)
  },

  Lab: (options?: Partial<AIConfig>) => {
    return AIFactory.getInstance().createAssistant('lab', options)
  },

  Assignment: (options?: Partial<AIConfig>) => {
    return AIFactory.getInstance().createAssistant('assignment', options)
  },

  General: (options?: Partial<AIConfig>) => {
    return AIFactory.getInstance().createAssistant('general', options)
  }
}

// 导出工厂实例
export const aiFactory = AIFactory.getInstance()

/**
 * 创建AI助手Hook
 */
export function useAIAssistant(context: AIContext, options: Partial<AIConfig> = {}) {
  const config = aiFactory.getConfig(context)
  const mergedConfig = { ...config, ...options }

  // 根据上下文返回特定的功能
  const contextFeatures = {
    course: {
      generateObjectives: async (title: string) => {
        // 生成学习目标
        console.log('Generating objectives for:', title)
      },
      suggestActivities: async (objectives: string[]) => {
        // 推荐活动
        console.log('Suggesting activities for:', objectives)
      },
      createAssessment: async (content: string) => {
        // 创建测评
        console.log('Creating assessment for:', content)
      }
    },
    experiment: {
      analyzeResults: async (data: any) => {
        // 分析实验结果
        console.log('Analyzing experiment results:', data)
      },
      suggestImprovements: async (results: any) => {
        // 提供改进建议
        console.log('Suggesting improvements for:', results)
      }
    },
    assignment: {
      generateFeedback: async (submission: any) => {
        // 生成反馈
        console.log('Generating feedback for:', submission)
      },
      gradeSubmission: async (answers: any) => {
        // 批改作业
        console.log('Grading submission:', answers)
      }
    }
  }

  return {
    config: mergedConfig,
    features: contextFeatures[context] || {},
    assistant: AIAssistants[context.charAt(0).toUpperCase() + context.slice(1) as keyof typeof AIAssistants](options)
  }
}

/**
 * AI服务类 - 处理API调用
 */
export class AIService {
  private static baseUrl = '/api/ai'

  /**
   * 调用AI API
   */
  static async call(context: AIContext, prompt: string, data?: any) {
    const config = aiFactory.getConfig(context)
    if (!config?.enabled) {
      throw new Error(`AI assistant for ${context} is disabled`)
    }

    const response = await fetch(`${this.baseUrl}/${context}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        data,
        model: config.api?.model,
        temperature: config.api?.temperature,
        max_tokens: config.api?.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error('AI service is unavailable')
    }

    return response.json()
  }

  /**
   * 流式调用AI API
   */
  static async callStream(
    context: AIContext,
    prompt: string,
    onChunk: (chunk: string) => void,
    data?: any
  ) {
    const config = aiFactory.getConfig(context)
    if (!config?.enabled) {
      throw new Error(`AI assistant for ${context} is disabled`)
    }

    const response = await fetch(`${this.baseUrl}/${context}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        data,
        model: config.api?.model,
        temperature: config.api?.temperature,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error('AI service is unavailable')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Stream reader not available')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            const json = JSON.parse(data)
            onChunk(json.content || '')
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }
}