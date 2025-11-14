import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'ai-service',
  port: parseInt(process.env.PORT, 10) || 3004,
  env: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true',

  // DeepSeek 配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-269cfd68cbe94759a39369c637dfe2d8',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    defaultModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    reasoningModel: 'deepseek-reasoner'
  },

  // 其他 AI 提供商配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4'
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    defaultModel: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
  },

  // 性能配置
  performance: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 60000,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS, 10) || 3,
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD, 10) || 5
  },

  // 安全配置
  security: {
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  }
}))