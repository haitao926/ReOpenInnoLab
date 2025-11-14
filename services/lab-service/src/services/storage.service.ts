import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Minio from 'minio'
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { v4 as uuidv4 } from 'uuid'

import { MinioConfig } from '@config/minio.config'
import { ResourceRef, ResourceType, StorageBackend } from '../database/entities/resource-ref.entity'

const streamPipeline = promisify(pipeline)

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private minioClient: Minio.Client
  private readonly config: MinioConfig

  constructor(
    private readonly configService: ConfigService,
    private readonly minioConfig: MinioConfig,
  ) {
    this.config = minioConfig
    this.initializeMinio()
  }

  private initializeMinio() {
    try {
      this.minioClient = new Minio.Client(this.config.getOptions())
      this.logger.log('MinIO client initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize MinIO client:', error)
    }
  }

  async ensureBucket(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName)
      if (!exists) {
        await this.minioClient.makeBucket(bucketName, this.config.getOptions().region)
        this.logger.log(`Created bucket: ${bucketName}`)
      }
    } catch (error) {
      this.logger.error(`Failed to ensure bucket ${bucketName}:`, error)
      throw error
    }
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    bucketName: string,
    metadata?: Record<string, string>,
  ): Promise<{ url: string; etag: string }> {
    try {
      await this.ensureBucket(bucketName)

      const objectName = `${Date.now()}-${uuidv4()}-${fileName}`

      const uploadOptions = {
        'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
        'Cache-Control': metadata?.['Cache-Control'] || 'public, max-age=31536000',
        ...metadata,
      }

      const result = await new Promise<{ etag: string }>((resolve, reject) => {
        this.minioClient.putObject(
          bucketName,
          objectName,
          buffer,
          buffer.length,
          uploadOptions,
          (error, etag) => {
            if (error) {
              reject(error)
            } else {
              resolve({ etag: etag! })
            }
          },
        )
      })

      const url = await this.minioClient.presignedGetObject(bucketName, objectName)

      this.logger.log(`Successfully uploaded ${fileName} to ${bucketName}/${objectName}`)

      return {
        url,
        etag: result.etag,
      }
    } catch (error) {
      this.logger.error(`Failed to upload file ${fileName}:`, error)
      throw error
    }
  }

  async uploadFileStream(
    fileStream: NodeJS.ReadableStream,
    fileName: string,
    bucketName: string,
    metadata?: Record<string, string>,
  ): Promise<{ url: string; etag: string; size: number }> {
    try {
      await this.ensureBucket(bucketName)

      const objectName = `${Date.now()}-${uuidv4()}-${fileName}`

      const uploadOptions = {
        'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
        'Cache-Control': metadata?.['Cache-Control'] || 'public, max-age=31536000',
        ...metadata,
      }

      const chunks: Buffer[] = []
      let size = 0

      // Collect chunks to calculate size
      for await (const chunk of fileStream) {
        chunks.push(chunk)
        size += chunk.length
      }

      // Create buffer from chunks
      const buffer = Buffer.concat(chunks)

      const result = await new Promise<{ etag: string }>((resolve, reject) => {
        this.minioClient.putObject(
          bucketName,
          objectName,
          buffer,
          buffer.length,
          uploadOptions,
          (error, etag) => {
            if (error) {
              reject(error)
            } else {
              resolve({ etag: etag! })
            }
          },
        )
      })

      const url = await this.minioClient.presignedGetObject(bucketName, objectName)

      this.logger.log(`Successfully uploaded ${fileName} (${size} bytes) to ${bucketName}/${objectName}`)

      return {
        url,
        etag: result.etag,
        size,
      }
    } catch (error) {
      this.logger.error(`Failed to upload file stream ${fileName}:`, error)
      throw error
    }
  }

  async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(bucketName, objectName)
      const chunks: Buffer[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const buffer = Buffer.concat(chunks)
      this.logger.log(`Successfully downloaded ${objectName} from ${bucketName} (${buffer.length} bytes)`)

      return buffer
    } catch (error) {
      this.logger.error(`Failed to download file ${bucketName}/${objectName}:`, error)
      throw error
    }
  }

  async getPresignedUrl(
    bucketName: string,
    objectName: string,
    expiry: number = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(bucketName, objectName, expiry)
      return url
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${bucketName}/${objectName}:`, error)
      throw error
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, objectName)
      this.logger.log(`Successfully deleted ${bucketName}/${objectName}`)
    } catch (error) {
      this.logger.error(`Failed to delete file ${bucketName}/${objectName}:`, error)
      throw error
    }
  }

  async copyFile(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    try {
      await this.ensureBucket(destBucket)
      await this.minioClient.copyObject(destBucket, destObject, `${sourceBucket}/${sourceObject}`)
      this.logger.log(`Successfully copied ${sourceBucket}/${sourceObject} to ${destBucket}/${destObject}`)
    } catch (error) {
      this.logger.error(`Failed to copy file ${sourceBucket}/${sourceObject}:`, error)
      throw error
    }
  }

  async listFiles(
    bucketName: string,
    prefix: string = '',
    recursive: boolean = false,
  ): Promise<Array<{ name: string; size: number; lastModified: Date; etag: string }>> {
    try {
      const stream = this.minioClient.listObjects(bucketName, prefix, recursive)
      const files: Array<{ name: string; size: number; lastModified: Date; etag: string }> = []

      for await (const obj of stream) {
        files.push({
          name: obj.name!,
          size: obj.size || 0,
          lastModified: obj.lastModified || new Date(),
          etag: obj.etag || '',
        })
      }

      return files
    } catch (error) {
      this.logger.error(`Failed to list files in ${bucketName} with prefix ${prefix}:`, error)
      throw error
    }
  }

  async getFileInfo(
    bucketName: string,
    objectName: string,
  ): Promise<{ size: number; lastModified: Date; contentType: string; etag: string }> {
    try {
      const stat = await this.minioClient.statObject(bucketName, objectName)
      return {
        size: stat.size,
        lastModified: stat.lastModified,
        contentType: stat.contentType || 'application/octet-stream',
        etag: stat.etag,
      }
    } catch (error) {
      this.logger.error(`Failed to get file info for ${bucketName}/${objectName}:`, error)
      throw error
    }
  }

  async createResourceRef(
    entityType: string,
    entityId: string,
    resourceType: ResourceType,
    fileData: Buffer | NodeJS.ReadableStream,
    fileName: string,
    mimeType?: string,
    metadata?: Record<string, any>,
  ): Promise<ResourceRef> {
    const resourceRef = new ResourceRef()
    resourceRef.entityType = entityType
    resourceRef.entityId = entityId
    resourceRef.resourceType = resourceType
    resourceRef.fileName = fileName
    resourceRef.mimeType = mimeType
    resourceRef.storageBackend = StorageBackend.MINIO

    try {
      const bucket = this.getBucketName(resourceType)

      let uploadResult
      if (Buffer.isBuffer(fileData)) {
        uploadResult = await this.uploadFile(fileData, fileName, bucket, {
          'Content-Type': mimeType,
        })
        resourceRef.fileSize = fileData.length
      } else {
        uploadResult = await this.uploadFileStream(fileData, fileName, bucket, {
          'Content-Type': mimeType,
        })
        resourceRef.fileSize = uploadResult.size
      }

      resourceRef.filePath = uploadResult.url
      resourceRef.storageMetadata = {
        bucket,
        key: uploadResult.url.split('/').pop(),
        etag: uploadResult.etag,
        url: uploadResult.url,
        ...metadata,
      }

      return resourceRef
    } catch (error) {
      this.logger.error(`Failed to create resource ref for ${fileName}:`, error)
      throw error
    }
  }

  private getBucketName(resourceType: ResourceType): string {
    const buckets = this.config.getBucketOptions()
    const bucketMap = {
      [ResourceType.ATTACHMENT]: buckets.attachments.name,
      [ResourceType.PREVIEW]: buckets.previews.name,
      [ResourceType.THUMBNAIL]: buckets.temp.name, // Use temp for thumbnails
      [ResourceType.CHECKSUM]: buckets.temp.name,
      [ResourceType.METADATA]: buckets.temp.name,
      [ResourceType.BACKUP]: buckets.artifacts.name,
    }
    return bucketMap[resourceType] || buckets.temp.name
  }

  async storeLocalFile(
    buffer: Buffer,
    fileName: string,
    subDirectory: string = '',
  ): Promise<string> {
    try {
      const tempDir = this.config.getUploadOptions().tempDir
      const fullPath = join(tempDir, subDirectory)

      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true })
      }

      const filePath = join(fullPath, fileName)
      await streamPipeline(createReadStream(filePath), createWriteStream(filePath))

      this.logger.log(`Successfully stored local file: ${filePath}`)
      return filePath
    } catch (error) {
      this.logger.error(`Failed to store local file ${fileName}:`, error)
      throw error
    }
  }

  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    try {
      const tempDir = this.config.getUploadOptions().tempDir
      const files = await this.listFiles(this.config.getBucketOptions().temp.name)

      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
      let deletedCount = 0

      for (const file of files) {
        if (file.lastModified < cutoffTime) {
          await this.deleteFile(this.config.getBucketOptions().temp.name, file.name)
          deletedCount++
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} temporary files older than ${olderThanHours} hours`)
    } catch (error) {
      this.logger.error('Failed to cleanup temp files:', error)
    }
  }

  async generateThumbnail(
    imageBuffer: Buffer,
    fileName: string,
    width: number = 300,
    height: number = 200,
  ): Promise<Buffer> {
    // This is a placeholder - in a real implementation, you'd use sharp or another image processing library
    // For now, we'll just return the original buffer
    this.logger.log(`Thumbnail generation requested for ${fileName} (${width}x${height})`)
    return imageBuffer
  }

  async generatePreview(
    content: string | Buffer,
    fileName: string,
    type: 'html' | 'markdown' | 'text' | 'json',
  ): Promise<Buffer> {
    // This is a placeholder - in a real implementation, you'd generate appropriate previews
    this.logger.log(`Preview generation requested for ${fileName} (${type})`)

    if (typeof content === 'string') {
      return Buffer.from(content, 'utf-8')
    }
    return content
  }

  async validateFile(buffer: Buffer, fileName: string, mimeType?: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    const uploadOptions = this.config.getUploadOptions()

    // Check file size
    if (buffer.length > uploadOptions.maxFileSize) {
      errors.push(`File size ${buffer.length} exceeds maximum allowed size ${uploadOptions.maxFileSize}`)
    }

    // Check file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    if (fileExtension && !uploadOptions.allowedExtensions.includes(`.${fileExtension}`)) {
      errors.push(`File extension .${fileExtension} is not allowed`)
    }

    // Check MIME type
    if (mimeType && !uploadOptions.allowedTypes.includes(mimeType)) {
      errors.push(`MIME type ${mimeType} is not allowed`)
    }

    // Basic content validation for common file types
    if (fileName.endsWith('.ipynb')) {
      try {
        const content = JSON.parse(buffer.toString('utf-8'))
        if (!content.cells || !Array.isArray(content.cells)) {
          errors.push('Invalid Jupyter notebook format: missing cells array')
        }
      } catch (error) {
        errors.push('Invalid JSON format in notebook file')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Upload notebook file
   */
  async uploadNotebook(buffer: Buffer, fileName: string, tenantId: string): Promise<string> {
    const bucketName = this.config.getBucketOptions().notebooks.name
    const objectPath = `${tenantId}/notebooks/${Date.now()}-${uuidv4()}-${fileName}`

    const result = await this.uploadFile(buffer, fileName, bucketName, {
      'Content-Type': 'application/x-ipynb+json',
      'X-Tenant-ID': tenantId,
      'X-File-Type': 'notebook'
    })

    this.logger.log(`Uploaded notebook: ${fileName} for tenant: ${tenantId}`)
    return result.url
  }

  /**
   * Upload attachment file
   */
  async uploadAttachment(buffer: Buffer, fileName: string, labTemplateId: string, tenantId: string): Promise<string> {
    const bucketName = this.config.getBucketOptions().attachments.name
    const objectPath = `${tenantId}/attachments/${labTemplateId}/${Date.now()}-${uuidv4()}-${fileName}`

    const result = await this.uploadFile(buffer, fileName, bucketName, {
      'Content-Type': this.getMimeType(fileName),
      'X-Tenant-ID': tenantId,
      'X-Template-ID': labTemplateId,
      'X-File-Type': 'attachment'
    })

    this.logger.log(`Uploaded attachment: ${fileName} for template: ${labTemplateId}`)
    return result.url
  }

  /**
   * Upload preview file
   */
  async uploadPreview(buffer: Buffer, objectPath: string, tenantId: string): Promise<string> {
    const bucketName = this.config.getBucketOptions().previews.name
    const fullPath = `${tenantId}/previews/${objectPath}`

    const result = await this.uploadFile(buffer, objectPath.split('/').pop() || 'preview', bucketName, {
      'Content-Type': this.getPreviewMimeType(objectPath),
      'X-Tenant-ID': tenantId,
      'X-File-Type': 'preview'
    })

    this.logger.log(`Uploaded preview: ${objectPath} for tenant: ${tenantId}`)
    return result.url
  }

  /**
   * Download file from storage
   */
  async downloadFile(url: string): Promise<Buffer> {
    try {
      // Extract bucket and object name from URL
      const { bucketName, objectName } = this.parseUrl(url)

      const stream = await this.minioClient.getObject(bucketName, objectName)
      const chunks: Buffer[] = []

      return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => {
          chunks.push(chunk)
        })

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks)
          resolve(buffer)
        })

        stream.on('error', (error) => {
          reject(error)
        })
      })
    } catch (error) {
      this.logger.error(`Failed to download file from ${url}:`, error)
      throw error
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const { bucketName, objectName } = this.parseUrl(url)
      await this.minioClient.removeObject(bucketName, objectName)
      this.logger.log(`Deleted file: ${objectName} from bucket: ${bucketName}`)
    } catch (error) {
      this.logger.error(`Failed to delete file ${url}:`, error)
      throw error
    }
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'json': 'application/json',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'py': 'text/x-python',
      'ipynb': 'application/x-ipynb+json',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip'
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  /**
   * Get MIME type for preview files
   */
  private getPreviewMimeType(objectPath: string): string {
    if (objectPath.endsWith('.html')) return 'text/html'
    if (objectPath.endsWith('.json')) return 'application/json'
    if (objectPath.endsWith('.svg')) return 'image/svg+xml'
    if (objectPath.endsWith('.png')) return 'image/png'
    return 'text/html'
  }

  /**
   * Parse URL to extract bucket and object name
   */
  private parseUrl(url: string): { bucketName: string; objectName: string } {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)

      // MinIO URLs typically have format: http://host/bucket/object/path
      if (pathParts.length >= 2) {
        return {
          bucketName: pathParts[0],
          objectName: pathParts.slice(1).join('/')
        }
      }

      throw new Error('Invalid URL format')
    } catch (error) {
      // If URL parsing fails, assume it's a presigned URL with query parameters
      const pathPart = url.split('?')[0]
      const pathParts = pathPart.split('/').filter(part => part.length > 0)

      if (pathParts.length >= 2) {
        return {
          bucketName: pathParts[0],
          objectName: pathParts.slice(1).join('/')
        }
      }

      throw new Error(`Unable to parse URL: ${url}`)
    }
  }
}