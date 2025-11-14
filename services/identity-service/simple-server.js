const express = require('express');

// Simple JWT signing functions
const jwt = {
  sign: (payload, secret, options) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
    const signature = Buffer.from('simple-signature').toString('base64url');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },
  verify: (token, secret) => {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  }
};

// Simple CORS middleware
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  if (['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'].includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  next();
};

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = 'your-super-secret-refresh-key-change-in-production';

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  console.log(`Login attempt for email: ${email} from IP: ${req.ip}`);

  // Mock authentication - accept admin@reopenlab.dev / admin123
  if (email === 'admin@reopenlab.dev' && password === 'admin123') {
    const user = {
      id: 'admin-user-id',
      email: 'admin@reopenlab.dev',
      name: 'Admin User',
      roleType: 'admin',
      tenantId: 'default-tenant',
      permissions: ['read', 'write', 'admin'],
    };

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, type: 'access' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, email: user.email, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`User ${email} logged in successfully`);

    res.json({
      user,
      accessToken,
      refreshToken,
      expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
    });
  } else {
    res.status(401).json({ message: '邮箱或密码错误' });
  }
});

// Refresh token endpoint
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    if (payload.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      name: 'Admin User',
      roleType: 'admin',
      tenantId: 'default-tenant',
      permissions: ['read', 'write', 'admin'],
    };

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, type: 'access' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.id, email: user.email, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Mock subjects endpoints for other requests
app.get('/api/v1/subjects/teacher/me', (req, res) => {
  res.json({
    data: [
      { id: '1', name: '数学', code: 'MATH', level: 'high_school' },
      { id: '2', name: '物理', code: 'PHYS', level: 'high_school' },
      { id: '3', name: '化学', code: 'CHEM', level: 'high_school' },
    ],
    success: true,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/subjects/recommendations/me', (req, res) => {
  res.json({
    data: [
      { id: '1', name: '数学', code: 'MATH', level: 'high_school' },
      { id: '4', name: '生物', code: 'BIO', level: 'high_school' },
    ],
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口未找到',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Identity Service is running on: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📝 API Endpoints:`);
  console.log(`   POST /api/v1/auth/login - Login`);
  console.log(`   POST /api/v1/auth/refresh - Refresh token`);
  console.log(`   GET /api/v1/subjects/teacher/me - Get teacher subjects`);
  console.log(`   GET /api/v1/subjects/recommendations/me - Get subject recommendations`);
});