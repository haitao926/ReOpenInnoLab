<template>
  <CanvasWorkspaceLayout
    title="课程工作台"
    subtitle="管理您的 AI 赋能教学课程"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <WorkspacePrimaryToolbar
        :create-button-text="'创建课程'"
        :import-button-text="'导入课程'"
        :show-ai-button="true"
        :ai-active="aiAssistantVisible"
        @create="createCourse"
        @import="importCourse"
        @ai="toggleAIAssistant"
      />
    </template>

    <template #summary>
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        class="summary-card"
        variant="glass"
        size="sm"
        :hoverable="true"
        body-class="summary-card__body"
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
        :subject-options="subjectOptionsForSidebar"
        :initial-filters="sidebarFilters"
        @quick-action="handleQuickAction"
        @filter-change="handleFilterChange"
      >
        <!-- 自定义筛选器插槽 -->
        <template #filters="{ data }">
          <div class="custom-filters">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索我的课程"
              clearable
              class="sidebar-search"
              @change="searchCourses"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <div class="category-list">
              <button
                v-for="category in categoryStats"
                :key="category.type"
                type="button"
                class="category-item"
                @click="filterByCategory(category.type)"
              >
                <span class="category-icon" :style="{ backgroundColor: category.color }">
                  <el-icon><component :is="category.icon" /></el-icon>
                </span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }} 门</span>
              </button>
            </div>

            <div class="filter-tags">
              <el-tag
                v-for="filter in quickFilters"
                :key="filter.key"
                :type="activeFilters.includes(filter.key) ? 'primary' : 'info'"
                :effect="activeFilters.includes(filter.key) ? 'dark' : 'plain'"
                @click="toggleFilter(filter.key)"
                class="filter-tag"
              >
                {{ filter.label }}
              </el-tag>
            </div>
          </div>
        </template>

        <!-- 自定义快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="custom-quick-actions">
            <div class="action-section">
              <el-button type="primary" size="small" style="width: 100%; margin-bottom: 8px;" @click="createNewCourse">
                <el-icon><Plus /></el-icon>
                新建课程
              </el-button>
              <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="importCourse">
                <el-icon><Upload /></el-icon>
                导入课程
              </el-button>
            </div>
            <div class="action-section">
              <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="batchExport">
                <el-icon><Download /></el-icon>
                导出课程
              </el-button>
              <el-button type="default" size="small" style="width: 100%;" @click="batchEdit">
                <el-icon><Edit /></el-icon>
                批量编辑
              </el-button>
            </div>
          </div>
        </template>

        <!-- 自定义教学动态插槽 -->
        <template #activity="{ data }">
          <div class="custom-activity">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <span class="activity-icon" :class="`activity-icon--${activity.type}`">
                <el-icon><component :is="activity.icon" /></el-icon>
              </span>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarLeft>
    </template>

    <template #right>
      <ManagementSidebarRight
        :sections="rightSidebarSections"
        @ai-action="handleAIAction"
        @resource-action="handleResourceAction"
        @help-action="handleHelpAction"
      >
        <!-- 自定义 AI 助手插槽 -->
        <template #ai-assistant="{ data }">
          <div class="custom-ai-assistant">
            <div class="ai-suggestions">
              <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">AI 建议</h5>
              <div class="suggestion-list">
                <button
                  v-for="suggestion in aiSuggestions"
                  :key="suggestion.id"
                  type="button"
                  class="suggestion-item"
                  @click="applySuggestion(suggestion)"
                >
                  <span class="suggestion-icon">
                    <el-icon><component :is="suggestion.icon" /></el-icon>
                  </span>
                  <div class="suggestion-content">
                    <span class="suggestion-text">{{ suggestion.text }}</span>
                    <span class="suggestion-type">{{ suggestion.type }}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="custom-resources">
            <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">教学资源</h5>
            <div class="resource-list">
              <button
                v-for="resource in resourceReferences"
                :key="resource.id"
                type="button"
                class="resource-item"
                @click="openResource(resource)"
              >
                <span class="resource-icon" :style="{ backgroundColor: resource.color }">
                  <el-icon><component :is="resource.icon" /></el-icon>
                </span>
                <div class="resource-info">
                  <span class="resource-name">{{ resource.name }}</span>
                  <span class="resource-type">{{ resource.type }}</span>
                </div>
              </button>
            </div>
          </div>
        </template>

        <!-- 自定义协作记录插槽 -->
        <template #collaboration="{ data }">
          <div class="custom-collaboration">
            <div class="collaboration-list">
              <div
                v-for="record in collaborationRecords"
                :key="record.id"
                class="collaboration-item"
              >
                <el-avatar :size="32" :src="record.avatar">
                  {{ record.userName.charAt(0) }}
                </el-avatar>
                <div class="collaboration-content">
                  <div class="collaboration-text">{{ record.action }}</div>
                  <div class="collaboration-meta">
                    <span class="collaboration-target">{{ record.target }}</span>
                    <span class="collaboration-time">{{ formatTime(record.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义统计信息插槽 -->
        <template #stats="{ data }">
          <div class="custom-stats">
            <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">课程统计</h5>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ summaryStats.value.totalCourses }}</div>
                <div class="stat-label">本学科课程</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ summaryStats.value.totalStudents }}</div>
                <div class="stat-label">覆盖学生</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ summaryStats.value.avgProgress }}%</div>
                <div class="stat-label">平均进度</div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarRight>
    </template>

                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                    <div class="course-meta">
                      <span class="course-grade">{{ row.gradeBand || row.grade || '未设置' }} 年级</span>
                      <span class="course-teacher">{{ row.teacher || '当前用户' }}</span>
                      <span class="course-students">{{ row.enrolledCount || row.students || 0 }}/{{ row.maxStudents || 30 }} 学生</span>
                      <span class="course-updated">{{ formatDate(row.updatedAt) }}</span>
                    </div>
                    <div class="course-progress">
                      <el-progress
                        :percentage="row.progress"
                        :stroke-width="6"
                        :color="getProgressColor(row.progress)"
                        :show-text="false"
                      />
                      <span class="progress-text">{{ row.progress }}%</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
                            <el-table-column label="标签" width="180" align="right">
                <template #default="{ row }">
                  <div class="course-tags">
                    <el-tag :type="getSubjectTagType(row.subject)" size="small" effect="light">
                      {{ getSubjectName(row.subject) }}
                    </el-tag>
                    <el-tag v-if="row.isPublic" type="info" size="small" effect="light">公开</el-tag>
                    <el-tag :type="getStatusTagType(row.status)" size="small" effect="light">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div v-else class="courses-grid">
              <div
                v-for="course in paginatedCourses"
                :key="course.id"
                class="course-card"
                @click="viewCourse(course.id)"
              >
                <!-- 课程封面区域 -->
                <div class="course-card__cover">
                  <div class="course-thumbnail">
                    <img
                      v-if="course.thumbnail"
                      :src="course.thumbnail"
                      :alt="course.title"
                      class="course-thumbnail__image"
                    />
                    <div v-else class="course-thumbnail__placeholder">
                      <el-icon><Document /></el-icon>
                    </div>
                  </div>
                  <div class="course-cover__overlay">
                    <div class="course-cover__badge">
                      <el-tag :type="getSubjectTagType(course.subject)" size="small" effect="dark">
                        {{ getSubjectName(course.subject) }}
                      </el-tag>
                    </div>
                    <div class="course-cover__status">
                      <el-tag :type="getStatusTagType(course.status)" size="small" effect="dark">
                        {{ getStatusText(course.status) }}
                      </el-tag>
                    </div>
                  </div>
                </div>

                <!-- 课程内容区域 -->
                <div class="course-card__content">
                  <div class="course-card__header">
                    <h4 class="course-card__title">{{ course.title }}</h4>
                    <div class="course-card__meta">
                      <span class="course-grade">{{ course.gradeBand || course.grade || '未设置' }}</span>
                      <el-rate
                        v-if="course.rating"
                        :model-value="course.rating"
                        disabled
                        size="small"
                        show-score
                      />
                    </div>
                  </div>

                  <p class="course-card__description">{{ course.description }}</p>

                  <!-- 课程统计信息 -->
                  <div class="course-card__stats">
                    <div class="stat-group">
                      <div class="stat-item">
                        <el-icon><User /></el-icon>
                        <span class="stat-value">{{ course.enrolledCount || course.students || 0 }}</span>
                        <span class="stat-label">学生</span>
                      </div>
                      <div class="stat-item">
                        <el-icon><Clock /></el-icon>
                        <span class="stat-value">{{ course.duration || 0 }}h</span>
                        <span class="stat-label">课时</span>
                      </div>
                      <div class="stat-item">
                        <el-icon><FolderOpened /></el-icon>
                        <span class="stat-value">{{ getChapterCount(course) }}</span>
                        <span class="stat-label">章节</span>
                      </div>
                    </div>

                    <div class="progress-section">
                      <div class="progress-header">
                        <span class="progress-label">课程进度</span>
                        <span class="progress-value">{{ course.progress || 0 }}%</span>
                      </div>
                      <el-progress
                        :percentage="course.progress || 0"
                        :stroke-width="8"
                        :color="getProgressColor(course.progress || 0)"
                        :show-text="false"
                      />
                    </div>
                  </div>
                </div>

                <!-- 底部操作区域 -->
                <div class="course-card__footer">
                  <div class="course-card__actions">
                    <el-button size="small" @click.stop="viewCourse(course.id)">
                      <el-icon><View /></el-icon>
                      查看
                    </el-button>
                    <el-button size="small" type="primary" @click.stop="editCourse(course.id)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                    <el-dropdown trigger="click" @command="handleCourseAction">
                      <el-button size="small" text @click.stop>
                        <el-icon><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="{ action: 'copy', id: course.id }">
                            <el-icon><CopyDocument /></el-icon>
                            复制课程
                          </el-dropdown-item>
                          <el-dropdown-item :command="{ action: 'archive', id: course.id }">
                            <el-icon><FolderRemove /></el-icon>
                            归档课程
                          </el-dropdown-item>
                        <el-dropdown-item :command="{ action: 'delete', id: course.id }">
                          <span class="danger-text">删除课程</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                      </template>

                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>

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
        </EduCard>
      </section>

      <el-dialog
        v-model="courseDialogVisible"
        :title="courseDialogMode === 'create' ? '创建课程' : '编辑课程'"
        width="600px"
        destroy-on-close
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
            <el-select v-model="courseForm.subject" placeholder="当前学科" disabled>
              <el-option :label="subjectDisplayName" :value="teacherSubject" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级" prop="grade">
            <el-select v-model="courseForm.grade" placeholder="请选择年级">
              <el-option
                v-for="grade in gradeOptions"
                :key="grade.value"
                :label="grade.label"
                :value="grade.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="最大学生数" prop="maxStudents">
            <el-input-number v-model="courseForm.maxStudents" :min="10" :max="200" />
          </el-form-item>
          <el-form-item label="课程描述" prop="description">
            <el-input
              v-model="courseForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入课程描述"
            />
          </el-form-item>
          <el-form-item label="是否公开">
            <el-switch v-model="courseForm.isPublic" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="courseDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="submitCourse">
              {{ courseDialogMode === 'create' ? '创建' : '保存' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <!-- 高级筛选抽屉 -->
    <FilterDrawer
      v-model="filterDrawerVisible"
      :subjects="[]"
      :grade-options="gradeOptions"
      :initial-filters="advancedFilters"
      :filtered-count="filteredCourses.length"
      @apply-filters="applyAdvancedFilters"
    />
  </CanvasWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Plus,
  Upload,
  Search,
  Grid,
  List,
  ArrowDown,
  MagicStick,
  Reading,
  TrendCharts,
  User,
  Bell,
  Filter,
  RefreshRight,
  Download,
  Edit,
  Timer,
  Cpu,
  DataAnalysis,
  Monitor,
  Guide,
  Document,
  Clock,
  FolderOpened,
  CopyDocument,
  FolderRemove,
  View,
  MoreFilled
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import WorkspacePrimaryToolbar from '@/components/workspace/WorkspacePrimaryToolbar.vue'
import { EduCard, EduAccordion, EduTabs } from '@reopeninnolab/ui-kit'
import FilterDrawer from '@/components/course/FilterDrawer.vue'
import { useAppStore } from '@/stores/app'
import { useCourseStore } from '@/stores/course'
import { storeToRefs } from 'pinia'
import { formatDate } from '@/utils/date'
import { PAGE_SIDEBAR_CONFIGS, DEFAULT_LEFT_SIDEBAR_SECTIONS, DEFAULT_RIGHT_SIDEBAR_SECTIONS, type LeftSidebarSectionConfig, type RightSidebarSectionConfig } from '@/constants/managementSidebar'

interface Course {
  id: string
  title: string
  subject: string
  gradeBand?: string  // API可能使用gradeBand而不是grade
  grade?: string
  teacher?: string
  students?: number
  enrolledCount?: number  // API可能使用enrolledCount
  maxStudents?: number
  progress?: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'active' | 'completed' | 'archived'
  isPublic?: boolean
  description?: string
  thumbnail?: string
  rating?: number
  duration?: number
  modules?: any[]
  aclContent?: any
  createdAt: string | Date
  updatedAt: string | Date
}

interface Filters {
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
const courseStore = useCourseStore()

const loading = ref(false)
const viewMode = ref<'table' | 'grid'>('table')
const courseDialogVisible = ref(false)
const courseDialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const courseFormRef = ref<FormInstance>()
const courseForm = ref({
  title: '',
  subject: '',
  grade: '',
  maxStudents: 30,
  description: '',
  isPublic: false
})
const selectedCourses = ref<string[]>([])
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const aiAssistantVisible = ref(false)
const activeFilters = ref<string[]>([])
const filterDrawerCollapsed = ref(false)
const activeRightTab = ref('ai-suggestions')

// 筛选器状态
const filterDrawerVisible = ref(false)
const advancedFilters = ref<{
  quickFilters: string[]
  subjects: string[]
  grades: string[]
  statuses: string[]
  dateRange: string[]
}>({
  quickFilters: [],
  subjects: [],
  grades: [],
  statuses: [],
  dateRange: []
})

const { selectedSubject: storeSubject } = storeToRefs(appStore)

const teacherSubject = computed(() => {
  const subject = storeSubject.value
  if (subject && subject !== 'all' && subject !== 'my-subjects') {
    return subject
  }
  return 'ai'
})

// 年级选项
const gradeOptions = [
  { label: '一年级', value: 'grade1' },
  { label: '二年级', value: 'grade2' },
  { label: '三年级', value: 'grade3' },
  { label: '四年级', value: 'grade4' },
  { label: '五年级', value: 'grade5' },
  { label: '六年级', value: 'grade6' },
  { label: '七年级', value: 'grade7' },
  { label: '八年级', value: 'grade8' },
  { label: '九年级', value: 'grade9' },
  { label: '高一', value: 'grade10' },
  { label: '高二', value: 'grade11' },
  { label: '高三', value: 'grade12' }
]

const viewModeOptions = [
  { label: '列表视图', value: 'table' },
  { label: '卡片视图', value: 'grid' }
]

const filters = reactive<Filters>({
  grade: '',
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 12
})

// 使用真实课程数据
const courses = computed(() => courseStore.courses)

const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    if (teacherSubject.value !== 'all' && course.subject !== teacherSubject.value) return false

    // 处理年级筛选，兼容不同的字段名
    const courseGrade = course.gradeBand || course.grade
    if (filters.grade && courseGrade !== filters.grade) return false

    // 处理状态筛选，兼容不同的状态值
    if (filters.status) {
      const courseStatus = course.status?.toLowerCase()
      const filterStatus = filters.status.toLowerCase()

      // 映射状态值
      const statusMap: Record<string, string[]> = {
        'active': ['active', 'published'],
        'completed': ['completed'],
        'archived': ['archived'],
        'draft': ['draft']
      }

      const matchingStatuses = statusMap[filterStatus] || [filterStatus]
      if (!matchingStatuses.includes(courseStatus)) return false
    }

    if (filters.keyword && !course.title.toLowerCase().includes(filters.keyword.toLowerCase())) return false
    return true
  })
})

const paginatedCourses = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredCourses.value.slice(start, end)
})

const summaryStats = computed(() => {
  const courseList = filteredCourses.value
  if (courseList.length === 0) {
    return {
      totalCourses: 0,
      avgProgress: 0,
      totalStudents: 0
    }
  }

  // 基于真实课程数据结构
  const totalCourses = courseList.length
  const totalStudents = courseList.reduce((sum, course) => {
    // 从课程数据中获取学生数，如果没有则使用maxStudents或默认值
    return sum + (course.students || course.enrolledCount || course.maxStudents || 0)
  }, 0)
  const avgProgress = Math.round(
    courseList.reduce((sum, course) => sum + (course.progress || 0), 0) / courseList.length
  )

  return {
    totalCourses,
    avgProgress,
    totalStudents
  }
})

const summaryCards = computed(() => [
  {
    id: 'courses',
    label: '本学科课程数',
    value: `${summaryStats.value.totalCourses}`,
    icon: Cpu,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'progress',
    label: '平均项目进度',
    value: `${summaryStats.value.avgProgress}%`,
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  },
  {
    id: 'students',
    label: '覆盖学生',
    value: `${summaryStats.value.totalStudents} 人`,
    icon: User,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
])

const SUBJECT_VISUALS: Record<string, { icon: string; color: string }> = {
  ai: { icon: 'Cpu', color: '#6366f1' }
}

const SUBJECT_LABELS: Record<string, string> = {
  ai: '人工智能'
}

const subjectDisplayName = computed(() => SUBJECT_LABELS[teacherSubject.value] || '本学科')

const currentSubjectVisual = computed(() => SUBJECT_VISUALS[teacherSubject.value] || SUBJECT_VISUALS['ai'])

const categoryStats = computed(() => [
  {
    name: subjectDisplayName.value,
    count: filteredCourses.value.length,
    icon: currentSubjectVisual.value.icon,
    color: currentSubjectVisual.value.color,
    type: teacherSubject.value
  }
])

const quickFilters = computed(() => [
  { key: 'recent', label: '最近创建' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'archived', label: '已归档' }
])

const recentActivities = ref([
  { id: '1', text: '发布了 “AI 创意编程工作坊” 单元任务', type: 'create', icon: Plus, timestamp: Date.now() - 86400000 },
  { id: '2', text: '更新了 “AI 数据洞察实验” 数据集', type: 'edit', icon: Edit, timestamp: Date.now() - 172800000 },
  { id: '3', text: '完成 “AI 视觉巡线项目” 项目复盘', type: 'system', icon: Bell, timestamp: Date.now() - 259200000 }
])

// 根据当前选中的课程动态生成AI建议
const aiSuggestions = computed(() => {
  const selectedCount = selectedCourses.value.length
  const suggestions = []

  if (selectedCount === 0) {
    suggestions.push(
      { id: 'default-1', text: '为 AI 创意编程课程添加图像生成案例，提升项目创意度。', type: '课程优化', icon: MagicStick },
      { id: 'default-2', text: 'AI 数据洞察实验本周提交率下降 12%，建议插入课堂小测。', type: '进度提醒', icon: Timer },
      { id: 'default-3', text: 'AI 视觉项目需提前推送调试检查清单。', type: '教学提醒', icon: TrendCharts }
    )
  } else {
    suggestions.push(
      { id: 'selected-1', text: `已选中 ${selectedCount} 个课程，可批量添加 AI 助教功能。`, type: '批量操作', icon: Plus },
      { id: 'selected-2', text: '建议为选中课程统一配置 AI 评分标准。', type: '标准化', icon: Document },
      { id: 'selected-3', text: '可以基于选中课程创建 AI 教学模板。', type: '模板创建', icon: MagicStick }
    )
  }

  return suggestions
})

// 根据学科筛选动态生成资源引用
const resourceReferences = computed(() => {
  const subject = teacherSubject.value
  const baseResources = [
    { id: '1', name: 'AI 提示词案例库', type: '模板资源', icon: Document, color: '#6366f1' },
    { id: '2', name: 'AI 数据洞察示例集', type: '教学资源', icon: Grid, color: '#0ea5e9' },
    { id: '3', name: 'AI 视觉调试指南', type: '工具资源', icon: Cpu, color: '#f97316' }
  ]

  // 根据学科添加特定资源
  if (subject === 'ai') {
    baseResources.push(
      { id: '4', name: '机器学习算法集', type: '代码库', icon: Cpu, color: '#10b981' },
      { id: '5', name: '深度学习框架指南', type: '教程', icon: Document, color: '#8b5cf6' }
    )
  }

  return baseResources
})

// 协作记录（模拟实时数据）
const collaborationRecords = ref([
  { id: '1', name: '李老师', text: '为 "AI 数据洞察实验" 添加了实训反馈', avatar: '', timestamp: Date.now() - 3600000 },
  { id: '2', name: '王老师', text: '共享了 AI 提示词在课堂的使用经验', avatar: '', timestamp: Date.now() - 7200000 },
  { id: '3', name: '张老师', text: '更新了 AI 视觉项目的调试步骤', avatar: '', timestamp: Date.now() - 1800000 }
])

// 模拟新的协作记录
const addCollaborationRecord = (name: string, text: string) => {
  collaborationRecords.value.unshift({
    id: Date.now().toString(),
    name,
    text,
    avatar: '',
    timestamp: Date.now()
  })

  // 保持最多显示10条记录
  if (collaborationRecords.value.length > 10) {
    collaborationRecords.value = collaborationRecords.value.slice(0, 10)
  }
}


// Filter accordion items
const filterAccordionItems = computed(() => [
  {
    id: 'category',
    title: '分类统计',
    subtitle: `${categoryStats.value.length} 个分类`,
    icon: Reading
  },
  {
    id: 'filters',
    title: '快速筛选',
    subtitle: `${quickFilters.value.length} 个选项`,
    icon: Filter
  }
])

// Right sidebar tabs
const rightSidebarTabs = computed(() => [
  {
    id: 'ai-suggestions',
    label: 'AI 建议',
    icon: 'MagicStick',
    badge: {
      text: `${aiSuggestions.value.length}`,
      variant: 'info'
    }
  },
  {
    id: 'resources',
    label: '资源引用',
    icon: 'Document',
    badge: {
      text: `${resourceReferences.value.length}`,
      variant: 'success'
    }
  },
  {
    id: 'collaboration',
    label: '协作记录',
    icon: 'User',
    badge: {
      text: `${collaborationRecords.value.length}`,
      variant: 'warning'
    }
  }
])

const toggleAIAssistant = () => {
  aiAssistantVisible.value = !aiAssistantVisible.value
  if (aiAssistantVisible.value) {
    rightSidebarCollapsed.value = false
  }
  if (aiAssistantVisible.value) {
    appStore.setAIAssistantVisible(true)
  }
}

const toggleFilter = (filterKey: string) => {
  const index = activeFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterKey)
  }
}

const filterByCategory = () => {
  searchCourses()
}

const applySuggestion = (suggestion: any) => {
  if (suggestion.id.includes('selected')) {
    // 批量操作建议
    const selectedCount = selectedCourses.value.length
    ElMessage.success(`正在为 ${selectedCount} 个选中课程${suggestion.text.includes('批量') ? '批量添加' : ''}AI助教功能`)

    // 模拟应用建议后添加协作记录
    setTimeout(() => {
      addCollaborationRecord('系统', `已为 ${selectedCount} 个课程应用 ${suggestion.type}`)
    }, 1000)
  } else {
    ElMessage.success(`应用建议: ${suggestion.text}`)

    // 模拟应用建议后添加协作记录
    setTimeout(() => {
      addCollaborationRecord('系统', `已应用 ${suggestion.type}: ${suggestion.text.substring(0, 20)}...`)
    }, 1000)
  }
}

const openResource = (resource: any) => {
  ElMessage.info(`正在打开资源: ${resource.name}`)

  // 模拟打开资源后添加协作记录
  setTimeout(() => {
    addCollaborationRecord('当前用户', `查看了 ${resource.name}`)
  }, 500)
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  return `${days} 天前`
}

const getSubjectName = (subject: string): string => SUBJECT_LABELS[subject] || subjectDisplayName.value

const getSubjectTagType = (subject: string): string => {
  const tagTypes: Record<string, string> = {
    ai: 'primary',
    'data-science': 'info',
    robotics: 'warning',
    it: 'success',
    maker: 'danger'
  }
  return tagTypes[subject] || 'info'
}

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    'active': '进行中',
    'published': '已发布',
    'PUBLISHED': '已发布',
    'completed': '已完成',
    'archived': '已归档',
    'ARCHIVED': '已归档',
    'draft': '草稿',
    'DRAFT': '草稿'
  }
  return statusTexts[status] || status || '未知'
}

const getStatusTagType = (status: string): string => {
  const tagTypes: Record<string, string> = {
    'active': 'success',
    'published': 'success',
    'PUBLISHED': 'success',
    'completed': 'info',
    'archived': 'warning',
    'ARCHIVED': 'warning',
    'draft': 'info',
    'DRAFT': 'info'
  }
  return tagTypes[status] || 'info'
}

const createCourse = () => {
  courseDialogMode.value = 'create'
  Object.assign(courseForm, {
    title: '',
    subject: teacherSubject.value,
    grade: '',
    maxStudents: 30,
    description: '',
    isPublic: false
  })
  courseDialogVisible.value = true
}

const editCourse = (id: string) => {
  courseDialogMode.value = 'edit'
  const course = courses.value.find(c => c.id === id)
  if (course) {
    Object.assign(courseForm, {
      title: course.title,
      subject: course.subject,
      grade: course.gradeBand,
      maxStudents: 30,
      description: course.description,
      isPublic: false
    })
    courseDialogVisible.value = true
  }
}

const submitCourse = async () => {
  if (!courseFormRef.value) return
  try {
    saving.value = true
    await courseFormRef.value.validate()

    if (courseDialogMode.value === 'create') {
      // 初始化编辑器数据
      courseStore.initializeEditor()

      // 设置基本信息
      if (courseStore.editor) {
        courseStore.editor.basicInfo = {
          title: courseForm.title,
          description: courseForm.description,
          code: courseForm.title.toUpperCase().replace(/\s+/g, '_'),
          subject: courseForm.subject,
          grade: courseForm.grade
        }
      }

      await courseStore.createCourse(true)
    } else {
      // 编辑模式更新基本信息
      if (courseStore.editor && courseStore.currentCourse) {
        courseStore.editor.basicInfo = {
          ...courseStore.editor.basicInfo,
          title: courseForm.title,
          description: courseForm.description,
          subject: courseForm.subject,
          grade: courseForm.grade
        }
      }
      await courseStore.updateCourse()
    }

    ElMessage.success(courseDialogMode.value === 'create' ? '课程创建成功' : '课程更新成功')
    courseDialogVisible.value = false
    await loadCourses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存失败，请重试')
    }
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
    subject: teacherSubject.value,
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
    await courseStore.duplicateCourse(id)
    ElMessage.success('课程复制成功')
    await loadCourses()
  } catch (error) {
    ElMessage.error('课程复制失败')
  }
}

const exportCourse = async (id: string) => {
  try {
    const exportData = await courseStore.exportCourse(id)

    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `course_${id}_export.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('课程导出成功')
  } catch (error) {
    ElMessage.error('课程导出失败')
  }
}

const archiveCourse = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要归档该课程吗？', '确认归档', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await courseStore.archiveCourse(id)
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
    await ElMessageBox.confirm('确定要删除该课程吗？此操作不可恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await courseStore.deleteCourse(id)
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

    // TODO: 暂时使用mock数据，等服务修复后切换回真实API
    const mockCourses: CourseResponse[] = [
      {
        id: '1',
        title: '演示课程 - 物理基础',
        description: '这是一个演示课程，展示五环节教学结构',
        code: 'DEMO-PHYS-001',
        subject: '物理',
        gradeBand: '高中1年级',
        status: 'DRAFT',
        thumbnail: '',
        metadata: {},
        tenantId: 'demo-tenant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: []
      },
      {
        id: '2',
        title: '演示课程 - 化学实验',
        description: '化学实验操作演示课程',
        code: 'DEMO-CHEM-001',
        subject: '化学',
        gradeBand: '高中2年级',
        status: 'PUBLISHED',
        thumbnail: '',
        metadata: {},
        tenantId: 'demo-tenant',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        versions: []
      }
    ]

    // 临时使用mock数据
    courses.value = mockCourses

    // 真实API调用（暂时注释，等服务修复后启用）
    // await courseStore.fetchCourses()
  } catch (error) {
    console.error('Failed to load courses:', error)
    ElMessage.warning('使用演示数据，后端服务连接中...')
    // 即使出错也提供mock数据
    const mockCourses: CourseResponse[] = [
      {
        id: '1',
        title: '演示课程 - 物理基础',
        description: '这是一个演示课程，展示五环节教学结构',
        code: 'DEMO-PHYS-001',
        subject: '物理',
        gradeBand: '高中1年级',
        status: 'DRAFT',
        thumbnail: '',
        metadata: {},
        tenantId: 'demo-tenant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: []
      }
    ]
    courses.value = mockCourses
  } finally {
    loading.value = false
  }
}

// 辅助方法
const getChapterCount = (course: any) => {
  // 从课程数据中获取章节数量，如果没有则根据五环节结构返回5
  if (course.modules && Array.isArray(course.modules)) {
    return course.modules.length
  }
  if (course.aclContent && course.aclContent.modules) {
    return Object.keys(course.aclContent.modules).length
  }
  // 默认返回5个环节
  return 5
}

// 快速操作函数
const createNewCourse = () => {
  courseDialogMode.value = 'create'
  courseDialogVisible.value = true
}

// 生命周期
onMounted(async () => {
  await loadCourses()
})

const batchExport = () => {
  ElMessage.info('批量导出功能开发中...')
}

const batchEdit = () => {
  ElMessage.info('批量编辑功能开发中...')
}

// 筛选器相关函数
const openFilterDrawer = () => {
  filterDrawerVisible.value = true
}

const applyAdvancedFilters = (filters: typeof advancedFilters.value) => {
  advancedFilters.value = { ...filters }

  // 更新现有的筛选状态
  // 这里可以根据需要更新筛选逻辑

  ElMessage.success(`已应用 ${getActiveFiltersCount()} 个筛选条件`)
}

const getActiveFiltersCount = () => {
  return advancedFilters.value.quickFilters.length +
         advancedFilters.value.grades.length +
         advancedFilters.value.statuses.length +
         (advancedFilters.value.dateRange.length > 0 ? 1 : 0)
}

const resetFilters = () => {
  advancedFilters.value = {
    quickFilters: [],
    subjects: [],
    grades: [],
    statuses: [],
    dateRange: []
  }
  // 同时重置简单筛选
  filters.keyword = ''
  filters.grade = ''
  searchCourses()
}

const hasActiveFilters = computed(() => getActiveFiltersCount() > 0)

// 统一侧边栏配置
const leftSidebarSections = computed<LeftSidebarSectionConfig[]>(() =>
  PAGE_SIDEBAR_CONFIGS.courses.left
)

const rightSidebarSections = computed<RightSidebarSectionConfig[]>(() =>
  PAGE_SIDEBAR_CONFIGS.courses.right
)

// 为侧边栏组件准备的数据
const subjectOptionsForSidebar = computed(() => [
  { label: subjectDisplayName.value, value: teacherSubject.value },
  ...gradeOptions.map(grade => ({ label: grade.label, value: grade.value }))
])

const sidebarFilters = computed(() => ({
  subject: teacherSubject.value,
  status: filters.status,
  dateRange: null
}))

// 统一侧边栏事件处理
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'create':
      createNewCourse()
      break
    case 'import':
      importCourse()
      break
    case 'export':
      batchExport()
      break
    default:
      console.log('Unhandled quick action:', action)
  }
}

const handleFilterChange = (newFilters: any) => {
  // 更新筛选器状态
  if (newFilters.subject !== undefined) {
    // 处理学科切换
  }
  if (newFilters.status !== undefined) {
    filters.status = newFilters.status
  }
  searchCourses()
}

const handleAIAction = (action: string) => {
  switch (action) {
    case 'chat':
      toggleAIAssistant()
      break
    case 'generate-content':
      ElMessage.info('AI 内容生成功能开发中...')
      break
    case 'analyze-data':
      ElMessage.info('AI 数据分析功能开发中...')
      break
    default:
      console.log('Unhandled AI action:', action)
  }
}

const handleResourceAction = (action: string, resourceId: string | number) => {
  if (action === 'open') {
    const resource = resourceReferences.value.find(r => r.id === resourceId)
    if (resource) {
      openResource(resource)
    }
  }
}

const handleHelpAction = (action: string, data: any) => {
  if (action === 'open-link') {
    ElMessage.info(`正在打开帮助页面: ${data}`)
  }
}
</script>

<style scoped lang="scss">

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


.collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  color: var(--edu-primary-600);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.2);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }
}

.filter-accordion {
  :deep(.edu-accordion__item) {
    background: transparent;
    border: none;
    margin-bottom: 8px;
  }

  :deep(.edu-accordion__header) {
    background: rgba(15, 23, 42, 0.04);
    border-radius: 12px;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }

  :deep(.edu-accordion__header:hover) {
    background: rgba(99, 102, 241, 0.08);
  }

  :deep(.edu-accordion__header--active) {
    background: rgba(99, 102, 241, 0.12);
    color: var(--edu-primary-700);
  }

  :deep(.edu-accordion__content) {
    padding: 12px 16px;
  }
}

.right-sidebar-tabs {
  :deep(.edu-tabs__nav) {
    background: rgba(15, 23, 42, 0.04);
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
  }

  :deep(.edu-tabs__tab) {
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    color: var(--edu-text-secondary);
  }

  :deep(.edu-tabs__tab:hover) {
    background: rgba(99, 102, 241, 0.08);
    color: var(--edu-text-primary);
  }

  :deep(.edu-tabs__tab--active) {
    background: var(--edu-bg-primary);
    color: var(--edu-primary-600);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  :deep(.edu-tabs__content) {
    padding: 16px 0 0 0;
  }
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
  transition: transform 0.2s ease, background 0.2s ease;
  color: inherit;
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
  align-items: flex-start;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
}

.activity-icon--edit {
  background: rgba(249, 115, 22, 0.12);
  color: #f97316;
}

.activity-icon--system {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-text {
  font-weight: 600;
}

.activity-time {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.suggestion-list,
.resource-list,
.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item,
.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  cursor: pointer;
  text-align: left;
}

.suggestion-item:hover,
.resource-item:hover {
  background: rgba(99, 102, 241, 0.12);
}

.suggestion-icon,
.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.suggestion-text {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.suggestion-type,
.resource-type {
  font-size: 12px;
  color: var(--edu-text-secondary);
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
}

.collaboration-meta {
  font-size: 12px;
  color: var(--edu-text-secondary);
  display: flex;
  gap: 8px;
}


.course-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.course-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 确保flex子元素可以缩小 */
}

.course-section-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

:deep(.course-section-card__body) {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  min-height: 0;
  overflow: visible; // 让父容器控制滚动
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-description {
  margin: 0;
  color: var(--edu-text-secondary);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-bar {
  padding: 16px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 16px;
}

.view-toggle {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.courses-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-height: 0; // 防止flex子项溢出
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-main-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.course-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.course-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.course-grade,
.course-teacher,
.course-students,
.course-updated {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 40px;
}

.course-tags {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

// 响应式设计
@media (max-width: 768px) {
  .course-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .course-actions {
    align-self: flex-end;
  }

  .course-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .course-tags {
    align-items: flex-start;
  }
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--edu-text-secondary);
  font-size: 13px;
}

.course-grade {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.course-card {
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  cursor: pointer;
}

.course-card:hover {
  box-shadow: var(--edu-shadow-md);
  transform: translateY(-2px);
}

.course-card__cover {
  position: relative;
  height: 120px;
  background: var(--edu-bg-secondary);
}

.course-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
}

.course-thumbnail__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-thumbnail__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-text-tertiary);
  font-size: 48px;
  background: linear-gradient(135deg, var(--edu-bg-secondary) 0%, var(--edu-bg-tertiary) 100%);
}

.course-cover__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
}

.course-cover__badge {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-card__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  flex: 1;
}

.course-card__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  line-height: 1.4;
}

.course-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.course-grade {
  font-size: 13px;
  color: var(--edu-text-secondary);
  font-weight: 500;
  background: var(--edu-bg-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-base);
}

.course-card__description {
  color: var(--edu-text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card__stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-group {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  flex: 1;
}

.stat-item .el-icon {
  font-size: 16px;
  color: var(--edu-primary-500);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--edu-text-tertiary);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.progress-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--edu-primary-600);
}

.course-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);
}

.course-card__actions {
  display: flex;
  gap: 8px;
}

.danger-text {
  color: var(--el-color-danger);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1200px) {
  .section-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .view-toggle {
    justify-content: flex-start;
    margin-top: 12px;
  }
}

@media (max-width: 768px) {
  .workspace-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-bar {
    padding: 12px;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }
}

// 筛选栏样式
.filter-bar {
  padding: var(--spacing-base);
  background: var(--edu-bg-tertiary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-base);

  .subject-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
  }

  .subject-option__color {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  .subject-option__name {
    flex: 1;
    font-size: var(--font-size-sm);
  }
}

.filter-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: stretch;

  .filter-buttons {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .advanced-filter-btn {
      position: relative;
      flex: 1;

      .filter-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        transform: scale(0.8);
      }
    }

    .reset-filter-btn {
      flex-shrink: 0;
    }
  }

  .view-switcher {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

// 快速操作区域样式
.quick-actions-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin: 0;
  padding: 0 var(--spacing-sm);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  border: none;
  background: rgba(15, 23, 42, 0.04);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  text-align: left;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--edu-primary-700);
    transform: translateX(2px);
  }

  .el-icon {
    width: 16px;
    height: 16px;
  }
}

// 最近活动区域样式
.recent-activities {
  .section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-sm) 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .quick-actions-content {
    gap: var(--spacing-base);
  }

  .action-section {
    gap: var(--spacing-xs);
  }

  .quick-action-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);

    span:not(.el-icon) {
      display: none;
    }

    .el-icon {
      width: 18px;
      height: 18px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-item,
  .course-card,
  .ai-trigger,
  .summary-card,
  .quick-action-btn {
    transition: none !important;
  }
}

// 统一侧边栏自定义样式
.custom-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-search {
  margin-bottom: 8px;
}

.custom-quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-activity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  flex-shrink: 0;
}

.activity-icon--edit {
  background: rgba(249, 115, 22, 0.12);
  color: #f97316;
}

.activity-icon--system {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-weight: 600;
  color: var(--edu-text-primary);
  font-size: 14px;
}

.activity-time {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.custom-ai-assistant,
.custom-resources,
.custom-collaboration,
.custom-stats {
  display: flex;
  flex-direction: column;
}

.suggestion-list,
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item,
.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.12);
  }
}

.suggestion-icon,
.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.suggestion-text {
  font-weight: 600;
  color: var(--edu-text-primary);
  font-size: 14px;
}

.suggestion-type,
.resource-type {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collaboration-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.collaboration-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.collaboration-text {
  font-weight: 600;
  color: var(--edu-text-primary);
  font-size: 14px;
}

.collaboration-meta {
  font-size: 12px;
  color: var(--edu-text-secondary);
  display: flex;
  gap: 8px;
}

.stats-grid {
  display: grid;
  gap: 12px;
}

.stat-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.04);
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--edu-primary-500);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--edu-text-secondary);
}
</style>
