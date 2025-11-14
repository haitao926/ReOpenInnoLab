import { Controller, Get, Post, Body, Query, Headers } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Public } from '../../decorators/public.decorator'
import { MonitoringService } from './monitoring.service'

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    return this.monitoringService.getHealthStatus()
  }

  @Get('metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gateway metrics' })
  async getMetrics(@Query() query: any) {
    return this.monitoringService.getMetrics(query)
  }

  @Post('metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record custom metrics' })
  async recordMetrics(@Body() metricData: any, @Headers() headers: any) {
    return this.monitoringService.recordMetric(metricData, headers)
  }

  @Post('errors')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record errors for monitoring' })
  async recordError(@Body() errorData: any, @Headers() headers: any) {
    return this.monitoringService.recordError(errorData, headers)
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gateway statistics' })
  async getStats(@Query() query: any) {
    return this.monitoringService.getStats(query)
  }
}