const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

// 课程列表API
app.get('/api/v1/courses', (req, res) => {
  console.log('GET /api/v1/courses', req.query);
  const { page = 1, limit = 10, status, subject, gradeBand, search } = req.query;

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
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  res.json({
    courses: paginatedCourses,
    total: filteredCourses.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// 获取单个课程
app.get('/api/v1/courses/:id', (req, res) => {
  console.log('GET /api/v1/courses/:id', req.params.id);
  const course = mockCourses.find(c => c.id === req.params.id);

  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  res.json(course);
});

// 创建课程
app.post('/api/v1/courses', (req, res) => {
  console.log('POST /api/v1/courses', req.body);
  const newCourse = {
    id: (mockCourses.length + 1).toString(),
    ...req.body,
    status: 'DRAFT',
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    enrolledCount: 0
  };

  mockCourses.push(newCourse);
  res.status(201).json(newCourse);
});

// 更新课程
app.put('/api/v1/courses/:id', (req, res) => {
  console.log('PUT /api/v1/courses/:id', req.params.id, req.body);
  const courseIndex = mockCourses.findIndex(c => c.id === req.params.id);

  if (courseIndex === -1) {
    return res.status(404).json({ error: '课程不存在' });
  }

  mockCourses[courseIndex] = {
    ...mockCourses[courseIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(mockCourses[courseIndex]);
});

// 删除课程
app.delete('/api/v1/courses/:id', (req, res) => {
  console.log('DELETE /api/v1/courses/:id', req.params.id);
  const courseIndex = mockCourses.findIndex(c => c.id === req.params.id);

  if (courseIndex === -1) {
    return res.status(404).json({ error: '课程不存在' });
  }

  mockCourses.splice(courseIndex, 1);
  res.status(204).send();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Mock Course API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Courses API: http://localhost:${PORT}/api/v1/courses`);
});