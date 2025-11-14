import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

export interface ReasoningResponse {
  reasoning_content?: string // 思维链内容
  content: string // 最终回答
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ReasoningRequest {
  messages: Array<{ role: string; content: string }>
  maxTokens?: number
  stream?: boolean
}

@Injectable()
export class DeepSeekReasoningService {
  private readonly logger = new Logger(DeepSeekReasoningService.name)
  private readonly client: OpenAI

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('DEEPSEEK_API_KEY') || 'sk-269cfd68cbe94759a39369c637dfe2d8',
      baseURL: this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com'
    })
  }

  /**
   * 调用 DeepSeek 推理模型
   * @param request 推理请求
   * @returns 推理响应，包含思维链和最终答案
   */
  async reasoning(request: ReasoningRequest): Promise<ReasoningResponse> {
    try {
      this.logger.debug('Calling DeepSeek Reasoner with request:', {
        messageCount: request.messages.length,
        maxTokens: request.maxTokens,
        stream: request.stream
      })

      const response = await this.client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: request.messages,
        max_tokens: request.maxTokens || 32768,
        stream: false // 暂不支持流式
      })

      const choice = response.choices[0]

      // 处理推理模型的特殊响应格式
      if (choice.message && typeof choice.message === 'object') {
        const message = choice.message as any

        return {
          reasoning_content: message.reasoning_content,
          content: message.content,
          model: response.model,
          usage: response.usage ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens
          } : undefined
        }
      }

      // 兼容普通响应格式
      return {
        content: choice.message?.content || '',
        model: response.model,
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined
      }
    } catch (error) {
      this.logger.error('Error calling DeepSeek Reasoner:', error)

      if (error instanceof Error) {
        // 处理 API 错误
        if (error.message.includes('400')) {
          throw new Error('Invalid request format for reasoning model')
        }
        if (error.message.includes('401')) {
          throw new Error('Invalid API key for DeepSeek')
        }
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded for DeepSeek API')
        }
        if (error.message.includes('500')) {
          throw new Error('DeepSeek server error')
        }
      }

      throw new Error('Failed to call DeepSeek Reasoner')
    }
  }

  /**
   * 流式调用 DeepSeek 推理模型
   * @param request 推理请求
   * @returns 流式响应，包含思维链和最终答案
   */
  async *reasoningStream(request: ReasoningRequest): AsyncGenerator<{
    type: 'reasoning' | 'content'
    content: string
    done?: boolean
  }> {
    try {
      this.logger.debug('Starting DeepSeek Reasoner stream')

      const stream = await this.client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: request.messages,
        max_tokens: request.maxTokens || 32768,
        stream: true
      })

      let reasoningContent = ''
      let content = ''

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta

        if (delta?.reasoning_content) {
          reasoningContent += delta.reasoning_content
          yield {
            type: 'reasoning',
            content: delta.reasoning_content
          }
        } else if (delta?.content) {
          content += delta.content
          yield {
            type: 'content',
            content: delta.content
          }
        }

        // 检查是否完成
        if (chunk.choices[0]?.finish_reason === 'stop') {
          yield {
            type: 'content',
            content: '',
            done: true
          }
          break
        }
      }
    } catch (error) {
      this.logger.error('Error in DeepSeek Reasoner stream:', error)
      throw new Error('Failed to stream from DeepSeek Reasoner')
    }
  }

  /**
   * 教育场景专用推理 - 课程设计
   */
  async designCourse(requirements: {
    subject: string
    grade: string
    topic: string
    duration: string
    objectives: string[]
    specialRequirements?: string
  }): Promise<ReasoningResponse> {
    const systemPrompt = `你是一位专业的教学设计师，具有以下特点：
1. 深度理解认知科学和学习理论
2. 熟悉中小学课程标准
3. 能够根据学生认知水平设计合适的教学内容
4. 注重教学目标的可测量性
5. 考虑不同学习风格的学生需求

请详细分析课程设计需求，并提供完整的设计方案，包括：
- 学情分析
- 教学目标设定（知识与技能、过程与方法、情感态度价值观）
- 教学重难点分析
- 教学策略选择
- 教学过程设计
- 评价体系设计
- 可能的难点和解决方案`

    const userPrompt = `请为以下课程需求设计一个完整的教学方案：

学科：${requirements.subject}
年级：${requirements.grade}
主题：${requirements.topic}
课时：${requirements.duration}
教学目标：${requirements.objectives.join('、')}
${requirements.specialRequirements ? `特殊要求：${requirements.specialRequirements}` : ''}

请提供详细的课程设计方案，确保内容科学、可行、符合教学规律。`

    return this.reasoning({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 32768
    })
  }

  /**
   * 教育场景专用推理 - 问题分析
   */
  async analyzeEducationalProblem(problem: {
    context: string
    question: string
    difficulty: 'basic' | 'intermediate' | 'advanced'
    subject: string
  }): Promise<ReasoningResponse> {
    const systemPrompt = `你是一位资深的教育专家和问题解决专家。
对于复杂的教育问题，请：
1. 仔细分析问题的各个方面
2. 识别关键概念和原理
3. 提供详细的解题思路
4. 解释每一步的推理过程
5. 给出最终答案
6. 提供相关的拓展思考`

    const userPrompt = `请分析并解答以下${problem.subject}问题：

背景信息：${problem.context}
问题：${problem.question}
难度级别：${problem.difficulty}

请提供详细的分析过程和解答，特别注意推理的逻辑性。`

    return this.reasoning({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 16384
    })
  }

  /**
   * 实验设计推理
   */
  async designExperiment(requirements: {
    topic: string
    subject: string
    grade: string
    availableMaterials: string[]
    safetyConstraints?: string[]
  }): Promise<ReasoningResponse> {
    const systemPrompt = `你是一位专业的科学实验指导老师。
设计实验时请：
1. 确保实验的科学性和安全性
2. 考虑学生的认知水平和操作能力
3. 详细说明实验原理和步骤
4. 指出可能的危险和防护措施
5. 提供数据记录和分析方法
6. 给出实验结论和拓展建议`

    const userPrompt = `请设计一个科学实验：

实验主题：${requirements.topic}
学科领域：${requirements.subject}
适用年级：${requirements.grade}
可用材料：${requirements.availableMaterials.join('、')}
${requirements.safetyConstraints ? `安全限制：${requirements.safetyConstraints.join('、')}` : ''}

请提供完整的实验设计方案，包括实验目的、原理、步骤、安全注意事项等。`

    return this.reasoning({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 24576
    })
  }
}