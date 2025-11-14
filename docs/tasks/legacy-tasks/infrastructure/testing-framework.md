# 测试框架搭建任务

**优先级**: 🔴 高
**预估工作量**: 2-3周
**影响范围**: 整个项目
**当前状态**: 仅有手写测试脚本

---

## 📋 任务描述

建立完整的测试体系，包括单元测试、集成测试、端到端测试，确保代码质量和功能稳定性，替换现有的手写测试脚本。

## 🎯 验收标准

### 测试覆盖验收
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖核心业务流程
- [ ] E2E 测试覆盖主要用户路径
- [ ] API 契约测试保证接口稳定性
- [ ] 性能测试验证系统负载能力

### CI/CD 集成验收
- [ ] 测试自动运行在 CI/CD 流水线
- [ ] 测试报告自动生成和通知
- [ ] 覆盖率门禁机制
- [ ] 测试失败时阻止部署

## 🔧 技术实现要点

### 1. 单元测试框架 (Vitest)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

### 2. Vue 组件测试
```typescript
// test/components/CourseCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CourseCard from '@/components/CourseCard.vue'
import type { Course } from '@/types/course'

describe('CourseCard', () => {
  const mockCourse: Course = {
    id: '1',
    title: 'Test Course',
    description: 'Test Description',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  it('renders course information correctly', () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    expect(wrapper.find('.course-title').text()).toBe(mockCourse.title)
    expect(wrapper.find('.course-description').text()).toBe(mockCourse.description)
  })

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    await wrapper.find('.edit-button').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0]).toEqual([mockCourse])
  })

  it('shows correct status badge', () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    const statusBadge = wrapper.find('.status-badge')
    expect(statusBadge.classes()).toContain('status-active')
  })
})
```

### 3. API 服务测试
```typescript
// test/services/courseService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { courseService } from '@/services/courseService'
import { apiClient } from '@/api'

// Mock API client
vi.mock('@/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('CourseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCourses', () => {
    it('should fetch courses successfully', async () => {
      const mockResponse = {
        courses: [
          { id: '1', title: 'Course 1' },
          { id: '2', title: 'Course 2' }
        ],
        total: 2
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await courseService.getCourses()

      expect(apiClient.get).toHaveBeenCalledWith('/courses')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      vi.mocked(apiClient.get).mockRejectedValue(error)

      await expect(courseService.getCourses()).rejects.toThrow('API Error')
    })
  })
})
```

### 4. E2E 测试 (Playwright)
```typescript
// test/e2e/course-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Course Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login')
    await page.fill('[data-testid=username]', 'teacher@test.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-button]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create a new course', async ({ page }) => {
    await page.goto('/courses')
    await page.click('[data-testid=create-course-button]')

    // 填写课程信息
    await page.fill('[data-testid=course-title]', 'New Test Course')
    await page.fill('[data-testid=course-description]', 'This is a test course')
    await page.selectOption('[data-testid=course-category]', 'Mathematics')

    // 提交表单
    await page.click('[data-testid=submit-button]')

    // 验证课程创建成功
    await expect(page.locator('[data-testid=success-message]')).toBeVisible()
    await expect(page.locator('text=New Test Course')).toBeVisible()
  })

  test('should edit an existing course', async ({ page }) => {
    await page.goto('/courses')

    // 点击第一个课程的编辑按钮
    await page.click('[data-testid=edit-course-button]:first-child')

    // 修改课程信息
    await page.fill('[data-testid=course-title]', 'Updated Course Title')
    await page.click('[data-testid=save-button]')

    // 验证更新成功
    await expect(page.locator('text=Updated Course Title')).toBeVisible()
  })
})
```

### 5. API 契约测试
```typescript
// test/contract/course-api.spec.ts
import { pactWith } from 'jest-pact'
import { Matchers } from '@pact-foundation/pact'
import { courseApi } from '@/api/course'

pactWith({ consumer: 'web-teacher', provider: 'course-service' }, provider => {
  describe('Course API', () => {
    beforeEach('setup interactions', () => {
      provider.uponReceiving('a request for courses')
        .withRequest({
          method: 'GET',
          path: '/courses',
          headers: {
            Authorization: Matchers.like('Bearer token')
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: {
            courses: Matchers.eachLike({
              id: Matchers.string('1'),
              title: Matchers.string('Course Title'),
              description: Matchers.string('Description'),
              status: Matchers.like('active')
            }),
            total: Matchers.integer(1)
          }
        })
    })

    it('should return courses list', async () => {
      const courses = await courseApi.getCourses()
      expect(courses.courses).toBeDefined()
      expect(courses.total).toBeGreaterThan(0)
    })
  })
})
```

## 📁 文件结构规划

```
test/
├── setup.ts                    # 测试环境配置
├── components/                 # Vue 组件测试
│   ├── common/
│   ├── course/
│   └── layout/
├── services/                   # 服务层测试
│   ├── auth.service.test.ts
│   ├── course.service.test.ts
│   └── websocket.service.test.ts
├── stores/                     # 状态管理测试
│   ├── user.store.test.ts
│   └── course.store.test.ts
├── utils/                      # 工具函数测试
│   ├── date.util.test.ts
│   └── validation.util.test.ts
├── e2e/                        # 端到端测试
│   ├── auth.spec.ts
│   ├── course-management.spec.ts
│   ├── classroom.spec.ts
│   └── assignment.spec.ts
├── integration/                # 集成测试
│   ├── api.integration.test.ts
│   └── websocket.integration.test.ts
├── contract/                   # 契约测试
│   ├── course-api.spec.ts
│   └── auth-api.spec.ts
├── performance/                # 性能测试
│   ├── load-testing.spec.ts
│   └── stress-testing.spec.ts
└── fixtures/                   # 测试数据
    ├── courses.json
    ├── users.json
    └── mock-responses.json
```

## 🧪 测试配置

### 1. package.json 脚本
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:contract": "jest --testPathPattern=test/contract",
    "test:performance": "k6 run test/performance/load-testing.js"
  }
}
```

### 2. GitHub Actions 配置
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

## 📝 开发步骤

### Week 1: 基础框架
1. 配置 Vitest 测试环境
2. 编写测试工具函数和 fixtures
3. 为现有组件编写单元测试
4. 配置测试覆盖率报告

### Week 2: 服务和集成测试
1. 编写 API 服务单元测试
2. 实现状态管理测试
3. 配置 Mock Service Worker
4. 编写集成测试用例

### Week 3: E2E 和自动化
1. 配置 Playwright E2E 测试
2. 编写核心用户流程测试
3. 配置 CI/CD 自动化测试
4. 实现契约测试

## 🚨 风险与注意事项

1. **测试维护成本**: 需要持续维护测试用例
2. **测试稳定性**: E2E 测试可能因为网络等因素不稳定
3. **性能影响**: 完整测试套件可能运行时间较长
4. **Mock 数据管理**: 需要维护测试数据的一致性

## 📚 参考资料

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 文档](https://test-utils.vuejs.org/)
- [Playwright 文档](https://playwright.dev/)
- [Jest Pact 文档](https://pact-foundation.github.io/pact-js/v5/)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-11-29
**当前状态**: 🔄 未开始