import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MinioConfig {
  constructor(private configService: ConfigService) {}

  getOptions() {
    return {
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: this.configService.get<number>('MINIO_PORT') || 9000,
      useSSL: this.configService.get<boolean>('MINIO_USE_SSL') || false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
      region: this.configService.get<string>('MINIO_REGION') || 'us-east-1',
    }
  }

  getBucketOptions() {
    return {
      templates: {
        name: this.configService.get<string>('MINIO_TEMPLATES_BUCKET') || 'lab-templates',
        policy: 'public-read',
        versioning: true,
        lifecycle: {
          rules: [
            {
              id: 'template-versions',
              status: 'Enabled',
              filter: { prefix: 'versions/' },
              noncurrentVersionTransitions: [
                {
                  noncurrentDays: 30,
                  storageClass: 'STANDARD_IA',
                },
                {
                  noncurrentDays: 90,
                  storageClass: 'GLACIER',
                },
              ],
            },
          ],
        },
      },
      artifacts: {
        name: this.configService.get<string>('MINIO_ARTIFACTS_BUCKET') || 'lab-artifacts',
        policy: 'private',
        versioning: true,
        lifecycle: {
          rules: [
            {
              id: 'artifact-retention',
              status: 'Enabled',
              expiration: { days: 365 }, // Keep artifacts for 1 year
            },
          ],
        },
      },
      previews: {
        name: this.configService.get<string>('MINIO_PREVIEWS_BUCKET') || 'lab-previews',
        policy: 'public-read',
        versioning: false,
        lifecycle: {
          rules: [
            {
              id: 'preview-cleanup',
              status: 'Enabled',
              expiration: { days: 30 }, // Keep previews for 30 days
            },
          ],
        },
      },
      temp: {
        name: this.configService.get<string>('MINIO_TEMP_BUCKET') || 'lab-temp',
        policy: 'private',
        versioning: false,
        lifecycle: {
          rules: [
            {
              id: 'temp-cleanup',
              status: 'Enabled',
              expiration: { days: 1 }, // Clean up temp files after 1 day
            },
          ],
        },
      },
    }
  }

  getUploadOptions() {
    return {
      maxFileSize: this.configService.get<number>('MAX_UPLOAD_SIZE') || 100 * 1024 * 1024, // 100MB
      allowedTypes: [
        'application/json',
        'application/x-ipynb+json',
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/svg+xml',
      ],
      allowedExtensions: ['.ipynb', '.json', '.md', '.txt', '.pdf', '.zip', '.png', '.jpg', '.jpeg', '.gif', '.svg'],
      tempDir: this.configService.get<string>('UPLOAD_TEMP_DIR') || '/tmp/lab-uploads',
    }
  }

  getPresignedUrlExpiry() {
    return {
      upload: this.configService.get<number>('PRESIGNED_UPLOAD_EXPIRY') || 3600, // 1 hour
      download: this.configService.get<number>('PRESIGNED_DOWNLOAD_EXPIRY') || 86400, // 24 hours
      preview: this.configService.get<number>('PRESIGNED_PREVIEW_EXPIRY') || 1800, // 30 minutes
    }
  }
}