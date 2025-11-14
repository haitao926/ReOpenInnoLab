const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const PORT = 3002;
const DB_FILE = path.join(__dirname, 'database.json');

// Database operations
const database = {
  async load() {
    try {
      const data = await fs.readFile(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Initialize with default data if file doesn't exist
      const defaultData = {
        users: [],
        sessions: [],
        refreshTokens: []
      };
      await this.save(defaultData);
      return defaultData;
    }
  },

  async save(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  },

  async findUserByEmail(email) {
    const data = await this.load();
    return data.users.find(user => user.email === email);
  },

  async findUserById(id) {
    const data = await this.load();
    return data.users.find(user => user.id === id);
  },

  async createUser(userData) {
    const data = await this.load();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      password: hashedPassword,
      name: userData.name || userData.email.split('@')[0],
      roleType: userData.roleType || 'user',
      tenantId: userData.tenantId || 'default-tenant',
      permissions: userData.permissions || [],
      status: userData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    data.users.push(newUser);
    await this.save(data);
    return newUser;
  },

  async updateUserLastLogin(userId) {
    const data = await this.load();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      await this.save(data);
    }
  },

  async saveRefreshToken(tokenData) {
    const data = await this.load();
    data.refreshTokens.push({
      ...tokenData,
      createdAt: new Date().toISOString()
    });
    await this.save(data);
  },

  async findRefreshToken(token) {
    const data = await this.load();
    return data.refreshTokens.find(rt => rt.token === token && rt.isActive);
  },

  async revokeRefreshToken(token) {
    const data = await this.load();
    const rt = data.refreshTokens.find(rt => rt.token === token);
    if (rt) {
      rt.isActive = false;
      rt.revokedAt = new Date().toISOString();
      await this.save(data);
    }
  }
};

// Initialize database with admin user if empty
async function initializeDatabase() {
  const data = await database.load();

  if (data.users.length === 0) {
    console.log('Initializing database with admin user...');
    await database.createUser({
      email: 'admin@reopenlab.dev',
      password: 'admin123',
      name: 'Admin User',
      roleType: 'admin',
      permissions: ['read', 'write', 'admin']
    });
    console.log('Database initialized successfully!');
  }
}

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

// CORS headers
const setCorsHeaders = (res, origin) => {
  if (['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:3003', 'http://localhost:3004'].includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-request-id, X-Request-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
};

// Parse JSON body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
};

// Request handler
const requestHandler = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;
  const origin = req.headers.origin;

  console.log(`${method} ${path} - Origin: ${origin}`);

  // Set CORS headers for all requests
  setCorsHeaders(res, origin);

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health check
    if (path === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Login endpoint
    if (path === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      console.log(`=== LOGIN ATTEMPT ===`);
      console.log(`Email: ${email}, Password: ${password ? '[REDACTED]' : 'undefined'}`);
      console.log('Request body:', JSON.stringify(body));
      console.log('User-Agent:', req.headers['user-agent']);
      console.log('Referer:', req.headers.referer);
      console.log('=====================');

      // Validate input
      if (!email || !password || email === 'undefined' || password === 'undefined') {
        res.writeHead(400);
        res.end(JSON.stringify({ message: '邮箱和密码不能为空' }));
        return;
      }

      try {
        // Database authentication
        const user = await database.findUserByEmail(email);

        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ message: '邮箱或密码错误' }));
          return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          res.writeHead(401);
          res.end(JSON.stringify({ message: '邮箱或密码错误' }));
          return;
        }

        if (user.status !== 'active') {
          res.writeHead(403);
          res.end(JSON.stringify({ message: '账户已被禁用，请联系管理员' }));
          return;
        }

        // Create tokens
        const accessToken = jwt.sign(
          { sub: user.id, email: user.email, type: 'access' },
          'JWT_SECRET',
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { sub: user.id, email: user.email, type: 'refresh' },
          'JWT_REFRESH_SECRET',
          { expiresIn: '7d' }
        );

        // Save refresh token to database
        await database.saveRefreshToken({
          token: refreshToken,
          userId: user.id,
          isActive: true
        });

        // Update user last login
        await database.updateUserLastLogin(user.id);

        // Return user data without password
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          roleType: user.roleType,
          tenantId: user.tenantId,
          permissions: user.permissions,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        };

        console.log(`User ${email} logged in successfully`);

        res.writeHead(200);
        res.end(JSON.stringify({
          user: userResponse,
          accessToken,
          refreshToken,
          expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
        }));
        return;
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ message: '服务器内部错误' }));
        return;
      }
    }

    // Refresh token endpoint
    if (path === '/api/v1/auth/refresh' && method === 'POST') {
      const body = await parseBody(req);
      const { refreshToken } = body;

      console.log(`=== REFRESH TOKEN ATTEMPT ===`);
      console.log('Refresh Token:', refreshToken ? '[PRESENT]' : 'undefined');
      console.log('Request body:', JSON.stringify(body));
      console.log('User-Agent:', req.headers['user-agent']);
      console.log('Referer:', req.headers.referer);
      console.log('=============================');

      if (!refreshToken || refreshToken === 'undefined') {
        res.writeHead(401);
        res.end(JSON.stringify({ message: 'Refresh token is required' }));
        return;
      }

      try {
        // Verify JWT token first
        const payload = jwt.verify(refreshToken, 'JWT_REFRESH_SECRET');

        if (payload.type !== 'refresh') {
          res.writeHead(401);
          res.end(JSON.stringify({ message: 'Invalid token type' }));
          return;
        }

        // Check if refresh token exists in database and is active
        const storedToken = await database.findRefreshToken(refreshToken);
        if (!storedToken) {
          res.writeHead(401);
          res.end(JSON.stringify({ message: 'Refresh token not found or revoked' }));
          return;
        }

        // Get user from database
        const user = await database.findUserById(payload.sub);
        if (!user || user.status !== 'active') {
          // Revoke the refresh token if user doesn't exist or is inactive
          await database.revokeRefreshToken(refreshToken);
          res.writeHead(401);
          res.end(JSON.stringify({ message: 'User not found or inactive' }));
          return;
        }

        // Create new tokens
        const accessToken = jwt.sign(
          { sub: user.id, email: user.email, type: 'access' },
          'JWT_SECRET',
          { expiresIn: '1h' }
        );

        const newRefreshToken = jwt.sign(
          { sub: user.id, email: user.email, type: 'refresh' },
          'JWT_REFRESH_SECRET',
          { expiresIn: '7d' }
        );

        // Save new refresh token and revoke old one
        await database.saveRefreshToken({
          token: newRefreshToken,
          userId: user.id,
          isActive: true
        });
        await database.revokeRefreshToken(refreshToken);

        // Return user data without password
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          roleType: user.roleType,
          tenantId: user.tenantId,
          permissions: user.permissions,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        };

        res.writeHead(200);
        res.end(JSON.stringify({
          user: userResponse,
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: new Date(Date.now() + 3600 * 1000), // 1 hour
        }));
        return;
      } catch (error) {
        console.error('Refresh token error:', error);
        res.writeHead(401);
        res.end(JSON.stringify({ message: 'Invalid refresh token' }));
        return;
      }
    }

    // Register endpoint
    if (path === '/api/v1/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password, name, roleType } = body;

      console.log(`=== REGISTER ATTEMPT ===`);
      console.log(`Email: ${email}, Name: ${name}, Role: ${roleType}`);

      // Validate input
      if (!email || !password || email === 'undefined' || password === 'undefined') {
        res.writeHead(400);
        res.end(JSON.stringify({ message: '邮箱和密码不能为空' }));
        return;
      }

      if (!email.includes('@') || email.length < 5) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: '请输入有效的邮箱地址' }));
        return;
      }

      if (password.length < 6) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: '密码至少需要6个字符' }));
        return;
      }

      try {
        // Check if user already exists
        const existingUser = await database.findUserByEmail(email);
        if (existingUser) {
          res.writeHead(409);
          res.end(JSON.stringify({ message: '该邮箱已被注册' }));
          return;
        }

        // Create new user
        const newUser = await database.createUser({
          email,
          password,
          name: name || email.split('@')[0],
          roleType: roleType || 'user',
          permissions: roleType === 'teacher' ? ['read', 'write'] : ['read']
        });

        // Remove password from response
        const userResponse = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          roleType: newUser.roleType,
          tenantId: newUser.tenantId,
          permissions: newUser.permissions,
          status: newUser.status,
          createdAt: newUser.createdAt
        };

        console.log(`User ${email} registered successfully`);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: '注册成功',
          user: userResponse,
          timestamp: new Date().toISOString()
        }));
        return;
      } catch (error) {
        console.error('Registration error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ message: '服务器内部错误' }));
        return;
      }
    }

    // Profile endpoint
    if (path === '/api/v1/auth/profile' && method === 'GET') {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Verify JWT token
          const payload = jwt.verify(token, 'JWT_SECRET');

          if (payload.type !== 'access') {
            res.writeHead(401);
            res.end(JSON.stringify({
              success: false,
              message: 'Invalid token type',
              timestamp: new Date().toISOString(),
            }));
            return;
          }

          // Get user from database
          const user = await database.findUserById(payload.sub);
          if (!user || user.status !== 'active') {
            res.writeHead(401);
            res.end(JSON.stringify({
              success: false,
              message: 'User not found or inactive',
              timestamp: new Date().toISOString(),
            }));
            return;
          }

          // Return user data without password
          const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.name.split(' ')[0] || user.name,
            lastName: user.name.split(' ')[1] || '',
            avatar: user.avatar || `https://via.placeholder.com/100x100.png?text=${user.name.charAt(0).toUpperCase()}`,
            roleType: user.roleType,
            tenantId: user.tenantId,
            permissions: user.permissions,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };

          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: userResponse,
            timestamp: new Date().toISOString(),
          }));
          return;
        } catch (error) {
          console.error('Profile token verification error:', error);
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid token',
            timestamp: new Date().toISOString(),
          }));
          return;
        }
      } else {
        // No token provided
        res.writeHead(401);
        res.end(JSON.stringify({
          success: false,
          message: 'Authorization token required',
          timestamp: new Date().toISOString(),
        }));
        return;
      }
    }

    // Mock subjects endpoints
    if (path === '/api/v1/subjects/teacher/me' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        data: [
          { id: '1', name: '数学', code: 'MATH', level: 'high_school' },
          { id: '2', name: '物理', code: 'PHYS', level: 'high_school' },
          { id: '3', name: '化学', code: 'CHEM', level: 'high_school' },
        ],
        success: true,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    if (path === '/api/v1/subjects/recommendations/me' && method === 'GET') {
      const limit = parsedUrl.query.limit || '5';
      res.writeHead(200);
      res.end(JSON.stringify({
        data: [
          { id: '1', name: '数学', code: 'MATH', level: 'high_school' },
          { id: '4', name: '生物', code: 'BIO', level: 'high_school' },
        ].slice(0, parseInt(limit)),
        success: true,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // 404 for unknown endpoints
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      message: '接口未找到',
      timestamp: new Date().toISOString(),
    }));

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      message: '服务器内部错误',
      timestamp: new Date().toISOString(),
    }));
  }
};

// Create and start server
const server = http.createServer(requestHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Identity Service is running on: http://localhost:${PORT}`);
      console.log(`💾 Database: ${DB_FILE}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📝 API Endpoints:`);
      console.log(`   POST /api/v1/auth/register - Register new user`);
      console.log(`   POST /api/v1/auth/login - Login (admin@reopenlab.dev / admin123)`);
      console.log(`   GET /api/v1/auth/profile - Get user profile`);
      console.log(`   POST /api/v1/auth/refresh - Refresh token`);
      console.log(`   GET /api/v1/subjects/teacher/me - Get teacher subjects`);
      console.log(`   GET /api/v1/subjects/recommendations/me - Get subject recommendations`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});