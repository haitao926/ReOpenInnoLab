export default () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'reopenlab',
    password: process.env.DATABASE_PASSWORD || 'reopenlab_dev_password',
    database: process.env.DATABASE_NAME || 'reopenlab_dev',
    ssl: process.env.DATABASE_SSL === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'false',
    migrationsRun: process.env.DATABASE_MIGRATIONS_RUN === 'false'
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'reopenlab_redis_password',
    db: parseInt(process.env.REDIS_DB || '1', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'course:'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: process.env.JWT_ISSUER || 'reopeninnolab',
    audience: process.env.JWT_AUDIENCE || 'reopeninnolab-users'
  },

  // File Storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3: {
      bucket: process.env.S3_BUCKET || 'reopenlab-course-files',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10)
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },

  // Course Settings
  course: {
    maxFileSize: parseInt(process.env.COURSE_MAX_FILE_SIZE || '104857600', 10), // 100MB
    allowedFileTypes: process.env.COURSE_ALLOWED_FILE_TYPES?.split(',') || [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'
    ],
    defaultVersionPrefix: process.env.COURSE_DEFAULT_VERSION_PREFIX || 'v',
    maxModulesPerCourse: parseInt(process.env.COURSE_MAX_MODULES_PER_COURSE || '100', 10),
    maxActivitiesPerModule: parseInt(process.env.COURSE_MAX_ACTIVITIES_PER_MODULE || '50', 10)
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Monitoring
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics'
  }
})