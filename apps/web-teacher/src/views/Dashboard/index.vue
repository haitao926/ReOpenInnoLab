<template>
  <TeacherWorkspaceLayout
    title="洞察面板"
    subtitle="教学数据分析与智能洞察，助力科学决策"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <EduTag variant="primary" size="md" class="subject-chip">
          {{ currentSubjectName }}
        </EduTag>
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
        <!-- 筛选器插槽 -->
        <template #filters="{ data }">
          <div class="dashboard-filters">
            <div class="filter-section">
              <h5 class="sidebar-section-title">分析维度</h5>
              <div class="category-list">
                <button
                  v-for="dimension in analysisDimensions"
                  :key="dimension.type"
                  type="button"
                  class="sidebar-category-item"
                  :class="{ active: selectedDimension === dimension.type }"
                  @click="selectDimension(dimension.type)"
                >
                  <span class="sidebar-category-icon" :style="{ backgroundColor: dimension.color }">
                    <el-icon><component :is="dimension.icon" /></el-icon>
                  </span>
                  <div class="sidebar-category-info">
                    <div class="sidebar-category-name">{{ dimension.name }}</div>
                    <div class="sidebar-category-count">{{ dimension.count }} 项</div>
                  </div>
                </button>
              </div>
            </div>

            <div class="filter-section">
              <h5 class="sidebar-section-title">时间范围</h5>
              <div class="time-range-filters">
                <div class="filter-tags">
                  <el-tag
                    v-for="range in timeRanges"
                    :key="range.key"
                    :effect="selectedTimeRange === range.key ? 'dark' : 'plain'"
                    :type="selectedTimeRange === range.key ? 'primary' : 'info'"
                    class="filter-tag"
                    @click="selectTimeRange(range.key)"
                  >
                    {{ range.label }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="sidebar-quick-actions">
            <el-button type="primary" size="small" class="sidebar-quick-action-btn" @click="createNewCourse">
              <el-icon class="action-icon"><Plus /></el-icon>
              创建课程
            </el-button>
            <el-button type="default" size="small" class="sidebar-quick-action-btn" @click="createNewAssignment">
              <el-icon class="action-icon"><EditPen /></el-icon>
              新建作业
            </el-button>
            <el-button type="default" size="small" class="sidebar-quick-action-btn" @click="scheduleExperiment">
              <el-icon class="action-icon"><Monitor /></el-icon>
              安排实验
            </el-button>
          </div>
        </template>

        <!-- 教学动态插槽 -->
        <template #activity="{ data }">
          <div class="sidebar-activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="sidebar-activity-item">
              <div class="sidebar-activity-icon">
                <el-icon><component :is="activity.icon" /></el-icon>
              </div>
              <div class="sidebar-activity-content">
                <div class="sidebar-activity-text">{{ activity.studentName }} {{ activity.description }}</div>
                <div class="sidebar-activity-time">{{ activity.time }}</div>
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
        <!-- 数据洞察插槽 -->
        <template #insights="{ data }">
          <div class="sidebar-stats">
            <div class="sidebar-stat-item">
              <div class="sidebar-stat-label">平均评分</div>
              <div class="sidebar-stat-value">{{ averageRating }}/5</div>
            </div>
            <div class="sidebar-stat-item">
              <div class="sidebar-stat-label">热门内容</div>
              <div class="sidebar-stat-value">{{ featuredCount }} 个</div>
            </div>
            <div class="sidebar-stat-item">
              <div class="sidebar-stat-label">总内容数</div>
              <div class="sidebar-stat-value">{{ contentList.length }} 个</div>
            </div>
          </div>
        </template>

        <!-- 资源参考插槽 -->
        <template #resources="{ data }">
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
        </template>

        <!-- 协作动态插槽 -->
        <template #collaboration="{ data }">
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
        </template>
      </ManagementSidebarRight>
    </template>

    <div class="insight-content">
      <!-- 主要内容标签页 -->
      <EduTabs
        :tabs="dashboardTabs"
        v-model:active-id="activeTab"
        variant="card"
        class="dashboard-tabs"
        @change="handleTabChange"
      >
        <template #panel-课堂态势>
          <div class="insight-grid">
            <EduCard
              class="insight-card"
              variant="elevated"
              title="今日课程安排"
              subtitle="按需调整节奏，留意跨班协同"
              :hoverable="true"
              @click="navigateToSchedule"
            >
              <div class="schedule-list">
                <div v-for="item in todaySchedule" :key="item.id" class="schedule-item">
                  <div class="schedule-time">
                    <span class="schedule-start">{{ item.startTime }}</span>
                    <span class="schedule-end">{{ item.endTime }}</span>
                  </div>
                  <div class="schedule-detail">
                    <div class="schedule-title">{{ item.title }}</div>
                    <div class="schedule-meta">
                      <EduTag :variant="getSubjectVariant(item.subject)" size="xs">
                        {{ getSubjectName(item.subject) }}
                      </EduTag>
                      <span class="schedule-class">{{ item.className }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </EduCard>

            <EduCard
              class="insight-card"
              variant="gradient"
              gradient-variant="primary"
              title="学生状态概览"
              subtitle="高一年级两班"
              :hoverable="true"
              @click="navigateToStudents"
            >
              <div class="student-status">
                <div v-for="status in studentHighlights" :key="status.id" class="student-status__item">
                  <span class="student-status__icon" :class="`student-status__icon--${status.tone}`">
                    <el-icon><component :is="status.icon" /></el-icon>
                  </span>
                  <div class="student-status__content">
                    <span class="student-status__value">{{ status.value }}</span>
                    <span class="student-status__label">{{ status.label }}</span>
                  </div>
                </div>
              </div>
            </EduCard>

            <EduCard
              class="insight-card"
              variant="bordered"
              title="课堂互动与学习提醒"
              subtitle="AI 聚合课堂信号，提示即时干预"
              :hoverable="true"
            >
              <div class="activity-feed">
                <div v-for="activity in recentActivities" :key="activity.id" class="activity-feed__item">
                  <div class="activity-feed__meta">
                    <span class="activity-feed__label">{{ activity.label }}</span>
                    <span class="activity-feed__time">{{ activity.time }}</span>
                  </div>
                  <div class="activity-feed__content">
                    <strong>{{ activity.studentName }}</strong>
                    <span class="activity-feed__text">{{ activity.description }}</span>
                  </div>
                </div>
              </div>
            </EduCard>
          </div>
        </template>

        <template #panel-作业提醒>
          <div class="insight-grid">
            <EduCard
              class="insight-card"
              variant="elevated"
              title="本周待办事项"
              subtitle="聚焦关键任务，确保教学节奏"
              :hoverable="true"
            >
              <div class="todo-list">
                <div
                  v-for="todo in criticalTodos"
                  :key="todo.id"
                  class="todo-item"
                  :class="{ 'todo-item--completed': todo.completed }"
                >
                  <div class="todo-content">
                    <div class="todo-title">{{ todo.title }}</div>
                    <div class="todo-meta">
                      <EduTag
                        v-if="todo.course"
                        :variant="getSubjectVariant(todo.course.subject)"
                        size="sm"
                      >
                        {{ todo.course.name }}
                      </EduTag>
                      <span class="todo-time">{{ todo.time }}</span>
                    </div>
                  </div>
                  <EduTag :variant="getPriorityVariant(todo.priority)" size="xs">
                    {{ getPriorityText(todo.priority) }}
                  </EduTag>
                </div>
              </div>
            </EduCard>

            <EduCard
              class="insight-card"
              variant="glass"
              title="作业批提醒"
              subtitle="需要及时批改的作业列表"
              :hoverable="true"
            >
              <div class="assignment-alerts">
                <div v-for="alert in assignmentAlerts" :key="alert.id" class="assignment-alert">
                  <div class="alert-content">
                    <div class="alert-title">{{ alert.title }}</div>
                    <div class="alert-meta">
                      <EduTag :variant="getSubjectVariant(alert.subject)" size="xs">
                        {{ getSubjectName(alert.subject) }}
                      </EduTag>
                      <span class="alert-count">{{ alert.submittedCount }}/{{ alert.totalCount }} 已提交</span>
                    </div>
                  </div>
                  <EduTag :variant="getUrgencyVariant(alert.urgency)" size="xs">
                    {{ getUrgencyText(alert.urgency) }}
                  </EduTag>
                </div>
              </div>
            </EduCard>

            <EduCard
              class="insight-card"
              variant="bordered"
              title="学生作业分析"
              subtitle="AI 分析的作业质量趋势"
              :hoverable="true"
            >
              <div class="assignment-analysis">
                <div v-for="analysis in assignmentAnalysis" :key="analysis.id" class="analysis-item">
                  <div class="analysis-title">{{ analysis.title }}</div>
                  <div class="analysis-metrics">
                    <div class="metric">
                      <span class="metric-label">平均分</span>
                      <span class="metric-value">{{ analysis.avgScore }}</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">完成率</span>
                      <span class="metric-value">{{ analysis.completionRate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </EduCard>
          </div>
        </template>

        <template #panel-教学洞察>
          <div class="insight-grid">
            <EduCard
              class="insight-card"
              variant="glass"
              title="AI 教学建议"
              subtitle="基于数据分析的教学优化建议"
              :hoverable="true"
            >
              <div class="ai-suggestions">
                <div v-for="suggestion in aiSuggestions" :key="suggestion.id" class="suggestion-item">
                  <div class="suggestion-icon">
                    <el-icon><component :is="suggestion.icon" /></el-icon>
                  </div>
                  <div class="suggestion-content">
                    <div class="suggestion-title">{{ suggestion.title }}</div>
                    <div class="suggestion-description">{{ suggestion.description }}</div>
                    <div class="suggestion-impact">
                      <EduTag :variant="getImpactVariant(suggestion.impact)" size="xs">
                        影响程度: {{ getImpactText(suggestion.impact) }}
                      </EduTag>
                    </div>
                  </div>
                </div>
              </div>
            </EduCard>

            <EduCard
              class="insight-card"
              variant="elevated"
              title="学生学习分析"
              subtitle="个性化学习路径推荐"
              :hoverable="true"
            >
              <div class="learning-insights">
                <div v-for="insight in learningInsights" :key="insight.id" class="insight-item">
                  <div class="insight-header">
                    <span class="insight-student">{{ insight.studentName }}</span>
                    <EduTag :variant="getInsightVariant(insight.type)" size="xs">
                      {{ insight.type }}
                    </EduTag>
                  </div>
                  <div class="insight-description">{{ insight.description }}</div>
                  <div class="insight-actions">
                    <el-button type="text" size="small" @click="handleInsightAction(insight, 'view')">
                      查看详情
                    </el-button>
                    <el-button type="text" size="small" @click="handleInsightAction(insight, 'intervene')">
                      个性化辅导
                    </el-button>
                  </div>
                </div>
              </div>
            </EduCard>

            <EduCard
              class="insight-card"
              variant="gradient"
              gradient-variant="success"
              title="教学效果评估"
              subtitle="综合教学质量指标"
              :hoverable="true"
            >
              <div class="teaching-metrics">
                <div v-for="metric in teachingMetrics" :key="metric.id" class="metric-item">
                  <div class="metric-score">{{ metric.score }}</div>
                  <div class="metric-details">
                    <div class="metric-title">{{ metric.title }}</div>
                    <div class="metric-trend">
                      <el-icon><component :is="metric.trendIcon" /></el-icon>
                      <span>{{ metric.trendText }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </EduCard>
          </div>
        </template>
      </EduTabs>
    </div>

    <template #footer>
      <div class="footer-column">
        <h4 class="footer-title">快速操作</h4>
        <div class="footer-actions">
          <el-button
            v-for="action in quickActions"
            :key="action.id"
            type="primary"
            link
            @click="action.handler()"
          >
            <el-icon><component :is="action.icon" /></el-icon>
            {{ action.label }}
          </el-button>
        </div>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">导出中心</h4>
        <p class="footer-text">生成周期报告、学情简报，可一键分享给教研团队。</p>
        <el-button type="text" size="small" @click="generateReport">
          <el-icon><Document /></el-icon>
          生成综合报告
        </el-button>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">系统公告</h4>
        <ul class="footer-list">
          <li v-for="notice in dashboardNotices" :key="notice.id" class="footer-list__item">
            <el-icon><Bell /></el-icon>
            <span>{{ notice.text }}</span>
          </li>
        </ul>
      </div>
    </template>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  TrendCharts,
  Warning,
  Star,
  Download,
  Plus,
  EditPen,
  Monitor,
  Clock,
  Document,
  Bell,
  User,
  School,
  Collection,
  Timer,
  More
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import { EduCard, EduTag, EduTabs } from '@reopeninnolab/ui-kit'
import { useAppStore } from '@/stores/app'
import { PAGE_SIDEBAR_CONFIGS } from '@/constants/managementSidebar'

interface TodoItem {
  id: string
  title: string
  time: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  course?: {
    name: string
    subject: string
  }
}

interface ScheduleItem {
  id: string
  title: string
  startTime: string
  endTime: string
  subject: string
  className: string
}

const router = useRouter()
const appStore = useAppStore()
const { selectedSubject } = storeToRefs(appStore)

const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const selectedDimension = ref('course')
const selectedTimeRange = ref('week')
const activeTab = ref('课堂态势')

// 侧边栏配置
const leftSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.dashboard.left)
const rightSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.dashboard.right)

const SUBJECT_LABELS: Record<string, string> = {
  ai: '人工智能'
}

const teacherSubject = computed(() => {
  const subject = selectedSubject.value
  if (subject && subject !== 'all' && subject !== 'my-subjects') {
    return subject
  }
  return 'ai'
})

const currentSubjectName = computed(() => SUBJECT_LABELS[teacherSubject.value] || '人工智能')

const baseCriticalTodos = ref<TodoItem[]>([
  {
    id: 'todo-1',
    title: '完善 AI 创意编程班项目反馈',
    time: '今日 17:00 前',
    priority: 'high',
    completed: false,
    course: { name: 'AI 创意编程', subject: 'ai' }
  },
  {
    id: 'todo-2',
    title: '更新 AI 数据洞察实验安全告知',
    time: '本周内',
    priority: 'medium',
    completed: true,
    course: { name: 'AI 数据洞察实验', subject: 'ai' }
  },
  {
    id: 'todo-3',
    title: '整理 AI 视觉项目调试记录',
    time: '明日 10:00 前',
    priority: 'low',
    completed: false,
    course: { name: 'AI 视觉项目', subject: 'ai' }
  }
])

const criticalTodos = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseCriticalTodos.value
  }
  return baseCriticalTodos.value.filter(todo => todo.course?.subject === subject)
})

const baseTodaySchedule = ref<ScheduleItem[]>([
  {
    id: 'schedule-1',
    title: '高一1班 · AI 创意编程（第五节）',
    startTime: '08:30',
    endTime: '09:15',
    subject: 'ai',
    className: '高一1班'
  },
  {
    id: 'schedule-2',
    title: '高二选修 · AI 数据洞察实验',
    startTime: '10:10',
    endTime: '10:55',
    subject: 'ai',
    className: '高二选修班'
  },
  {
    id: 'schedule-3',
    title: '跨班教研会议 · 智能教学共创',
    startTime: '15:30',
    endTime: '16:10',
    subject: 'ai',
    className: '全年级'
  }
])

const todaySchedule = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseTodaySchedule.value
  }
  return baseTodaySchedule.value.filter(schedule => schedule.subject === subject)
})

const baseRecentActivities = ref([
  {
    id: 'activity-1',
    label: '课堂互动',
    studentName: '张小明',
    description: '在 AI 共创课堂尝试新的提示词，AI 建议同步推送示例代码。',
    time: '5 分钟前',
    subject: 'ai'
  },
  {
    id: 'activity-2',
    label: '作业提醒',
    studentName: '李小红',
    description: 'AI 数据洞察实验记录迟交，系统建议发送个性化提醒。',
    time: '20 分钟前',
    subject: 'ai'
  },
  {
    id: 'activity-3',
    label: '学习预警',
    studentName: '王大伟',
    description: 'AI 视觉调试任务连续两次未通过，建议安排定向辅导。',
    time: '1 小时前',
    subject: 'ai'
  }
])

const recentActivities = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseRecentActivities.value
  }
  return baseRecentActivities.value.filter(activity => activity.subject === subject)
})

const studentHighlights = ref([
  { id: 'online', label: '在线', value: '42 / 45', icon: User, tone: 'positive' },
  { id: 'submission', label: '今日新提交', value: '3 份作业', icon: Collection, tone: 'info' },
  { id: 'alert', label: '待关注', value: '2 位学生', icon: Warning, tone: 'warning' }
])

const summaryStats = computed(() => {
  const baseStats = {
    'my-subjects': { keyKPI: '89.1', alertCount: 2, aiSuggestions: 12 },
    'ai': { keyKPI: '89.8', alertCount: 2, aiSuggestions: 14 }
  }

  const subjectKey = teacherSubject.value || 'my-subjects'
  return baseStats[subjectKey as keyof typeof baseStats] || baseStats['my-subjects']
})

const summaryCards = computed(() => [
  {
    id: 'kpi',
    label: getSubjectKPILabel(teacherSubject.value || 'my-subjects'),
    value: summaryStats.value.keyKPI,
    icon: TrendCharts,
    gradient: getSubjectGradient(teacherSubject.value || 'my-subjects', 'kpi')
  },
  {
    id: 'alerts',
    label: '异常预警',
    value: `${summaryStats.value.alertCount} 项`,
    icon: Warning,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'ai',
    label: 'AI 建议',
    value: `${summaryStats.value.aiSuggestions} 条`,
    icon: MagicStick,
    gradient: getSubjectGradient(teacherSubject.value || 'my-subjects', 'ai')
  }
])

const analysisDimensions = computed(() => [
  { name: '课程维度', count: 12, icon: 'Reading', color: '#4ECDC4', type: 'course' },
  { name: '班级维度', count: 5, icon: 'School', color: '#45B7D1', type: 'class' },
  { name: '学生维度', count: 186, icon: 'User', color: '#96CEB4', type: 'student' },
  { name: '时间维度', count: 30, icon: 'Clock', color: '#FFB347', type: 'time' }
])

const timeRanges = computed(() => [
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'semester', label: '本学期' }
])

const indicatorTemplates = ref([
  { id: 'template-1', name: '教学效果模板' },
  { id: 'template-2', name: '学习进度模板' },
  { id: 'template-3', name: '互动分析模板' }
])

const baseAiObservationReports = ref([
  { id: 'report-1', text: 'AI 创意编程班项目达成率提升 6%，建议扩展跨学科案例。', type: '积极变化', icon: TrendCharts, subject: 'ai' },
  { id: 'report-2', text: 'AI 数据洞察实验提交率低于 80%，建议推送分步引导。', type: '改进建议', icon: Warning, subject: 'ai' },
  { id: 'report-3', text: 'AI 视觉项目学生满意度 96%，适合安排公开课展示。', type: '正面评价', icon: Star, subject: 'ai' }
])

const aiObservationReports = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseAiObservationReports.value
  }
  return baseAiObservationReports.value.filter(report => report.subject === subject)
})

const baseActionSuggestions = ref([
  { id: 'action-1', text: '为 AI 课程配置"提示词对照表"模板', priority: 'high', subject: 'ai' },
  { id: 'action-2', text: '安排 AI 数据洞察实验的助教辅导时段', priority: 'medium', subject: 'ai' },
  { id: 'action-3', text: '整理 AI 视觉项目调试经验供教研分享', priority: 'low', subject: 'ai' }
])

const actionSuggestions = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseActionSuggestions.value
  }
  return baseActionSuggestions.value.filter(item => item.subject === subject)
})

const exportTasks = ref([
  { id: 'task-1', name: '周教学报告', status: 'ready' },
  { id: 'task-2', name: '学生成绩分析', status: 'processing' },
  { id: 'task-3', name: '课程满意度调查', status: 'ready' }
])

const dashboardNotices = ref([
  { id: 'notice-1', text: '周三 19:00 将开展"AI 赋能课堂"线上研讨。' },
  { id: 'notice-2', text: '新版实验工作坊支持多人协同编辑，请及时体验。' }
])

// 标签页配置
const dashboardTabs = computed(() => [
  {
    id: '课堂态势',
    label: '课堂态势',
    icon: 'Monitor',
    badge: {
      text: '实时',
      variant: 'success'
    }
  },
  {
    id: '作业提醒',
    label: '作业提醒',
    icon: 'EditPen',
    badge: {
      text: `${criticalTodos.value.filter(t => !t.completed).length} 项`,
      variant: 'warning'
    }
  },
  {
    id: '教学洞察',
    label: '教学洞察',
    icon: 'TrendCharts',
    badge: {
      text: 'AI 分析',
      variant: 'info'
    }
  }
])

// 作业提醒数据
const baseAssignmentAlerts = ref([
  {
    id: 'alert-1',
    title: 'AI 项目日志',
    subject: 'ai',
    submittedCount: 32,
    totalCount: 45,
    urgency: 'high'
  },
  {
    id: 'alert-2',
    title: 'AI 数据洞察实验笔记',
    subject: 'ai',
    submittedCount: 28,
    totalCount: 30,
    urgency: 'medium'
  },
  {
    id: 'alert-3',
    title: 'AI 视觉调试报告',
    subject: 'ai',
    submittedCount: 42,
    totalCount: 42,
    urgency: 'low'
  }
])

const assignmentAlerts = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseAssignmentAlerts.value
  }
  return baseAssignmentAlerts.value.filter(alert => alert.subject === subject)
})

const assignmentAnalysis = ref([
  {
    id: 'analysis-1',
    title: '高一年级作业质量分析',
    avgScore: '85.6',
    completionRate: '94.2%'
  },
  {
    id: 'analysis-2',
    title: '本周作业提交趋势',
    avgScore: '82.3',
    completionRate: '91.8%'
  }
])

// 教学洞察数据
const baseAiSuggestions = ref([
  {
    id: 'suggestion-1',
    title: '引入提示词实战演练',
    description: '针对 AI 创意编程课程，可安排"优秀提示词对照"环节，预计提升课堂产出 30%。',
    icon: 'MagicStick',
    impact: 'high',
    subject: 'ai'
  },
  {
    id: 'suggestion-2',
    title: '设置 AI 数据分层任务',
    description: 'AI 数据洞察实验难度梯度偏高，建议按基础/拓展任务分层投放。',
    icon: 'TrendCharts',
    impact: 'medium',
    subject: 'ai'
  },
  {
    id: 'suggestion-3',
    title: '预留机器人调试时间',
    description: '机器人项目因硬件调试花费时间，建议课堂中预留 15 分钟问题排查。',
    icon: 'Timer',
    impact: 'low',
    subject: 'ai'
  }
])

const aiSuggestions = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseAiSuggestions.value
  }
  return baseAiSuggestions.value.filter(item => item.subject === subject)
})

const baseLearningInsights = ref([
  {
    id: 'insight-1',
    studentName: '张小明',
    type: '学习预警',
    description: '连续 3 次 AI 项目提交质量偏低，建议安排一对一提示词辅导。',
    actions: ['查看详情', '个性化辅导'],
    subject: 'ai'
  },
  {
    id: 'insight-2',
    studentName: '李小红',
    type: '优秀表现',
    description: 'AI 视觉调试任务表现突出，建议推荐参加创客挑战赛。',
    actions: ['查看详情', '推荐参赛'],
    subject: 'ai'
  }
])

const learningInsights = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseLearningInsights.value
  }
  return baseLearningInsights.value.filter(insight => insight.subject === subject)
})

const teachingMetrics = ref([
  {
    id: 'metric-1',
    score: '92.5',
    title: '教学效果综合评分',
    trendIcon: 'ArrowUp',
    trendText: '较上周提升 3.2%'
  },
  {
    id: 'metric-2',
    score: '88.7',
    title: '学生参与度指数',
    trendIcon: 'ArrowUp',
    trendText: '较上周提升 2.1%'
  },
  {
    id: 'metric-3',
    score: '85.3',
    title: '作业完成质量',
    trendIcon: 'ArrowDown',
    trendText: '较上周下降 1.5%'
  }
])

const quickActions = computed(() => [
  { id: 'create-course', label: '创建课程', icon: Plus, handler: createCourse },
  { id: 'create-assignment', label: '布置作业', icon: EditPen, handler: createAssignment },
  { id: 'open-lab', label: '创建实验', icon: Monitor, handler: startLab },
  { id: 'view-report', label: '查看报告', icon: Document, handler: viewReports },
  { id: 'manage-class', label: '班级控制台', icon: School, handler: manageClass },
  { id: 'send-notice', label: '发布公告', icon: Bell, handler: publishNotice }
])

// 协作数据
const collaborationItems = ref([
  {
    id: 'collab-1',
    text: 'AI 教研小组发布了新的教学模板',
    time: '2 小时前',
    icon: 'Document'
  },
  {
    id: 'collab-2',
    text: '系统推荐了 3 个相关教学资源',
    time: '5 小时前',
    icon: 'Collection'
  }
])

// 推荐资源
const recommendedResources = ref([
  {
    id: 1,
    title: 'AI 教学最佳实践',
    description: '基于最新教育理论的 AI 教学指南',
    color: '#1890ff',
    icon: 'Document'
  },
  {
    id: 2,
    title: '互动式学习设计',
    description: '创建引人入胜的互动学习体验',
    color: '#52c41a',
    icon: 'VideoPlay'
  },
  {
    id: 3,
    title: '数据驱动教学',
    description: '利用数据分析优化教学效果',
    color: '#722ed1',
    icon: 'TrendCharts'
  }
])

// 内容数据
const contentList = ref([
  { id: '1', title: 'AI 基础课程', subject: 'ai' },
  { id: '2', title: '机器学习入门', subject: 'ai' },
  { id: '3', title: '深度学习实践', subject: 'ai' }
])

const averageRating = computed(() => {
  if (contentList.value.length === 0) return 0
  const total = contentList.value.reduce((sum, content) => sum + 5, 0)
  return (total / contentList.value.length).toFixed(1)
})

const featuredCount = computed(() => contentList.value.filter(c => true).length)


const handleTabChange = (tabId: string) => {
  activeTab.value = tabId

  let message = `已切换到${tabId}视图`
  if (teacherSubject.value) {
    message += `（${currentSubjectName.value}）`
  }

  ElMessage.info(message)

  refreshTabData(tabId)
}

const refreshTabData = async (tabId: string) => {
  try {
    switch (tabId) {
      case '课堂态势':
        await loadTodaySchedule()
        break
      case '作业提醒':
        await loadTodoItems()
        break
      case '教学洞察':
        await loadAIInsights()
        break
    }
  } catch (error) {
    console.error(`刷新${tabId}数据失败:`, error)
  }
}

const loadTodaySchedule = async () => {
  console.log('刷新今日课程安排数据')
}

const loadTodoItems = async () => {
  console.log('刷新待办事项数据')
}

const loadAIInsights = async () => {
  console.log('刷新AI教学洞察数据')
}

const getUrgencyVariant = (urgency: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'success'
  }
  return variants[urgency] || 'info'
}

const getUrgencyText = (urgency: string): string => {
  const texts: Record<string, string> = {
    high: '紧急',
    medium: '一般',
    low: '较低'
  }
  return texts[urgency] || urgency
}

const getImpactVariant = (impact: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return variants[impact] || 'info'
}

const getImpactText = (impact: string): string => {
  const texts: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[impact] || impact
}

const getInsightVariant = (type: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    '学习预警': 'error',
    '优秀表现': 'success',
    '进步明显': 'info',
    '需要关注': 'warning'
  }
  return variants[type] || 'info'
}

const handleInsightAction = (insight: any, action: string) => {
  if (action === 'view') {
    ElMessage.info(`查看${insight.studentName}的详细学习数据`)
  } else if (action === 'intervene') {
    ElMessage.success(`已为${insight.studentName}制定个性化辅导计划`)
  }
}

const selectDimension = (dimension: string) => {
  selectedDimension.value = dimension
}

const selectTimeRange = (range: string) => {
  selectedTimeRange.value = range
}

const selectTemplate = (template: { id: string; name: string }) => {
  ElMessage.success(`已应用模板：${template.name}`)
}

const exportData = () => {
  ElMessage.success('导出任务已加入队列')
}

const generateReport = () => {
  ElMessage.info('开始生成综合报告，完成后将通知您')
}

const getPriorityVariant = (priority: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return variants[priority] || 'info'
}

const getPriorityText = (priority: string): string => {
  const texts: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || priority
}

const getSubjectName = (subject: string): string => {
  const map: Record<string, string> = {
    ai: '人工智能',
    it: '信息技术',
    'data-science': '数据科学',
    robotics: '智能机器人',
    maker: '创客实践'
  }
  return map[subject] || '综合'
}

const getSubjectVariant = (subject: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  return subject === 'ai' ? 'primary' : 'info'
}

const navigateToSchedule = () => {
  router.push('/courses')
}

const navigateToStudents = () => {
  router.push('/classrooms')
}

function createCourse() {
  router.push('/courses/create')
}

function createAssignment() {
  router.push('/assignments/create')
}

function startLab() {
  router.push('/labs/create')
}

function viewReports() {
  router.push('/analytics')
}

function manageClass() {
  router.push('/classrooms')
}

function publishNotice() {
  ElMessage.success('已创建公告草稿，稍后可在系统公告中查看')
}

const getSubjectKPILabel = (subject: string): string => {
  const labels: Record<string, string> = {
    'my-subjects': '教学综合指数',
    'ai': 'AI 课程指数',
    'all': '整体教学指数'
  }
  return labels[subject] || '教学综合指数'
}

const getSubjectGradient = (subject: string, type: 'kpi' | 'ai'): string => {
  const gradients: Record<string, Record<string, string>> = {
    'my-subjects': {
      'kpi': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ai': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    'ai': {
      'kpi': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'ai': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    'all': {
      'kpi': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ai': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  }

  return gradients[subject]?.[type] || gradients['my-subjects'][type]
}

// 侧边栏事件处理
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'create':
      createCourse()
      break
    case 'assignment':
      createAssignment()
      break
    case 'experiment':
      startLab()
      break
    case 'export':
      exportData()
      break
  }
}

const handleFilterChange = (filters: any) => {
  console.log('Dashboard filters changed:', filters)
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

const openResource = (resource: any) => {
  if (resource) {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
}
</script>

<style scoped lang="scss">
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

.subject-chip {
  font-weight: 600;
  text-transform: none;
}

// 仪表板筛选器样式
.dashboard-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-lg);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.time-range-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sidebar-spacing-sm);
}

.filter-tag {
  cursor: pointer;
}

// 侧边栏内容样式
.sidebar-stats {
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
}

.collaboration-time {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
}

.insight-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.insight-card {
  height: 100%;
  :deep(.edu-card__body-content) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
}

.todo-item--completed {
  opacity: 0.6;
}

.todo-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-title {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.todo-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 14px;
}

.schedule-time {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--edu-text-secondary);
  min-width: 64px;
}

.schedule-start {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.schedule-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schedule-title {
  font-weight: 600;
}

.schedule-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.student-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-status__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.28);
}

.student-status__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.student-status__icon--positive {
  background: rgba(34, 197, 94, 0.85);
}

.student-status__icon--info {
  background: rgba(96, 165, 250, 0.85);
}

.student-status__icon--warning {
  background: rgba(251, 191, 36, 0.85);
}

.student-status__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-status__value {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.student-status__label {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-feed__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
}

.activity-feed__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.activity-feed__content {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  color: var(--edu-text-primary);
  font-size: 13px;
}

.assignment-alerts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assignment-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.alert-count {
  font-weight: 500;
}

.assignment-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
}

.analysis-title {
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 8px;
}

.analysis-metrics {
  display: flex;
  gap: 20px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--edu-primary-600);
}

.ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
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
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-title {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.suggestion-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  line-height: 1.5;
}

.suggestion-impact {
  margin-top: 4px;
}

.learning-insights {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-left: 4px solid var(--edu-primary-500);
}

.insight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.insight-student {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.insight-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.insight-actions {
  display: flex;
  gap: 12px;
}

.teaching-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
}

.metric-score {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: var(--edu-primary-600);
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.metric-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-title {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--edu-text-secondary);
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

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-text {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.footer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-list__item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.dashboard-tabs {
  margin-bottom: 24px;
}

// 快捷操作图标样式
.action-icon {
  border-radius: 8px;
  padding: 3px;
  color: white;
  font-size: 14px;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
}

.sidebar-quick-action-btn {
  display: flex;
  align-items: center;
  gap: var(--sidebar-spacing-sm);
  width: 100%;
  justify-content: flex-start;

  .action-icon {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    padding: 2px;
    font-size: 10px;
    transition: all var(--sidebar-transition-normal);
  }
}

.sidebar-quick-action-btn:hover .action-icon {
  transform: translateY(-1px) scale(1.1);
}

.sidebar-quick-action-btn:hover .action-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4);
}

@media (max-width: 960px) {
  .workspace-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .action-icon,
  .sidebar-quick-action-btn .action-icon {
    transition: none !important;
  }

  .sidebar-quick-action-btn:hover .action-icon {
    transform: none !important;
  }
}
</style>
