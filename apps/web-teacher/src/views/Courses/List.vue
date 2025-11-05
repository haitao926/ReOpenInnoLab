<template>
  <TeacherWorkspaceLayout
    title="课程工作台"
    subtitle="管理您的 AI 赋能教学课程"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <el-segmented
          v-model="viewMode"
          :options="viewModeOptions"
          size="large"
        />
        <el-button
          type="primary"
          class="ai-trigger"
          :class="{ active: aiAssistantVisible }"
          @click="toggleAIAssistant"
        >
          <el-icon><MagicStick /></el-icon>
          AI 助手
        </el-button>
      </div>
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
            <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">协作记录</h5>
            <div class="collaboration-list">
              <div
                v-for="record in collaborationRecords"
                :key="record.id"
                class="collaboration-item"
              >
                <el-avatar :size="36" :src="record.avatar">
                  {{ record.name.charAt(0) }}
                </el-avatar>
                <div class="collaboration-content">
                  <div class="collaboration-text">{{ record.text }}</div>
                  <div class="collaboration-meta">
                    <span class="collaboration-author">{{ record.name }}</span>
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

    <template #footer>
      <div class="footer-column">
        <h4 class="footer-title">最近活动</h4>
        <div class="footer-list">
          <div
            v-for="activity in footerActivities"
            :key="activity.id"
            class="footer-item"
          >
            <span class="footer-indicator" :class="`footer-indicator--${activity.type}`"></span>
            <span class="footer-text">{{ activity.text }}</span>
            <span class="footer-time">{{ formatTime(activity.timestamp) }}</span>
          </div>
        </div>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">系统公告</h4>
        <div class="footer-list">
          <div
            v-for="notice in systemNotices"
            :key="notice.id"
            class="footer-item"
          >
            <el-icon><Bell /></el-icon>
            <span class="footer-text">{{ notice.text }}</span>
          </div>
        </div>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">支持与反馈</h4>
        <div class="support-links">
          <el-button text size="small">使用帮助</el-button>
          <el-button text size="small">问题反馈</el-button>
          <el-button text size="small">联系运营</el-button>
        </div>
      </div>
    </template>

    <div class="course-content">
      <section class="course-main">
        <EduCard
          class="course-section-card"
          variant="elevated"
          :hoverable="false"
          body-class="course-section-card__body"
        >
          <template #header>
            <div class="section-header">
              <div class="section-info">
                <h3 class="section-title">课程列表</h3>
                <p class="section-description">管理和编排您的教学课程</p>
              </div>
              <div class="section-actions">
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
          </template>

          <div class="filter-bar">
            <el-row :gutter="16" align="middle">
              <el-col :xs="24" :sm="12" :md="6">
                <el-input
                  v-model="filters.keyword"
                  placeholder="搜索课程名称..."
                  clearable
                  @change="searchCourses"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
              <el-col :xs="24" :sm="12" :md="4">
                <el-select v-model="filters.grade" placeholder="选择年级" clearable @change="searchCourses">
                  <el-option
                    v-for="grade in gradeOptions"
                    :key="grade.value"
                    :label="grade.label"
                    :value="grade.value"
                  />
                </el-select>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6" class="filter-actions">
                <div class="filter-buttons">
                  <el-button
                    :type="hasActiveFilters ? 'primary' : 'default'"
                    :icon="Filter"
                    @click="openFilterDrawer"
                    class="advanced-filter-btn"
                  >
                    高级筛选
                    <el-badge v-if="getActiveFiltersCount() > 0" :value="getActiveFiltersCount()" class="filter-badge" />
                  </el-button>
                  <el-button
                    v-if="hasActiveFilters"
                    :icon="RefreshRight"
                    @click="resetFilters"
                    circle
                    class="reset-filter-btn"
                  />
                </div>
                <div class="view-switcher">
                  <el-segmented
                    v-model="viewMode"
                    :options="[
                      { label: '列表', value: 'table', icon: 'List' },
                      { label: '卡片', value: 'grid', icon: 'Grid' }
                    ]"
                    size="small"
                  />
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="courses-container">
            <el-table
              v-if="viewMode === 'table'"
              :data="paginatedCourses"
              style="width: 100%"
              v-loading="loading"
            >
              <el-table-column prop="title" label="课程名称" min-width="220">
                <template #default="{ row }">
                  <div class="course-info">
                    <h4 class="course-title">{{ row.title }}</h4>
                    <div class="course-meta">
                      <el-tag :type="getSubjectTagType(row.subject)" size="small">
                        {{ getSubjectName(row.subject) }}
                      </el-tag>
                      <span class="course-grade">{{ row.grade }} 年级</span>
                      <el-tag v-if="row.isPublic" type="info" size="small">公开</el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="teacher" label="授课教师" width="120" />
              <el-table-column prop="students" label="学生数" width="120">
                <template #default="{ row }">
                  {{ row.students }}/{{ row.maxStudents }}
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="140">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.progress"
                    :stroke-width="8"
                    :color="getProgressColor(row.progress)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="updatedAt" label="最后更新" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.updatedAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button type="text" @click="viewCourse(row.id)">查看</el-button>
                  <el-button type="text" @click="editCourse(row.id)">编辑</el-button>
                  <el-dropdown trigger="click" @command="handleCourseAction">
                    <el-button type="text">
                      更多<el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="{ action: 'copy', id: row.id }">复制课程</el-dropdown-item>
                        <el-dropdown-item :command="{ action: 'export', id: row.id }">导出数据</el-dropdown-item>
                        <el-dropdown-item :command="{ action: 'archive', id: row.id }">归档课程</el-dropdown-item>
                        <el-dropdown-item :command="{ action: 'delete', id: row.id }" divided>
                          <span class="danger-text">删除课程</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
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
                <header class="course-card__header">
                  <h4 class="course-card__title">{{ course.title }}</h4>
                  <el-tag :type="getSubjectTagType(course.subject)" size="small">
                    {{ getSubjectName(course.subject) }}
                  </el-tag>
                </header>
                <p class="course-card__description">{{ course.description }}</p>
                <div class="course-card__stats">
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
                <footer class="course-card__footer">
                  <el-tag :type="getStatusTagType(course.status)" size="small">
                    {{ getStatusText(course.status) }}
                  </el-tag>
                  <span class="course-card__date">{{ formatDate(course.updatedAt) }}</span>
                </footer>
                <div class="course-card__actions">
                  <el-button text size="small" @click.stop="editCourse(course.id)">编辑</el-button>
                  <el-dropdown trigger="click" @command="handleCourseAction">
                    <el-button text size="small" @click.stop>
                      更多<el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="{ action: 'copy', id: course.id }">复制课程</el-dropdown-item>
                        <el-dropdown-item :command="{ action: 'archive', id: course.id }">归档课程</el-dropdown-item>
                        <el-dropdown-item :command="{ action: 'delete', id: course.id }">
                          <span class="danger-text">删除课程</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
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
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
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
  Document
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import { EduCard, EduAccordion, EduTabs } from '@reopeninnolab/ui-kit'
import FilterDrawer from '@/components/course/FilterDrawer.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { formatDate } from '@/utils/date'
import { PAGE_SIDEBAR_CONFIGS, DEFAULT_LEFT_SIDEBAR_SECTIONS, DEFAULT_RIGHT_SIDEBAR_SECTIONS, type LeftSidebarSectionConfig, type RightSidebarSectionConfig } from '@/constants/managementSidebar'

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

const loading = ref(false)
const viewMode = ref<'table' | 'grid'>('table')
const courseDialogVisible = ref(false)
const courseDialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const courseFormRef = ref<FormInstance>()
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

const allCourses = ref<Course[]>([
  {
    id: 'ai-workshop',
    title: 'AI 创意编程工作坊',
    subject: 'ai',
    grade: '10',
    teacher: '陈老师',
    students: 28,
    maxStudents: 32,
    progress: 72,
    status: 'active',
    isPublic: true,
    description: '结合大语言模型与图形化编程，带领学生完成智能互动项目。',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-22')
  },
  {
    id: 'ai-data-lab',
    title: 'AI 数据洞察实验班',
    subject: 'ai',
    grade: '11',
    teacher: '刘老师',
    students: 26,
    maxStudents: 30,
    progress: 64,
    status: 'active',
    isPublic: false,
    description: '围绕校园真实数据集，训练学生使用 AI 工具完成数据分析与可视化。',
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-21')
  },
  {
    id: 'ai-robotics',
    title: 'AI 驱动智能机器人项目',
    subject: 'ai',
    grade: '10',
    teacher: '周老师',
    students: 22,
    maxStudents: 28,
    progress: 58,
    status: 'active',
    isPublic: true,
    description: '使用视觉识别与智能规划算法，完成机器人自主巡线任务。',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-19')
  },
  {
    id: 'ai-cloud-native',
    title: 'AI 应用云端部署实训',
    subject: 'ai',
    grade: '12',
    teacher: '孙老师',
    students: 31,
    maxStudents: 36,
    progress: 81,
    status: 'active',
    isPublic: true,
    description: '引导学生使用容器与无服务器平台部署 AI 应用。',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-02-20')
  }
])

const courseForm = reactive<CourseForm>({
  title: '',
  subject: teacherSubject.value,
  grade: '',
  maxStudents: 30,
  description: '',
  isPublic: false
})

watch(teacherSubject, (subject) => {
  courseForm.subject = subject
  filters.keyword = ''
  pagination.page = 1
})

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

const filteredCourses = computed(() => {
  return allCourses.value.filter(course => course.subject === teacherSubject.value).filter(course => {
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

const summaryStats = computed(() => {
  const courses = filteredCourses.value
  if (courses.length === 0) {
    return {
      totalCourses: 0,
      avgProgress: 0,
      totalStudents: 0
    }
  }

  const totalStudents = courses.reduce((sum, course) => sum + course.students, 0)
  const avgProgress = Math.round(
    courses.reduce((sum, course) => sum + course.progress, 0) / courses.length
  )

  return {
    totalCourses: courses.length,
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

const footerActivities = ref([
  { id: '1', text: '陈老师完善了 “AI 创意编程工作坊” 项目模板', type: 'success', timestamp: Date.now() - 1800000 },
  { id: '2', text: '系统已同步最新 AI 助手提示词库', type: 'system', timestamp: Date.now() - 3600000 },
  { id: '3', text: '有 2 名学生加入 “AI 数据洞察实验”', type: 'info', timestamp: Date.now() - 5400000 }
])

const systemNotices = ref([
  { id: '1', text: '周三 20:00 举办 “AI 教学设计” 线上分享会' },
  { id: '2', text: '实验资源中心新增 AI 视觉调试指南' }
])

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
    archived: 'warning'
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
  const course = allCourses.value.find(c => c.id === id)
  if (course) {
    Object.assign(courseForm, {
      title: course.title,
      subject: course.subject,
      grade: course.grade,
      maxStudents: course.maxStudents,
      description: course.description,
      isPublic: course.isPublic
    })
    courseDialogVisible.value = true
  }
}

const submitCourse = async () => {
  if (!courseFormRef.value) return
  try {
    saving.value = true
    await courseFormRef.value.validate()

    await new Promise(resolve => setTimeout(resolve, 800))
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
    await new Promise(resolve => setTimeout(resolve, 600))
    ElMessage.success('课程复制成功')
  } catch (error) {
    ElMessage.error('课程复制失败')
  }
}

const exportCourse = async (id: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
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
    await new Promise(resolve => setTimeout(resolve, 600))
    ElMessage.success('课程归档成功')
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
    await new Promise(resolve => setTimeout(resolve, 600))
    ElMessage.success('课程删除成功')
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
    await new Promise(resolve => setTimeout(resolve, 600))
  } catch (error) {
    ElMessage.error('加载课程失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 快速操作函数
const createNewCourse = () => {
  courseDialogMode.value = 'create'
  courseDialogVisible.value = true
}

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
.workspace-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &.active {
    background: linear-gradient(135deg, #7f5eff 0%, #45a3ff 100%);
    border-color: transparent;
  }
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

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.footer-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--edu-text-secondary);
  font-size: 13px;
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
  background: #0ea5e9;
}

.footer-indicator--info {
  background: #6366f1;
}

.support-links {
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
}

.course-section-card {
  width: 100%;
}

:deep(.course-section-card__body) {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  gap: 12px;
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
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
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
  gap: 16px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(243, 245, 250, 0.92) 100%);
  box-shadow: 0 20px 45px -26px rgba(15, 23, 42, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 60px -28px rgba(79, 70, 229, 0.45);
}

.course-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.course-card__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.course-card__description {
  margin: 0;
  color: var(--edu-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.course-card__stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.course-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.course-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.danger-text {
  color: var(--el-color-danger);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
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
    justify-content: center;
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
