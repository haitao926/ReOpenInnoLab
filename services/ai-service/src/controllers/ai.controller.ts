import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AIGatewayService } from '../services/ai-gateway.service'
import { ReasoningRequestDto } from '../dto/reasoning-request.dto'

@ApiTags('AI General')
@Controller('api/v1/ai')
export class AIController {
  private readonly logger = new Logger(AIController.name)

  constructor(private readonly aiGatewayService: AIGatewayService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '通用AI请求',
    description: '处理各种AI任务，自动选择最适合的模型'
  })
  @ApiResponse({
    status: 200,
    description: 'AI请求成功'
  })
  async generate(@Body() request: ReasoningRequestDto) {
    this.logger.log(`通用AI请求 - 任务类型: ${request.taskType || 'general'}`)

    try {
      const response = await this.aiGatewayService.generateResponse({
        content: request.content,
        systemPrompt: request.systemPrompt,
        taskType: request.taskType as any,
        maxTokens: request.maxTokens
      })

      return {
        success: true,
        data: {
          content: response.content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          metadata: response.metadata
        }
      }
    } catch (error) {
      this.logger.error('AI请求失败', error.stack)
      return {
        success: false,
        error: {
          code: 'AI_REQUEST_FAILED',
          message: error.message || 'AI请求失败'
        }
      }
    }
  }

  @Get('providers/status')
  @ApiOperation({
    summary: '获取AI提供商状态',
    description: '查看所有AI提供商的可用性和性能指标'
  })
  @ApiResponse({
    status: 200,
    description: '获取状态成功'
  })
  getProvidersStatus() {
    return {
      success: true,
      data: this.aiGatewayService.getProviderStatus()
    }
  }
}