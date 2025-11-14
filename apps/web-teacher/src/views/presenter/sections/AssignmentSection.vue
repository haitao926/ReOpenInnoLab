<template>
  <div class="assignment-section">
    <!-- 环节头部 -->
    <div class="section-header">
      <h3>{{ section.title }}</h3>
      <div class="section-meta">
        <span class="duration">{{ section.duration }}分钟</span>
        <el-tag type="info" size="small">作业测试</el-tag>
      </div>
    </div>

    <!-- 环节描述 -->
    <div v-if="section.content?.description" class="section-description">
      {{ section.content.description }}
    </div>

    <!-- 作业内容主体 -->
    <div class="assignment-content">
      <!-- 作业信息卡片 -->
      <div class="assignment-info-card">
        <div class="card-header">
          <el-icon class="icon"><EditPen /></el-icon>
          <h4>作业信息</h4>
        </div>
        <div class="card-body">
          <div class="assignment-meta">
            <div class="meta-item">
              <label>作业类型:</label>
              <span>{{ getAssignmentTypeLabel(section.content?.assignmentType) }}</span>
            </div>
            <div class="meta-item">
              <label>题目数量:</label>
              <span>{{ section.content?.questionCount || 0 }}题</span>
            </div>
            <div class="meta-item">
              <label>总分:</label>
              <span>{{ section.content?.totalScore || 100 }}分</span>
            </div>
            <div class="meta-item">
              <label>及格分:</label>
              <span>{{ section.content?.passingScore || 60 }}分</span>
            </div>
            <div class="meta-item">
              <label>是否限时:</label>
              <el-tag :type="section.content?.timeLimit ? 'warning' : 'success'" size="small">
                {{ section.content?.timeLimit ? '是' : '否' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 题目预览 -->
      <div v-if="section.content?.questions?.length" class="questions-preview-card">
        <div class="card-header">
          <el-icon class="icon"><QuestionFilled /></el-icon>
          <h4>题目预览</h4>
        </div>
        <div class="card-body">
          <div class="questions-list">
            <div
              v-for="(question, index) in displayQuestions"
              :key="question.id"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">{{ index + 1 }}.</span>
                <el-tag
                  :type="getQuestionTypeColor(question.type)"
                  size="small"
                >
                  {{ getQuestionTypeLabel(question.type) }}
                </el-tag>
                <span class="question-score">{{ question.score }}分</span>
              </div>
              <div class="question-content">
                {{ question.content }}
              </div>
              <div v-if="question.options" class="question-options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option-item"
                >
                  {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="section.content.questions.length > 3" class="more-questions">
            <el-button text type="primary" @click="showAllQuestions = !showAllQuestions">
              {{ showAllQuestions ? '收起' : `查看全部${section.content.questions.length}题` }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 评分标准 -->
      <div v-if="section.content?.gradingCriteria" class="grading-card">
        <div class="card-header">
          <el-icon class="icon"><ScaleToOriginal /></el-icon>
          <h4>评分标准</h4>
        </div>
        <div class="card-body">
          <div class="grading-content">
            {{ section.content.gradingCriteria }}
          </div>
        </div>
      </div>

      <!-- AI生成提示 -->
      <div v-if="section.content?.aiGenerated" class="ai-hint-card">
        <div class="card-header">
          <el-icon class="icon"><Magic /></el-icon>
          <h4>AI生成提示</h4>
        </div>
        <div class="card-body">
          <div class="ai-hint-content">
            <p>本作业由AI辅助生成，基于课程内容和学生学习情况定制。</p>
            <div class="ai-stats">
              <span>生成时间: {{ formatTime(section.content.generatedAt) }}</span>
              <span>难度适配: {{ section.content.difficultyLevel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制按钮区域 -->
      <div class="action-area">
        <el-button
          type="primary"
          size="large"
          @click="startAssignment"
          :loading="isLoading"
        >
          <el-icon><VideoPlay /></el-icon>
          开始作业
        </el-button>

        <el-button
          v-if="canRegenerate"
          type="success"
          size="large"
          @click="regenerateAssignment"
        >
          <el-icon><RefreshRight /></el-icon>
          AI重新生成
        </el-button>

        <el-button
          type="default"
          size="large"
          @click="previewAssignment"
        >
          <el-icon><View /></el-icon>
          预览作业
        </el-button>
      </div>
    </div>

    <!-- 作业进度跟踪 -->
    <div v-if="showProgress" class="progress-section">
      <div class="progress-header">
        <h4>作业进度</h4>
        <span class="progress-text">{{ progressPercentage }}%</span>
      </div>
      <el-progress
        :percentage="progressPercentage"
        :stroke-width="8"
        :show-text="false"
      />
      <div class="progress-details">
        <div class="detail-item">
          <span>已提交: {{ submittedCount }}人</span>
        </div>
        <div class="detail-item">
          <span>完成率: {{ completionRate }}%</span>
        </div>
        <div class="detail-item">
          <span>平均用时: {{ averageTime }}分钟</span>
        </div>
      </div>
    </div>

    <!-- 实时提交统计 -->
    <div v-if="showSubmissionStats" class="submission-stats-section">
      <div class="stats-header">
        <h4>提交统计</h4>
        <el-button size="small" @click="refreshStats">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="stats-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ submissionStats.total }}</div>
            <div class="stat-label">总学生数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ submissionStats.submitted }}</div>
            <div class="stat-label">已提交</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ submissionStats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ submissionStats.notStarted }}</div>
            <div class="stat-label">未开始</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自动批改结果 -->
    <div v-if="showAutoGrading" class="auto-grading-section">
      <div class="grading-header">
        <h4>自动批改结果</h4>
        <el-tag :type="getGradingStatusColor(autoGradingStats.status)" size="small">
          {{ getGradingStatusLabel(autoGradingStats.status) }}
        </el-tag>
      </div>
      <div class="grading-content">
        <div class="grading-summary">
          <div class="summary-item">
            <span class="label">已批改:</span>
            <span class="value">{{ autoGradingStats.graded }}份</span>
          </div>
          <div class="summary-item">
            <span class="label">平均分:</span>
            <span class="value">{{ autoGradingStats.averageScore || 0 }}分</span>
          </div>
          <div class="summary-item">
            <span class="label">及格率:</span>
            <span class="value">{{ autoGradingStats.passRate || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI教学建议 -->
    <div v-if="showAISuggestions" class="ai-suggestions-section">
      <div class="suggestions-header">
        <h4>
          <el-icon><Magic /></el-icon>
          AI教学建议
        </h4>
      </div>
      <div class="suggestions-content">
        <div
          v-for="(suggestion, index) in aiSuggestions"
          :key="index"
          class="suggestion-item"
        >
          <el-tag
            :type="suggestion.type"
            size="small"
          >
            {{ suggestion.title }}
          </el-tag>
          <p class="suggestion-text">{{ suggestion.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  EditPen,
  QuestionFilled,
  ScaleToOriginal,
  Magic,
  VideoPlay,
  RefreshRight,
  View,
  Refresh
} from '@element-plus/icons-vue'
import type { CourseSection } from '@/types/course'
import { ElMessage } from 'element-plus'
import { usePresenterStore } from '@/stores/presenter'
import { useClassroomStore } from '@/stores/classroom'
import { useUserStore } from '@/stores/user'

interface Props {
  section: CourseSection
}

const props = defineProps<Props>()

const presenterStore = usePresenterStore()
const classroomStore = useClassroomStore()
const userStore = useUserStore()

// 响应式数据
const isLoading = ref(false)
const showAllQuestions = ref(false)
const progressPercentage = ref(0)
const submittedCount = ref(0)
const completionRate = ref(0)
const averageTime = ref(0)
const showProgress = ref(false)
const showSubmissionStats = ref(false)
const showAutoGrading = ref(false)
const showAISuggestions = ref(false)
const submissionStats = ref<any>({})
const autoGradingStats = ref<any>({})
const aiSuggestions = ref<any[]>([])

// 计算属性
const displayQuestions = computed(() => {
  const questions = props.section.content?.questions || []
  return showAllQuestions.value ? questions : questions.slice(0, 3)
})

const canRegenerate = computed(() => {
  return props.section.content?.aiGenerated === true
})

// 作业类型标签
const getAssignmentTypeLabel = (type: string): string => {
  const types = {
    'quiz': '随堂测验',
    'homework': '课后作业',
    'exam': '考试',
    'practice': '练习题',
    'assessment': '综合评估'
  }
  return types[type] || '课后作业'
}

// 题目类型标签
const getQuestionTypeLabel = (type: string): string => {
  const types = {
    'single_choice': '单选题',
    'multiple_choice': '多选题',
    'true_false': '判断题',
    'fill_blank': '填空题',
    'short_answer': '简答题',
    'essay': '论述题'
  }
  return types[type] || '单选题'
}

const getQuestionTypeColor = (type: string): string => {
  const colors = {
    'single_choice': 'primary',
    'multiple_choice': 'success',
    'true_false': 'warning',
    'fill_blank': 'info',
    'short_answer': 'warning',
    'essay': 'danger'
  }
  return colors[type] || 'primary'
}

// 批改状态标签
const getGradingStatusColor = (status: string): string => {
  const colors = {
    'pending': 'info',
    'grading': 'warning',
    'completed': 'success',
    'failed': 'danger'
  }
  return colors[status] || 'info'
}

const getGradingStatusLabel = (status: string): string => {
  const labels = {
    'pending': '待批改',
    'grading': '批改中',
    'completed': '已完成',
    'failed': '批改失败'
  }
  return labels[status] || '待批改'
}

// 时间格式化
const formatTime = (timestamp: string): string => {
  if (!timestamp) return '未知'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 方法
const startAssignment = async () => {
  try {
    isLoading.value = true

    // 广播作业开始事件
    await presenterStore.broadcastSectionChange({
      type: 'assignment_start',
      sectionId: props.section.id,
      section: props.section,
      timestamp: new Date()
    })

    // 更新显示状态
    showProgress.value = true
    showSubmissionStats.value = true
    progressPercentage.value = 0

    ElMessage.success('作业环节已开始')
  } catch (error) {
    console.error('开始作业失败:', error)
    ElMessage.error('开始作业失败')
  } finally {
    isLoading.value = false
  }
}

const regenerateAssignment = async () => {
  try {
    isLoading.value = true

    // 调用AI重新生成作业
    const newAssignment = await aiService.generateAssignment({
      courseId: presenterStore.currentCourseId,
      lessonId: presenterStore.currentLessonId,
      sectionId: props.section.id,
      preferences: {
        questionCount: props.section.content?.questionCount || 10,
        difficulty: props.section.content?.difficultyLevel || 'medium',
        topics: props.section.content?.topics || []
      }
    })

    // 更新作业内容
    props.section.content = {
      ...props.section.content,
      ...newAssignment,
      generatedAt: new Date().toISOString()
    }

    ElMessage.success('作业已重新生成')
  } catch (error) {
    console.error('重新生成作业失败:', error)
    ElMessage.error('重新生成作业失败')
  } finally {
    isLoading.value = false
  }
}

const previewAssignment = () => {
  // 打开预览模态框或新窗口
  ElMessage.info('预览功能开发中...')
}

const refreshStats = async () => {
  try {
    // 获取提交统计
    const stats = await assignmentService.getSubmissionStats({
      lessonId: presenterStore.currentLessonId,
      sectionId: props.section.id
    })

    submissionStats.value = stats
    submittedCount.value = stats.submitted
    completionRate.value = Math.round((stats.submitted / stats.total) * 100)
    progressPercentage.value = completionRate.value
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 更新进度数据
const updateProgress = (progress: number, submitted: number, completion: number, avgTime: number) => {
  progressPercentage.value = Math.round(progress)
  submittedCount.value = submitted
  completionRate.value = Math.round(completion)
  averageTime.value = avgTime
  showProgress.value = true
}

// 更新批改结果
const updateGradingResults = (results: any) => {
  autoGradingStats.value = results
  showAutoGrading.value = true

  // 根据批改结果生成AI建议
  if (results.averageScore < 60) {
    aiSuggestions.value = [
      {
        type: 'danger',
        title: '学习效果不佳',
        content: '学生整体掌握情况较差，建议进行知识点回顾和针对性辅导。'
      },
      {
        type: 'warning',
        title: '作业难度调整',
        content: '当前作业难度可能偏高，建议降低难度或提供更多学习支持。'
      }
    ]
  } else if (results.averageScore >= 90) {
    aiSuggestions.value = [
      {
        type: 'success',
        title: '掌握良好',
        content: '学生对知识点掌握良好，可以考虑增加难度或拓展内容。'
      }
    ]
  } else {
    aiSuggestions.value = [
      {
        type: 'info',
        title: '保持现状',
        content: '学生掌握情况正常，可以按计划进行后续教学。'
      }
    ]
  }
}

// 生命周期
onMounted(() => {
  // 初始化进度数据
  updateProgress(0, 0, 0, 0)

  // 如果是当前活跃环节，显示进度和统计
  if (props.section.isActive) {
    updateProgress(30, 15, 60, 18)

    // 模拟提交统计数据
    submissionStats.value = {
      total: 25,
      submitted: 15,
      inProgress: 7,
      notStarted: 3
    }

    // 模拟自动批改结果
    updateGradingResults({
      status: 'completed',
      graded: 15,
      averageScore: 78.5,
      passRate: 86.7
    })
  }
})

// 暴露方法供父组件调用
defineExpose({
  updateProgress,
  updateGradingResults,
  refreshStats
})
</script>

<style scoped lang="scss">
.assignment-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%);
  color: #fff;
  border-radius: 12px;
  min-height: 400px;
}

.section-header {
  text-align: center;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .section-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 14px;

    .duration {
      opacity: 0.9;
    }
  }
}

.section-description {
  text-align: center;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;
  opacity: 0.95;
}

.assignment-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignment-info-card,
.questions-preview-card,
.grading-card,
.ai-hint-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .icon {
    font-size: 20px;
  }

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.card-body {
  padding: 16px 20px;
}

.assignment-meta {
  .meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    label {
      font-weight: 500;
      opacity: 0.9;
    }

    span {
      font-size: 14px;
    }
  }
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 12px;

  .question-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .question-number {
      font-weight: bold;
    }

    .question-score {
      margin-left: auto;
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .question-content {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .question-options {
    .option-item {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 4px;
      padding-left: 8px;
    }
  }
}

.more-questions {
  text-align: center;
  margin-top: 16px;
}

.grading-content,
.ai-hint-content {
  font-size: 14px;
  line-height: 1.6;
}

.ai-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}

.action-area {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
}

.progress-section,
.submission-stats-section,
.auto-grading-section,
.ai-suggestions-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
}

.progress-header,
.stats-header,
.grading-header,
.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .progress-text {
    font-size: 14px;
    font-weight: bold;
  }
}

.progress-details {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  flex-wrap: wrap;

  .detail-item {
    font-size: 14px;
    opacity: 0.9;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;

  .stat-card {
    text-align: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;

    .stat-number {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.8;
    }
  }
}

.grading-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;

  .summary-item {
    display: flex;
    justify-content: space-between;

    .label {
      opacity: 0.8;
    }

    .value {
      font-weight: bold;
    }
  }
}

.suggestions-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .suggestion-text {
    font-size: 14px;
    line-height: 1.4;
    opacity: 0.95;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .assignment-section {
    padding: 16px;
    gap: 16px;
  }

  .action-area {
    flex-direction: column;
    align-items: stretch;
  }

  .assignment-content {
    gap: 12px;
  }

  .progress-section,
  .submission-stats-section,
  .auto-grading-section,
  .ai-suggestions-section {
    padding: 16px;
  }

  .progress-details,
  .grading-summary {
    flex-direction: column;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ai-stats {
    flex-direction: column;
    gap: 4px;
  }
}

// 动画效果
.assignment-info-card,
.questions-preview-card,
.grading-card,
.ai-hint-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
}

.action-area .el-button {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.question-item {
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.stat-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>