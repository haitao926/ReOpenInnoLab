<template>
  <div class="grading-workspace">
    <!-- 左侧：作业列表 -->
    <div class="grading-left-panel">
      <EduCard variant="elevated" class="assignment-list-card">
        <template #header>
          <div class="list-header">
            <div class="list-info">
              <h3 class="list-title">待批改作业</h3>
              <span class="list-count">{{ filteredAssignments.length }} 份</span>
            </div>
            <div class="list-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索作业或学生"
                clearable
                size="small"
                class="list-search"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </template>

        <div class="assignment-list">
          <div
            v-for="assignment in filteredAssignments"
            :key="assignment.id"
            class="assignment-item"
            :class="{
              'assignment-item--active': selectedAssignment?.id === assignment.id,
              'assignment-item--urgent': assignment.isUrgent,
              'assignment-item--late': assignment.isLate
            }"
            @click="selectAssignment(assignment)"
          >
            <div class="assignment-content">
              <div class="assignment-header">
                <h4 class="assignment-title">{{ assignment.title }}</h4>
                <EduTag
                  :variant="getStatusVariant(assignment.status)"
                  size="xs"
                  class="assignment-status"
                >
                  {{ getStatusText(assignment.status) }}
                </EduTag>
              </div>

              <div class="assignment-meta">
                <div class="meta-row">
                  <span class="course-info">
                    <EduTag :variant="getSubjectVariant(assignment.course.subject)" size="xs">
                      {{ assignment.course.name }}
                    </EduTag>
                    <span class="class-name">{{ assignment.className }}</span>
                  </span>
                  <span class="submit-time">{{ formatDateTime(assignment.submitTime) }}</span>
                </div>

                <div class="student-row">
                  <el-avatar :size="24" :src="assignment.student.avatar">
                    {{ assignment.student.name.charAt(0) }}
                  </el-avatar>
                  <span class="student-name">{{ assignment.student.name }}</span>
                  <span v-if="assignment.isLate" class="late-indicator">
                    <el-icon><Warning /></el-icon>
                    逾期 {{ getDaysOverdue(assignment.dueDate) }} 天
                  </span>
                </div>
              </div>

              <div class="assignment-progress">
                <div class="progress-info">
                  <span>评分进度</span>
                  <span class="progress-text">{{ assignment.gradingProgress || 0 }}%</span>
                </div>
                <el-progress
                  :percentage="assignment.gradingProgress || 0"
                  :stroke-width="4"
                  :show-text="false"
                  :color="getProgressColor(assignment.gradingProgress || 0)"
                  class="progress-bar"
                />
              </div>
            </div>

            <div class="assignment-actions">
              <el-button
                type="primary"
                size="small"
                @click.stop="startGrading(assignment)"
              >
                开始批改
              </el-button>
              <el-dropdown @command="(cmd) => handleAssignmentAction(cmd, assignment)">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看详情</el-dropdown-item>
                    <el-dropdown-item command="download">下载附件</el-dropdown-item>
                    <el-dropdown-item command="message">发送消息</el-dropdown-item>
                    <el-dropdown-item command="skip" divided>跳过本次</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </EduCard>
    </div>

    <!-- 右侧：批改工作台 -->
    <div class="grading-right-panel">
      <div v-if="selectedAssignment" class="grading-workbench">
        <!-- 作业信息头部 -->
        <EduCard variant="glass" class="assignment-info-card">
          <template #header>
            <div class="info-header">
              <div class="assignment-basic">
                <h3 class="assignment-title">{{ selectedAssignment.title }}</h3>
                <div class="assignment-badges">
                  <EduTag :variant="getSubjectVariant(selectedAssignment.course.subject)" size="sm">
                    {{ selectedAssignment.course.name }}
                  </EduTag>
                  <EduTag :variant="getStatusVariant(selectedAssignment.status)" size="sm">
                    {{ getStatusText(selectedAssignment.status) }}
                  </EduTag>
                </div>
              </div>
              <div class="student-info">
                <el-avatar :size="40" :src="selectedAssignment.student.avatar">
                  {{ selectedAssignment.student.name.charAt(0) }}
                </el-avatar>
                <div class="student-details">
                  <span class="student-name">{{ selectedAssignment.student.name }}</span>
                  <span class="student-id">{{ selectedAssignment.student.id }}</span>
                  <span class="submit-info">
                    提交时间：{{ formatDateTime(selectedAssignment.submitTime) }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </EduCard>

        <!-- 评分区域 -->
        <EduCard variant="elevated" class="grading-area-card">
          <template #header>
            <div class="grading-header">
              <h4>评分标准</h4>
              <div class="grading-actions">
                <el-button size="small" @click="showAISuggestions = !showAISuggestions">
                  <el-icon><MagicStick /></el-icon>
                  AI 建议
                </el-button>
                <el-button size="small" @click="saveGrading">
                  <el-icon><Check /></el-icon>
                  保存评分
                </el-button>
              </div>
            </div>
          </template>

          <!-- AI 建议面板 -->
          <div v-if="showAISuggestions" class="ai-suggestions-panel">
            <div class="suggestions-header">
              <h5>AI 评分建议</h5>
              <el-button type="text" size="small" @click="refreshAISuggestions">
                <el-icon><RefreshRight /></el-icon>
                刷新
              </el-button>
            </div>
            <div class="suggestions-content">
              <div v-for="suggestion in aiSuggestions" :key="suggestion.id" class="suggestion-item">
                <div class="suggestion-type">
                  <EduTag :variant="getSuggestionVariant(suggestion.type)" size="xs">
                    {{ suggestion.type }}
                  </EduTag>
                </div>
                <div class="suggestion-text">{{ suggestion.text }}</div>
                <div class="suggestion-actions">
                  <el-button type="text" size="small" @click="applySuggestion(suggestion)">
                    应用建议
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 评分标准 -->
          <div class="grading-criteria">
            <div v-for="criterion in gradingCriteria" :key="criterion.id" class="criterion-item">
              <div class="criterion-header">
                <span class="criterion-name">{{ criterion.name }}</span>
                <span class="criterion-weight">{{ criterion.weight }}%</span>
              </div>
              <div class="criterion-description">{{ criterion.description }}</div>
              <div class="criterion-scoring">
                <el-slider
                  v-model="criterion.score"
                  :min="0"
                  :max="criterion.maxScore"
                  :step="1"
                  show-input
                  :show-input-controls="false"
                  class="score-slider"
                />
                <div class="score-display">
                  <span class="current-score">{{ criterion.score }}</span>
                  <span class="max-score">/ {{ criterion.maxScore }}</span>
                </div>
              </div>
              <el-input
                v-model="criterion.comment"
                type="textarea"
                :rows="2"
                placeholder="评分说明..."
                class="criterion-comment"
              />
            </div>
          </div>

          <!-- 总分计算 -->
          <div class="total-score">
            <div class="score-summary">
              <span class="score-label">总分</span>
              <span class="score-value">{{ totalScore }}</span>
              <span class="score-max">/ {{ maxScore }}</span>
            </div>
            <div class="grade-display">
              <EduTag :variant="getGradeVariant(totalScore / maxScore)" size="md">
                {{ getGradeText(totalScore / maxScore) }}
              </EduTag>
            </div>
          </div>
        </EduCard>

        <!-- 评语编辑区域 -->
        <EduCard variant="elevated" class="comment-card">
          <template #header>
            <div class="comment-header">
              <h4>综合评语</h4>
              <div class="comment-actions">
                <el-button size="small" @click="useAICComment">
                  <el-icon><MagicStick /></el-icon>
                  AI 生成
                </el-button>
                <el-button size="small" @click="useTemplate">
                  <el-icon><Document /></el-icon>
                  使用模板
                </el-button>
              </div>
            </div>
          </template>

          <!-- AI 评语面板 -->
          <div v-if="showAIComment" class="ai-comment-panel">
            <div class="comment-suggestions">
              <h5>AI 评语建议</h5>
              <div class="comment-options">
                <div
                  v-for="option in aiCommentOptions"
                  :key="option.id"
                  class="comment-option"
                  @click="selectCommentOption(option)"
                >
                  <div class="option-preview">{{ option.preview }}</div>
                  <div class="option-type">{{ option.type }}</div>
                </div>
              </div>
            </div>
          </div>

          <el-input
            v-model="overallComment"
            type="textarea"
            :rows="6"
            placeholder="请输入综合评语..."
            class="overall-comment"
          />
        </EduCard>

        <!-- 附件和详情 -->
        <EduCard variant="glass" class="details-card">
          <template #header>
            <h4>作业详情</h4>
          </template>

          <div class="assignment-details">
            <div class="detail-section">
              <h5>作业要求</h5>
              <p class="requirement-text">{{ selectedAssignment.requirements }}</p>
            </div>

            <div v-if="selectedAssignment.attachments?.length" class="detail-section">
              <h5>提交附件</h5>
              <div class="attachment-list">
                <div
                  v-for="attachment in selectedAssignment.attachments"
                  :key="attachment.id"
                  class="attachment-item"
                >
                  <div class="attachment-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="attachment-info">
                    <span class="attachment-name">{{ attachment.name }}</span>
                    <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
                  </div>
                  <div class="attachment-actions">
                    <el-button type="text" size="small" @click="downloadAttachment(attachment)">
                      下载
                    </el-button>
                    <el-button type="text" size="small" @click="previewAttachment(attachment)">
                      预览
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h5>评分历史</h5>
              <div class="grading-history">
                <div v-for="record in gradingHistory" :key="record.id" class="history-item">
                  <span class="history-time">{{ formatDateTime(record.time) }}</span>
                  <span class="history-action">{{ record.action }}</span>
                  <span class="history-user">{{ record.user }}</span>
                </div>
              </div>
            </div>
          </div>
        </EduCard>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Document /></el-icon>
          <h3>选择作业开始批改</h3>
          <p>从左侧列表中选择需要批改的作业</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  MoreFilled,
  Warning,
  MagicStick,
  Check,
  RefreshRight,
  Document
} from '@element-plus/icons-vue'
import { EduCard, EduTag } from '@reopeninnolab/ui-kit'

interface Student {
  id: string
  name: string
  avatar?: string
}

interface Course {
  id: string
  name: string
  subject: string
}

interface Attachment {
  id: string
  name: string
  size: number
  url: string
}

interface Assignment {
  id: string
  title: string
  description: string
  course: Course
  className: string
  student: Student
  status: 'submitted' | 'graded' | 'returned' | 'draft'
  type: 'homework' | 'quiz' | 'project' | 'exam'
  submitTime: string
  dueDate: string
  isUrgent: boolean
  isLate: boolean
  gradingProgress: number
  requirements: string
  attachments?: Attachment[]
}

interface GradingCriterion {
  id: string
  name: string
  description: string
  weight: number
  maxScore: number
  score: number
  comment: string
}

interface AISuggestion {
  id: string
  type: string
  text: string
}

interface AICommentOption {
  id: string
  type: string
  preview: string
  content: string
}

interface Props {
  assignments: Assignment[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'assignment-selected': [assignment: Assignment]
  'grading-complete': [assignmentId: string, score: number, comment: string]
}>()

// 响应式数据
const searchKeyword = ref('')
const selectedAssignment = ref<Assignment | null>(null)
const showAISuggestions = ref(false)
const showAIComment = ref(false)
const overallComment = ref('')

// 评分标准
const gradingCriteria = ref<GradingCriterion[]>([
  {
    id: 'content',
    name: '内容完整性',
    description: '作业内容是否完整，是否符合要求',
    weight: 30,
    maxScore: 30,
    score: 0,
    comment: ''
  },
  {
    id: 'quality',
    name: '完成质量',
    description: '作业完成的质量和准确度',
    weight: 40,
    maxScore: 40,
    score: 0,
    comment: ''
  },
  {
    id: 'creativity',
    name: '创新思考',
    description: '是否展现创新思维和独立见解',
    weight: 20,
    maxScore: 20,
    score: 0,
    comment: ''
  },
  {
    id: 'presentation',
    name: '格式规范',
    description: '作业格式、排版和语言表达',
    weight: 10,
    maxScore: 10,
    score: 0,
    comment: ''
  }
])

// AI 建议
const aiSuggestions = ref<AISuggestion[]>([
  {
    id: '1',
    type: '内容',
    text: '学生的作业内容完整，很好地涵盖了所有要求点。建议在细节方面稍作补充。'
  },
  {
    id: '2',
    type: '结构',
    text: '作业结构清晰，逻辑性强。建议在段落之间添加更好的过渡。'
  },
  {
    id: '3',
    type: '语言',
    text: '语言表达流畅，用词准确。可以适当增加一些专业术语的使用。'
  }
])

// AI 评语选项
const aiCommentOptions = ref<AICommentOption[]>([
  {
    id: '1',
    type: '鼓励型',
    preview: '整体完成情况很好...',
    content: '整体完成情况很好，内容充实，结构清晰。建议在细节方面稍作补充，继续保持这种良好的学习态度。'
  },
  {
    id: '2',
    type: '指导型',
    preview: '作业基本完成，但在以下方面需要改进...',
    content: '作业基本完成，但在细节处理和逻辑表达方面还有提升空间。建议多关注题目要求的细节部分，加强逻辑推理训练。'
  },
  {
    id: '3',
    type: '专业型',
    preview: '专业知识点掌握准确，应用能力强...',
    content: '专业知识点掌握准确，能够很好地将理论知识应用到实际问题中。建议进一步拓展知识面，增强创新思维。'
  }
])

// 评分历史
const gradingHistory = ref([
  {
    id: '1',
    time: '2024-01-15 14:30',
    action: '开始批改',
    user: '张老师'
  },
  {
    id: '2',
    time: '2024-01-15 15:45',
    action: '保存草稿',
    user: '张老师'
  }
])

// 计算属性
const filteredAssignments = computed(() => {
  if (!searchKeyword.value) return props.assignments

  const keyword = searchKeyword.value.toLowerCase()
  return props.assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(keyword) ||
    assignment.student.name.toLowerCase().includes(keyword) ||
    assignment.course.name.toLowerCase().includes(keyword)
  )
})

const totalScore = computed(() => {
  return gradingCriteria.value.reduce((sum, criterion) => sum + criterion.score, 0)
})

const maxScore = computed(() => {
  return gradingCriteria.value.reduce((sum, criterion) => sum + criterion.maxScore, 0)
})

// 方法
const selectAssignment = (assignment: Assignment) => {
  selectedAssignment.value = assignment
  emit('assignment-selected', assignment)
  loadGradingData(assignment.id)
}

const loadGradingData = (assignmentId: string) => {
  // 模拟加载评分数据
  console.log('Loading grading data for assignment:', assignmentId)
}

const startGrading = (assignment: Assignment) => {
  selectedAssignment.value = assignment
  emit('assignment-selected', assignment)
  loadGradingData(assignment.id)
}

const handleAssignmentAction = (command: string, assignment: Assignment) => {
  switch (command) {
    case 'view':
      // 查看详情
      break
    case 'download':
      // 下载附件
      break
    case 'message':
      // 发送消息
      break
    case 'skip':
      // 跳过本次
      break
  }
}

const refreshAISuggestions = () => {
  ElMessage.success('正在刷新 AI 建议...')
  // 模拟刷新
  setTimeout(() => {
    ElMessage.success('AI 建议已更新')
  }, 1000)
}

const applySuggestion = (suggestion: AISuggestion) => {
  // 应用 AI 建议到评分
  ElMessage.success('已应用 AI 建议')
}

const saveGrading = () => {
  if (!selectedAssignment.value) return

  emit('grading-complete', selectedAssignment.value.id, totalScore.value, overallComment.value)
  ElMessage.success('评分已保存')
}

const useAICComment = () => {
  showAIComment.value = !showAIComment.value
  if (showAIComment.value) {
    ElMessage.info('正在生成 AI 评语建议...')
  }
}

const useTemplate = () => {
  // 使用评语模板
  ElMessage.success('评语模板已应用')
}

const selectCommentOption = (option: AICommentOption) => {
  overallComment.value = option.content
  showAIComment.value = false
  ElMessage.success('AI 评语已应用')
}

const downloadAttachment = (attachment: Attachment) => {
  // 下载附件
  ElMessage.success(`正在下载: ${attachment.name}`)
}

const previewAttachment = (attachment: Attachment) => {
  // 预览附件
  ElMessage.info(`预览: ${attachment.name}`)
}

// 工具函数
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getDaysOverdue = (dueDate: string) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = now.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    'graded': 'success',
    'submitted': 'warning',
    'returned': 'info',
    'draft': 'error'
  }
  return variants[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'graded': '已评分',
    'submitted': '待批改',
    'returned': '已返回',
    'draft': '草稿'
  }
  return texts[status] || status
}

const getSubjectVariant = (subject: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    'math': 'success',
    'physics': 'info',
    'chemistry': 'warning',
    'biology': 'success',
    'language': 'error',
    'english': 'info'
  }
  return variants[subject] || 'info'
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'var(--edu-color-success-default)'
  if (progress >= 60) return 'var(--edu-color-warning-default)'
  if (progress >= 40) return 'var(--edu-color-error-default)'
  return 'var(--edu-color-gray-500)'
}

const getGradeVariant = (scoreRatio: number): 'success' | 'warning' | 'error' | 'info' => {
  if (scoreRatio >= 0.9) return 'success'
  if (scoreRatio >= 0.8) return 'info'
  if (scoreRatio >= 0.6) return 'warning'
  return 'error'
}

const getGradeText = (scoreRatio: number) => {
  if (scoreRatio >= 0.9) return '优秀'
  if (scoreRatio >= 0.8) return '良好'
  if (scoreRatio >= 0.6) return '及格'
  return '不及格'
}

const getSuggestionVariant = (type: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    '内容': 'info',
    '结构': 'warning',
    '语言': 'success',
    '格式': 'error'
  }
  return variants[type] || 'info'
}

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// 监听选中作业变化
watch(selectedAssignment, (newAssignment) => {
  if (newAssignment) {
    // 重置评分数据
    gradingCriteria.value.forEach(criterion => {
      criterion.score = 0
      criterion.comment = ''
    })
    overallComment.value = ''
  }
})
</script>

<style scoped lang="scss">
.grading-workspace {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 600px;
}

// 左侧面板
.grading-left-panel {
  .assignment-list-card {
    height: 100%;

    :deep(.edu-card__body-content) {
      padding: var(--spacing-base);
      height: calc(100% - 60px);
      overflow-y: auto;
    }
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base) 0;
}

.list-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.list-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.list-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.list-search {
  width: 200px;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  background: var(--edu-bg-primary);

  &:hover {
    border-color: var(--edu-primary-300);
    background: var(--edu-bg-secondary);
  }

  &--active {
    border-color: var(--edu-primary-500);
    background: rgba(99, 102, 241, 0.08);
  }

  &--urgent {
    border-left: 4px solid var(--edu-error-500);
  }

  &--late {
    border-left: 4px solid var(--edu-warning-500);
  }
}

.assignment-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.assignment-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight);
}

.assignment-status {
  flex-shrink: 0;
}

.assignment-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.course-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.class-name {
  color: var(--text-secondary);
}

.student-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.student-name {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.late-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--edu-warning-600);
  font-weight: var(--font-weight-medium);
}

.assignment-progress {
  margin-top: var(--spacing-xs);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
  margin-bottom: var(--spacing-xs);
}

.progress-text {
  font-weight: var(--font-weight-medium);
  color: var(--edu-primary-600);
}

.progress-bar {
  :deep(.el-progress-bar__outer) {
    height: 4px;
  }
}

.assignment-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

// 右侧面板
.grading-right-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.grading-workbench {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.assignment-info-card,
.grading-area-card,
.comment-card,
.details-card {
  :deep(.edu-card__body-content) {
    padding: var(--spacing-base);
  }
}

.info-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-lg);
  align-items: start;
}

.assignment-basic {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.assignment-badges {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.student-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.student-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.student-id {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.submit-info {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

// 评分区域
.grading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grading-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.ai-suggestions-panel {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--radius-md);
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.suggestions-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--edu-bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--edu-border-light);
}

.suggestion-type {
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.suggestion-actions {
  flex-shrink: 0;
}

.grading-criteria {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.criterion-item {
  padding: var(--spacing-base);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--radius-md);
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.criterion-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.criterion-weight {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--edu-bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.criterion-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.criterion-scoring {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-sm);
}

.score-slider {
  flex: 1;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.current-score {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-primary-600);
}

.max-score {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.criterion-comment {
  margin-top: var(--spacing-sm);
}

.total-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-lg);
}

.score-summary {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.score-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.score-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--edu-primary-600);
}

.score-max {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

// 评语区域
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.ai-comment-panel {
  margin-bottom: var(--spacing-lg);
}

.comment-suggestions {
  h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }
}

.comment-options {
  display: grid;
  gap: var(--spacing-sm);
}

.comment-option {
  padding: var(--spacing-sm);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    border-color: var(--edu-primary-300);
    background: var(--edu-bg-secondary);
  }
}

.option-preview {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: var(--leading-normal);
}

.option-type {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.overall-comment {
  width: 100%;
}

// 详情区域
.assignment-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-section {
  h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }
}

.requirement-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--edu-bg-secondary);
  border-radius: var(--radius-sm);
}

.attachment-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--edu-primary-100);
  color: var(--edu-primary-600);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.attachment-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.attachment-size {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.attachment-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.grading-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  padding: var(--spacing-xs) 0;
}

// 空状态
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--edu-bg-secondary);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--edu-border-light);
}

.empty-content {
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-base);
}

.empty-content h3 {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-content p {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

// 响应式适配
@media (max-width: 1200px) {
  .grading-workspace {
    grid-template-columns: 1fr;
    gap: var(--spacing-base);
  }

  .grading-left-panel {
    max-height: 400px;
  }

  .grading-right-panel {
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .list-search {
    width: 100%;
  }

  .info-header {
    grid-template-columns: 1fr;
    gap: var(--spacing-base);
  }

  .assignment-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .assignment-actions {
    justify-content: space-between;
  }

  .criterion-scoring {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .score-slider {
    width: 100%;
  }

  .total-score {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .grading-header,
  .comment-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
}
</style>