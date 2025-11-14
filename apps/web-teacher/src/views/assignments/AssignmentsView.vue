<template>
  <TeacherWorkspaceLayout
    title="作业管理"
    subtitle="统一作业管理流程，包含创建、批改、反馈、数据分析"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <WorkspacePrimaryToolbar
        :create-button-text="'布置作业'"
        :import-button-text="'导入作业'"
        :show-ai-button="false"
        @create="createAssignment"
        @import="importAssignments"
      />
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
        :subject-options="subjectOptionsForSidebar"
        :initial-filters="sidebarFilters"
        @quick-action="handleQuickAction"
        @filter-change="handleFilterChange"
      >
        <!-- 自定义筛选器插槽 -->
        <template #filters="{ data }">
          <div class="custom-filters">
            <div class="filter-stack">
              <el-select v-model="selectedStatus" placeholder="作业状态" clearable>
                <el-option value="" label="全部" />
                <el-option value="pending" label="待批改" />
                <el-option value="graded" label="已批改" />
                <el-option value="overdue" label="逾期未交" />
              </el-select>
              <el-select v-model="selectedCourse" placeholder="所属课程" clearable>
                <el-option value="" label="全部课程" />
                <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
              </el-select>
              <el-select v-model="selectedClass" placeholder="班级" clearable>
                <el-option value="" label="全部班级" />
                <el-option v-for="classItem in classes" :key="classItem.id" :label="classItem.name" :value="classItem.id" />
              </el-select>
            </div>

            <div class="filter-tags">
              <el-tag
                v-for="tag in quickFilters"
                :key="tag.key"
                :effect="activeQuickFilters.includes(tag.key) ? 'dark' : 'plain'"
                :type="activeQuickFilters.includes(tag.key) ? 'primary' : 'info'"
                class="filter-tag"
                @click="toggleQuickFilter(tag.key)"
              >
                {{ tag.label }}
              </el-tag>
            </div>
          </div>
        </template>

        <!-- 自定义快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="custom-quick-actions">
            <div class="action-section">
              <el-button type="primary" size="small" style="width: 100%; margin-bottom: 8px;" @click="createAssignment">
                <el-icon><EditPen /></el-icon>
                布置作业
              </el-button>
              <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="importAssignments">
                <el-icon><Upload /></el-icon>
                导入作业
              </el-button>
            </div>
            <div class="action-section">
              <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="openFeedbackTemplates">
                <el-icon><Document /></el-icon>
                常用评语
              </el-button>
              <el-button type="default" size="small" style="width: 100%;" @click="generateFeedback">
                <el-icon><MagicStick /></el-icon>
                AI 生成反馈
              </el-button>
            </div>
          </div>
        </template>

        <!-- 自定义动态插槽 -->
        <template #activity="{ data }">
          <div class="custom-activity">
            <div class="reminder-list">
              <div v-for="reminder in reminders" :key="reminder.id" class="reminder-item">
                <span class="reminder-label">{{ reminder.label }}</span>
                <span class="reminder-time">{{ reminder.time }}</span>
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
          <div class="assignment-insights">
            <div class="insights-overview">
              <div class="insight-item">
                <div class="insight-label">待批改</div>
                <div class="insight-value">{{ pendingCount }}</div>
              </div>
              <div class="insight-item">
                <div class="insight-label">已批改</div>
                <div class="insight-value">{{ gradedCount }}</div>
              </div>
              <div class="insight-item">
                <div class="insight-label">完成率</div>
                <div class="insight-value">{{ completionRate }}%</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="assignment-resources">
            <h5>教学资源</h5>
            <div class="resource-list">
              <div v-for="resource in assignmentResources" :key="resource.id" class="resource-item">
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
          <div class="assignment-collaboration">
            <h5>批改协作</h5>
            <div class="collaboration-list">
              <div v-for="item in gradingBacklog" :key="item.id" class="collaboration-item">
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

    <!-- 作业管理标签页 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 作业列表 -->
      <el-tab-pane label="作业列表" name="assignments">
        <div class="tab-content">
          <EduCard variant="elevated" class="assignments-header-card">
            <template #header>
              <div class="assignments-header">
                <div class="assignments-info">
                  <h3 class="assignments-title">作业管理</h3>
                  <p class="assignments-subtitle">统一作业管理流程，包含创建、批改、反馈、数据分析</p>
                </div>
                <div class="assignments-actions">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索作业或学生..."
                    style="width: 300px;"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select v-model="selectedStatus" placeholder="作业状态" style="width: 150px;" clearable>
                    <el-option label="全部状态" value="" />
                    <el-option label="待批改" value="pending" />
                    <el-option label="已批改" value="graded" />
                    <el-option label="逾期未交" value="overdue" />
                  </el-select>
                  <div class="view-switcher">
                    <el-segmented
                      v-model="viewMode"
                      :options="[
                        { label: '卡片', value: 'card' },
                        { label: '列表', value: 'table' }
                      ]"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </template>
          </EduCard>

          <!-- 筛选工具栏 -->
          <div class="filter-toolbar">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-select v-model="selectedCourse" placeholder="所属课程" clearable>
                  <el-option label="全部课程" value="" />
                  <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-select v-model="selectedClass" placeholder="班级" clearable>
                  <el-option label="全部班级" value="" />
                  <el-option v-for="classItem in classes" :key="classItem.id" :label="classItem.name" :value="classItem.id" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-button @click="resetFilters">
                  <el-icon><RefreshLeft /></el-icon>
                  重置筛选
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 作业卡片视图 -->
          <div v-if="viewMode === 'card'" class="assignments-grid">
            <div
              v-for="assignment in filteredAssignments"
              :key="assignment.id"
              class="assignment-card"
              :class="{
                'assignment-card--urgent': assignment.isUrgent,
                'assignment-card--late': assignment.isLate,
                'assignment-card--graded': assignment.status === 'graded',
                'assignment-card--pending': assignment.status === 'pending'
              }"
            >
              <!-- 作业状态指示条 -->
              <div class="assignment-card__status-bar" :class="`status-bar--${assignment.status}`">
                <div class="status-indicator"></div>
              </div>

              <!-- 学生信息区域 -->
              <div class="assignment-card__student">
                <div class="student-section">
                  <div class="student-avatar">
                    <el-avatar :size="48" :src="assignment.student.avatar">
                      {{ assignment.student.name.charAt(0) }}
                    </el-avatar>
                    <div class="status-badge" :class="`status-badge--${assignment.status}`">
                      <el-icon><component :is="getStatusIcon(assignment.status)" /></el-icon>
                    </div>
                  </div>
                  <div class="student-info">
                    <h4 class="student-name">{{ assignment.student.name }}</h4>
                    <div class="student-meta">
                      <span class="class-name">{{ assignment.className }}</span>
                      <el-tag :type="getSubjectVariant(assignment.course.subject)" size="small">
                        {{ assignment.course.name }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div class="assignment-actions">
                  <el-dropdown @command="(command) => handleAssignmentAction(command, assignment)">
                    <el-button size="small" text>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">
                          <el-icon><View /></el-icon>
                          查看详情
                        </el-dropdown-item>
                        <el-dropdown-item command="edit">
                          <el-icon><Edit /></el-icon>
                          编辑作业
                        </el-dropdown-item>
                        <el-dropdown-item command="download">
                          <el-icon><Download /></el-icon>
                          下载附件
                        </el-dropdown-item>
                        <el-dropdown-item command="message" divided>
                          <el-icon><Message /></el-icon>
                          发送消息
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <!-- 作业内容区域 -->
              <div class="assignment-card__content">
                <div class="assignment-header">
                  <h5 class="assignment-title">{{ assignment.title }}</h5>
                  <div class="assignment-meta">
                    <div v-if="assignment.isLate" class="late-badge">
                      <el-icon><Warning /></el-icon>
                      逾期 {{ getDaysOverdue(assignment.dueDate) }} 天
                    </div>
                    <div class="submit-time">
                      <el-icon><Clock /></el-icon>
                      {{ formatDateTime(assignment.submitTime) }}
                    </div>
                  </div>
                </div>

                <div class="assignment-description">
                  {{ assignment.description || '暂无描述' }}
                </div>

                <!-- 评分状态 -->
                <div class="grading-section">
                  <div class="score-display">
                    <div class="score-main">
                      <span class="score-value">{{ assignment.score || '--' }}</span>
                      <span class="score-divider">/</span>
                      <span class="score-total">{{ assignment.totalScore }}</span>
                    </div>
                    <div class="score-label">
                      {{ assignment.status === 'graded' ? '已评分' : '待评分' }}
                    </div>
                  </div>
                  <div v-if="assignment.status === 'graded'" class="grade-percentage">
                    {{ Math.round((assignment.score / assignment.totalScore) * 100) }}%
                  </div>
                </div>
              </div>

              <!-- 底部操作区域 -->
              <footer class="assignment-card__footer">
                <div class="urgency-indicator" v-if="assignment.isUrgent">
                  <el-icon><WarningFilled /></el-icon>
                  <span>紧急</span>
                </div>
                <div class="assignment-actions">
                  <el-button size="small" @click="viewAssignment(assignment)">
                    <el-icon><View /></el-icon>
                    查看详情
                  </el-button>
                  <el-button
                    size="small"
                    :type="assignment.status === 'pending' ? 'primary' : 'success'"
                    @click="startGrading(assignment)"
                  >
                    <el-icon><EditPen /></el-icon>
                    {{ assignment.status === 'pending' ? '开始批改' : '重新批改' }}
                  </el-button>
                </div>
              </footer>
            </div>
          </div>

          <!-- 作业表格视图 -->
          <div v-else class="assignments-table">
            <el-table :data="filteredAssignments" stripe>
              <el-table-column label="作业" min-width="200">
                <template #default="{ row }">
                  <div class="assignment-row">
                    <div class="assignment-row__title">{{ row.title }}</div>
                    <div class="assignment-row__meta">
                      <el-tag :type="getSubjectVariant(row.course.subject)" size="small">
                        {{ row.course.name }}
                      </el-tag>
                      <span>{{ row.className }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="student.name" label="学生" width="120" />
              <el-table-column label="得分" width="100" align="center">
                <template #default="{ row }">
                  <span v-if="row.status === 'graded'">{{ row.score }}/{{ row.totalScore }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTag(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="提交时间" width="140">
                <template #default="{ row }">
                  {{ formatDateTime(row.submitTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="viewAssignment(row)">详情</el-button>
                  <el-button size="small" type="primary" @click="startGrading(row)">批改</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 批改工作台 -->
      <el-tab-pane label="批改工作台" name="grading">
        <div class="tab-content">
          <GradingWorkspace
            :assignments="filteredAssignments"
            @assignment-selected="handleAssignmentSelected"
            @grading-complete="handleGradingComplete"
          />
        </div>
      </el-tab-pane>

      <!-- 数据统计 -->
      <el-tab-pane label="数据统计" name="analytics">
        <div class="tab-content">
          <div class="analytics-placeholder">
            <el-empty description="数据统计功能开发中">
              <el-button type="primary">查看详细统计</el-button>
            </el-empty>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Upload,
  EditPen,
  View,
  Star,
  TrendCharts,
  MagicStick,
  Warning,
  Hide,
  Document,
  Search,
  RefreshLeft,
  Grid,
  List,
  MoreFilled,
  Edit,
  Download,
  Message,
  Clock,
  Check,
  User,
  WarningFilled
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import WorkspacePrimaryToolbar from '@/components/workspace/WorkspacePrimaryToolbar.vue'
import GradingWorkspace from '@/components/assignment/GradingWorkspace.vue'
import AICommentPanel from '@/components/ai/AICommentPanel.vue'
import { EduButton, EduCard } from '@reopeninnolab/ui-kit'
import { PAGE_SIDEBAR_CONFIGS, DEFAULT_LEFT_SIDEBAR_SECTIONS, DEFAULT_RIGHT_SIDEBAR_SECTIONS, type LeftSidebarSectionConfig, type RightSidebarSectionConfig } from '@/constants/managementSidebar'


const router = useRouter()
const viewMode = ref<'card' | 'table'>('card')
const activeTab = ref('assignments')
const viewModeOptions = [
  { label: '列表模式', value: 'list' },
  { label: '卡片模式', value: 'grid' }
]

// Assignment workflow tabs - TODO: 实现标签页功能
// const assignmentTabs = computed(() => [
//   {
//     id: 'pending-grading',
//     label: '待批改',
//     badge: { text: `${pendingAssignments.value.length}`, variant: 'warning' }
//   },
//   {
//     id: 'graded',
//     label: '已批改',
//     badge: { text: `${gradedAssignments.value.length}`, variant: 'success' }
//   },
//   {
//     id: 'analytics',
//     label: '数据统计',
//     badge: { text: '分析', variant: 'info' }
//   }
// ])

const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const searchKeyword = ref('')

// AI 评语面板状态
const showAIPanel = ref(false)
const currentAssignmentForAI = ref<any>(null)

const selectedStatus = ref('')
const selectedCourse = ref('')
const selectedClass = ref('')
const activeQuickFilters = ref<string[]>([])

const courses = [
  { id: 'course-1', name: '高中物理 · 力学基础' },
  { id: 'course-2', name: '高中化学 · 有机化合物' }
]

const classes = [
  { id: 'class-1', name: '高一 1 班' },
  { id: 'class-2', name: '高二 3 班' }
]

const assignments = ref<any[]>([
  {
    id: 'assign-1',
    title: '力学章节课堂练习',
    description: '请根据实验数据完成力与加速度的分析，并提交分析报告。',
    content: '实验数据显示：物体A在10秒内从静止加速到20m/s，请计算加速度并分析力的影响因素。',
    subject: 'physics',
    type: 'project',
    className: '高一 1 班',
    status: 'pending',
    score: 0,
    totalScore: 100,
    submitTime: new Date('2024-01-16T10:20:00'),
    dueDate: new Date('2024-01-15T18:00:00'),
    isLate: true,
    isUrgent: true,
    course: { name: '力与运动', subject: 'physics' },
    student: { id: 'S2024001', name: '张小明', avatar: '' }
  },
  {
    id: 'assign-2',
    title: '有机化合物结构分析',
    description: '结合课堂实验，完成有机化合物分子结构绘制与说明。',
    content: '请绘制并标注出乙醇、乙酸和苯环的分子结构，并说明它们的官能团特点。',
    subject: 'chemistry',
    type: 'essay',
    className: '高二 3 班',
    status: 'graded',
    score: 92,
    totalScore: 100,
    submitTime: new Date('2024-01-15T22:10:00'),
    submittedAt: new Date('2024-01-15T22:10:00'),
    dueDate: new Date('2024-01-16T20:00:00'),
    isLate: false,
    isUrgent: false,
    course: { name: '有机化学', subject: 'chemistry' },
    student: { id: 'S2023034', name: '李小红', avatar: '' }
  }
])

const quickFilters = [
  { key: 'overdue', label: '逾期未交' },
  { key: 'urgent', label: '紧急批改' },
  { key: 'highscore', label: '高分作业' }
]

const reminders = [
  { id: 'rem-1', label: '高一 1 班', time: '今日 18:00 截止' },
  { id: 'rem-2', label: '高二 3 班', time: '明日 12:00 复批' }
]

const assignmentResources = [
  {
    id: 1,
    title: '批改参考',
    description: '作业批改标准与评分指南',
    color: '#1890ff',
    icon: 'Document'
  },
  {
    id: 2,
    title: '知识点库',
    description: '各科目知识点与易错点汇总',
    color: '#52c41a',
    icon: 'Collection'
  },
  {
    id: 3,
    title: '评语模板',
    description: '常用评语与反馈模板集合',
    color: '#722ed1',
    icon: 'Edit'
  }
]

const knowledgeAlerts = ref([
  { id: 'knowledge-1', topic: '力与运动 · 牛顿第二定律', mastery: 62 },
  { id: 'knowledge-2', topic: '有机化合物 · 官能团识别', mastery: 71 }
])

const gradingBacklog = ref([
  { id: 'todo-1', text: '待批改：力学课堂练习（5 份）', time: '今日 17:00', type: 'warning' },
  { id: 'todo-2', text: '待复核：化学分析报告（3 份）', time: '明日 10:00', type: 'info' }
])

const summaryCards = computed(() => {
  const totalPending = assignments.value.filter(item => item.status === 'pending').length
  const totalGraded = assignments.value.filter(item => item.status === 'graded').length
  const avgScore = assignments.value
    .filter(item => item.status === 'graded')
    .reduce((sum, item) => sum + item.score, 0)

  const gradedCount = assignments.value.filter(item => item.status === 'graded').length
  const averageScore = gradedCount > 0 ? Math.round(avgScore / gradedCount) : 0

  return [
    {
      id: 'pending',
      label: '待批改',
      value: `${totalPending}`,
      icon: Warning,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'graded',
      label: '已批改',
      value: `${totalGraded}`,
      icon: TrendCharts,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      id: 'avg',
      label: '平均得分',
      value: `${averageScore}`,
      icon: Star,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ]
})

const filteredAssignments = computed(() => {
  return assignments.value.filter(assignment => {
    const matchesKeyword = !searchKeyword.value ||
      assignment.title.includes(searchKeyword.value) ||
      assignment.student.name.includes(searchKeyword.value)
    const matchesStatus = !selectedStatus.value || assignment.status === selectedStatus.value
    const matchesCourse = !selectedCourse.value || assignment.course.name === courses.find(c => c.id === selectedCourse.value)?.name
    const matchesClass = !selectedClass.value || assignment.className === classes.find(cls => cls.id === selectedClass.value)?.name
    return matchesKeyword && matchesStatus && matchesCourse && matchesClass
  })
})

// Assignment workflow computed properties
const pendingAssignments = computed(() => {
  return filteredAssignments.value.filter(assignment => assignment.status === 'submitted')
})

const gradedAssignments = computed(() => {
  return filteredAssignments.value.filter(assignment => assignment.status === 'graded')
})

const currentAssignments = computed(() => {
  switch (activeTab.value) {
    case 'pending-grading':
      return pendingAssignments.value
    case 'graded':
      return gradedAssignments.value
    case 'analytics':
      return gradedAssignments.value // Show all graded assignments for analytics
    default:
      return filteredAssignments.value
  }
})

const toggleQuickFilter = (key: string) => {
  if (activeQuickFilters.value.includes(key)) {
    activeQuickFilters.value = activeQuickFilters.value.filter(item => item !== key)
  } else {
    activeQuickFilters.value.push(key)
  }
}

const getSubjectVariant = (subject: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    physics: 'primary',
    chemistry: 'success',
    math: 'warning',
    biology: 'info',
    language: 'danger'
  }
  return map[subject] || 'info'
}

const getTypeName = (type: Assignment['type']) => {
  const map: Record<Assignment['type'], string> = {
    essay: '主观题',
    quiz: '客观题',
    project: '项目任务'
  }
  return map[type]
}

const getStatusText = (status: Assignment['status']) => {
  const map: Record<Assignment['status'], string> = {
    pending: '待批改',
    graded: '已批改',
    overdue: '逾期未交'
  }
  return map[status]
}

const getStatusTag = (status: Assignment['status']): 'warning' | 'success' | 'danger' | 'info' => {
  const map: Record<Assignment['status'], 'warning' | 'success' | 'danger' | 'info'> = {
    pending: 'warning',
    graded: 'success',
    overdue: 'danger'
  }
  return map[status]
}

const getGradeVariant = (score: number, total: number): 'success' | 'warning' | 'danger' => {
  const ratio = score / total
  if (ratio >= 0.85) return 'success'
  if (ratio >= 0.6) return 'warning'
  return 'danger'
}

const getGradeLabel = (score: number, total: number) => {
  const ratio = score / total
  if (ratio >= 0.85) return '优秀'
  if (ratio >= 0.6) return '合格'
  return '待提升'
}

const getDaysOverdue = (dueDate: Date) => {
  const diff = Date.now() - dueDate.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// 新增作业卡片相关函数
const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    'pending': 'Clock',
    'graded': 'Check',
    'overdue': 'Warning',
    'submitted': 'Upload'
  }
  return iconMap[status] || 'Clock'
}

// 统一侧边栏配置
const leftSidebarSections = computed<LeftSidebarSectionConfig[]>(() =>
  PAGE_SIDEBAR_CONFIGS.assignments.left
)

const rightSidebarSections = computed<RightSidebarSectionConfig[]>(() =>
  PAGE_SIDEBAR_CONFIGS.assignments.right
)

// 为侧边栏组件准备的数据
const subjectOptionsForSidebar = computed(() => [
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '数学', value: 'math' }
])

const sidebarFilters = computed(() => ({
  subject: selectedCourse.value,
  status: selectedStatus.value,
  dateRange: null
}))

// 数据洞察计算属性
const pendingCount = computed(() =>
  assignments.value.filter(a => a.status === 'submitted').length
)

const gradedCount = computed(() =>
  assignments.value.filter(a => a.status === 'graded').length
)

const completionRate = computed(() => {
  const total = assignments.value.length
  if (total === 0) return 0
  const completed = assignments.value.filter(a => a.status === 'graded').length
  return Math.round((completed / total) * 100)
})

// 统一侧边栏事件处理
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'create':
      createAssignment()
      break
    case 'import':
      importAssignments()
      break
    case 'export':
      ElMessage.info('批量导出功能开发中...')
      break
    default:
      console.log('Unhandled quick action:', action)
  }
}

const handleFilterChange = (newFilters: any) => {
  // 更新筛选器状态
  if (newFilters.subject !== undefined) {
    selectedCourse.value = newFilters.subject
  }
  if (newFilters.status !== undefined) {
    selectedStatus.value = newFilters.status
  }
}

const handleResourceAction = (action: string, id: string | number) => {
  console.log('Resource action:', action, id)
  if (action === 'open') {
    openResource(assignmentResources.find(r => r.id === id))
  }
}

const handleCollaborationAction = (action: string, data: any) => {
  console.log('Collaboration action:', action, data)
}

const openResource = (resource: any) => {
  if (resource) {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
}


const viewAssignment = (assignment: any) => {
  ElMessage.info(`查看作业详情：${assignment.title}`)
}

const createAssignment = () => {
  router.push('/assignments/create')
}

const resetFilters = () => {
  searchKeyword.value = ''
  selectedStatus.value = ''
  selectedCourse.value = ''
  selectedClass.value = ''
}

const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const handleAssignmentAction = (command: string, assignment: any) => {
  switch (command) {
    case 'view':
      viewAssignment(assignment)
      break
    case 'edit':
      ElMessage.info(`编辑作业：${assignment.title}`)
      break
    case 'download':
      ElMessage.info(`下载作业：${assignment.title}`)
      break
    case 'message':
      ElMessage.info(`发送消息给：${assignment.student.name}`)
      break
  }
}

const importAssignments = () => {
  ElMessage.info('作业导入功能即将上线')
}

const openFeedbackTemplates = () => {
  ElMessage.info('打开常用评语库')
}

const generateFeedback = () => {
  ElMessage.success('AI 正在生成作业整体反馈')
}

// AI 评语面板方法
const toggleAIPanel = () => {
  showAIPanel.value = !showAIPanel.value

  // 如果展开面板但没有选中作业，选择第一个待批改的作业
  if (showAIPanel.value && !currentAssignmentForAI.value) {
    const firstPendingAssignment = filteredAssignments.value.find(a => a.status === 'pending')
    if (firstPendingAssignment) {
      currentAssignmentForAI.value = firstPendingAssignment
    }
  }
}

const handleAICommentApplied = (comment: any) => {
  ElMessage.success('AI 评语已应用')
  // 这里可以将评语应用到当前作业的批改中
}

const handleRegenerateAIComment = () => {
  if (currentAssignmentForAI.value) {
    ElMessage.info('正在重新生成 AI 评语...')
    // 模拟重新生成
    setTimeout(() => {
      ElMessage.success('AI 评语已重新生成')
    }, 2000)
  }
}

// Event handlers for GradingWorkspace
const handleAssignmentSelected = (assignment: any) => {
  // 更新 AI 面板的当前作业
  if (showAIPanel.value) {
    currentAssignmentForAI.value = assignment
  }
  console.log('Assignment selected:', assignment.title)
}

const handleGradingComplete = (assignmentId: string, score: number, comment: string) => {
  const assignment = assignments.value.find(a => a.id === assignmentId)
  if (assignment) {
    assignment.status = 'graded'
    assignment.score = score
    ElMessage.success(`作业 ${assignment.title} 批改完成`)
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


.filter-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  cursor: pointer;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.reminder-item {
  display: flex;
  justify-content: space-between;
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
  background: rgba(15, 23, 42, 0.04);
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.suggestion-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--edu-text-primary);
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.knowledge-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.assignments-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.assignments-card {
  :deep(.edu-card__body-content) {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

.assignments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.assignments-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.assignments-subtitle {
  margin: 0;
  color: var(--edu-text-secondary);
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignment-row {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr 0.8fr 0.5fr 0.6fr 0.5fr;
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.04);
}

.assignment-row--urgent {
  border: 1px solid rgba(251, 191, 36, 0.6);
}

.assignment-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assignment-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.assignment-desc {
  margin: 0;
  color: var(--edu-text-secondary);
  font-size: 13px;
}

.assignment-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.assignment-student {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.assignment-time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.late-badge {
  color: #ef4444;
}

.assignment-score {
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--edu-text-primary);
}

.score-total {
  color: var(--edu-text-secondary);
}

.score-pending {
  color: var(--edu-text-secondary);
}

.assignment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.assignment-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(243, 245, 250, 0.9) 100%);
  box-shadow: 0 24px 45px -26px rgba(15, 23, 42, 0.35);
}

.assignment-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--edu-text-secondary);
  font-size: 12px;
}

.assignment-card__footer {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 1200px) {
  .assignment-row {
    grid-template-columns: 1.4fr 0.8fr 0.8fr 0.6fr;
    grid-auto-flow: row;
  }
}

@media (max-width: 960px) {
  .workspace-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .assignment-row {
    grid-template-columns: 1fr;
  }

  .assignment-actions {
    justify-content: flex-end;
  }

  .assignments-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.assignments-tabs {
  margin: 16px 0;
  width: 100%;

  :deep(.edu-tabs__nav) {
    background: rgba(15, 23, 42, 0.04);
    border-radius: 12px;
    padding: 6px;
    gap: 6px;
  }

  :deep(.edu-tabs__tab) {
    border-radius: 8px;
    padding: 12px 20px;
    font-weight: 500;
    background: transparent;
    color: var(--edu-text-secondary);
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  }

  :deep(.edu-tabs__tab:hover) {
    background: rgba(99, 102, 241, 0.08);
    color: var(--edu-text-primary);
  }

  :deep(.edu-tabs__tab--active) {
    background: var(--edu-bg-primary);
    color: var(--edu-primary-600);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.edu-tabs__content) {
    padding: 20px 0 0 0;
  }
}


// 增强作业卡片样式
.assignment-card {
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  cursor: pointer;
  box-shadow: var(--edu-shadow-sm);
  position: relative;

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  &--urgent {
    border-left: 4px solid var(--edu-danger-500);
  }

  &--late {
    border-left: 4px solid var(--edu-warning-500);
  }

  &--graded {
    border-left: 4px solid var(--edu-success-500);
  }

  &--pending {
    border-left: 4px solid var(--edu-primary-500);
  }
}

.assignment-card__status-bar {
  height: 4px;
  width: 100%;

  &--pending {
    background: linear-gradient(90deg, var(--edu-primary-400) 0%, var(--edu-primary-600) 100%);
  }

  &--graded {
    background: linear-gradient(90deg, var(--edu-success-400) 0%, var(--edu-success-600) 100%);
  }

  &--overdue {
    background: linear-gradient(90deg, var(--edu-warning-400) 0%, var(--edu-warning-600) 100%);
  }

  &--submitted {
    background: linear-gradient(90deg, var(--edu-info-400) 0%, var(--edu-info-600) 100%);
  }
}

.status-indicator {
  width: 100%;
  height: 100%;
}

.assignment-card__student {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
}

.student-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.student-avatar {
  position: relative;

  .status-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: white;
    border: 2px solid var(--edu-bg-primary);

    &--pending {
      background: var(--edu-primary-500);
    }

    &--graded {
      background: var(--edu-success-500);
    }

    &--overdue {
      background: var(--edu-warning-500);
    }

    &--submitted {
      background: var(--edu-info-500);
    }
  }
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.student-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.student-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.class-name {
  font-size: 13px;
  color: var(--edu-text-secondary);
  font-weight: 500;
}

.assignment-card__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  flex: 1;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.assignment-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  line-height: 1.4;
}

.assignment-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.late-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--edu-warning-600);
  font-weight: 500;
}

.submit-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.assignment-description {
  color: var(--edu-text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.grading-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  border: 1px solid var(--edu-border-light);
}

.score-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--edu-text-primary);
}

.score-divider {
  font-size: 16px;
  color: var(--edu-text-tertiary);
  font-weight: 500;
}

.score-total {
  font-size: 16px;
  color: var(--edu-text-secondary);
  font-weight: 500;
}

.score-label {
  font-size: 12px;
  color: var(--edu-text-secondary);
  font-weight: 500;
}

.grade-percentage {
  font-size: 18px;
  font-weight: 600;
  padding: 8px 16px;
  background: var(--edu-success-100);
  color: var(--edu-success-600);
  border-radius: var(--radius-base);
}

.assignment-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);
}

.urgency-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--edu-danger-600);
  font-weight: 600;
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .summary-card,
  .assignment-row,
  .assignment-card {
    transition: none !important;
  }
}

// 统一侧边栏自定义样式
.custom-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  cursor: pointer;
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

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.reminder-item {
  display: flex;
  justify-content: space-between;
}

.custom-ai-assistant {
  display: flex;
  flex-direction: column;
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
  background: rgba(15, 23, 42, 0.04);
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.suggestion-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--edu-text-primary);
  flex: 1;
}

.suggestion-text {
  font-weight: 600;
  color: var(--edu-text-primary);
  font-size: 14px;
}

.suggestion-meta {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.custom-resources,
.custom-collaboration,
.custom-stats,
.custom-quick-tips {
  display: flex;
  flex-direction: column;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.knowledge-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.knowledge-topic {
  color: var(--edu-text-primary);
  font-weight: 500;
}

.collaboration-list,
.tip-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collaboration-item,
.tip-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.collaboration-content,
.tip-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.collaboration-text,
.tip-content {
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

.collaboration-time {
  color: var(--edu-text-secondary);
}

.tip-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--edu-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

// 主标签页样式
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

.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.assignment-card {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  &--urgent {
    border-left: 4px solid var(--edu-error-500);
  }

  &--late {
    border-left: 4px solid var(--edu-warning-500);
  }
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);

  .assignment-info {
    flex: 1;

    h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
    }

    .assignment-meta {
      display: flex;
      gap: var(--spacing-xs);
    }
  }

  .assignment-actions {
    margin-left: var(--spacing-sm);
  }
}

.assignment-content {
  padding: var(--spacing-lg);

  .assignment-stats {
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

  .assignment-student {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);
    padding: var(--spacing-sm);
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-base);

    .student-info {
      .student-name {
        font-weight: var(--font-weight-medium);
        color: var(--edu-text-primary);
        font-size: var(--font-size-sm);
      }

      .student-class {
        font-size: var(--font-size-xs);
        color: var(--edu-text-tertiary);
      }
    }
  }

  .assignment-description {
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-base);
    line-height: var(--edu-leading-normal);
  }

  .assignment-time {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    .time-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: var(--edu-text-secondary);

      &--late {
        color: var(--edu-warning-600);
      }
    }
  }
}

.assignment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
}

.assignments-table {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
}

.assignment-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  &__title {
    font-weight: var(--font-weight-semibold);
    color: var(--edu-text-primary);
  }

  &__meta {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    font-size: var(--font-size-xs);
    color: var(--edu-text-secondary);
  }
}

.analytics-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.view-switcher {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.assignments-header-card {
  margin-bottom: var(--spacing-lg);
}

.assignments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.assignments-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.assignments-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.assignments-subtitle {
  margin: 0;
  color: var(--edu-text-secondary);
  font-size: 14px;
}

.assignments-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

// 响应式设计
@media (max-width: 1200px) {
  .assignments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .assignments-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .filter-toolbar .el-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .assignments-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .assignments-grid {
    grid-template-columns: 1fr;
  }

  .assignment-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .assignment-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
