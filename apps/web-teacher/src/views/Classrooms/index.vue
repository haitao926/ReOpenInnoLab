<template>
  <TeacherWorkspaceLayout
    title="班级管理"
    subtitle="管理班级信息、学生分配和课程安排"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <el-button type="primary" @click="showCreateClassModal = true">
          <el-icon><Plus /></el-icon>
          创建班级
        </el-button>
        <el-button @click="importStudents">
          <el-icon><Upload /></el-icon>
          导入学生
        </el-button>
      </div>
    </template>

    <template #summary>
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        variant="glass"
        size="sm"
        class="summary-card"
        :hoverable="true"
      >
        <div class="summary-card__content">
          <span class="summary-card__icon" :style="{ background: card.gradient }">
            <el-icon><component :is="card.icon" /></el-icon>
          </span>
          <div class="summary-card__text">
            <span class="summary-card__value">{{ card.value }}</span>
            <span class="summary-card__label">{{ card.label }}</span>
          </div>
        </div>
      </EduCard>
    </template>

    <template #left>
      <ManagementSidebarLeft
        :sections="leftSidebarSections"
        @quick-action="handleQuickAction"
        @filter-change="handleFilterChange"
      >
        <!-- 自定义筛选器插槽 -->
        <template #filters="{ data }">
          <div class="classroom-filters">
            <div class="filter-section">
              <h5 class="sidebar-section-title">年级筛选</h5>
              <div class="grade-filter">
                <div
                  v-for="grade in grades"
                  :key="grade.value"
                  class="grade-item"
                  :class="{ active: selectedGrade === grade.value }"
                  @click="filterByGrade(grade.value)"
                >
                  <EduTag :variant="getGradeVariant(grade.value)" size="sm">
                    {{ grade.label }}
                  </EduTag>
                  <span class="grade-count">{{ getGradeClassCount(grade.value) }} 个班级</span>
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h5 class="sidebar-section-title">班级状态</h5>
              <div class="status-filter">
                <div
                  v-for="status in statusOptions"
                  :key="status.value"
                  class="status-item"
                  :class="{ active: selectedStatus === status.value }"
                  @click="filterByStatus(status.value)"
                >
                  <span class="status-icon" :style="{ backgroundColor: status.color }">
                    <el-icon><component :is="status.icon" /></el-icon>
                  </span>
                  <div class="status-info">
                    <div class="status-name">{{ status.label }}</div>
                    <div class="status-count">{{ status.count }} 个</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="classroom-quick-actions">
            <el-button type="primary" size="small" style="width: 100%; margin-bottom: 8px;" @click="showCreateClassModal = true">
              <el-icon class="create-icon"><Plus /></el-icon>
              创建班级
            </el-button>
            <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="importStudents">
              <el-icon class="import-icon"><Upload /></el-icon>
              导入学生
            </el-button>
            <el-button type="default" size="small" style="width: 100%;" @click="exportClassData">
              <el-icon class="export-icon"><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </template>

        <!-- 自定义教学动态插槽 -->
        <template #activity="{ data }">
          <div class="classroom-activity">
            <div class="activity-overview">
              <div class="activity-item">
                <div class="activity-label">今日活跃</div>
                <div class="activity-value">{{ todayActiveClasses }} 个班级</div>
              </div>
              <div class="activity-item">
                <div class="activity-label">本周新增</div>
                <div class="activity-value">{{ weekNewStudents }} 名学生</div>
              </div>
              <div class="activity-item">
                <div class="activity-label">待处理</div>
                <div class="activity-value">{{ pendingRequests }} 项申请</div>
              </div>
            </div>

            <div class="recent-activities">
              <h5>最近活动</h5>
              <div
                v-for="activity in recentActivities.slice(0, 3)"
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-icon" :class="`activity-icon--${activity.type}`">
                  <el-icon><component :is="activity.icon" /></el-icon>
                </div>
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarLeft>
    </template>

    <template #right>
      <ManagementSidebarRight
        :sections="rightSidebarSections"
        @resource-action="handleResourceAction"
        @collaboration-action="handleCollaborationAction"
      >
        <!-- 自定义数据洞察插槽 -->
        <template #insights="{ data }">
          <div class="classroom-insights">
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-label">平均班级规模</div>
                <div class="stat-value">{{ averageClassSize }} 人</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">满员率</div>
                <div class="stat-value">{{ fullCapacityRate }}%</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">活跃度</div>
                <div class="stat-value">{{ activityRate }}%</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="classroom-resources">
            <h5>班级管理资源</h5>
            <div class="resource-list">
              <div v-for="resource in recommendedResources" :key="resource.id" class="resource-item">
                <div class="resource-icon" :style="{ backgroundColor: resource.color }">
                  <el-icon><component :is="resource.icon" /></el-icon>
                </div>
                <div class="resource-content">
                  <div class="resource-title">{{ resource.title }}</div>
                  <div class="resource-desc">{{ resource.description }}</div>
                </div>
                <el-button text size="small" @click="openResource(resource)">查看</el-button>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义协作动态插槽 -->
        <template #collaboration="{ data }">
          <div class="classroom-collaboration">
            <h5>教师协作</h5>
            <div class="collaboration-list">
              <div v-for="item in collaborationItems" :key="item.id" class="collaboration-item">
                <div class="collaboration-icon">
                  <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div class="collaboration-content">
                  <div class="collaboration-text">{{ item.text }}</div>
                  <div class="collaboration-time">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarRight>
    </template>

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
  Plus, Upload, Search, RefreshLeft, Grid, List, MoreFilled,
  Edit, User, Reading, DataAnalysis, FolderOpened, View, VideoPlay,
  School, TrendCharts, Clock, Star, Check, Warning, Bell
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import { EduCard, EduTag } from '@reopeninnolab/ui-kit'
import { PAGE_SIDEBAR_CONFIGS } from '@/constants/managementSidebar'
import { formatTime } from '@/utils/date'

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
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

// 侧边栏筛选状态
const selectedGrade = ref('')
const selectedStatus = ref('')

const classList = ref<ClassInfo[]>([])
const availableTeachers = ref<Teacher[]>([])

const createClassForm = ref({
  name: '',
  grade: '',
  teacherId: '',
  description: ''
})

// 侧边栏配置
const leftSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.classrooms.left)
const rightSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.classrooms.right)

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

// Summary cards for workspace layout
const summaryCards = computed(() => [
  {
    id: 'classes',
    label: '班级总数',
    value: totalClasses.value,
    icon: School,
    gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
  },
  {
    id: 'students',
    label: '学生总数',
    value: totalStudents.value,
    icon: User,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'courses',
    label: '活跃课程',
    value: activeCourses.value,
    icon: Reading,
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  },
  {
    id: 'progress',
    label: '平均进度',
    value: `${averageProgress.value}%`,
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
])

// 年级数据
const grades = [
  { label: '高一', value: 'grade10' },
  { label: '高二', value: 'grade11' },
  { label: '高三', value: 'grade12' }
]

// 状态选项
const statusOptions = computed(() => [
  {
    label: '活跃',
    value: 'active',
    color: '#10b981',
    icon: 'Check',
    count: classList.value.filter(c => c.status === 'active').length
  },
  {
    label: '已完成',
    value: 'completed',
    color: '#3b82f6',
    icon: 'Check',
    count: classList.value.filter(c => c.status === 'completed').length
  },
  {
    label: '已归档',
    value: 'archived',
    color: '#6b7280',
    icon: 'FolderOpened',
    count: classList.value.filter(c => c.status === 'archived').length
  }
])

// 活动数据
const todayActiveClasses = computed(() => classList.value.filter(c => c.status === 'active').length)
const weekNewStudents = computed(() => 12) // 模拟数据
const pendingRequests = computed(() => 3) // 模拟数据

const recentActivities = ref([
  { id: '1', title: '创建了新的班级', type: 'create', icon: 'Plus', timestamp: Date.now() - 1800000 },
  { id: '2', title: '更新了班级信息', type: 'edit', icon: 'Edit', timestamp: Date.now() - 3600000 },
  { id: '3', title: '完成了学生导入', type: 'import', icon: 'Upload', timestamp: Date.now() - 5400000 }
])

// 洞察数据
const averageClassSize = computed(() => {
  if (classList.value.length === 0) return 0
  return Math.round(totalStudents.value / classList.value.length)
})
const fullCapacityRate = computed(() => 85) // 模拟数据
const activityRate = computed(() => 92) // 模拟数据

// 推荐资源
const recommendedResources = ref([
  {
    id: 1,
    title: '班级管理指南',
    description: '高效的班级组织和管理方法',
    color: '#1890ff',
    icon: 'Document'
  },
  {
    id: 2,
    title: '学生信息模板',
    description: '标准化的学生信息录入模板',
    color: '#52c41a',
    icon: 'FileText'
  },
  {
    id: 3,
    title: '家校沟通工具',
    description: '促进家校合作的有效工具',
    color: '#722ed1',
    icon: 'Message'
  }
])

// 协作数据
const collaborationItems = ref([
  {
    id: 'collab-1',
    text: '李老师分享了班级管理经验',
    time: '2 小时前',
    icon: 'User'
  },
  {
    id: 'collab-2',
    text: '年级组发布了新的教学安排',
    time: '5 小时前',
    icon: 'Bell'
  }
])

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

// 侧边栏方法
const getGradeClassCount = (grade: string) => {
  return classList.value.filter(c => c.grade === grade).length
}

const getGradeVariant = (grade: string): string => {
  const variants: Record<string, string> = {
    grade10: 'primary',
    grade11: 'success',
    grade12: 'warning'
  }
  return variants[grade] || 'info'
}

const filterByGrade = (grade: string) => {
  selectedGrade.value = grade === selectedGrade.value ? '' : grade
  gradeFilter.value = selectedGrade.value
}

const filterByStatus = (status: string) => {
  selectedStatus.value = status === selectedStatus.value ? '' : status
  statusFilter.value = selectedStatus.value
}

const handleQuickAction = (action: string) => {
  switch (action) {
    case 'create':
      showCreateClassModal.value = true
      break
    case 'import':
      importStudents()
      break
    case 'export':
      exportClassData()
      break
  }
}

const handleFilterChange = (filters: any) => {
  console.log('Classroom filters changed:', filters)
}

const handleResourceAction = (action: string, id: string | number) => {
  console.log('Resource action:', action, id)
  if (action === 'open') {
    openResource(recommendedResources.value.find(r => r.id === id))
  }
}

const handleCollaborationAction = (action: string, data: any) => {
  console.log('Collaboration action:', action, data)
}

const exportClassData = () => {
  ElMessage.info('导出功能开发中...')
}

const openResource = (resource: any) => {
  if (resource) {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
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
  flex: 1; /* 占用剩余空间 */
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex子元素缩小 */

  :deep(.el-tabs__header) {
    margin: 0;
    background: var(--edu-bg-secondary);
    border-bottom: 1px solid var(--edu-border-light);
    flex-shrink: 0; /* 头部不缩小 */
  }

  :deep(.el-tabs__content) {
    padding: 0;
    flex: 1; /* 内容区域占用剩余空间 */
    overflow: visible; /* 允许内容溢出到父容器的滚动区域 */
  }
}

.tab-content {
  padding: var(--spacing-lg);
  min-height: 0; /* 允许内容缩小 */
  overflow: visible; /* 允许内容溢出 */
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

// 工作区操作栏样式
.workspace-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-card {
  width: 100%;
  :deep(.edu-card__body-content) {
    padding: 16px;
  }
}

.summary-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.summary-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--edu-text-primary);
}

.summary-card__label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

// 使用标准侧栏样式
.classroom-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-lg);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.grade-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grade-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--edu-color-gray-50);
  }

  &.active {
    background-color: var(--edu-primary-50);
  }
}

.grade-count {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.status-filter {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sidebar-spacing-base) var(--sidebar-spacing-lg);
  height: var(--sidebar-category-item-height);
  border-radius: var(--sidebar-radius-lg);
  background: transparent;
  border: none;
  color: var(--sidebar-text-primary);
  cursor: pointer;
  transition: all var(--sidebar-transition-normal);
  font-size: var(--sidebar-font-size-base);
  font-weight: var(--sidebar-font-weight-medium);
  line-height: var(--sidebar-line-height-normal);
  width: 100%;
  text-align: left;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    transform: translateX(2px);
  }

  &.active {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    font-weight: var(--sidebar-font-weight-semibold);
  }
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--sidebar-radius-base);
  color: #fff;
  font-size: var(--sidebar-icon-size-sm);
  flex-shrink: 0;
  transition: all var(--sidebar-transition-normal);
}

.status-info {
  flex: 1;
  margin-left: var(--sidebar-spacing-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.status-name {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  font-size: var(--sidebar-font-size-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-count {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
  font-weight: var(--sidebar-font-weight-normal);
}

.activity-overview {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sidebar-spacing-sm) 0;
}

.activity-label {
  font-size: var(--sidebar-font-size-sm);
  color: var(--sidebar-text-secondary);
}

.activity-value {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
}

.recent-activities {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--sidebar-radius-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  flex-shrink: 0;
  font-size: var(--sidebar-icon-size-base);

  &--create {
    background: rgba(33, 150, 243, 0.12);
    color: #2196f3;
  }

  &--edit {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
  }

  &--import {
    background: rgba(76, 175, 80, 0.12);
    color: #4caf50;
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  margin-bottom: 4px;
  font-size: var(--sidebar-font-size-sm);
  line-height: var(--sidebar-line-height-tight);
}

.activity-time {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
  line-height: var(--sidebar-line-height-normal);
}

// 快捷操作样式
.classroom-quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-sm);
}

.classroom-quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: var(--sidebar-spacing-sm);
  padding: var(--sidebar-spacing-sm) var(--sidebar-spacing-base);
  height: var(--sidebar-category-item-height-sm);
  border-radius: var(--sidebar-radius-base);
  font-size: var(--sidebar-font-size-sm);
  font-weight: var(--sidebar-font-weight-medium);
  transition: all var(--sidebar-transition-normal);
  width: 100%;
  justify-content: flex-start;

  .create-icon,
  .import-icon,
  .export-icon {
    width: 16px;
    height: 16px;
    color: white;
    border-radius: 4px;
    padding: 2px;
    font-size: 10px;
    transition: all var(--sidebar-transition-normal);
  }
}

.classroom-quick-actions .el-button:hover .create-icon,
.classroom-quick-actions .el-button:hover .import-icon,
.classroom-quick-actions .el-button:hover .export-icon {
  transform: translateY(-1px) scale(1.1);
}

// 特殊图标样式
.create-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.import-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.export-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.classroom-quick-actions .el-button:hover .create-icon {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
}

.classroom-quick-actions .el-button:hover .import-icon {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4);
}

.classroom-quick-actions .el-button:hover .export-icon {
  background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 3px 8px rgba(139, 92, 246, 0.4);
}

// 右侧栏样式
.classroom-insights {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.quick-stats {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sidebar-spacing-sm) 0;
}

.stat-label {
  font-size: var(--sidebar-font-size-sm);
  color: var(--sidebar-text-secondary);
  font-weight: var(--sidebar-font-weight-normal);
}

.stat-value {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  font-size: var(--sidebar-font-size-base);
}

.classroom-resources {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--sidebar-spacing-sm);
  padding: var(--sidebar-spacing-sm);
  border-radius: var(--sidebar-radius-base);
  background: rgba(15, 23, 42, 0.04);
  transition: all var(--sidebar-transition-normal);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
}

.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--sidebar-radius-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.resource-content {
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  margin-bottom: 2px;
  font-size: var(--sidebar-font-size-sm);
}

.resource-desc {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
}

.classroom-collaboration {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.collaboration-item {
  display: flex;
  gap: var(--sidebar-spacing-sm);
  align-items: flex-start;
}

.collaboration-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--sidebar-radius-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  flex-shrink: 0;
}

.collaboration-content {
  flex: 1;
  min-width: 0;
}

.collaboration-text {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  margin-bottom: 2px;
  font-size: var(--sidebar-font-size-sm);
  line-height: var(--sidebar-line-height-tight);
}

.collaboration-time {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
  line-height: var(--sidebar-line-height-normal);
}
</style>