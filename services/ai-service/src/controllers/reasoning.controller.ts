import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
  ValidationPipe
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger'
import { AIGatewayService } from '../services/ai-gateway.service'
import { ReasoningRequestDto } from '../dto/reasoning-request.dto'
import { CourseDesignDto } from '../dto/course-design.dto'
import { ProblemAnalysisDto } from '../dto/problem-analysis.dto'
import { ExperimentDesignDto } from '../dto/experiment-design.dto'

@ApiTags('AI Reasoning')
@Controller('api/v1/reasoning')
export class ReasoningController {
  private readonly logger = new Logger(ReasoningController.name)

  constructor(private readonly aiGatewayService: AIGatewayService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AI推理请求',
    description: '使用DeepSeek推理模型生成包含思维链的回答'
  })
  @ApiResponse({
    status: 200,
    description: '推理成功，返回思维链和最终答案'
  })
  @ApiHeader({ name: 'X-Tenant-ID', required: false, description: '租户ID' })
  @ApiHeader({ name: 'X-User-ID', required: false, description: '用户ID' })
  async generateReasoning(
    @Body(ValidationPipe) request: ReasoningRequestDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string
  ) {
    this.logger.log(`推理请求 - 租户: ${tenantId}, 用户: ${userId}, 启用推理: ${request.enableReasoning}`)

    try {
      const response = await this.aiGatewayService.generateReasoningResponse({
        content: request.content,
        systemPrompt: request.systemPrompt,
        taskType: request.taskType,
        enableReasoning: request.enableReasoning,
        maxTokens: request.maxTokens,
        tenantId,
        userId
      })

      return {
        success: true,
        data: {
          content: response.content,
          reasoning_content: response.reasoning_content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          metadata: response.metadata
        }
      }
    } catch (error) {
      this.logger.error('推理请求失败', error.stack)
      return {
        success: false,
        error: {
          code: 'REASONING_FAILED',
          message: error.message || '推理请求失败'
        }
      }
    }
  }

  @Post('stream')
  @ApiOperation({
    summary: '流式AI推理',
    description: '流式返回思维链和答案内容'
  })
  @ApiResponse({
    status: 200,
    description: '流式响应成功'
  })
  async streamReasoning(
    @Body(ValidationPipe) request: ReasoningRequestDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string
  ) {
    this.logger.log(`流式推理请求 - 租户: ${tenantId}, 用户: ${userId}`)

    // 这里需要实现SSE或WebSocket响应
    // 暂时返回普通响应作为占位
    return {
      message: '流式推理功能开发中，请使用普通推理接口',
      suggestion: '使用 POST /api/v1/reasoning 接口'
    }
  }

  @Post('course-design')
  @ApiOperation({
    summary: '课程设计',
    description: '基于AI推理生成完整的课程设计方案'
  })
  @ApiResponse({
    status: 200,
    description: '课程设计成功'
  })
  async designCourse(
    @Body(ValidationPipe) request: CourseDesignDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string
  ) {
    this.logger.log(`课程设计请求 - 学科: ${request.subject}, 年级: ${request.grade}`)

    try {
      const response = await this.aiGatewayService.designCourse({
        subject: request.subject,
        grade: request.grade,
        topic: request.topic,
        duration: request.duration,
        objectives: request.objectives,
        specialRequirements: request.specialRequirements
      })

      return {
        success: true,
        data: {
          content: response.content,
          reasoning_content: response.reasoning_content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          metadata: response.metadata
        }
      }
    } catch (error) {
      this.logger.error('课程设计失败', error.stack)
      return {
        success: false,
        error: {
          code: 'COURSE_DESIGN_FAILED',
          message: error.message || '课程设计失败'
        }
      }
    }
  }

  @Post('problem-analysis')
  @ApiOperation({
    summary: '问题分析',
    description: '分析教育问题并提供详细解答'
  })
  @ApiResponse({
    status: 200,
    description: '问题分析成功'
  })
  async analyzeProblem(
    @Body(ValidationPipe) request: ProblemAnalysisDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string
  ) {
    this.logger.log(`问题分析请求 - 学科: ${request.subject}, 难度: ${request.difficulty}`)

    try {
      const response = await this.aiGatewayService.analyzeEducationalProblem({
        context: request.context,
        question: request.question,
        difficulty: request.difficulty,
        subject: request.subject
      })

      return {
        success: true,
        data: {
          content: response.content,
          reasoning_content: response.reasoning_content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          metadata: response.metadata
        }
      }
    } catch (error) {
      this.logger.error('问题分析失败', error.stack)
      return {
        success: false,
        error: {
          code: 'PROBLEM_ANALYSIS_FAILED',
          message: error.message || '问题分析失败'
        }
      }
    }
  }

  @Post('experiment-design')
  @ApiOperation({
    summary: '实验设计',
    description: '基于AI推理设计科学实验方案'
  })
  @ApiResponse({
    status: 200,
    description: '实验设计成功'
  })
  async designExperiment(
    @Body(ValidationPipe) request: ExperimentDesignDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string
  ) {
    this.logger.log(`实验设计请求 - 学科: ${request.subject}, 年级: ${request.grade}`)

    try {
      const response = await this.aiGatewayService.designExperiment({
        topic: request.topic,
        subject: request.subject,
        grade: request.grade,
        availableMaterials: request.availableMaterials,
        safetyConstraints: request.safetyConstraints
      })

      return {
        success: true,
        data: {
          content: response.content,
          reasoning_content: response.reasoning_content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          metadata: response.metadata
        }
      }
    } catch (error) {
      this.logger.error('实验设计失败', error.stack)
      return {
        success: false,
        error: {
          code: 'EXPERIMENT_DESIGN_FAILED',
          message: error.message || '实验设计失败'
        }
      }
    }
  }

  @Post('explain')
  @ApiOperation({
    summary: '概念解释',
    description: '详细解释教育概念和原理'
  })
  @ApiResponse({
    status: 200,
    description: '概念解释成功'
  })
  async explainConcept(
    @Body() body: {
      concept: string
      subject: string
      grade: string
      context?: string
    },
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string
  ) {
    this.logger.log(`概念解释请求 - 概念: ${body.concept}, 学科: ${body.subject}`)

    try {
      const response = await this.aiGatewayService.generateReasoningResponse({
        content: `请详细解释"${body.concept}"这个概念，适合${body.grade}年级的学生学习${body.subject}时理解。${body.context ? `背景信息：${body.context}` : ''}`,
        systemPrompt: `你是一位专业的教育专家，擅长用通俗易懂的语言解释复杂的概念。
请按照以下结构进行解释：
1. 概念定义
2. 基本原理
3. 实例说明
4. 应用场景
5. 相关概念
6. 常见误区

确保解释准确、生动、符合学生的认知水平。`,
        taskType: 'complexProblemSolving',
        enableReasoning: true,
        tenantId,
        userId
      })

      return {
        success: true,
        data: {
          content: response.content,
          reasoning_content: response.reasoning_content,
          provider: response.provider,
          model: response.model,
          usage: response.usage
        }
      }
    } catch (error) {
      this.logger.error('概念解释失败', error.stack)
      return {
        success: false,
        error: {
          code: 'CONCEPT_EXPLANATION_FAILED',
          message: error.message || '概念解释失败'
        }
      }
    }
  }
}