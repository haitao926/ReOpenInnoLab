const http = require('http');
const url = require('url');

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

const PORT = 8080;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Mock user data
const mockUsers = [
  {
    id: 'user_1',
    email: 'teacher@reopenlab.dev',
    name: '张老师',
    role: 'teacher',
    subjects: ['数学', '物理']
  },
  {
    id: 'user_2',
    email: 'admin@reopenlab.dev',
    name: '管理员',
    role: 'admin',
    subjects: []
  }
];

// Mock subjects data
const mockSubjects = [
  '数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治',
  '信息技术', '艺术', '音乐', '体育', '科学', '思想品德'
];

// CORS middleware
const addCorsHeaders = (req, res, origin) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:5173'
  ];

  // Always set these headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-request-id, X-Request-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  // Set origin header if it's in the allowed list
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // If no origin header (like curl), set a default
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
};

// Send JSON response
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Parse request body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Handle routes
const handleRequest = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const origin = req.headers.origin;

  // Add CORS headers
  addCorsHeaders(req, res, origin);

  // Handle OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    // Login endpoint
    if (path === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      console.log('Login attempt:', { email, password });

      // Find user
      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        sendJson(res, 401, {
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }

      // For demo, accept any password for mock users
      if (password.length < 1) {
        sendJson(res, 401, {
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { sub: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      sendJson(res, 200, {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roleType: user.role, // 前端期望 roleType 字段
            role: user.role,    // 保留 role 字段
            subjects: user.subjects,
            permissions: []     // 添加权限字段
          },
          accessToken,
          refreshToken,
          expiresIn: 86400
        },
        message: '登录成功'
      });
      return;
    }

    // Register endpoint
    if (path === '/api/v1/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password, name } = body;

      // Check if user exists
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        sendJson(res, 400, {
          success: false,
          message: '用户已存在'
        });
        return;
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        role: 'teacher',
        subjects: []
      };

      mockUsers.push(newUser);

      // Generate tokens
      const accessToken = jwt.sign(
        {
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { sub: newUser.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      sendJson(res, 201, {
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            roleType: newUser.role, // 前端期望 roleType 字段
            role: newUser.role,    // 保留 role 字段
            subjects: newUser.subjects,
            permissions: []     // 添加权限字段
          },
          accessToken,
          refreshToken,
          expiresIn: 86400
        },
        message: '注册成功'
      });
      return;
    }

    // Subjects endpoint
    if (path === '/api/v1/subjects/teacher/me' && method === 'GET') {
      // 将字符串数组转换为对象数组
      const subjectsObjects = mockSubjects.map((subject, index) => ({
        id: subject,
        name: subject,
        code: subject,
        description: `${subject}教学`,
        icon: 'subject',
        color: '#409EFF',
        order: index
      }));

      sendJson(res, 200, {
        success: true,
        data: {
          subjects: subjectsObjects,
          defaultSubject: 'my-subjects'
        },
        message: '获取学科列表成功'
      });
      return;
    }

    // Subject recommendations endpoint
    if (path === '/api/v1/subjects/recommendations/me' && method === 'GET') {
      const limit = parseInt(parsedUrl.query.limit) || 5;
      const recommendations = mockSubjects.slice(0, limit);

      // 将字符串数组转换为对象数组
      const recommendationsObjects = recommendations.map((subject, index) => ({
        id: subject,
        name: subject,
        code: subject,
        description: `${subject}教学推荐`,
        icon: 'recommendation',
        color: '#67C23A',
        order: index,
        score: Math.floor(Math.random() * 100) + 1
      }));

      sendJson(res, 200, {
        success: true,
        data: recommendationsObjects,
        message: '获取学科推荐成功'
      });
      return;
    }

    // Refresh token endpoint
    if (path === '/api/v1/auth/refresh' && method === 'POST') {
      const body = await parseBody(req);
      const { refreshToken } = body;

      if (!refreshToken) {
        sendJson(res, 401, {
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      try {
        // Verify refresh token (simplified)
        const payload = jwt.verify(refreshToken, JWT_SECRET);
        const user = mockUsers.find(u => u.id === payload.sub);

        if (!user) {
          sendJson(res, 401, {
            success: false,
            message: 'Invalid refresh token'
          });
          return;
        }

        // Generate new access token
        const accessToken = jwt.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        sendJson(res, 200, {
          success: true,
          data: {
            accessToken,
            expiresIn: 86400
          },
          message: 'Token refreshed successfully'
        });
        return;
      } catch (error) {
        sendJson(res, 401, {
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }
    }

    // Profile endpoint - 获取用户信息
    if (path === '/api/v1/auth/profile' && method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJson(res, 401, {
          success: false,
          message: '未提供有效的认证令牌'
        });
        return;
      }

      const token = authHeader.substring(7);
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = mockUsers.find(u => u.id === payload.sub);

        if (!user) {
          sendJson(res, 401, {
            success: false,
            message: '用户不存在'
          });
          return;
        }

        sendJson(res, 200, {
          success: true,
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            roleType: user.role,
            role: user.role,
            subjects: user.subjects,
            permissions: user.permissions || []
          },
          message: '获取用户信息成功'
        });
        return;
      } catch (error) {
        sendJson(res, 401, {
          success: false,
          message: '无效的认证令牌'
        });
        return;
      }
    }

    // Logout endpoint
    if (path === '/api/v1/auth/logout' && method === 'POST') {
      sendJson(res, 200, {
        success: true,
        message: '退出登录成功'
      });
      return;
    }

    // 404 handler
    sendJson(res, 404, {
      success: false,
      message: '接口不存在'
    });

  } catch (error) {
    console.error('API Error:', error);
    sendJson(res, 500, {
      success: false,
      message: '服务器内部错误'
    });
  }
};

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Development API Server running on: http://localhost:${PORT}`);
  console.log(`📋 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`👤 Test Users:`);
  console.log(`   - teacher@reopenlab.dev (any password)`);
  console.log(`   - admin@reopenlab.dev (any password)`);
});

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