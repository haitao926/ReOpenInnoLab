import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger'

import { LabRuntimeControllerService } from '../modules/lab-runtime-controller/lab-runtime-controller.service'
import { LabArtifactService } from '../modules/lab-artifact/lab-artifact.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TenantGuard } from '../auth/guards/tenant.guard'
import { CurrentUser } from '../decorators/current-user.decorator'
import { CurrentTenant } from '../decorators/current-tenant.decorator'
import { LabRun } from '../database/entities/lab-run.entity'

@ApiTags('Lab Runs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('labs/runs')
export class LabRunController {
  constructor(
    private readonly labRuntimeControllerService: LabRuntimeControllerService,
    private readonly labArtifactService: LabArtifactService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lab run' })
  @ApiResponse({ status: 201, description: 'Lab run created successfully', type: LabRun })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createLabRun(
    @Body() body: {
      templateId: string
      classroomId?: string
      studentId?: string
      scheduledFor?: string
    },
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<LabRun> {
    return await this.labRuntimeControllerService.createLabRun(
      body.templateId,
      body.classroomId || 'default',
      body.studentId || userId,
      tenantId
    )
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific lab run' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 200, description: 'Lab run retrieved successfully', type: LabRun })
  @ApiResponse({ status: 404, description: 'Lab run not found' })
  async getLabRun(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<LabRun> {
    // 这里需要在服务中实现获取方法
    throw new Error('Not implemented yet')
  }

  @Get(':id/artifacts')
  @ApiOperation({ summary: 'Get artifacts for a lab run' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiQuery({ name: 'type', required: false, type: 'string', description: 'Filter by artifact type' })
  @ApiResponse({ status: 200, description: 'Artifacts retrieved successfully' })
  async getLabRunArtifacts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') artifactType?: string
  ) {
    return await this.labArtifactService.getLabRunArtifacts(id, artifactType)
  }

  @Get(':id/artifacts/:artifactId/content')
  @ApiOperation({ summary: 'Get artifact content' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiParam({ name: 'artifactId', type: 'string', description: 'Artifact ID' })
  @ApiResponse({ status: 200, description: 'Artifact content retrieved successfully' })
  async getArtifactContent(
    @Param('artifactId', ParseUUIDPipe) artifactId: string
  ): Promise<Buffer> {
    return await this.labArtifactService.getArtifactContent(artifactId)
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start a lab run' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 200, description: 'Lab run started successfully' })
  async startLabRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { classroomId?: string }
  ) {
    return await this.labRuntimeControllerService.dispatchToAgents(
      id,
      body.classroomId || 'default',
      '' // templateId 需要从 run 中获取
    )
  }

  @Put(':id/stop')
  @ApiOperation({ summary: 'Stop a lab run' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 200, description: 'Lab run stopped successfully' })
  async stopLabRun(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    return await this.labRuntimeControllerService.stopLabRun(id)
  }

  @Post(':id/heartbeat')
  @ApiOperation({ summary: 'Handle agent heartbeat' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 200, description: 'Heartbeat processed successfully' })
  async handleHeartbeat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      agentId: string
      sessionId: string
      status: string
      cpu_usage?: number
      memory_usage?: number
      log_tail?: string
    }
  ) {
    return await this.labRuntimeControllerService.handleHeartbeat(
      body.agentId,
      body.sessionId,
      body
    )
  }

  @Post(':id/artifacts')
  @ApiOperation({ summary: 'Upload artifact for a lab run' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 201, description: 'Artifact uploaded successfully' })
  async uploadArtifact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      sessionId: string
      artifactType: string
      content: string
      metadata?: Record<string, any>
    }
  ) {
    return await this.labArtifactService.processArtifact(
      body.sessionId,
      body.artifactType,
      body.content,
      body.metadata
    )
  }

  @Post(':id/logs')
  @ApiOperation({ summary: 'Upload log for a lab run' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 201, description: 'Log uploaded successfully' })
  async uploadLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      sessionId: string
      message: string
      level?: 'info' | 'warn' | 'error'
      metadata?: Record<string, any>
    }
  ) {
    return await this.labArtifactService.processLog(
      body.sessionId,
      body.message,
      body.level || 'info',
      body.metadata
    )
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync offline artifacts' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  async syncOfflineArtifacts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      sessionId: string
      events: any[]
    }
  ) {
    return await this.labArtifactService.processAgentEvents(body.sessionId, body.events)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lab run and its artifacts' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab run ID' })
  @ApiResponse({ status: 204, description: 'Lab run deleted successfully' })
  async deleteLabRun(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    // 停止运行
    await this.labRuntimeControllerService.stopLabRun(id)

    // 清理产出
    await this.labArtifactService.cleanupArtifacts(id)
  }
}