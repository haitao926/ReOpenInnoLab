/**
 * AI服务提供商配置
 * 支持DeepSeek、OpenAI、Anthropic等多个AI模型提供商
 */

export interface AIProvider {
  name: string
  apiKey: string
  baseUrl: string
  model: string
  maxTokens?: number
  temperature?: number
  timeout?: number
  retryAttempts?: number
}

export interface AIProvidersConfig {
  providers: Record<string, AIProvider>
  defaultProvider: string
  fallbackProviders: string[]
}

export const AI_PROVIDERS_CONFIG: AIProvidersConfig = {
  providers: {
    // DeepSeek - 主要用于教育场景，性价比高
    deepseek: {
      name: 'DeepSeek',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
      retryAttempts: 3
    },

    // OpenAI GPT-4 - 高质量内容生成
    openai: {
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
      retryAttempts: 3
    },

    // OpenAI GPT-3.5 - 快速响应
    openai_fast: {
      name: 'OpenAI Fast',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL_FAST || 'gpt-3.5-turbo',
      maxTokens: 2048,
      temperature: 0.7,
      timeout: 15000,
      retryAttempts: 2
    },

    // Anthropic Claude - 对话式AI
    anthropic: {
      name: 'Anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
      retryAttempts: 3
    },

    // 本地模型 - 支持私有化部署
    local: {
      name: 'Local Model',
      apiKey: process.env.LOCAL_MODEL_API_KEY || 'local-key',
      baseUrl: process.env.LOCAL_MODEL_ENDPOINT || 'http://localhost:8000/v1',
      model: process.env.LOCAL_MODEL_MODEL || 'llama-2-7b-chat',
      maxTokens: 2048,
      temperature: 0.7,
      timeout: 60000,
      retryAttempts: 1
    }
  },

  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'deepseek',
  fallbackProviders: ['openai', 'anthropic']
}

// 教育场景专用配置
export const EDUCATION_AI_CONFIG = {
  // 课程设计 - 使用DeepSeek（性价比高，适合长文本）
  courseDesign: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.8,
    maxTokens: 4096,
    systemPrompt: `你是一位专业的教学设计师，具有以下特点：
1. 深度理解认知科学和学习理论
2. 熟悉中小学课程标准
3. 能够根据学生认知水平设计合适的教学内容
4. 注重教学目标的可测量性
5. 考虑不同学习风格的学生需求`
  },

  // 内容生成 - 使用OpenAI（质量高）
  contentGeneration: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 3072,
    systemPrompt: `你是一位教育内容专家，专门为中小学教学生成高质量内容。
要求：
- 内容准确、科学、符合教育规律
- 语言通俗易懂，适合目标年级学生
- 包含丰富的实例和类比
- 考虑学生的认知负荷`
  },

  // 实验指导 - 使用DeepSeek（技术内容强）
  labGuidance: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.6,
    maxTokens: 2048,
    systemPrompt: `你是一位科学实验指导老师，具有以下特点：
1. 熟悉各种实验操作流程和安全规范
2. 能够解释实验原理和现象
3. 善于引导学生发现问题、解决问题
4. 注重实验安全和环保意识
5. 能够根据学生水平调整指导难度`
  },

  // 作业批改 - 使用OpenAI Fast（快速响应）
  assignmentGrading: {
    provider: 'openai_fast',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 1024,
    systemPrompt: `你是一位经验丰富的教师，负责批改学生作业。
要求：
- 公正客观地评价学生答案
- 提供具体的改进建议
- 鼓励学生的进步
- 指出错误并解释正确答案
- 适合学生的语言风格`
  },

  // 学习分析 - 使用Anthropic（分析能力强）
  learningAnalytics: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.5,
    maxTokens: 2048,
    systemPrompt: `你是一位教育数据分析专家，专门分析学生的学习行为和效果。
能力：
- 识别学生的学习模式和困难点
- 分析教学效果的优劣
- 提供个性化的学习建议
- 预测学生的学习趋势
- 生成可视化分析报告`
  },

  // 实时问答 - 使用DeepSeek（响应快）
  realtimeQA: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.6,
    maxTokens: 1024,
    systemPrompt: `你是一位知识渊博的AI助教，能够快速回答学生的各种问题。
特点：
- 回答准确、简洁、易懂
- 善于用类比和实例解释复杂概念
- 适时提出启发性问题
- 尊重学生的学习节奏`
  }
}

// 根据任务类型选择最适合的AI配置
export function getAIConfigByTaskType(taskType: keyof typeof EDUCATION_AI_CONFIG): AIProvider {
  const config = EDUCATION_AI_CONFIG[taskType]
  const baseProvider = AI_PROVIDERS_CONFIG.providers[config.provider]

  return {
    ...baseProvider,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    systemPrompt: config.systemPrompt
  }
}

// AI模型能力映射
export const AI_MODEL_CAPABILITIES = {
  deepseek: {
    strengths: ['代码生成', '数学推理', '中文理解', '长文本处理'],
    costLevel: 'low',
    speedLevel: 'medium',
    qualityLevel: 'high'
  },
  openai: {
    strengths: ['创意写作', '逻辑推理', '多语言', '复杂问题解决'],
    costLevel: 'high',
    speedLevel: 'medium',
    qualityLevel: 'very-high'
  },
  anthropic: {
    strengths: ['对话理解', '分析推理', '文本总结', '安全审查'],
    costLevel: 'high',
    speedLevel: 'slow',
    qualityLevel: 'very-high'
  },
  local: {
    strengths: ['隐私保护', '离线使用', '成本可控'],
    costLevel: 'very-low',
    speedLevel: 'variable',
    qualityLevel: 'medium'
  }
}

export default AI_PROVIDERS_CONFIG