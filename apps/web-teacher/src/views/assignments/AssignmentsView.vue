<template>
  <TeacherWorkspaceLayout
    title="作业管理"
    subtitle="统一作业管理流程，包含创建、批改、反馈、数据分析"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <el-segmented v-model="viewMode" :options="viewModeOptions" size="large" />
        <div class="workspace-actions__buttons">
          <EduButton variant="primary" @click="createAssignment">
            <el-icon><EditPen /></el-icon>
            布置作业
          </EduButton>
          <EduButton variant="secondary" @click="importAssignments">
            <el-icon><Upload /></el-icon>
            导入作业
          </EduButton>
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

    <!-- 双栏布局：作业列表 + 批改工作台 -->
    <GradingWorkspace
      :assignments="filteredAssignments"
      @assignment-selected="handleAssignmentSelected"
      @grading-complete="handleGradingComplete"
    />

    <template #footer>
      <div class="footer-column">
        <h4 class="footer-title">批改待办</h4>
        <ul class="footer-list">
          <li v-for="todo in gradingBacklog" :key="todo.id">
            <span class="footer-indicator" :class="`footer-indicator--${todo.type}`"></span>
            <span>{{ todo.text }}</span>
            <span class="footer-time">{{ todo.time }}</span>
          </li>
        </ul>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">反馈模板</h4>
        <div class="support-links">
          <el-button text size="small" @click="openFeedbackTemplates">
            常用评语
          </el-button>
          <el-button text size="small" @click="generateFeedback">
            AI 生成反馈
          </el-button>
        </div>
      </div>
      <div class="footer-column">
        <h4 class="footer-title">系统公告</h4>
        <ul class="footer-list">
          <li v-for="notice in announcements" :key="notice.id">
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Upload,
  EditPen,
  View,
  Star,
  Bell,
  TrendCharts,
  MagicStick,
  Warning,
  Hide,
  Document
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import GradingWorkspace from '@/components/assignment/GradingWorkspace.vue'
import AICommentPanel from '@/components/ai/AICommentPanel.vue'
import { EduButton, EduCard } from '@reopeninnolab/ui-kit'
import { PAGE_SIDEBAR_CONFIGS, DEFAULT_LEFT_SIDEBAR_SECTIONS, DEFAULT_RIGHT_SIDEBAR_SECTIONS, type LeftSidebarSectionConfig, type RightSidebarSectionConfig } from '@/constants/managementSidebar'


const router = useRouter()
const viewMode = ref<'list' | 'grid'>('list')
const activeTab = ref('pending-grading')
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

const announcements = ref([
  { id: 'notice-1', text: 'AI 批改模板更新：新增“图像类作业”评语集。' },
  { id: 'notice-2', text: '周五 15:00 将进行作业库维护，请提前下载数据。' }
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
.workspace-actions {
  display: flex;
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
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--edu-text-secondary);
}

.footer-indicator {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.footer-indicator--warning { background: #f97316; }
.footer-indicator--info { background: #4f46e5; }

.support-links {
  display: flex;
  gap: 12px;
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
</style>
