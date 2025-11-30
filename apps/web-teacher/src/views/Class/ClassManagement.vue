<template>
  <CanvasWorkspaceLayout
    title="班级控制台"
    subtitle="掌握班级画像、课堂节奏与学生进度"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <el-segmented v-model="classViewMode" :options="viewModeOptions" size="large" />
        <div class="workspace-actions__buttons">
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
          <div class="class-filters">
            <div class="filter-section">
              <h5>班级概览</h5>
              <div class="category-list">
                <button
                  v-for="item in classStats"
                  :key="item.type"
                  type="button"
                  class="category-item"
                  @click="filterByCategory(item.type)"
                >
                  <span class="category-icon" :style="{ backgroundColor: item.color }">
                    <el-icon><component :is="item.icon" /></el-icon>
                  </span>
                  <span class="category-name">{{ item.name }}</span>
                  <span class="category-count">{{ item.count }}</span>
                </button>
              </div>
            </div>

            <div class="filter-section">
              <h5>快速筛选</h5>
              <div class="filter-tags">
                <el-tag
                  v-for="filter in quickFilters"
                  :key="filter.key"
                  :effect="activeFilters.includes(filter.key) ? 'dark' : 'plain'"
                  :type="activeFilters.includes(filter.key) ? 'primary' : 'info'"
                  class="filter-tag"
                  @click="toggleFilter(filter.key)"
                >
                  {{ filter.label }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="class-quick-actions">
            <el-button
              type="primary"
              size="small"
              style="width: 100%; margin-bottom: 8px"
              @click="showCreateClassModal = true"
            >
              <el-icon><Plus /></el-icon>
              创建班级
            </el-button>
            <el-button
              type="default"
              size="small"
              style="width: 100%; margin-bottom: 8px"
              @click="importStudents"
            >
              <el-icon><Upload /></el-icon>
              导入学生
            </el-button>
            <el-button type="default" size="small" style="width: 100%" @click="exportClassData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </template>

        <!-- 自定义教学动态插槽 -->
        <template #activity="{ data }">
          <div class="class-activity">
            <h5>近期动态</h5>
            <div class="activity-list">
              <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                <span class="activity-icon">
                  <el-icon><component :is="activity.icon" /></el-icon>
                </span>
                <div class="activity-content">
                  <span class="activity-text">{{ activity.text }}</span>
                  <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
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
          <div class="class-insights">
            <div class="insights-overview">
              <div class="insight-item">
                <div class="insight-label">活跃班级</div>
                <div class="insight-value">{{ activeClassCount }}</div>
              </div>
              <div class="insight-item">
                <div class="insight-label">总学生数</div>
                <div class="insight-value">{{ totalStudents }}</div>
              </div>
              <div class="insight-item">
                <div class="insight-label">平均出勤</div>
                <div class="insight-value">{{ averageAttendance }}%</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义协作动态插槽 -->
        <template #collaboration="{ data }">
          <div class="class-collaboration">
            <h5>协作记录</h5>
            <div class="collaboration-list">
              <div
                v-for="record in collaborationRecords"
                :key="record.id"
                class="collaboration-item"
              >
                <el-avatar :size="32" :src="record.avatar">
                  {{ record.name.charAt(0) }}
                </el-avatar>
                <div class="collaboration-content">
                  <div class="collaboration-text">{{ record.text }}</div>
                  <div class="collaboration-meta">
                    <span>{{ record.name }}</span>
                    <span>{{ formatTime(record.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="class-resources">
            <h5>教学资源</h5>
            <div class="resource-list">
              <div v-for="resource in classResources" :key="resource.id" class="resource-item">
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
      </ManagementSidebarRight>
    </template>

    <div class="classroom-content">
      <EduCard
        class="classroom-card"
        variant="elevated"
        title="班级列表"
        subtitle="检索班级、分配课程与掌握课堂节奏"
      >
        <div class="classroom-toolbar">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="6">
              <el-input
                v-model="classSearchKeyword"
                placeholder="搜索班级名称或描述"
                clearable
                @change="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-select v-model="classGradeFilter" placeholder="按年级筛选" clearable>
                <el-option
                  v-for="grade in grades"
                  :key="grade.value"
                  :label="grade.label"
                  :value="grade.value"
                />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-select v-model="classStatusFilter" placeholder="班级状态" clearable>
                <el-option label="活跃" value="active" />
                <el-option label="已完成" value="completed" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" class="toolbar-actions">
              <el-button-group>
                <el-button
                  :type="classViewMode === 'card' ? 'primary' : 'default'"
                  @click="classViewMode = 'card'"
                >
                  <el-icon><Grid /></el-icon>
                </el-button>
                <el-button
                  :type="classViewMode === 'table' ? 'primary' : 'default'"
                  @click="classViewMode = 'table'"
                >
                  <el-icon><List /></el-icon>
                </el-button>
              </el-button-group>
            </el-col>
          </el-row>
        </div>

        <div v-if="classViewMode === 'card'" class="class-grid">
          <div v-for="classItem in filteredClasses" :key="classItem.id" class="class-card">
            <header class="class-card__header">
              <div class="class-card__title">
                <h3>{{ classItem.name }}</h3>
                <div class="class-card__tags">
                  <el-tag :type="getGradeColor(classItem.grade)" size="small">
                    {{ getGradeLabel(classItem.grade) }}
                  </el-tag>
                  <el-tag :type="getStatusColor(classItem.status)" size="small">
                    {{ getStatusLabel(classItem.status) }}
                  </el-tag>
                </div>
              </div>
              <el-dropdown @command="command => handleClassAction(command, classItem)">
                <span class="class-card__more">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑班级</el-dropdown-item>
                    <el-dropdown-item command="students">管理学生</el-dropdown-item>
                    <el-dropdown-item command="courses">分配课程</el-dropdown-item>
                    <el-dropdown-item command="analytics">学习分析</el-dropdown-item>
                    <el-dropdown-item command="archive" divided>归档班级</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </header>

            <section class="class-card__stats">
              <div class="stat-block">
                <span class="stat-label">学生</span>
                <span class="stat-value">{{ classItem.studentCount }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-label">课程</span>
                <span class="stat-value">{{ classItem.courseCount }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-label">进度</span>
                <el-progress :percentage="classItem.averageProgress" :stroke-width="6" />
              </div>
            </section>

            <section class="class-card__teacher">
              <el-avatar :size="36" :src="classItem.teacher?.avatar">
                {{ classItem.teacher?.name?.charAt(0) }}
              </el-avatar>
              <div class="teacher-info">
                <span class="teacher-name">{{ classItem.teacher?.name || '未分配' }}</span>
                <span class="teacher-role">
                  班主任 · {{ classItem.teacher?.subject || '待定' }}
                </span>
              </div>
            </section>

            <section class="class-card__courses">
              <span class="courses-label">最近课程</span>
              <div class="courses-list">
                <el-tag v-for="course in classItem.recentCourses" :key="course.id" size="small">
                  {{ course.title }}
                </el-tag>
              </div>
            </section>

            <footer class="class-card__footer">
              <el-button size="small" @click="viewClassDetail(classItem)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button size="small" @click="manageClassStudents(classItem)">
                <el-icon><User /></el-icon>
                学生管理
              </el-button>
              <el-button
                size="small"
                type="success"
                @click="startLesson(classItem)"
                :disabled="!hasActiveCourses(classItem)"
              >
                <el-icon><VideoPlay /></el-icon>
                开始上课
              </el-button>
            </footer>
          </div>
        </div>

        <el-table v-else :data="filteredClasses" border stripe>
          <el-table-column prop="name" label="班级名称" min-width="160" />
          <el-table-column prop="grade" label="年级" width="120">
            <template #default="{ row }">
              <el-tag :type="getGradeColor(row.grade)" size="small">
                {{ getGradeLabel(row.grade) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="studentCount" label="学生数" width="120" align="center" />
          <el-table-column prop="courseCount" label="课程数" width="120" align="center" />
          <el-table-column prop="averageProgress" label="平均进度" width="140" align="center">
            <template #default="{ row }">
              <el-progress :percentage="row.averageProgress" :stroke-width="6" />
            </template>
          </el-table-column>
          <el-table-column prop="teacher.name" label="班主任" width="140" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="viewClassDetail(row)">详情</el-button>
              <el-button text size="small" @click="manageClassStudents(row)">学生</el-button>
              <el-button
                text
                size="small"
                type="success"
                @click="startLesson(row)"
                :disabled="!hasActiveCourses(row)"
              >
                上课
              </el-button>
              <el-dropdown @command="command => handleClassAction(command, row)">
                <el-button text size="small">
                  更多
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="courses">分配课程</el-dropdown-item>
                    <el-dropdown-item command="analytics">学习分析</el-dropdown-item>
                    <el-dropdown-item command="archive" divided>归档班级</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </EduCard>

      <EduCard class="classroom-card" variant="bordered">
        <el-tabs v-model="activeTab" stretch>
          <el-tab-pane label="学生管理" name="students">
            <StudentManagement />
          </el-tab-pane>
          <el-tab-pane label="课程分配" name="courses">
            <CourseAssignment />
          </el-tab-pane>
          <el-tab-pane label="学习分析" name="analytics">
            <LearningAnalytics />
          </el-tab-pane>
        </el-tabs>
      </EduCard>
    </div>

    <template #footer>
      <div class="footer-column">
        <h4 class="footer-title">最近活动</h4>
        <div class="footer-list">
          <div v-for="activity in footerActivities" :key="activity.id" class="footer-item">
            <span class="footer-indicator" :class="`footer-indicator--${activity.type}`"></span>
            <span class="footer-text">{{ activity.text }}</span>
            <span class="footer-time">{{ formatTime(activity.timestamp) }}</span>
          </div>
        </div>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">系统公告</h4>
        <ul class="footer-list">
          <li v-for="notice in systemNotices" :key="notice.id" class="footer-item">
            <el-icon><Bell /></el-icon>
            <span class="footer-text">{{ notice.text }}</span>
          </li>
        </ul>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">常用操作</h4>
        <div class="support-links">
          <el-button text size="small" @click="exportData">
            <el-icon><Download /></el-icon>
            导出班级报表
          </el-button>
          <el-button text size="small" @click="createClassPlan">
            <el-icon><DataAnalysis /></el-icon>
            设计班级计划
          </el-button>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="showCreateClassModal"
      title="创建新班级"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form :model="createClassForm" :rules="createClassRules" label-width="100px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="createClassForm.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="createClassForm.grade" placeholder="选择年级">
            <el-option
              v-for="grade in grades"
              :key="grade.value"
              :label="grade.label"
              :value="grade.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班主任" prop="teacherId">
          <el-select v-model="createClassForm.teacherId" placeholder="选择班主任">
            <el-option
              v-for="teacher in availableTeachers"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.id"
            >
              <div class="teacher-option">
                <el-avatar :size="24" :src="teacher.avatar">
                  {{ teacher.name.charAt(0) }}
                </el-avatar>
                <span>{{ teacher.name }}</span>
                <span class="teacher-subject">{{ teacher.subject }}</span>
              </div>
            </el-option>
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
        <el-form-item label="学期设置">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-date-picker
                v-model="createClassForm.semesterStart"
                type="date"
                placeholder="学期开始"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-date-picker
                v-model="createClassForm.semesterEnd"
                type="date"
                placeholder="学期结束"
                style="width: 100%"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateClassModal = false">取消</el-button>
        <el-button type="primary" :loading="creatingClass" @click="createClass">创建</el-button>
      </template>
    </el-dialog>
  </CanvasWorkspaceLayout>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import {
    Plus,
    Upload,
    Download,
    User,
    School,
    Reading,
    TrendCharts,
    Search,
    Grid,
    List,
    MoreFilled,
    View,
    MagicStick,
    ArrowDown,
    Bell,
    DataAnalysis,
    VideoPlay
  } from '@element-plus/icons-vue'

  import CanvasWorkspaceLayout from '@/components/layout/CanvasWorkspaceLayout.vue'
  import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
  import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
  import { EduCard } from '@reopeninnolab/ui-kit'
  import { grades } from '@/config/courseData'
  import StudentManagement from './StudentManagement.vue'
  import CourseAssignment from './CourseAssignment.vue'
  import LearningAnalytics from './LearningAnalytics.vue'
  import { PAGE_SIDEBAR_CONFIGS } from '@/constants/managementSidebar'

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
      subject: string
    }
    recentCourses: Array<{
      id: string
      title: string
    }>
    createdAt: Date
    semesterStart: Date
    semesterEnd: Date
  }

  interface Teacher {
    id: string
    name: string
    avatar?: string
    subject: string
    email: string
  }

  interface LessonInfo {
    id: string
    courseId: string
    classId: string
    title: string
    status: 'preparing' | 'active' | 'paused' | 'completed'
    startTime: Date
    endTime?: Date
    teacherId: string
    scheduledTime: Date
    duration: number // 分钟
    chapters: any[]
    currentSection: number
    students: any[]
    settings: {
      allowQuestions: boolean
      enableChat: boolean
      recordSession: boolean
      aiAssistance: boolean
    }
    createdAt: Date
    updatedAt: Date
  }

  const router = useRouter()
  const userStore = useUserStore()
  const activeTab = ref('students')
  const classViewMode = ref<'card' | 'table'>('card')
  const classSearchKeyword = ref('')
  const classGradeFilter = ref('')
  const classStatusFilter = ref('')
  const showCreateClassModal = ref(false)
  const creatingClass = ref(false)
  const leftSidebarCollapsed = ref(false)
  const rightSidebarCollapsed = ref(false)
  const aiAssistantVisible = ref(false)
  const activeFilters = ref<string[]>([])

  const viewModeOptions = [
    { label: '卡片视图', value: 'card' },
    { label: '列表视图', value: 'table' }
  ]

  const classList = ref<ClassInfo[]>([])
  const availableTeachers = ref<Teacher[]>([])

  const createClassForm = reactive({
    name: '',
    grade: '',
    teacherId: '',
    description: '',
    semesterStart: null as Date | null,
    semesterEnd: null as Date | null
  })

  const createClassRules = {
    name: [
      { required: true, message: '请输入班级名称', trigger: 'blur' },
      { min: 2, max: 50, message: '班级名称长度在2到50个字符之间', trigger: 'blur' }
    ],
    grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
    teacherId: [{ required: true, message: '请选择班主任', trigger: 'change' }]
  }

  const filteredClasses = computed(() => {
    let filtered = classList.value

    if (classSearchKeyword.value) {
      const keyword = classSearchKeyword.value.toLowerCase()
      filtered = filtered.filter(
        cls =>
          cls.name.toLowerCase().includes(keyword) ||
          (cls.description && cls.description.toLowerCase().includes(keyword))
      )
    }

    if (classGradeFilter.value) {
      filtered = filtered.filter(cls => cls.grade === classGradeFilter.value)
    }

    if (classStatusFilter.value) {
      filtered = filtered.filter(cls => cls.status === classStatusFilter.value)
    }

    return filtered
  })

  // 侧边栏配置
  const leftSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.classrooms.left)
  const rightSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.classrooms.right)

  // 数据洞察计算属性
  const activeClassCount = computed(
    () => classList.value.filter(cls => cls.status === 'active').length
  )

  const totalStudents = computed(() =>
    classList.value.reduce((sum, cls) => sum + cls.studentCount, 0)
  )

  const averageAttendance = computed(() => {
    // 模拟平均出勤率
    return 85
  })

  const summaryStats = computed(() => ({
    totalStudents: classList.value.reduce((sum, cls) => sum + cls.studentCount, 0),
    totalClasses: classList.value.length,
    averageProgress:
      classList.value.length > 0
        ? Math.round(
            classList.value.reduce((sum, cls) => sum + cls.averageProgress, 0) /
              classList.value.length
          )
        : 0
  }))

  const summaryCards = computed(() => [
    {
      id: 'students',
      label: '学生总数',
      value: `${summaryStats.value.totalStudents}`,
      icon: User,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'classes',
      label: '班级总数',
      value: `${summaryStats.value.totalClasses}`,
      icon: School,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'progress',
      label: '平均进度',
      value: `${summaryStats.value.averageProgress}%`,
      icon: TrendCharts,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ])

  const classStats = computed(() => [
    {
      name: '活跃班级',
      count: classList.value.filter(c => c.status === 'active').length,
      icon: 'School',
      color: '#4ECDC4',
      type: 'active'
    },
    {
      name: '高一',
      count: classList.value.filter(c => c.grade === 'grade10').length,
      icon: 'Reading',
      color: '#45B7D1',
      type: 'grade10'
    },
    {
      name: '高二',
      count: classList.value.filter(c => c.grade === 'grade11').length,
      icon: 'Reading',
      color: '#96CEB4',
      type: 'grade11'
    },
    {
      name: '高三',
      count: classList.value.filter(c => c.grade === 'grade12').length,
      icon: 'Reading',
      color: '#FFB347',
      type: 'grade12'
    }
  ])

  const quickFilters = computed(() => [
    { key: 'active', label: '活跃班级' },
    { key: 'recent', label: '最近创建' },
    { key: 'completed', label: '已完成' },
    { key: 'archived', label: '已归档' }
  ])

  const recentActivities = ref([
    {
      id: 'activity-1',
      text: '创建了 “高一(1)班”',
      type: 'create',
      icon: 'Plus',
      timestamp: Date.now() - 86400000
    },
    {
      id: 'activity-2',
      text: '调整 “高二(3)班” 班级信息',
      type: 'edit',
      icon: 'MagicStick',
      timestamp: Date.now() - 172800000
    },
    {
      id: 'activity-3',
      text: '分配 “数学提高班” 课程',
      type: 'system',
      icon: 'Bell',
      timestamp: Date.now() - 259200000
    }
  ])

  const aiSuggestions = ref([
    {
      id: 'suggest-1',
      text: '为高一(1)班增加课堂互动，提高参与度',
      type: '课堂优化',
      icon: 'MagicStick'
    },
    {
      id: 'suggest-2',
      text: '高二(3)班物理进度偏慢，建议增加辅导',
      type: '进度提醒',
      icon: 'TrendCharts'
    },
    {
      id: 'suggest-3',
      text: '高三班级作业提交率 95%，可以适当加大难度',
      type: '难度调整',
      icon: 'DataAnalysis'
    }
  ])

  const collaborationRecords = ref([
    {
      id: 'collab-1',
      name: '张老师',
      text: '分享 "高一(1)班" 晨读管理经验',
      avatar: '',
      timestamp: Date.now() - 3600000
    },
    {
      id: 'collab-2',
      name: '李老师',
      text: '建议更新高二实验安排',
      avatar: '',
      timestamp: Date.now() - 7200000
    }
  ])

  const classResources = ref([
    {
      id: 'resource-1',
      title: '班级管理手册',
      description: '班级日常管理指南',
      color: '#1890ff',
      icon: 'Document'
    },
    {
      id: 'resource-2',
      title: '学生信息模板',
      description: '学生档案标准格式',
      color: '#52c41a',
      icon: 'Grid'
    },
    {
      id: 'resource-3',
      title: '家长会资料',
      description: '家长会准备材料',
      color: '#722ed1',
      icon: 'User'
    }
  ])

  const footerActivities = ref([
    {
      id: 'footer-1',
      text: '王老师完成班级教材分发',
      type: 'success',
      timestamp: Date.now() - 1800000
    },
    {
      id: 'footer-2',
      text: '系统自动备份班级数据',
      type: 'system',
      timestamp: Date.now() - 3600000
    },
    { id: 'footer-3', text: '新生加入高一(2)班', type: 'info', timestamp: Date.now() - 5400000 }
  ])

  const systemNotices = ref([
    { id: 'notice-1', text: '周五 15:00 班主任例会，请提前准备班情简报。' },
    { id: 'notice-2', text: '班级行为分析即将更新，敬请关注。' }
  ])

  const toggleFilter = (filterKey: string) => {
    const index = activeFilters.value.indexOf(filterKey)
    if (index > -1) {
      activeFilters.value.splice(index, 1)
    } else {
      activeFilters.value.push(filterKey)
    }
  }

  const filterByCategory = (category: string) => {
    ElMessage.info(`按类别筛选：${category}`)
  }

  const applySuggestion = (suggestion: any) => {
    ElMessage.success(`已采纳建议：${suggestion.text}`)
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    return `${days} 天前`
  }

  const handleSearch = () => {
    /* 占位：当前使用 computed 过滤即可 */
  }

  const exportData = () => {
    ElMessage.success('班级报表正在导出')
  }

  const createClassPlan = () => {
    ElMessage.info('班级计划功能即将开放')
  }

  // 侧边栏事件处理
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
    console.log('Class filters changed:', filters)
    // 应用筛选逻辑
  }

  const handleResourceAction = (action: string, id: string | number) => {
    console.log('Resource action:', action, id)
  }

  const handleCollaborationAction = (action: string, data: any) => {
    console.log('Collaboration action:', action, data)
  }

  const importStudents = () => {
    ElMessage.info('导入学生功能开发中...')
  }

  const exportClassData = () => {
    ElMessage.info('导出班级数据功能开发中...')
  }

  const openResource = (resource: any) => {
    if (resource) {
      ElMessage.info(`查看资源: ${resource.title}`)
    }
  }

  const getGradeLabel = (grade: string) => {
    const item = grades.find(g => g.value === grade)
    return item ? item.label : grade
  }

  const getGradeColor = (grade: string): 'primary' | 'success' | 'warning' | 'info' => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
      grade10: 'primary',
      grade11: 'success',
      grade12: 'warning'
    }
    return map[grade] || 'info'
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      active: '活跃',
      completed: '已完成',
      archived: '已归档'
    }
    return map[status] || status
  }

  const getStatusColor = (
    status: string
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
      active: 'success',
      completed: 'primary',
      archived: 'warning'
    }
    return map[status] || 'info'
  }

  const loadClassList = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    classList.value = [
      {
        id: 'class-1',
        name: '高一(1)班',
        grade: 'grade10',
        description: '理科实验班，强调探究式学习',
        studentCount: 45,
        courseCount: 8,
        averageProgress: 78,
        status: 'active',
        teacher: { id: 't1', name: '张老师', subject: '数学' },
        recentCourses: [
          { id: 'course-1', title: '数学·函数与图像' },
          { id: 'course-2', title: '物理·力学基础' }
        ],
        createdAt: new Date('2023-08-20'),
        semesterStart: new Date('2023-09-01'),
        semesterEnd: new Date('2024-01-15')
      },
      {
        id: 'class-2',
        name: '高二(3)班',
        grade: 'grade11',
        description: '综合班，注重跨学科学习',
        studentCount: 43,
        courseCount: 7,
        averageProgress: 72,
        status: 'active',
        teacher: { id: 't2', name: '李老师', subject: '化学' },
        recentCourses: [
          { id: 'course-3', title: '化学·有机反应' },
          { id: 'course-4', title: '生物·遗传基础' }
        ],
        createdAt: new Date('2022-08-20'),
        semesterStart: new Date('2023-09-01'),
        semesterEnd: new Date('2024-01-15')
      }
    ]
  }

  const loadTeachers = async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    availableTeachers.value = [
      { id: 't1', name: '张老师', subject: '数学', email: 'zhang@school.edu' },
      { id: 't2', name: '李老师', subject: '化学', email: 'li@school.edu' }
    ]
  }

  const createClass = async () => {
    if (!createClassForm.name || !createClassForm.grade || !createClassForm.teacherId) {
      ElMessage.warning('请完善班级信息')
      return
    }
    creatingClass.value = true
    await new Promise(resolve => setTimeout(resolve, 600))
    ElMessage.success('班级创建成功')
    showCreateClassModal.value = false
    creatingClass.value = false
    await loadClassList()
  }

  const manageClassStudents = (classItem: ClassInfo) => {
    ElMessage.info(`打开 ${classItem.name} 的学生管理`)
  }

  const viewClassDetail = (classItem: ClassInfo) => {
    ElMessage.info(`查看 ${classItem.name} 班级详情`)
  }

  const handleClassAction = (command: string, classItem: ClassInfo) => {
    ElMessage.info(`操作 ${command}：${classItem.name}`)
  }

  const hasActiveCourses = (classItem: ClassInfo): boolean => {
    return classItem.courseCount > 0
  }

  const startLesson = async (classItem: ClassInfo) => {
    try {
      // 获取班级的活跃课程
      const activeCourses = classItem.recentCourses || []

      if (activeCourses.length === 0) {
        ElMessage.warning('该班级暂无可用课程')
        return
      }

      // 如果只有一个课程，直接开始
      if (activeCourses.length === 1) {
        await createAndStartLesson(classItem, activeCourses[0])
      } else {
        // 显示课程选择对话框
        await showCourseSelectionDialog(classItem, activeCourses)
      }
    } catch (error) {
      // 用户取消操作
      console.log('取消开始上课:', error)
    }
  }

  // 创建并开始课程
  const createAndStartLesson = async (classItem: ClassInfo, course: any) => {
    try {
      await ElMessageBox.confirm(
        `确定要为 "${classItem.name}" 开始课程 "${course.title}" 吗？`,
        '开始上课',
        {
          confirmButtonText: '开始上课',
          cancelButtonText: '取消',
          type: 'info'
        }
      )

      // 创建Lesson实体
      const lessonId = `lesson_${course.id}_${classItem.id}_${Date.now()}`
      const lesson: LessonInfo = {
        id: lessonId,
        courseId: course.id,
        classId: classItem.id,
        title: course.title,
        status: 'preparing',
        startTime: new Date(),
        teacherId: userStore.id,
        scheduledTime: new Date(),
        duration: course.duration || 45,
        chapters: course.chapters || [],
        currentSection: 0,
        students: classItem.students || [],
        settings: {
          allowQuestions: true,
          enableChat: true,
          recordSession: false,
          aiAssistance: course.aiEnhanced || false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 保存Lesson到状态管理
      await saveLessonToStore(lesson)

      // 跳转到Presenter模式
      router.push(`/presenter/${lessonId}`)
      ElMessage.success('正在进入课堂播放模式')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('创建课程失败:', error)
        ElMessage.error('创建课程失败')
      }
    }
  }

  // 显示课程选择对话框
  const showCourseSelectionDialog = async (classItem: ClassInfo, courses: any[]) => {
    try {
      const { value: selectedCourse } = await ElMessageBox.prompt(
        '请选择要开始的课程',
        `为 ${classItem.name} 选择课程`,
        {
          confirmButtonText: '开始上课',
          cancelButtonText: '取消',
          inputType: 'select',
          inputOptions: courses.reduce(
            (options, course) => {
              options[course.id] = `${course.title} (${course.duration || 45}分钟)`
              return options
            },
            {} as Record<string, string>
          ),
          inputValidator: value => {
            if (!value) {
              return '请选择一个课程'
            }
            return true
          }
        }
      )

      if (selectedCourse) {
        const course = courses.find(c => c.id === selectedCourse)
        if (course) {
          await createAndStartLesson(classItem, course)
        }
      }
    } catch (error) {
      console.log('取消课程选择')
    }
  }

  // 保存Lesson到状态管理
  const saveLessonToStore = async (lesson: LessonInfo) => {
    try {
      // 这里应该调用API保存到后端
      // 暂时保存到localStorage作为模拟
      const existingLessons = JSON.parse(localStorage.getItem('lessons') || '[]')
      existingLessons.push(lesson)
      localStorage.setItem('lessons', JSON.stringify(existingLessons))

      // 也可以保存到useClassroomStore（需要创建）
      console.log('Lesson已保存:', lesson)
    } catch (error) {
      console.error('保存Lesson失败:', error)
      throw error
    }
  }

  onMounted(async () => {
    await Promise.all([loadClassList(), loadTeachers()])
  })
</script>

<style scoped lang="scss">
  .workspace-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .workspace-actions__buttons {
    display: flex;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
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

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.04);
    border: none;
    cursor: pointer;
    color: inherit;
    transition:
      transform 0.2s ease,
      background 0.2s ease;
  }

  .category-item:hover {
    transform: translateX(4px);
    background: rgba(99, 102, 241, 0.12);
  }

  .category-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .category-name {
    flex: 1;
    margin-left: 12px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }

  .category-count {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tag {
    cursor: pointer;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .activity-item {
    display: flex;
    gap: 12px;
  }

  .activity-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    background: rgba(79, 70, 229, 0.12);
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .activity-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .activity-text {
    font-size: 13px;
    color: var(--edu-text-primary);
  }

  .activity-time {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }

  .suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    border: none;
    background: rgba(15, 23, 42, 0.04);
    cursor: pointer;
    text-align: left;
  }

  .suggestion-item:hover {
    background: rgba(99, 102, 241, 0.12);
  }

  .suggestion-icon {
    width: 32px;
    height: 32px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
  }

  .suggestion-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .collaboration-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .collaboration-item {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .collaboration-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--edu-text-primary);
  }

  .collaboration-meta {
    font-size: 12px;
    color: var(--edu-text-secondary);
    display: flex;
    gap: 8px;
  }

  .classroom-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .classroom-card {
    width: 100%;
    :deep(.edu-card__body-content) {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
  }

  .classroom-toolbar {
    background: rgba(15, 23, 42, 0.04);
    border-radius: 16px;
    padding: 16px;
  }

  .toolbar-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .class-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .class-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    border-radius: 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.96) 0%,
      rgba(243, 245, 250, 0.92) 100%
    );
    box-shadow: 0 20px 45px -26px rgba(15, 23, 42, 0.45);
  }

  .class-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .class-card__title {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .class-card__tags {
    display: flex;
    gap: 8px;
  }

  .class-card__more {
    color: var(--edu-text-secondary);
    cursor: pointer;
  }

  .class-card__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .stat-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.04);
  }

  .stat-label {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }

  .class-card__teacher {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .teacher-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .teacher-name {
    font-weight: 600;
  }

  .teacher-role {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }

  .class-card__courses {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .courses-label {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }

  .courses-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .class-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .footer-title {
    font-size: 16px;
    font-weight: 600;
  }

  .footer-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .footer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--edu-text-secondary);
  }

  .footer-indicator {
    width: 8px;
    height: 8px;
    border-radius: 999px;
  }

  .footer-indicator--success {
    background: #22c55e;
  }
  .footer-indicator--system {
    background: #3b82f6;
  }
  .footer-indicator--info {
    background: #f59e0b;
  }

  .support-links {
    display: flex;
    gap: 12px;
  }

  .teacher-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .teacher-subject {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }

  @media (max-width: 960px) {
    .workspace-actions {
      flex-direction: column;
      align-items: flex-start;
    }

    .class-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .summary-card,
    .category-item,
    .class-card,
    .suggestion-item {
      transition: none !important;
    }
  }
</style>
