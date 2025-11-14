export default () => ({
  port: parseInt(process.env.PORT, 10) || 3003,
  wsPort: parseInt(process.env.WS_PORT, 10) || 3004,

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'reopeninnolab_classroom',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  cors: {
    origins: process.env.WS_CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  },

  services: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    courseService: process.env.COURSE_SERVICE_URL || 'http://localhost:3001',
    identityService: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002',
  },
});