<template>
  <div class="assignment-runner">
    <!-- 配置检查 -->
    <div v-if="!config || !config.assignmentType" class="assignment-error">
      <el-result
        icon="warning"
        title="作业配置错误"
        sub-title="缺少作业类型配置"
      >
        <template #extra>
          <el-button type="primary" @click="$emit('error', '作业配置不完整')">
            返回
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 作业信息 -->
    <div v-else class="assignment-content">
      <!-- 作业头部 -->
      <div class="assignment-header">
        <div class="header-left">
          <h3>{{ context.activity.title }}</h3>
          <el-tag :variant="getTypeVariant(config.assignmentType)" size="sm">
            {{ getTypeName(config.assignmentType) }}
          </el-tag>
        </div>
        <div class="header-right">
          <div v-if="config.timeLimit" class="time-limit">
            <el-icon><Timer /></el-icon>
            <span>剩余时间: {{ formatTime(remainingTime) }}</span>
          </div>
          <el-button type="success" @click="submitAssignment" :disabled="!canSubmit">
            <el-icon><Upload /></el-icon>
            提交作业
          </el-button>
        </div>
      </div>

      <!-- 作业说明 -->
      <div class="assignment-instructions">
        <div class="instructions-content">
          <h4>
            <el-icon><InfoFilled /></el-icon>
            作业说明
          </h4>
          <p>{{ context.activity.description }}</p>
          <div v-if="context.activity.instructions" v-html="context.activity.instructions"></div>

          <!-- 提交要求 -->
          <div class="submission-requirements">
            <h5>提交要求</h5>
            <div class="requirements-grid">
              <div v-if="config.submissionConfig.allowFiles" class="requirement-item">
                <el-icon><Document /></el-icon>
                <span>支持文件提交</span>
                <span v-if="config.submissionConfig.allowedFileTypes" class="file-types">
                  ({{ config.submissionConfig.allowedFileTypes.join(', ') }})
                </span>
              </div>
              <div v-if="config.submissionConfig.textSubmission" class="requirement-item">
                <el-icon><EditPen /></el-icon>
                <span>支持文本提交</span>
              </div>
              <div v-if="config.submissionConfig.codeSubmission" class="requirement-item">
                <el-icon><Monitor /></el-icon>
                <span>支持代码提交</span>
              </div>
              <div v-if="config.maxAttempts" class="requirement-item">
                <el-icon><RefreshRight /></el-icon>
                <span>最多尝试 {{ config.maxAttempts }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 测验作业 -->
      <div v-if="config.assignmentType === 'quiz'" class="quiz-content">
        <QuizRunner
          :questions="config.questions || []"
          :submission-config="config.submissionConfig"
          :grading-config="config.gradingConfig"
          @answer="handleQuizAnswer"
          @complete="handleQuizComplete"
        />
      </div>

      <!-- 文章作业 -->
      <div v-else-if="config.assignmentType === 'essay'" class="essay-content">
        <EssayRunner
          :submission-config="config.submissionConfig"
          :grading-config="config.gradingConfig"
          @submit="handleEssaySubmit"
          @save="handleEssaySave"
        />
      </div>

      <!-- 代码作业 -->
      <div v-else-if="config.assignmentType === 'code'" class="code-content">
        <CodeRunner
          :submission-config="config.submissionConfig"
          :grading-config="config.gradingConfig"
          @submit="handleCodeSubmit"
          @test="handleCodeTest"
        />
      </div>

      <!-- 文件作业 -->
      <div v-else-if="config.assignmentType === 'file'" class="file-content">
        <FileRunner
          :submission-config="config.submissionConfig"
          :grading-config="config.gradingConfig"
          @upload="handleFileUpload"
          @remove="handleFileRemove"
        />
      </div>

      <!-- 混合作业 -->
      <div v-else-if="config.assignmentType === 'mixed'" class="mixed-content">
        <MixedRunner
          :config="config"
          @submit="handleMixedSubmit"
          @progress="handleMixedProgress"
        />
      </div>

      <!-- 作业统计 -->
      <div class="assignment-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ attemptCount }}</div>
            <div class="stat-label">尝试次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ completionPercentage }}%</div>
            <div class="stat-label">完成度</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatTime(elapsedTime) }}</div>
            <div class="stat-label">用时</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ submissionStatus }}</div>
            <div class="stat-label">状态</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交确认对话框 -->
    <el-dialog
      v-model="showSubmitDialog"
      title="提交作业确认"
      width="500px"
      :before-close="handleCloseSubmit"
    >
      <div class="submit-dialog-content">
        <div class="submit-summary">
          <h4>作业提交摘要</h4>
          <div class="summary-items">
            <div class="summary-item">
              <span class="label">作业类型:</span>
              <span class="value">{{ getTypeName(config.assignmentType) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">完成度:</span>
              <span class="value">{{ completionPercentage }}%</span>
            </div>
            <div class="summary-item">
              <span class="label">用时:</span>
              <span class="value">{{ formatTime(elapsedTime) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">尝试次数:</span>
              <span class="value">{{ attemptCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="submissionWarnings.length > 0" class="submission-warnings">
          <h5>
            <el-icon><WarningFilled /></el-icon>
            提交提醒
          </h5>
          <ul>
            <li v-for="warning in submissionWarnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>

        <div class="submit-confirm">
          <el-checkbox v-model="confirmSubmit">
            我确认已完成作业并同意提交
          </el-checkbox>
        </div>
      </div>

      <template #footer>
        <el-button @click="showSubmitDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSubmission"
          :disabled="!confirmSubmit"
          :loading="submitting"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Timer,
  Upload,
  InfoFilled,
  Document,
  EditPen,
  Monitor,
  RefreshRight,
  WarningFilled
} from '@element-plus/icons-vue'

import type {
  AssignmentConfig,
  ActivityContext,
  ActivityResult,
  Question
} from '@/types/course'

// 导入子组件（稍后创建）
// import QuizRunner from './quiz/QuizRunner.vue'
// import EssayRunner from './essay/EssayRunner.vue'
// import CodeRunner from './code/CodeRunner.vue'
// import FileRunner from './file/FileRunner.vue'
// import MixedRunner from './mixed/MixedRunner.vue'

interface Props {
  config: AssignmentConfig
  context: ActivityContext
}

interface Emits {
  'complete': [result: ActivityResult]
  'error': [error: Error | string]
  'progress': [progress: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const attemptCount = ref(0)
const elapsedTime = ref(0)
const startTime = ref<Date | null>(null)
const remainingTime = ref(0)
const submissionData = ref<any>(null)
const showSubmitDialog = ref(false)
const confirmSubmit = ref(false)
const submitting = ref(false)

// 定时器
let timerInterval: number | null = null
let countdownInterval: number | null = null

// 计算属性
const canSubmit = computed(() => {
  // 检查基本提交条件
  if (!submissionData.value) return false

  // 检查尝试次数限制
  if (props.config.maxAttempts && attemptCount.value >= props.config.maxAttempts) {
    return false
  }

  // 检查时间限制
  if (props.config.timeLimit && remainingTime.value <= 0) {
    return false
  }

  return true
})

const completionPercentage = computed(() => {
  // 根据作业类型计算完成度
  switch (props.config.assignmentType) {
    case 'quiz':
      return calculateQuizCompletion()
    case 'essay':
      return calculateEssayCompletion()
    case 'code':
      return calculateCodeCompletion()
    case 'file':
      return calculateFileCompletion()
    case 'mixed':
      return calculateMixedCompletion()
    default:
      return 0
  }
})

const submissionWarnings = computed(() => {
  const warnings: string[] = []

  if (completionPercentage.value < 100) {
    warnings.push('作业尚未完全完成')
  }

  if (props.config.timeLimit && remainingTime.value < 60) {
    warnings.push('即将到达时间限制')
  }

  if (props.config.maxAttempts && attemptCount.value >= props.config.maxAttempts - 1) {
    warnings.push('这是最后一次提交机会')
  }

  return warnings
})

const submissionStatus = computed(() => {
  if (submissionData.value) {
    return '已准备'
  }
  return '未开始'
})

// 方法
const getTypeVariant = (type: AssignmentConfig['assignmentType']) => {
  const variantMap = {
    quiz: 'primary',
    essay: 'success',
    code: 'warning',
    file: 'info',
    mixed: 'default'
  }
  return variantMap[type] || 'default'
}

const getTypeName = (type: AssignmentConfig['assignmentType']) => {
  const nameMap = {
    quiz: '测验作业',
    essay: '文章作业',
    code: '代码作业',
    file: '文件作业',
    mixed: '混合作业'
  }
  return nameMap[type] || '作业'
}

const formatTime = (seconds: number): string => {
  if (seconds < 0) return '00:00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const startTimer = () => {
  startTime.value = new Date()

  timerInterval = window.setInterval(() => {
    if (startTime.value) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value.getTime()) / 1000)
    }
  }, 1000)

  // 如果有时间限制，启动倒计时
  if (props.config.timeLimit) {
    remainingTime.value = props.config.timeLimit * 60 // 转换为秒

    countdownInterval = window.setInterval(() => {
      remainingTime.value--

      if (remainingTime.value <= 0) {
        // 时间到，自动提交
        handleTimeUp()
      } else if (remainingTime.value === 300) { // 5分钟提醒
        ElMessage.warning('距离作业截止还有5分钟')
      } else if (remainingTime.value === 60) { // 1分钟提醒
        ElMessage.warning('距离作业截止还有1分钟')
      }
    }, 1000)
  }
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// 完成度计算方法
const calculateQuizCompletion = (): number => {
  if (!props.config.questions || props.config.questions.length === 0) return 0

  const answeredQuestions = submissionData.value?.answers?.length || 0
  return Math.round((answeredQuestions / props.config.questions.length) * 100)
}

const calculateEssayCompletion = (): number => {
  if (!submissionData.value?.content) return 0

  const content = submissionData.value.content
  const wordCount = content.trim().split(/\s+/).length

  // 假设至少需要100字才算完成
  return Math.min(Math.round((wordCount / 100) * 100), 100)
}

const calculateCodeCompletion = (): number => {
  if (!submissionData.value?.code) return 0

  // 简单的代码完成度评估
  const code = submissionData.value.code
  const hasImplementation = code.trim().length > 50
  const hasTests = submissionData.value?.tests?.length > 0

  let completion = 0
  if (hasImplementation) completion += 70
  if (hasTests) completion += 30

  return completion
}

const calculateFileCompletion = (): number => {
  if (!submissionData.value?.files || submissionData.value.files.length === 0) return 0

  // 基于上传文件数量和大小计算
  const files = submissionData.value.files
  const totalSize = files.reduce((sum: number, file: any) => sum + file.size, 0)

  // 假设至少需要1个文件且总大小大于1KB
  if (files.length > 0 && totalSize > 1024) {
    return 100
  }

  return files.length > 0 ? 50 : 0
}

const calculateMixedCompletion = (): number => {
  // 混合作业的完成度计算
  const components = submissionData.value || {}
  let totalCompletion = 0
  let componentCount = 0

  if (components.quiz) {
    totalCompletion += calculateQuizCompletion()
    componentCount++
  }

  if (components.essay) {
    totalCompletion += calculateEssayCompletion()
    componentCount++
  }

  if (components.code) {
    totalCompletion += calculateCodeCompletion()
    componentCount++
  }

  if (components.files) {
    totalCompletion += calculateFileCompletion()
    componentCount++
  }

  return componentCount > 0 ? Math.round(totalCompletion / componentCount) : 0
}

// 事件处理方法
const handleQuizAnswer = (answers: any[]) => {
  submissionData.value = {
    ...submissionData.value,
    answers
  }
  emit('progress', completionPercentage.value)
}

const handleQuizComplete = (result: any) => {
  submissionData.value = {
    ...submissionData.value,
    ...result
  }
}

const handleEssaySubmit = (content: string) => {
  submissionData.value = {
    ...submissionData.value,
    content
  }
  emit('progress', completionPercentage.value)
}

const handleEssaySave = (content: string) => {
  // 自动保存草稿
  submissionData.value = {
    ...submissionData.value,
    content,
    isDraft: true
  }
}

const handleCodeSubmit = (code: string, tests?: any) => {
  submissionData.value = {
    ...submissionData.value,
    code,
    tests
  }
  emit('progress', completionPercentage.value)
}

const handleCodeTest = (testResults: any) => {
  submissionData.value = {
    ...submissionData.value,
    testResults
  }
}

const handleFileUpload = (files: any[]) => {
  submissionData.value = {
    ...submissionData.value,
    files
  }
  emit('progress', completionPercentage.value)
}

const handleFileRemove = (fileId: string) => {
  if (submissionData.value?.files) {
    submissionData.value.files = submissionData.value.files.filter((file: any) => file.id !== fileId)
  }
  emit('progress', completionPercentage.value)
}

const handleMixedSubmit = (data: any) => {
  submissionData.value = {
    ...submissionData.value,
    ...data
  }
  emit('progress', completionPercentage.value)
}

const handleMixedProgress = (progress: number) => {
  emit('progress', progress)
}

const submitAssignment = () => {
  if (!canSubmit.value) {
    ElMessage.warning('当前无法提交作业')
    return
  }

  showSubmitDialog.value = true
  confirmSubmit.value = false
}

const handleTimeUp = () => {
  ElMessage.warning('作业时间已到，将自动提交')

  // 自动提交
  confirmSubmission()
}

const confirmSubmission = async () => {
  if (!confirmSubmit.value || !submissionData.value) return

  submitting.value = true

  try {
    // 增加尝试次数
    attemptCount.value++

    // 创建提交结果
    const result: ActivityResult = {
      success: true,
      score: calculateScore(),
      maxScore: 100,
      feedback: generateFeedback(),
      artifacts: [
        {
          id: 'assignment_submission',
          name: '作业提交',
          type: 'data',
          content: submissionData.value,
          createdAt: new Date()
        }
      ],
      analytics: {
        timeSpent: elapsedTime.value,
        interactions: 1,
        errors: 0,
        hints: 0,
        retries: attemptCount.value - 1
      }
    }

    // 停止计时器
    stopTimer()

    // 发送完成事件
    emit('complete', result)

    ElMessage.success('作业提交成功！')
    showSubmitDialog.value = false

  } catch (error) {
    console.error('Submit failed:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleCloseSubmit = () => {
  confirmSubmit.value = false
  showSubmitDialog.value = false
}

const calculateScore = (): number => {
  // 简单的评分算法，实际应该根据gradingConfig计算
  const baseScore = completionPercentage.value

  // 时间因素
  let timeBonus = 0
  if (props.config.timeLimit) {
    const timeUsedRatio = elapsedTime.value / (props.config.timeLimit * 60)
    if (timeUsedRatio < 0.5) {
      timeBonus = 10 // 提前完成加分
    }
  }

  // 尝试次数因素
  const attemptPenalty = Math.max(0, (attemptCount.value - 1) * 5)

  return Math.max(0, Math.min(100, baseScore + timeBonus - attemptPenalty))
}

const generateFeedback = (): string => {
  const score = calculateScore()

  if (score >= 90) {
    return '优秀！作业完成质量很高'
  } else if (score >= 80) {
    return '良好！作业完成得不错'
  } else if (score >= 70) {
    return '及格！作业基本完成'
  } else if (score >= 60) {
    return '尚可，但还有改进空间'
  } else {
    return '需要努力，建议重新审视作业要求'
  }
}

// 生命周期
onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

// 监听提交数据变化
watch(submissionData, () => {
  emit('progress', completionPercentage.value)
}, { deep: true })
</script>

<style scoped lang="scss">
.assignment-runner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 500px;
}

.assignment-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.assignment-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0;
    line-height: 1.4;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.time-limit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--edu-danger-600);
  font-size: 14px;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', monospace;
}

.assignment-instructions {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  overflow: hidden;
}

.instructions-content {
  padding: 20px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 16px 0;
  }

  p {
    font-size: 15px;
    line-height: 1.6;
    color: var(--edu-text-primary);
    margin: 0 0 16px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(p) {
    margin: 0 0 12px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.submission-requirements {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--edu-border-color);

  h5 {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 12px 0;
  }
}

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  color: var(--edu-text-secondary);
  font-size: 14px;

  .el-icon {
    color: var(--edu-primary-500);
    flex-shrink: 0;
  }
}

.file-types {
  color: var(--edu-text-disabled);
  font-size: 12px;
}

.quiz-content,
.essay-content,
.code-content,
.file-content,
.mixed-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  min-height: 400px;
  border: 1px solid var(--edu-border-color);
}

.assignment-stats {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--edu-border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--edu-primary-600);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--edu-text-secondary);
  font-weight: 500;
}

.submit-dialog-content {
  .submit-summary {
    margin-bottom: 20px;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 0 0 12px 0;
    }
  }

  .summary-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--edu-border-color);

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: var(--edu-text-secondary);
      font-size: 14px;
    }

    .value {
      color: var(--edu-text-primary);
      font-weight: 500;
      font-size: 14px;
    }
  }

  .submission-warnings {
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;

    h5 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--edu-danger-600);
      margin: 0 0 8px 0;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        color: var(--edu-danger-600);
        font-size: 14px;
        margin-bottom: 4px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .submit-confirm {
    padding-top: 16px;
    border-top: 1px solid var(--edu-border-color);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .assignment-runner {
    gap: 16px;
  }

  .assignment-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-right {
    justify-content: space-between;
  }

  .requirements-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-value {
    font-size: 20px;
  }

  .instructions-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>