# Mock 数据替换任务

**优先级**: 🔴 高
**预估工作量**: 2-3周
**影响范围**: apps/web-teacher/, apps/web-student/
**当前状态**: 大量功能使用 mock 数据

---

## 📋 任务描述

将前端应用中的 mock 数据替换为真实 API 调用，建立统一的数据获取和状态管理体系，确保前端功能与后端服务正确集成。

## 🎯 验收标准

### API 集成验收
- [ ] 所有列表页面从真实 API 获取数据
- [ ] CRUD 操作与后端 API 正确交互
- [ ] 错误处理和用户反馈完善
- [ ] 加载状态和骨架屏实现
- [ ] 数据缓存和更新机制

### 用户体验验收
- [ ] 页面加载时间 < 2秒
- [ ] 网络异常时有友好提示
- [ ] 操作失败时有明确错误信息
- [ ] 数据更新后界面自动刷新
- [ ] 离线时显示缓存数据

## 🔧 技术实现要点

### 1. 统一 API 客户端
```typescript
// apps/web-teacher/src/api/index.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证头
    this.instance.interceptors.request.use((config) => {
      const userStore = useUserStore()
      if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`
      }
      return config
    })

    // 响应拦截器 - 统一错误处理
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // 处理认证失败
          const userStore = useUserStore()
          userStore.logout()
          router.push('/login')
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

export const apiClient = new ApiClient()
```

### 2. 替换课程管理 API
```typescript
// apps/web-teacher/src/api/course.ts
import { apiClient } from './index'
import type { Course, CourseCreateData, CourseUpdateData } from '@/types/course'

export const courseApi = {
  // 获取课程列表
  async getCourses(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ courses: Course[], total: number }> {
    return apiClient.get('/courses', { params })
  },

  // 创建课程
  async createCourse(data: CourseCreateData): Promise<Course> {
    return apiClient.post('/courses', data)
  },

  // 更新课程
  async updateCourse(id: string, data: CourseUpdateData): Promise<Course> {
    return apiClient.put(`/courses/${id}`, data)
  },

  // 删除课程
  async deleteCourse(id: string): Promise<void> {
    return apiClient.delete(`/courses/${id}`)
  },

  // 获取课程详情
  async getCourse(id: string): Promise<Course> {
    return apiClient.get(`/courses/${id}`)
  }
}
```

### 3. 更新 Store 状态管理
```typescript
// apps/web-teacher/src/stores/course.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { courseApi } from '@/api/course'
import type { Course, CourseCreateData, CourseUpdateData } from '@/types/course'

export const useCourseStore = defineStore('course', () => {
  // 状态
  const courses = ref<Course[]>([])
  const currentCourse = ref<Course | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const activeCourses = computed(() =>
    courses.value.filter(course => course.status === 'active')
  )

  // 方法
  async function fetchCourses(params?: any) {
    loading.value = true
    error.value = null

    try {
      const response = await courseApi.getCourses(params)
      courses.value = response.courses
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch courses'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCourse(data: CourseCreateData) {
    loading.value = true

    try {
      const newCourse = await courseApi.createCourse(data)
      courses.value.push(newCourse)
      return newCourse
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create course'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCourse(id: string, data: CourseUpdateData) {
    loading.value = true

    try {
      const updatedCourse = await courseApi.updateCourse(id, data)
      const index = courses.value.findIndex(course => course.id === id)
      if (index !== -1) {
        courses.value[index] = updatedCourse
      }
      if (currentCourse.value?.id === id) {
        currentCourse.value = updatedCourse
      }
      return updatedCourse
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update course'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    courses,
    currentCourse,
    loading,
    error,

    // 计算属性
    activeCourses,

    // 方法
    fetchCourses,
    createCourse,
    updateCourse
  }
})
```

## 📋 具体替换清单

### 1. 课程管理模块
**文件位置**: `apps/web-teacher/src/views/Courses/List.vue`
- [ ] 替换 `mock.ts` 中的 `getCourses()` 调用
- [ ] 实现 `onMounted()` 中的真实数据获取
- [ ] 添加分页和搜索功能
- [ ] 实现课程创建、编辑、删除操作

**文件位置**: `apps/web-teacher/src/views/Course/CourseWizard.vue`
- [ ] 替换表单提交的 mock 逻辑
- [ ] 实现真实的课程创建 API 调用
- [ ] 添加表单验证和错误处理

### 2. 班级管理模块
**文件位置**: `apps/web-teacher/src/views/Class/ClassManagement.vue:688`
- [ ] 移除硬编码的班级数据
- [ ] 实现真实的班级 CRUD API 调用
- [ ] 添加学生导入和管理功能
- [ ] 实现课程分配功能

### 3. 体验管理模块
**文件位置**: `apps/web-teacher/src/views/Experience/ExperienceManagementView.vue:872`
- [ ] 替换 ElMessage 占位操作
- [ ] 实现真实的体验管理 API
- [ ] 添加 HTML 文件上传和预览
- [ ] 实现体验发布流程

### 4. 虚拟实验模块
**文件位置**: `apps/web-teacher/src/views/VirtualLab/LabEditor.vue`
- [ ] 754行: 实现实验保存功能
- [ ] 764行: 实现实验预览功能
- [ ] 779行: 实现实验发布功能
- [ ] 839,867行: 实现封面上传功能

**文件位置**: `apps/web-teacher/src/views/VirtualLab/LabLibrary.vue:508`
- [ ] 恢复时间线视图功能
- [ ] 实现实验列表真实数据获取
- [ ] 添加实验搜索和筛选

### 5. 作业管理模块
**文件位置**: `apps/web-teacher/src/views/assignments/AssignmentsView.vue:500`
- [ ] 取消注释的批改工作流
- [ ] 实现真实的作业管理 API
- [ ] 添加作业创建和分发功能
- [ ] 实现批改界面和评分功能

### 6. 学生端模块
**文件位置**: `apps/web-student/src/stores/course.ts:68`
- [ ] 移除 fallback 数据
- [ ] 实现真实的课程数据获取
- [ ] 添加课程进度跟踪

## 🧪 测试要求

### API 集成测试
- [ ] Mock Service Worker 配置
- [ ] API 响应数据结构验证
- [ ] 错误场景处理测试

### 用户体验测试
- [ ] 加载状态显示测试
- [ ] 错误提示友好性测试
- [ ] 数据更新实时性测试

## 📝 开发步骤

### Week 1: 基础替换
1. 建立 API 客户端和拦截器
2. 替换课程管理模块 mock 数据
3. 更新相关 Store 状态管理
4. 基础错误处理实现

### Week 2: 核心模块
1. 替换班级管理模块
2. 替换体验管理模块
3. 实现虚拟实验基础功能
4. 完善加载状态和错误处理

### Week 3: 完善优化
1. 替换作业管理模块
2. 完善学生端数据获取
3. 性能优化和缓存策略
4. 完整测试覆盖

## 🚨 风险与注意事项

1. **API 兼容性**: 确保前后端数据结构一致
2. **错误处理**: 网络异常和数据异常的友好提示
3. **性能影响**: API 调用可能影响页面加载速度
4. **向后兼容**: 考虑 API 版本升级的兼容性

## 📚 参考资料

- [Axios 拦截器文档](https://axios-http.com/docs/interceptors)
- [Pinia 状态管理最佳实践](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-11-29
**当前状态**: 🔄 未开始