/**
 * AI网关服务
 * 统一管理多个AI提供商，提供智能路由和负载均衡
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { HttpService } from '@nestjs/axios'
import {
  AI_PROVIDERS_CONFIG,
  getAIConfigByTaskType,
  AI_MODEL_CAPABILITIES
} from '../config/ai-providers.config'
import {
  AIRequest,
  AIResponse,
  AIProvider,
  TaskType
} from '../interfaces/ai.interface'

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name)
  private readonly providers: Map<string, AIProvider>
  private readonly circuitBreakers: Map<string, CircuitBreaker>
  private readonly metrics: Map<string, AIMetrics>

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.providers = new Map()
    this.circuitBreakers = new Map()
    this.metrics = new Map()
    this.initializeProviders()
  }

  /**
   * 初始化AI提供商
   */
  private initializeProviders(): void {
    for (const [key, provider] of Object.entries(AI_PROVIDERS_CONFIG.providers)) {
      if (provider.apiKey) {
        this.providers.set(key, provider)
        this.circuitBreakers.set(key, new CircuitBreaker())
        this.metrics.set(key, new AIMetrics())
        this.logger.log(`AI提供商初始化: ${key}`)
      }
    }
  }

  /**
   * 主要的AI请求入口
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // 1. 选择最适合的AI提供商
      const selectedProvider = await this.selectOptimalProvider(request)

      // 2. 检查断路器状态
      if (!this.isProviderAvailable(selectedProvider)) {
        this.logger.warn(`提供商 ${selectedProvider} 不可用，尝试备用方案`)
        return this.generateResponseWithFallback(request)
      }

      // 3. 执行请求
      const response = await this.executeRequest(selectedProvider, request)

      // 4. 更新指标
      const duration = Date.now() - startTime
      this.updateMetrics(selectedProvider, { success: true, duration })

      // 5. 记录使用情况
      await this.logAIUsage(selectedProvider, request, response, duration)

      return response

    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`AI请求失败: ${error.message}`, error.stack)

      // 尝试备用提供商
      return this.generateResponseWithFallback(request)
    }
  }

  /**
   * 智能路由选择最适合的AI提供商
   */
  private async selectOptimalProvider(request: AIRequest): Promise<string> {
    const { taskType, preferences } = request

    // 1. 如果指定了任务类型，使用专用配置
    if (taskType && EDUCATION_AI_CONFIG[taskType]) {
      const config = getAIConfigByTaskType(taskType)
      return config.provider
    }

    // 2. 基于内容特征选择提供商
    const contentFeatures = this.analyzeContent(request.content)

    // 3. 根据性能指标选择
    const availableProviders = Array.from(this.providers.keys()).filter(
      provider => this.isProviderAvailable(provider)
    )

    if (availableProviders.length === 0) {
      throw new Error('没有可用的AI提供商')
    }

    // 评分和排序
    const scoredProviders = availableProviders.map(provider => ({
      provider,
      score: this.calculateProviderScore(provider, contentFeatures, preferences)
    }))

    scoredProviders.sort((a, b) => b.score - a.score)

    return scoredProviders[0].provider
  }

  /**
   * 分析内容特征
   */
  private analyzeContent(content: any): ContentFeatures {
    const text = typeof content === 'string' ? content : JSON.stringify(content)

    return {
      length: text.length,
      language: this.detectLanguage(text),
      hasCode: /```[\s\S]*```/.test(text),
      hasMath: /[\w]+\s*[=+\-*/]\s*[\w]+/.test(text),
      complexity: this.calculateComplexity(text),
      isLongForm: text.length > 2000,
      isCreative: this.isCreativeContent(text)
    }
  }

  /**
   * 计算提供商评分
   */
  private calculateProviderScore(
    provider: string,
    features: ContentFeatures,
    preferences?: any
  ): number {
    const capabilities = AI_MODEL_CAPABILITIES[provider]
    const metrics = this.metrics.get(provider)

    let score = 0

    // 基于能力匹配
    if (features.hasCode && capabilities.strengths.includes('代码生成')) {
      score += 20
    }
    if (features.hasMath && capabilities.strengths.includes('数学推理')) {
      score += 20
    }
    if (features.language === 'zh' && provider === 'deepseek') {
      score += 15 // DeepSeek对中文支持更好
    }
    if (features.isLongForm && capabilities.strengths.includes('长文本处理')) {
      score += 15
    }

    // 基于性能指标
    if (metrics) {
      score += (1 - metrics.errorRate) * 20
      score += (1 - metrics.avgResponseTime / 10000) * 10 // 响应时间越短越好
    }

    // 基于成本考虑
    const costWeight = this.getCostWeight(capabilities.costLevel)
    score += costWeight * 10

    return score
  }

  /**
   * 执行AI请求
   */
  private async executeRequest(
    providerName: string,
    request: AIRequest
  ): Promise<AIResponse> {
    const provider = this.providers.get(providerName)
    const circuitBreaker = this.circuitBreakers.get(providerName)

    if (!provider || !circuitBreaker) {
      throw new Error(`提供商 ${providerName} 未找到`)
    }

    return circuitBreaker.execute(async () => {
      const requestConfig = this.buildRequestConfig(provider, request)

      const response: AxiosResponse = await this.httpService
        .post(provider.baseUrl + '/chat/completions', requestConfig.body, requestConfig)
        .toPromise()

      return this.formatResponse(response.data, providerName)
    })
  }

  /**
   * 构建请求配置
   */
  private buildRequestConfig(provider: AIProvider, request: AIRequest): AxiosRequestConfig {
    const messages = this.buildMessages(request)

    return {
      timeout: provider.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: provider.model,
        messages,
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
        stream: false
      }
    }
  }

  /**
   * 构建消息数组
   */
  private buildMessages(request: AIRequest): any[] {
    const messages = []

    // 系统提示
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      })
    }

    // 用户消息
    messages.push({
      role: 'user',
      content: this.formatContent(request.content)
    })

    return messages
  }

  /**
   * 格式化响应
   */
  private formatResponse(rawResponse: any, providerName: string): AIResponse {
    return {
      content: rawResponse.choices?.[0]?.message?.content || '',
      provider: providerName,
      model: rawResponse.model,
      usage: rawResponse.usage,
      finishReason: rawResponse.choices?.[0]?.finish_reason,
      metadata: {
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        processingTime: 0 // 将在上层计算
      }
    }
  }

  /**
   * 备用方案处理
   */
  private async generateResponseWithFallback(request: AIRequest): Promise<AIResponse> {
    const fallbackProviders = AI_PROVIDERS_CONFIG.fallbackProviders

    for (const providerName of fallbackProviders) {
      if (this.isProviderAvailable(providerName)) {
        try {
          this.logger.warn(`使用备用提供商: ${providerName}`)
          return await this.executeRequest(providerName, request)
        } catch (error) {
          this.logger.error(`备用提供商 ${providerName} 也失败了: ${error.message}`)
        }
      }
    }

    throw new Error('所有AI提供商都不可用')
  }

  /**
   * 检查提供商可用性
   */
  private isProviderAvailable(providerName: string): boolean {
    const provider = this.providers.get(providerName)
    const circuitBreaker = this.circuitBreakers.get(providerName)

    return !!(provider && circuitBreaker && circuitBreaker.isOpen() === false)
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(providerName: string, result: any): void {
    const metrics = this.metrics.get(providerName)
    if (metrics) {
      metrics.update(result.success, result.duration)
    }
  }

  /**
   * 记录AI使用情况
   */
  private async logAIUsage(
    providerName: string,
    request: AIRequest,
    response: AIResponse,
    duration: number
  ): Promise<void> {
    // 这里可以记录到数据库或日志系统
    this.logger.log(`AI使用记录: ${providerName}, 耗时: ${duration}ms`)
  }

  // 工具方法
  private detectLanguage(text: string): string {
    // 简单的语言检测逻辑
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)
    return chineseChars && chineseChars.length > text.length * 0.3 ? 'zh' : 'en'
  }

  private calculateComplexity(text: string): number {
    // 简单的复杂度计算
    return Math.min(text.length / 1000, 10)
  }

  private isCreativeContent(text: string): boolean {
    const creativeKeywords = ['创意', '想象', '设计', '创作', 'creative', 'imagine', 'design']
    return creativeKeywords.some(keyword => text.toLowerCase().includes(keyword))
  }

  private getCostWeight(costLevel: string): number {
    const weights = { 'very-low': 1, 'low': 0.8, 'high': 0.5, 'very-high': 0.3 }
    return weights[costLevel] || 0.5
  }

  private formatContent(content: any): string {
    if (typeof content === 'string') {
      return content
    }
    return JSON.stringify(content, null, 2)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取提供商状态
   */
  getProviderStatus(): ProviderStatus[] {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      available: this.isProviderAvailable(name),
      metrics: this.metrics.get(name)?.getStats(),
      capabilities: AI_MODEL_CAPABILITIES[name]
    }))
  }
}

// 辅助类和接口
interface ContentFeatures {
  length: number
  language: string
  hasCode: boolean
  hasMath: boolean
  complexity: number
  isLongForm: boolean
  isCreative: boolean
}

interface ProviderStatus {
  name: string
  available: boolean
  metrics?: any
  capabilities: any
}

class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private readonly threshold = 5
  private readonly timeout = 60000 // 1分钟

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }

  isOpen(): boolean {
    return this.state === 'OPEN'
  }
}

class AIMetrics {
  private totalRequests = 0
  private successfulRequests = 0
  private totalResponseTime = 0

  update(success: boolean, responseTime: number): void {
    this.totalRequests++
    if (success) {
      this.successfulRequests++
    }
    this.totalResponseTime += responseTime
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      successRate: this.totalRequests > 0 ? this.successfulRequests / this.totalRequests : 0,
      errorRate: this.totalRequests > 0 ? (this.totalRequests - this.successfulRequests) / this.totalRequests : 0,
      avgResponseTime: this.totalRequests > 0 ? this.totalResponseTime / this.totalRequests : 0
    }
  }
}