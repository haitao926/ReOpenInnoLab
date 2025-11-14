import {
  Controller,
  Get,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { HealthCheckService, HealthCheck } from '@nestjs/terminus'
import { Logger } from '@nestjs/common'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name)

  constructor(
    private health: HealthCheckService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @HealthCheck()
  @ApiOperation({
    summary: '健康检查',
    description: '检查AI服务的健康状态'
  })
  @ApiResponse({
    status: 200,
    description: '服务健康'
  })
  async check() {
    this.logger.debug('Health check requested')

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ai-service',
      version: '1.0.0',
      uptime: process.uptime()
    }
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '就绪检查',
    description: '检查服务是否准备好接收请求'
  })
  @ApiResponse({
    status: 200,
    description: '服务就绪'
  })
  async ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString()
    }
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '存活检查',
    description: '检查服务是否存活'
  })
  @ApiResponse({
    status: 200,
    description: '服务存活'
  })
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    }
  }
}