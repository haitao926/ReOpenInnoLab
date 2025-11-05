<template>
  <div class="classrooms-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>
          <el-icon><House /></el-icon>
          班级管理
        </h1>
        <p>管理班级信息、学生分配和课程安排</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateClassModal = true">
          <el-icon><Plus /></el-icon>
          创建班级
        </el-button>
        <el-button @click="importStudents">
          <el-icon><Upload /></el-icon>
          导入学生
        </el-button>
      </div>
    </div>

    <!-- 班级统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><School /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalClasses }}</div>
          <div class="stat-label">班级总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalStudents }}</div>
          <div class="stat-label">学生总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Reading /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeCourses }}</div>
          <div class="stat-label">活跃课程</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ averageProgress }}%</div>
          <div class="stat-label">平均进度</div>
        </div>
      </div>
    </div>

    <!-- 班级管理标签页 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 班级列表 -->
      <el-tab-pane label="班级列表" name="classes">
        <div class="tab-content">
          <!-- 筛选工具栏 -->
          <div class="filter-toolbar">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索班级名称..."
                  :prefix-icon="Search"
                  clearable
                />
              </el-col>
              <el-col :span="4">
                <el-select v-model="gradeFilter" placeholder="选择年级" clearable>
                  <el-option label="高一" value="grade10" />
                  <el-option label="高二" value="grade11" />
                  <el-option label="高三" value="grade12" />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-select v-model="statusFilter" placeholder="班级状态" clearable>
                  <el-option label="活跃" value="active" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已归档" value="archived" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button @click="resetFilters">
                  <el-icon><RefreshLeft /></el-icon>
                  重置筛选
                </el-button>
                <el-button-group>
                  <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
                    <el-icon><Grid /></el-icon>
                  </el-button>
                  <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
                    <el-icon><List /></el-icon>
                  </el-button>
                </el-button-group>
              </el-col>
            </el-row>
          </div>

          <!-- 班级卡片视图 -->
          <div v-if="viewMode === 'card'" class="classes-grid">
            <div
              v-for="classItem in filteredClasses"
              :key="classItem.id"
              class="class-card"
            >
              <div class="class-header">
                <div class="class-info">
                  <h4>{{ classItem.name }}</h4>
                  <div class="class-meta">
                    <el-tag :type="getGradeColor(classItem.grade)" size="small">
                      {{ classItem.grade }}
                    </el-tag>
                    <el-tag :type="getStatusColor(classItem.status)" size="small">
                      {{ getStatusLabel(classItem.status) }}
                    </el-tag>
                  </div>
                </div>
                <div class="class-actions">
                  <el-dropdown @command="(command) => handleClassAction(command, classItem)">
                    <el-button size="small" text>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">
                          <el-icon><Edit /></el-icon>
                          编辑班级
                        </el-dropdown-item>
                        <el-dropdown-item command="students">
                          <el-icon><User /></el-icon>
                          管理学生
                        </el-dropdown-item>
                        <el-dropdown-item command="courses">
                          <el-icon><Reading /></el-icon>
                          分配课程
                        </el-dropdown-item>
                        <el-dropdown-item command="start">
                          <el-icon><VideoPlay /></el-icon>
                          开始上课
                        </el-dropdown-item>
                        <el-dropdown-item command="analytics" divided>
                          <el-icon><DataAnalysis /></el-icon>
                          学习分析
                        </el-dropdown-item>
                        <el-dropdown-item command="archive">
                          <el-icon><FolderOpened /></el-icon>
                          归档班级
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <div class="class-content">
                <div class="class-stats">
                  <div class="stat-item">
                    <div class="stat-number">{{ classItem.studentCount }}</div>
                    <div class="stat-text">学生</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ classItem.courseCount }}</div>
                    <div class="stat-text">课程</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ classItem.averageProgress }}%</div>
                    <div class="stat-text">进度</div>
                  </div>
                </div>

                <div class="class-teacher">
                  <div class="teacher-avatar">
                    <el-avatar :size="32" :src="classItem.teacher?.avatar">
                      {{ classItem.teacher?.name?.charAt(0) }}
                    </el-avatar>
                  </div>
                  <div class="teacher-info">
                    <div class="teacher-name">{{ classItem.teacher?.name || '未分配' }}</div>
                    <div class="teacher-role">班主任</div>
                  </div>
                </div>

                <div class="class-description">
                  {{ classItem.description || '暂无描述' }}
                </div>
              </div>

              <div class="class-footer">
                <el-button size="small" @click="viewClassDetail(classItem)">
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
                <el-button size="small" type="primary" @click="manageClassStudents(classItem)">
                  <el-icon><User /></el-icon>
                  管理学生
                </el-button>
              </div>
            </div>
          </div>

          <!-- 班级表格视图 -->
          <div v-else class="classes-table">
            <el-table :data="filteredClasses" stripe>
              <el-table-column prop="name" label="班级名称" min-width="150" />
              <el-table-column prop="grade" label="年级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getGradeColor(row.grade)" size="small">
                    {{ row.grade }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="studentCount" label="学生数" width="80" align="center" />
              <el-table-column prop="courseCount" label="课程数" width="80" align="center" />
              <el-table-column prop="averageProgress" label="平均进度" width="120" align="center">
                <template #default="{ row }">
                  <el-progress :percentage="row.averageProgress" :stroke-width="6" />
                </template>
              </el-table-column>
              <el-table-column prop="teacher.name" label="班主任" width="120" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusColor(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="viewClassDetail(row)">详情</el-button>
                  <el-button size="small" type="primary" @click="manageClassStudents(row)">
                    学生
                  </el-button>
                  <el-button size="small" @click="startClass(row)">
                    上课
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 学生管理 -->
      <el-tab-pane label="学生管理" name="students">
        <div class="tab-content">
          <StudentManagement />
        </div>
      </el-tab-pane>

      <!-- 课程分配 -->
      <el-tab-pane label="课程分配" name="courses">
        <div class="tab-content">
          <CourseAssignment />
        </div>
      </el-tab-pane>

      <!-- 开课管理 -->
      <el-tab-pane label="开课管理" name="teaching">
        <div class="tab-content">
          <TeachingManagement />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建班级对话框 -->
    <el-dialog
      v-model="showCreateClassModal"
      title="创建新班级"
      width="600px"
    >
      <el-form :model="createClassForm" :rules="createClassRules" label-width="100px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="createClassForm.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="createClassForm.grade" placeholder="选择年级">
            <el-option label="高一" value="grade10" />
            <el-option label="高二" value="grade11" />
            <el-option label="高三" value="grade12" />
          </el-select>
        </el-form-item>
        <el-form-item label="班主任" prop="teacherId">
          <el-select v-model="createClassForm.teacherId" placeholder="选择班主任">
            <el-option
              v-for="teacher in availableTeachers"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级描述">
          <el-input
            v-model="createClassForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入班级描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateClassModal = false">取消</el-button>
        <el-button type="primary" :loading="creatingClass" @click="createClass">
          创建班级
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  House, Plus, Upload, Search, RefreshLeft, Grid, List, MoreFilled,
  Edit, User, Reading, DataAnalysis, FolderOpened, View, VideoPlay
} from '@element-plus/icons-vue'
import StudentManagement from '../Class/StudentManagement.vue'
import CourseAssignment from '../Class/CourseAssignment.vue'
import TeachingManagement from '../Class/TeachingManagement.vue'

interface ClassInfo {
  id: string
  name: string
  grade: string
  description?: string
  studentCount: number
  courseCount: number
  averageProgress: number
  status: 'active' | 'completed' | 'archived'
  teacher?: {
    id: string
    name: string
    avatar?: string
  }
}

interface Teacher {
  id: string
  name: string
  avatar?: string
}

// 响应式数据
const activeTab = ref('classes')
const viewMode = ref<'card' | 'table'>('card')
const searchKeyword = ref('')
const gradeFilter = ref('')
const statusFilter = ref('')
const showCreateClassModal = ref(false)
const creatingClass = ref(false)

const classList = ref<ClassInfo[]>([])
const availableTeachers = ref<Teacher[]>([])

const createClassForm = ref({
  name: '',
  grade: '',
  teacherId: '',
  description: ''
})

const createClassRules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '班级名称长度在2到50个字符之间', trigger: 'blur' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  teacherId: [
    { required: true, message: '请选择班主任', trigger: 'change' }
  ]
}

// 计算属性
const filteredClasses = computed(() => {
  let filtered = classList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(cls =>
      cls.name.toLowerCase().includes(keyword) ||
      (cls.description && cls.description.toLowerCase().includes(keyword))
    )
  }

  if (gradeFilter.value) {
    filtered = filtered.filter(cls => cls.grade === gradeFilter.value)
  }

  if (statusFilter.value) {
    filtered = filtered.filter(cls => cls.status === statusFilter.value)
  }

  return filtered
})

const totalClasses = computed(() => classList.value.length)
const totalStudents = computed(() => classList.value.reduce((sum, cls) => sum + cls.studentCount, 0))
const activeCourses = computed(() => classList.value.reduce((sum, cls) => sum + cls.courseCount, 0))
const averageProgress = computed(() => {
  if (classList.value.length === 0) return 0
  const total = classList.value.reduce((sum, cls) => sum + cls.averageProgress, 0)
  return Math.round(total / classList.value.length)
})

// 方法
const loadClassList = async () => {
  try {
    // 模拟加载班级数据
    await new Promise(resolve => setTimeout(resolve, 500))

    classList.value = [
      {
        id: '1',
        name: '高一(1)班',
        grade: 'grade10',
        description: '理科重点班',
        studentCount: 45,
        courseCount: 8,
        averageProgress: 78,
        status: 'active',
        teacher: {
          id: 't1',
          name: '张老师'
        }
      },
      {
        id: '2',
        name: '高一(2)班',
        grade: 'grade10',
        description: '文科重点班',
        studentCount: 42,
        courseCount: 7,
        averageProgress: 82,
        status: 'active',
        teacher: {
          id: 't2',
          name: '李老师'
        }
      },
      {
        id: '3',
        name: '高二(3)班',
        grade: 'grade11',
        description: '理科普通班',
        studentCount: 38,
        courseCount: 6,
        averageProgress: 65,
        status: 'active',
        teacher: {
          id: 't3',
          name: '王老师'
        }
      }
    ]
  } catch (error) {
    console.error('加载班级列表失败:', error)
    ElMessage.error('加载班级列表失败')
  }
}

const loadAvailableTeachers = async () => {
  try {
    availableTeachers.value = [
      { id: 't1', name: '张老师' },
      { id: 't2', name: '李老师' },
      { id: 't3', name: '王老师' },
      { id: 't4', name: '赵老师' },
      { id: 't5', name: '钱老师' }
    ]
  } catch (error) {
    console.error('加载教师列表失败:', error)
  }
}

const resetFilters = () => {
  searchKeyword.value = ''
  gradeFilter.value = ''
  statusFilter.value = ''
}

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    'grade10': 'primary',
    'grade11': 'success',
    'grade12': 'warning'
  }
  return colors[grade] || ''
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'active': 'success',
    'completed': 'info',
    'archived': 'warning'
  }
  return colors[status] || ''
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'active': '活跃',
    'completed': '已完成',
    'archived': '已归档'
  }
  return labels[status] || status
}

const handleClassAction = (command: string, classItem: ClassInfo) => {
  switch (command) {
    case 'edit':
      editClass(classItem)
      break
    case 'students':
      manageClassStudents(classItem)
      break
    case 'courses':
      assignCourses(classItem)
      break
    case 'start':
      startClass(classItem)
      break
    case 'analytics':
      viewAnalytics(classItem)
      break
    case 'archive':
      archiveClass(classItem)
      break
  }
}

const editClass = (classItem: ClassInfo) => {
  ElMessage.info(`编辑班级: ${classItem.name}`)
}

const manageClassStudents = (classItem: ClassInfo) => {
  ElMessage.info(`管理学生: ${classItem.name}`)
  // 可以切换到学生管理标签页
}

const assignCourses = (classItem: ClassInfo) => {
  ElMessage.info(`分配课程: ${classItem.name}`)
  // 可以切换到课程分配标签页
}

const startClass = (classItem: ClassInfo) => {
  ElMessage.success(`开始上课: ${classItem.name}`)
}

const viewAnalytics = (classItem: ClassInfo) => {
  ElMessage.info(`查看分析: ${classItem.name}`)
}

const archiveClass = (classItem: ClassInfo) => {
  ElMessage.success(`归档班级: ${classItem.name}`)
}

const viewClassDetail = (classItem: ClassInfo) => {
  ElMessage.info(`查看详情: ${classItem.name}`)
}

const createClass = async () => {
  try {
    creatingClass.value = true

    // 模拟创建班级
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newClass: ClassInfo = {
      id: `class_${Date.now()}`,
      name: createClassForm.value.name,
      grade: createClassForm.value.grade,
      description: createClassForm.value.description,
      studentCount: 0,
      courseCount: 0,
      averageProgress: 0,
      status: 'active',
      teacher: availableTeachers.value.find(t => t.id === createClassForm.value.teacherId)
    }

    classList.value.unshift(newClass)
    ElMessage.success('班级创建成功')
    showCreateClassModal.value = false
    resetCreateClassForm()
  } catch (error) {
    console.error('创建班级失败:', error)
    ElMessage.error('创建班级失败')
  } finally {
    creatingClass.value = false
  }
}

const resetCreateClassForm = () => {
  createClassForm.value = {
    name: '',
    grade: '',
    teacherId: '',
    description: ''
  }
}

const importStudents = () => {
  ElMessage.info('学生导入功能开发中...')
}

// 生命周期
onMounted(() => {
  loadClassList()
  loadAvailableTeachers()
})
</script>

<style lang="scss" scoped>
.classrooms-view {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--edu-bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);

  .header-content {
    h1 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-2xl);
      color: var(--edu-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    p {
      margin: 0;
      color: var(--edu-text-secondary);
      font-size: var(--font-size-sm);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    .el-icon {
      font-size: 28px;
    }
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--edu-text-primary);
      line-height: var(--edu-leading-tight);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--edu-text-secondary);
      margin-top: var(--spacing-xs);
    }
  }
}

.main-tabs {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;

  :deep(.el-tabs__header) {
    margin: 0;
    background: var(--edu-bg-secondary);
    border-bottom: 1px solid var(--edu-border-light);
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}

.tab-content {
  padding: var(--spacing-lg);
}

.filter-toolbar {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.class-card {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);

  .class-info {
    flex: 1;

    h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
    }

    .class-meta {
      display: flex;
      gap: var(--spacing-xs);
    }
  }

  .class-actions {
    margin-left: var(--spacing-sm);
  }
}

.class-content {
  padding: var(--spacing-lg);

  .class-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-base);
    margin-bottom: var(--spacing-base);

    .stat-item {
      text-align: center;

      .stat-number {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--edu-primary-600);
        margin-bottom: var(--spacing-xs);
      }

      .stat-text {
        font-size: var(--font-size-xs);
        color: var(--edu-text-tertiary);
      }
    }
  }

  .class-teacher {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);
    padding: var(--spacing-sm);
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-base);

    .teacher-info {
      .teacher-name {
        font-weight: var(--font-weight-medium);
        color: var(--edu-text-primary);
        font-size: var(--font-size-sm);
      }

      .teacher-role {
        font-size: var(--font-size-xs);
        color: var(--edu-text-tertiary);
      }
    }
  }

  .class-description {
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-base);
    line-height: var(--edu-leading-normal);
  }
}

.class-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
}

.classes-table {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-toolbar .el-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .classes-grid {
    grid-template-columns: 1fr;
  }

  .class-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .class-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>