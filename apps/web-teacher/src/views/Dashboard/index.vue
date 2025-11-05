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
      <!-- 快速操作按钮 -->
      <EduCard
        variant="glass"
        size="sm"
        class="quick-actions-card"
        :hoverable="false"
      >
        <div class="quick-actions-content">
          <span class="quick-actions-title">快速操作</span>
          <div class="quick-actions-buttons">
            <EduButton size="sm" variant="primary" @click="createNewCourse">
              <el-icon><Plus /></el-icon>
              创建课程
            </EduButton>
            <EduButton size="sm" variant="secondary" @click="createNewAssignment">
              <el-icon><EditPen /></el-icon>
              新建作业
            </EduButton>
            <EduButton size="sm" variant="secondary" @click="scheduleExperiment">
              <el-icon><Monitor /></el-icon>
              安排实验
            </EduButton>
          </div>
        </div>
      </EduCard>
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
      <div class="dashboard-sidebar">
        <section class="sidebar-card">
          <h4 class="sidebar-card__title">分析维度</h4>
          <div class="category-list">
            <button
              v-for="dimension in analysisDimensions"
              :key="dimension.type"
              type="button"
              class="category-item"
              :class="{ active: selectedDimension === dimension.type }"
              @click="selectDimension(dimension.type)"
            >
              <span class="category-icon" :style="{ backgroundColor: dimension.color }">
                <el-icon><component :is="dimension.icon" /></el-icon>
              </span>
              <span class="category-name">{{ dimension.name }}</span>
              <span class="category-count">{{ dimension.count }} 项</span>
            </button>
          </div>
        </section>

        <section class="sidebar-card">
          <h4 class="sidebar-card__title">时间范围</h4>
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
        </section>

        <section class="sidebar-card">
          <h4 class="sidebar-card__title">指标模板</h4>
          <div class="template-list">
            <button
              v-for="template in indicatorTemplates"
              :key="template.id"
              type="button"
              class="template-item"
              @click="selectTemplate(template)"
            >
              <el-icon><Document /></el-icon>
              <span>{{ template.name }}</span>
            </button>
          </div>
        </section>
      </div>
    </template>

    <template #right>
      <div class="dashboard-sidebar">
        <section class="sidebar-card">
          <h4 class="sidebar-card__title">AI 观察报告</h4>
          <div class="observation-list">
            <div v-for="report in aiObservationReports" :key="report.id" class="observation-item">
              <span class="observation-icon">
                <el-icon><component :is="report.icon" /></el-icon>
              </span>
              <div class="observation-content">
                <div class="observation-text">{{ report.text }}</div>
                <div class="observation-tag">{{ report.type }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="sidebar-card">
          <h4 class="sidebar-card__title">建议行动</h4>
          <div class="action-list">
            <div v-for="item in actionSuggestions" :key="item.id" class="action-item">
              <div class="action-text">{{ item.text }}</div>
              <EduTag :variant="getPriorityVariant(item.priority)" size="sm">
                {{ getPriorityText(item.priority) }}
              </EduTag>
            </div>
          </div>
        </section>

        <section class="sidebar-card">
          <h4 class="sidebar-card__title">导出任务</h4>
          <ul class="export-list">
            <li v-for="task in exportTasks" :key="task.id" class="export-item">
              <span class="export-name">{{ task.name }}</span>
              <el-tag
                size="small"
                :type="task.status === 'ready' ? 'success' : 'warning'"
              >
                {{ task.status === 'ready' ? '已完成' : '处理中' }}
              </el-tag>
            </li>
          </ul>
          <el-button type="text" size="small" @click="exportData">
            <el-icon><Download /></el-icon>
            导出最新报告
          </el-button>
        </section>
      </div>
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
import { EduCard, EduTag, EduTabs } from '@reopeninnolab/ui-kit'
import { useAppStore } from '@/stores/app'

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
const aiAssistantVisible = ref(false)
const selectedDimension = ref('course')
const selectedTimeRange = ref('week')
const activeTab = ref('课堂态势')

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
  // 根据学科返回不同的统计数据
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
  { id: 'action-1', text: '为 AI 课程配置“提示词对照表”模板', priority: 'high', subject: 'ai' },
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
    description: '针对 AI 创意编程课程，可安排“优秀提示词对照”环节，预计提升课堂产出 30%。',
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

const toggleAIAssistant = () => {
  aiAssistantVisible.value = !aiAssistantVisible.value
  if (aiAssistantVisible.value) {
    rightSidebarCollapsed.value = false
  }
  appStore.setAIAssistantVisible(aiAssistantVisible.value)
}

const handleTabChange = (tabId: string) => {
  activeTab.value = tabId

  // 根据不同标签页显示不同的提示信息
  let message = `已切换到${tabId}视图`
  if (teacherSubject.value) {
    message += `（${currentSubjectName.value}）`
  }

  ElMessage.info(message)

  // 可以在这里添加不同标签页的数据刷新逻辑
  refreshTabData(tabId)
}

// 刷新标签页数据
const refreshTabData = async (tabId: string) => {
  try {
    switch (tabId) {
      case '课堂态势':
        // 刷新课程安排数据
        await loadTodaySchedule()
        break
      case '作业提醒':
        // 刷新待办事项和作业提醒
        await loadTodoItems()
        break
      case '教学洞察':
        // 刷新AI建议和学习分析
        await loadAIInsights()
        break
    }
  } catch (error) {
    console.error(`刷新${tabId}数据失败:`, error)
  }
}

// 数据刷新函数（占位符，实际应从API获取）
const loadTodaySchedule = async () => {
  // 模拟刷新今日课程安排
  console.log('刷新今日课程安排数据')
}

const loadTodoItems = async () => {
  // 模拟刷新待办事项
  console.log('刷新待办事项数据')
}

const loadAIInsights = async () => {
  // 模拟刷新AI教学洞察
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

// 快速操作方法
const createNewCourse = () => {
  router.push('/courses/create')
  ElMessage.success('正在跳转到课程创建页面')
}

const createNewAssignment = () => {
  router.push('/assignments/create')
  ElMessage.success('正在跳转到作业创建页面')
}

const scheduleExperiment = () => {
  router.push('/labs')
  ElMessage.success('正在跳转到实验管理页面')
}

const viewRecentActivity = () => {
  ElMessage.info('最近活动功能开发中')
}

const exportReport = () => {
  ElMessage.info('报告导出功能开发中')
}
</script>

<style scoped lang="scss">
// 快速操作条样式
.quick-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(14px);
}

.quick-actions-group {
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 8px;
  }
}

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

.quick-actions-card {
  width: 100%;
  grid-column: 1 / -1; /* Span across all columns */

  :deep(.edu-card__body-content) {
    padding: 20px;
  }
}

.quick-actions-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-actions-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.quick-actions-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;

    .edu-button {
      width: 100%;
      justify-content: center;
    }
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

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(12px);
}

.sidebar-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-secondary);
  letter-spacing: 0.02em;
  margin: 0;
}

.subject-chip {
  font-weight: 600;
  text-transform: none;
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
  transition: transform 0.2s ease, background 0.2s ease;
}

.category-item:hover,
.category-item.active {
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

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: none;
  background: rgba(15, 23, 42, 0.04);
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.template-item:hover {
  background: rgba(79, 70, 229, 0.12);
}

.observation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.observation-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.observation-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.12);
  color: #4f46e5;
}

.observation-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.observation-text {
  font-size: 13px;
  color: var(--edu-text-primary);
  line-height: 1.5;
}

.observation-tag {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
}

.export-list {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--edu-text-primary);
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

@media (max-width: 960px) {
  .workspace-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-tabs {
  margin-bottom: 24px;
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

// 学科选择器样式
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
  font-weight: var(--font-weight-medium);
}

.subject-option__count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-normal);
}

// 学科加载状态
.el-select .el-select__loading {
  color: var(--edu-primary-600);
}

// 学科错误状态
.subject-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  color: var(--edu-color-error-600);
  font-size: var(--font-size-sm);

  .el-icon {
    flex-shrink: 0;
  }

  .el-button {
    margin-left: auto;
    color: var(--edu-primary-600);
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-item,
  .summary-card,
  .insight-card,
  .ai-trigger,
  .assignment-alert,
  .suggestion-item {
    transition: none !important;
  }
}
</style>
