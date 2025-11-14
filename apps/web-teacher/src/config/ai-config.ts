import { AIService, AIServiceConfig } from '../services/ai'

// AI服务配置
export const AI_CONFIG: AIServiceConfig = {
  providers: {
    // DeepSeek 推理模型
    deepseek_reasoner: {
      name: 'DeepSeek Reasoner',
      apiKey: 'sk-269cfd68cbe94759a39369c637dfe2d8',
      baseUrl: 'http://localhost:3004', // AI Service 地址
      model: 'deepseek-reasoner',
      supportsReasoning: true,
      reasoningModel: true
    },

    // DeepSeek 普通模型
    deepseek: {
      name: 'DeepSeek',
      apiKey: 'sk-269cfd68cbe94759a39369c637dfe2d8',
      baseUrl: 'http://localhost:3004',
      model: 'deepseek-chat',
      supportsReasoning: false,
      reasoningModel: false
    }
  },
  defaultProvider: 'deepseek_reasoner', // 默认使用推理模型
  requestTimeout: 60000,
  maxRetries: 3
}

// 创建AI服务实例
export const aiService = new AIService(AI_CONFIG)

// 教育场景专用配置
export const EDUCATION_AI_CONFIG = {
  // 课程设计 - 使用推理模型
  courseDesign: {
    provider: 'deepseek_reasoner',
    systemPrompt: `你是一位专业的教学设计师，具有以下特点：
1. 深度理解认知科学和学习理论
2. 熟悉中小学课程标准
3. 能够根据学生认知水平设计合适的教学内容
4. 注重教学目标的可测量性
5. 考虑不同学习风格的学生需求

请详细分析课程设计需求，并提供完整的设计方案。`
  },

  // 实验设计 - 使用推理模型
  experimentDesign: {
    provider: 'deepseek_reasoner',
    systemPrompt: `你是一位专业的科学实验指导老师。
设计实验时请：
1. 确保实验的科学性和安全性
2. 考虑学生的认知水平和操作能力
3. 详细说明实验原理和步骤
4. 指出可能的危险和防护措施
5. 提供数据记录和分析方法
6. 给出实验结论和拓展建议`
  },

  // 问题分析 - 使用推理模型
  problemAnalysis: {
    provider: 'deepseek_reasoner',
    systemPrompt: `你是一位资深的教育专家和问题解决专家。
对于复杂的教育问题，请：
1. 仔细分析问题的各个方面
2. 识别关键概念和原理
3. 提供详细的解题思路
4. 解释每一步的推理过程
5. 给出最终答案
6. 提供相关的拓展思考`
  },

  // 普通问答 - 使用普通模型
  generalQA: {
    provider: 'deepseek',
    systemPrompt: `你是一位知识渊博的AI助教，能够快速回答学生的各种问题。
特点：
- 回答准确、简洁、易懂
- 善于用类比和实例解释复杂概念
- 适时提出启发性问题
- 尊重学生的学习节奏`
  }
}

// 根据场景获取AI配置
export function getAIConfig(scenario: keyof typeof EDUCATION_AI_CONFIG) {
  const config = EDUCATION_AI_CONFIG[scenario]
  return {
    ...AI_CONFIG.providers[config.provider],
    systemPrompt: config.systemPrompt,
    enableReasoning: AI_CONFIG.providers[config.provider].reasoningModel
  }
}