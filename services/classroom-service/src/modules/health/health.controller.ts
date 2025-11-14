import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务正常运行' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'classroom-service',
      uptime: process.uptime(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: '详细健康检查' })
  @ApiResponse({ status: 200, description: '详细状态信息' })
  detailedCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'classroom-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}