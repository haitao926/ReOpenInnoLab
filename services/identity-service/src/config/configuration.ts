export default () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'identity_service',
    ssl: process.env.DATABASE_SSL === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DATABASE_MIGRATIONS_RUN === 'true',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'identity:',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'reopeninnolab',
    audience: process.env.JWT_AUDIENCE || 'reopeninnolab-users',
  },

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/api/v1/oauth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3002/api/v1/oauth/github/callback',
    },
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@reopeninnolab.org',
  },

  // 2FA
  twoFactorAuth: {
    issuer: process.env.TWOFA_ISSUER || 'ReOpenInnoLab',
    secretLength: parseInt(process.env.TWOFA_SECRET_LENGTH, 10) || 32,
    window: parseInt(process.env.TWOFA_WINDOW, 10) || 2,
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: process.env.UPLOAD_ALLOWED_MIME_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    destination: process.env.UPLOAD_DESTINATION || './uploads',
  },

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  webUrl: process.env.WEB_URL || 'http://localhost:3001',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    passwordMaxLength: parseInt(process.env.PASSWORD_MAX_LENGTH, 10) || 128,
    accountLockoutThreshold: parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD, 10) || 5,
    accountLockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION, 10) || 15 * 60, // 15 minutes
  },

  // Monitoring
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics',
  },
})