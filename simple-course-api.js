const http = require('http');

// 模拟课程数据
const mockCourses = [
  {
    id: '1',
    title: 'AI创意编程工作坊',
    description: '学习AI编程的基础知识和创意实践',
    code: 'AI_PROGRAMMING_101',
    subject: 'ai',
    gradeBand: 'grade9',
    status: 'PUBLISHED',
    thumbnail: null,
    metadata: {},
    tenantId: 'tenant-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    enrolledCount: 25,
    maxStudents: 30,
    progress: 75,
    teacher: '陈老师'
  },
  {
    id: '2',
    title: 'AI数据洞察实验',
    description: '通过AI进行数据分析和洞察发现',
    code: 'AI_DATA_INSIGHTS',
    subject: 'ai',
    gradeBand: 'grade10',
    status: 'DRAFT',
    thumbnail: null,
    metadata: {},
    tenantId: 'tenant-1',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    enrolledCount: 18,
    maxStudents: 25,
    progress: 45,
    teacher: '王老师'
  },
  {
    id: '3',
    title: 'AI视觉巡线项目',
    description: '学习计算机视觉和巡线机器人开发',
    code: 'AI_VISION_LINE',
    subject: 'ai',
    gradeBand: 'grade11',
    status: 'PUBLISHED',
    thumbnail: null,
    metadata: {},
    tenantId: 'tenant-1',
    createdAt: '2024-01-13T09:20:00Z',
    updatedAt: '2024-01-13T09:20:00Z',
    enrolledCount: 12,
    maxStudents: 20,
    progress: 60,
    teacher: '李老师'
  }
];

// 解析URL查询参数
function parseQuery(url) {
  const query = {};
  const queryStr = url.split('?')[1];
  if (queryStr) {
    queryStr.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
  }
  return query;
}

// 发送JSON响应
function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// 处理CORS预检请求
function handleCors(res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end();
}

// 路由处理
const router = {
  'GET /api/v1/courses': (req, res, query) => {
    console.log('GET /api/v1/courses', query);
    const { page = 1, limit = 10, status, subject, gradeBand, search } = query;

    let filteredCourses = [...mockCourses];

    // 应用筛选
    if (status) {
      filteredCourses = filteredCourses.filter(course =>
        course.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (subject) {
      filteredCourses = filteredCourses.filter(course =>
        course.subject === subject
      );
    }

    if (gradeBand) {
      filteredCourses = filteredCourses.filter(course =>
        course.gradeBand === gradeBand
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCourses = filteredCourses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
      );
    }

    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    const response = {
      courses: paginatedCourses,
      total: filteredCourses.length,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    sendJson(res, response);
  },

  'GET /api/v1/courses/([^/]+)': (req, res, query, matches) => {
    console.log('GET /api/v1/courses/:id', matches[1]);
    const courseId = matches[1];
    const course = mockCourses.find(c => c.id === courseId);

    if (!course) {
      return sendJson(res, { error: '课程不存在' }, 404);
    }

    sendJson(res, course);
  },

  'GET /health': (req, res) => {
    sendJson(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      courses: mockCourses.length
    });
  }
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;
  const query = parseQuery(url);

  console.log(`${method} ${url}`);

  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    return handleCors(res);
  }

  // 路由匹配
  let handled = false;
  for (const [route, handler] of Object.entries(router)) {
    const [routeMethod, routePath] = route.split(' ');
    if (method === routeMethod) {
      const regex = new RegExp('^' + routePath.replace(/\\/g, '\\/') + '$');
      const matches = url.match(regex);
      if (matches) {
        handler(req, res, query, matches);
        handled = true;
        break;
      }
    }
  }

  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Simple Course API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Courses API: http://localhost:${PORT}/api/v1/courses`);
  console.log(`Available courses: ${mockCourses.length}`);
});