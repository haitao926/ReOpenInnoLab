import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
  Logger,
  UseGuards
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'

import { LabTemplateService } from '../services/lab-template.service'
import { CreateLabTemplateDto } from '../dto/create-lab-template.dto'
import { LabTemplate } from '../database/entities/lab-template.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TenantGuard } from '../auth/guards/tenant.guard'
import { CurrentUser } from '../decorators/current-user.decorator'
import { CurrentTenant } from '../decorators/current-tenant.decorator'

@ApiTags('Lab Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('labs/templates')
export class LabTemplateController {
  private readonly logger = new Logger(LabTemplateController.name)

  constructor(
    private readonly labTemplateService: LabTemplateService,
    private readonly configService: ConfigService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lab template' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Lab template created successfully', type: LabTemplate })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate template' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('notebook', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/x-ipynb+json', 'application/json', 'text/plain']
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException('Only .ipynb files are allowed'), false)
        }
      }
    })
  )
  async createLabTemplate(
    @Body() createLabTemplateDto: CreateLabTemplateDto,
    @UploadedFile() notebookFile: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<LabTemplate> {
    this.logger.log(`Creating lab template: ${createLabTemplateDto.title} by user ${userId}`)

    try {
      return await this.labTemplateService.createLabTemplate(
        createLabTemplateDto,
        notebookFile,
        [], // No attachments in single file upload
        tenantId,
        userId
      )
    } catch (error) {
      this.logger.error(`Failed to create lab template: ${error.message}`, error.stack)
      throw error
    }
  }

  @Post('with-attachments')
  @ApiOperation({ summary: 'Create a new lab template with attachments' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Lab template created successfully', type: LabTemplate })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate template' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per attachment
        files: 10
      }
    })
  )
  async createLabTemplateWithAttachments(
    @Body() createLabTemplateDto: CreateLabTemplateDto,
    @UploadedFile() notebookFile: Express.Multer.File,
    @UploadedFiles() attachments: Express.Multer.File[],
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<LabTemplate> {
    this.logger.log(`Creating lab template with attachments: ${createLabTemplateDto.title} by user ${userId}`)

    try {
      return await this.labTemplateService.createLabTemplate(
        createLabTemplateDto,
        notebookFile,
        attachments || [],
        tenantId,
        userId
      )
    } catch (error) {
      this.logger.error(`Failed to create lab template with attachments: ${error.message}`, error.stack)
      throw error
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get lab templates with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title and description' })
  @ApiQuery({ name: 'labType', required: false, type: String, description: 'Filter by lab type' })
  @ApiQuery({ name: 'difficultyLevel', required: false, type: String, description: 'Filter by difficulty level' })
  @ApiQuery({ name: 'gradeBand', required: false, type: String, description: 'Filter by grade band' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  @ApiQuery({ name: 'courseActivityId', required: false, type: String, description: 'Filter by course activity' })
  @ApiResponse({ status: 200, description: 'Lab templates retrieved successfully' })
  async getLabTemplates(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('labType') labType?: string,
    @Query('difficultyLevel') difficultyLevel?: string,
    @Query('gradeBand') gradeBand?: string,
    @Query('tags') tags?: string[],
    @Query('courseActivityId') courseActivityId?: string,
    @CurrentTenant('id') tenantId: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20

    // Parse tags from comma-separated string if needed
    let parsedTags: string[] | undefined
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim())
    } else if (Array.isArray(tags)) {
      parsedTags = tags
    }

    return await this.labTemplateService.getLabTemplates(tenantId, {
      page: pageNum,
      limit: limitNum,
      search,
      labType,
      difficultyLevel,
      gradeBand,
      tags: parsedTags,
      courseActivityId
    })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific lab template' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab template ID' })
  @ApiResponse({ status: 200, description: 'Lab template retrieved successfully', type: LabTemplate })
  @ApiResponse({ status: 404, description: 'Lab template not found' })
  async getLabTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<LabTemplate> {
    return await this.labTemplateService.getLabTemplate(id, tenantId)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lab template' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab template ID' })
  @ApiResponse({ status: 200, description: 'Lab template updated successfully', type: LabTemplate })
  @ApiResponse({ status: 404, description: 'Lab template not found' })
  async updateLabTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateLabTemplateDto>,
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<LabTemplate> {
    this.logger.log(`Updating lab template ${id} by user ${userId}`)

    try {
      return await this.labTemplateService.updateLabTemplate(id, updateData, tenantId, userId)
    } catch (error) {
      this.logger.error(`Failed to update lab template ${id}: ${error.message}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lab template' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab template ID' })
  @ApiResponse({ status: 204, description: 'Lab template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lab template not found' })
  async deleteLabTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<void> {
    this.logger.log(`Deleting lab template ${id}`)

    try {
      await this.labTemplateService.deleteLabTemplate(id, tenantId)
    } catch (error) {
      this.logger.error(`Failed to delete lab template ${id}: ${error.message}`, error.stack)
      throw error
    }
  }

  @Post(':id/binding')
  @ApiOperation({ summary: 'Bind lab template to course activity' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lab template ID' })
  @ApiResponse({ status: 200, description: 'Binding updated successfully' })
  async updateBinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { courseActivityId: string; gradeBand?: string },
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string
  ): Promise<LabTemplate> {
    this.logger.log(`Updating binding for lab template ${id} by user ${userId}`)

    try {
      return await this.labTemplateService.updateLabTemplate(
        id,
        {
          courseActivityId: body.courseActivityId,
          gradeBand: body.gradeBand
        },
        tenantId,
        userId
      )
    } catch (error) {
      this.logger.error(`Failed to update binding for lab template ${id}: ${error.message}`, error.stack)
      throw error
    }
  }
}