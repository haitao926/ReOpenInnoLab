<template>
  <div class="courses-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">课程管理</h1>
        <p class="page-description">管理和创建您的教学课程</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createCourse">
          <el-icon><Plus /></el-icon>
          创建课程
        </el-button>
        <el-button @click="importCourse">
          <el-icon><Upload /></el-icon>
          导入课程
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="filters.subject" placeholder="选择学科" clearable>
            <el-option
              v-for="subject in subjectOptions"
              :key="subject.value"
              :label="subject.label"
              :value="subject.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="filters.grade" placeholder="选择年级" clearable>
            <el-option
              v-for="grade in gradeOptions"
              :key="grade.value"
              :label="grade.label"
              :value="grade.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="filters.status" placeholder="课程状态" clearable>
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="6">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索课程名称"
            clearable
            @keyup.enter="searchCourses"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- 课程列表 -->
    <el-card class="courses-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            课程列表
            <el-tag v-if="filteredCourses.length" class="count-tag">
              {{ filteredCourses.length }}
            </el-tag>
          </span>
          <div class="header-actions">
            <el-button-group>
              <el-button
                :type="viewMode === 'grid' ? 'primary' : 'default'"
                @click="viewMode = 'grid'"
              >
                <el-icon><Grid /></el-icon>
              </el-button>
              <el-button
                :type="viewMode === 'table' ? 'primary' : 'default'"
                @click="viewMode = 'table'"
              >
                <el-icon><List /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 表格视图 -->
      <el-table
        v-if="viewMode === 'table'"
        :data="paginatedCourses"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="title" label="课程名称" min-width="200">
          <template #default="{ row }">
            <div class="course-info">
              <div class="course-title">{{ row.title }}</div>
              <div class="course-meta">
                <el-tag :type="getSubjectTagType(row.subject)" size="small">
                  {{ getSubjectName(row.subject) }}
                </el-tag>
                <span class="course-grade">{{ row.grade }}年级</span>
                <el-tag v-if="row.isPublic" type="info" size="small">
                  公开
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="teacher" label="授课教师" width="120" />
        <el-table-column prop="students" label="学生数" width="100">
          <template #default="{ row }">
            <span>{{ row.students }}/{{ row.maxStudents }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :stroke-width="8"
              :color="getProgressColor(row.progress)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="最后更新" width="150">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="viewCourse(row.id)">
              查看
            </el-button>
            <el-button type="text" @click="editCourse(row.id)">
              编辑
            </el-button>
            <el-dropdown trigger="click" @command="handleCourseAction">
              <el-button type="text">
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'copy', id: row.id }">
                    复制课程
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'export', id: row.id }">
                    导出数据
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'archive', id: row.id }">
                    归档课程
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="{ action: 'delete', id: row.id }"
                    divided
                  >
                    <span style="color: var(--el-color-danger)">删除课程</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 网格视图 -->
      <div v-else class="courses-grid">
        <div
          v-for="course in paginatedCourses"
          :key="course.id"
          class="course-card"
          @click="viewCourse(course.id)"
        >
          <div class="course-header">
            <div class="course-title">{{ course.title }}</div>
            <el-tag :type="getSubjectTagType(course.subject)" size="small">
              {{ getSubjectName(course.subject) }}
            </el-tag>
          </div>
          <div class="course-meta">
            <span class="course-teacher">{{ course.teacher }}</span>
            <span class="course-grade">{{ course.grade }}年级</span>
          </div>
          <div class="course-stats">
            <div class="stat-item">
              <span class="stat-label">学生</span>
              <span class="stat-value">{{ course.students }}/{{ course.maxStudents }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">进度</span>
              <el-progress
                :percentage="course.progress"
                :stroke-width="6"
                :color="getProgressColor(course.progress)"
              />
            </div>
          </div>
          <div class="course-footer">
            <el-tag :type="getStatusTagType(course.status)" size="small">
              {{ getStatusText(course.status) }}
            </el-tag>
            <span class="course-date">{{ formatDate(course.updatedAt) }}</span>
          </div>
          <div class="course-actions">
            <el-button type="text" size="small" @click.stop="editCourse(course.id)">
              编辑
            </el-button>
            <el-dropdown trigger="click" @command="handleCourseAction">
              <el-button type="text" size="small" @click.stop>
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'copy', id: course.id }">
                    复制课程
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'archive', id: course.id }">
                    归档课程
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', id: course.id }">
                    <span style="color: var(--el-color-danger)">删除课程</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="filteredCourses.length"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑课程对话框 -->
    <el-dialog
      v-model="courseDialogVisible"
      :title="courseDialogMode === 'create' ? '创建课程' : '编辑课程'"
      width="600px"
      @close="resetCourseForm"
    >
      <el-form
        ref="courseFormRef"
        :model="courseForm"
        :rules="courseRules"
        label-width="100px"
      >
        <el-form-item label="课程名称" prop="title">
          <el-input v-model="courseForm.title" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="学科" prop="subject">
          <el-select v-model="courseForm.subject" placeholder="选择学科" style="width: 100%">
            <el-option
              v-for="subject in subjectOptions"
              :key="subject.value"
              :label="subject.label"
              :value="subject.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="courseForm.grade" placeholder="选择年级" style="width: 100%">
            <el-option
              v-for="grade in gradeOptions"
              :key="grade.value"
              :label="grade.label"
              :value="grade.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="最大学生数" prop="maxStudents">
          <el-input-number
            v-model="courseForm.maxStudents"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="courseForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入课程描述"
          />
        </el-form-item>
        <el-form-item label="是否公开" prop="isPublic">
          <el-switch v-model="courseForm.isPublic" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse" :loading="saving">
          {{ courseDialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Upload, Search, Grid, List, ArrowDown } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { formatDate } from '@/utils/date'

interface Course {
  id: string
  title: string
  subject: string
  grade: string
  teacher: string
  students: number
  maxStudents: number
  progress: number
  status: 'active' | 'completed' | 'archived'
  isPublic: boolean
  description: string
  createdAt: Date
  updatedAt: Date
}

interface Filters {
  subject: string
  grade: string
  status: string
  keyword: string
}

interface CourseForm {
  title: string
  subject: string
  grade: string
  maxStudents: number
  description: string
  isPublic: boolean
}

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const loading = ref(false)
const viewMode = ref<'table' | 'grid'>('table')
const courseDialogVisible = ref(false)
const courseDialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const courseFormRef = ref<FormInstance>()

// 筛选条件
const filters = reactive<Filters>({
  subject: '',
  grade: '',
  status: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 12
})

// 课程数据
const courses = ref<Course[]>([
  {
    id: '1',
    title: '高中物理 - 力学基础',
    subject: 'physics',
    grade: '10',
    teacher: '张老师',
    students: 32,
    maxStudents: 40,
    progress: 65,
    status: 'active',
    isPublic: true,
    description: '本课程介绍力学的基本概念，包括力、质量、加速度等',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: '高中化学 - 有机化合物',
    subject: 'chemistry',
    grade: '11',
    teacher: '李老师',
    students: 28,
    maxStudents: 35,
    progress: 82,
    status: 'active',
    isPublic: false,
    description: '深入学习有机化合物的结构、性质和反应',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: '3',
    title: '高中数学 - 函数与图像',
    subject: 'math',
    grade: '10',
    teacher: '王老师',
    students: 35,
    maxStudents: 40,
    progress: 71,
    status: 'active',
    isPublic: true,
    description: '学习各种函数的性质、图像和应用',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-13')
  }
])

// 课程表单
const courseForm = reactive<CourseForm>({
  title: '',
  subject: '',
  grade: '',
  maxStudents: 30,
  description: '',
  isPublic: false
})

// 表单验证规则
const courseRules: FormRules = {
  title: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 2, max: 50, message: '课程名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  maxStudents: [
    { required: true, message: '请输入最大学生数', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入课程描述', trigger: 'blur' },
    { min: 10, max: 500, message: '课程描述长度在 10 到 500 个字符', trigger: 'blur' }
  ]
}

// 选项数据
const subjectOptions = [
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '数学', value: 'math' },
  { label: '生物', value: 'biology' },
  { label: '语文', value: 'language' },
  { label: '历史', value: 'history' },
  { label: '地理', value: 'geography' },
  { label: '英语', value: 'english' },
  { label: '美术', value: 'art' },
  { label: '音乐', value: 'music' },
  { label: '体育', value: 'pe' },
  { label: '信息技术', value: 'it' }
]

const gradeOptions = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
  { label: '四年级', value: '4' },
  { label: '五年级', value: '5' },
  { label: '六年级', value: '6' },
  { label: '七年级', value: '7' },
  { label: '八年级', value: '8' },
  { label: '九年级', value: '9' },
  { label: '高一', value: '10' },
  { label: '高二', value: '11' },
  { label: '高三', value: '12' }
]

// 计算属性
const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    if (filters.subject && course.subject !== filters.subject) return false
    if (filters.grade && course.grade !== filters.grade) return false
    if (filters.status && course.status !== filters.status) return false
    if (filters.keyword && !course.title.includes(filters.keyword)) return false
    return true
  })
})

const paginatedCourses = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredCourses.value.slice(start, end)
})

// 方法
const getSubjectName = (subject: string): string => {
  const option = subjectOptions.find(opt => opt.value === subject)
  return option?.label || subject
}

const getSubjectTagType = (subject: string): string => {
  const tagTypes: Record<string, string> = {
    physics: 'primary',
    chemistry: 'success',
    math: 'warning',
    biology: 'info',
    language: 'danger'
  }
  return tagTypes[subject] || ''
}

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档'
  }
  return statusTexts[status] || status
}

const getStatusTagType = (status: string): string => {
  const tagTypes: Record<string, string> = {
    active: 'success',
    completed: 'info',
    archived: 'info'
  }
  return tagTypes[status] || ''
}

// 事件处理
const createCourse = () => {
  courseDialogMode.value = 'create'
  courseDialogVisible.value = true
}

const editCourse = (id: string) => {
  courseDialogMode.value = 'edit'
  const course = courses.value.find(c => c.id === id)
  if (course) {
    Object.assign(courseForm, {
      title: course.title,
      subject: course.subject,
      grade: course.grade,
      maxStudents: course.maxStudents,
      description: course.description,
      isPublic: course.isPublic
    })
  }
  courseDialogVisible.value = true
}

const saveCourse = async () => {
  if (!courseFormRef.value) return

  try {
    await courseFormRef.value.validate()
    saving.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success(courseDialogMode.value === 'create' ? '课程创建成功' : '课程更新成功')
    courseDialogVisible.value = false
    resetCourseForm()
    await loadCourses()
  } catch (error) {
    console.error('保存课程失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const resetCourseForm = () => {
  if (courseFormRef.value) {
    courseFormRef.value.resetFields()
  }
  Object.assign(courseForm, {
    title: '',
    subject: '',
    grade: '',
    maxStudents: 30,
    description: '',
    isPublic: false
  })
}

const viewCourse = (id: string) => {
  router.push(`/courses/${id}`)
}

const importCourse = () => {
  // 实现课程导入功能
  ElMessage.info('课程导入功能开发中...')
}

const handleCourseAction = async ({ action, id }: { action: string; id: string }) => {
  switch (action) {
    case 'copy':
      await copyCourse(id)
      break
    case 'export':
      await exportCourse(id)
      break
    case 'archive':
      await archiveCourse(id)
      break
    case 'delete':
      await deleteCourse(id)
      break
  }
}

const copyCourse = async (id: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('课程复制成功')
    await loadCourses()
  } catch (error) {
    ElMessage.error('课程复制失败')
  }
}

const exportCourse = async (id: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('课程导出成功')
  } catch (error) {
    ElMessage.error('课程导出失败')
  }
}

const archiveCourse = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要归档这个课程吗？', '确认归档', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('课程归档成功')
    await loadCourses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('课程归档失败')
    }
  }
}

const deleteCourse = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个课程吗？此操作不可恢复。', '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('课程删除成功')
    await loadCourses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('课程删除失败')
    }
  }
}

const searchCourses = () => {
  pagination.page = 1
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

const loadCourses = async () => {
  try {
    loading.value = true
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('加载课程失败:', error)
    ElMessage.error('加载课程失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadCourses()
})
</script>

<style lang="scss" scoped>
.courses-list {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;

  .header-left {
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 0 0 8px 0;
    }

    .page-description {
      font-size: 16px;
      color: var(--edu-text-secondary);
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filter-card {
  margin-bottom: 24px;
}

.courses-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--edu-text-primary);
      display: flex;
      align-items: center;
      gap: 8px;

      .count-tag {
        font-size: 12px;
      }
    }
  }
}

.course-info {
  .course-title {
    font-weight: 500;
    color: var(--edu-text-primary);
    margin-bottom: 4px;
  }

  .course-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--edu-text-secondary);
  }
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.course-card {
  border: 1px solid var(--edu-border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--color-white);

  &:hover {
    border-color: var(--color-primary-500);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .course-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;

    .course-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--edu-text-primary);
      flex: 1;
      margin-right: 8px;
    }
  }

  .course-meta {
    display: flex;
    gap: 12px;
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin-bottom: 16px;
  }

  .course-stats {
    margin-bottom: 16px;

    .stat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .stat-label {
        font-size: 12px;
        color: var(--edu-text-secondary);
      }

      .stat-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--edu-text-primary);
      }
    }
  }

  .course-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .course-date {
      font-size: 12px;
      color: var(--edu-text-placeholder);
    }
  }

  .course-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

// 响应式设计
@media (max-width: 768px) {
  .courses-list {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .header-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .course-card {
    background: var(--color-gray-800);
    border-color: var(--edu-border-color);
  }

  .course-title,
  .stat-value {
    color: var(--edu-text-primary);
  }
}
</style>