<template>
  <div class="experiment-section">
    <!-- 环节头部 -->
    <div class="section-header">
      <h3>{{ section.title }}</h3>
      <div class="section-meta">
        <span class="duration">{{ section.duration }}分钟</span>
        <el-tag type="success" size="small">实验活动</el-tag>
      </div>
    </div>

    <!-- 环节描述 -->
    <div v-if="section.content?.description" class="section-description">
      {{ section.content.description }}
    </div>

    <!-- 实验内容主体 -->
    <div class="experiment-content">
      <!-- 实验类型卡片 -->
      <div class="experiment-type-card">
        <div class="card-header">
          <el-icon class="icon"><Microscope /></el-icon>
          <h4>实验信息</h4>
        </div>
        <div class="card-body">
          <div class="experiment-info">
            <div class="info-item">
              <label>实验类型:</label>
              <span>{{ getExperimentTypeLabel(section.content?.experimentType) }}</span>
            </div>
            <div class="info-item">
              <label>难度级别:</label>
              <el-tag
                :type="getDifficultyType(section.content?.difficultyLevel)"
                size="small"
              >
                {{ getDifficultyLabel(section.content?.difficultyLevel) }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>预计时长:</label>
              <span>{{ section.content?.duration || section.duration }}分钟</span>
            </div>
            <div class="info-item">
              <label>是否需要算力:</label>
              <el-tag :type="section.content?.requiresCompute ? 'warning' : 'info'" size="small">
                {{ section.content?.requiresCompute ? '是' : '否' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Jupyter Notebook 预览 -->
      <div v-if="section.content?.notebook" class="notebook-preview-card">
        <div class="card-header">
          <el-icon class="icon"><Document /></el-icon>
          <h4>实验笔记本</h4>
        </div>
        <div class="card-body">
          <div class="notebook-meta">
            <div class="meta-item">
              <label>文件名:</label>
              <span>{{ section.content.notebook.filename }}</span>
            </div>
            <div class="meta-item">
              <label>单元格数量:</label>
              <span>{{ section.content.notebook.cellCount }}个</span>
            </div>
            <div class="meta-item">
              <label>依赖包:</label>
              <div class="dependencies">
                <el-tag
                  v-for="dep in section.content.notebook.dependencies.slice(0, 3)"
                  :key="dep"
                  size="small"
                  class="dependency-tag"
                >
                  {{ dep }}
                </el-tag>
                <span v-if="section.content.notebook.dependencies.length > 3" class="more-deps">
                  +{{ section.content.notebook.dependencies.length - 3 }}个
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 实验步骤 -->
      <div v-if="section.content?.steps?.length" class="steps-card">
        <div class="card-header">
          <el-icon class="icon"><List /></el-icon>
          <h4>实验步骤</h4>
        </div>
        <div class="card-body">
          <el-steps
            :active="currentStep"
            direction="vertical"
            finish-status="success"
          >
            <el-step
              v-for="(step, index) in section.content.steps"
              :key="index"
              :title="step.title"
              :description="step.description"
            />
          </el-steps>
        </div>
      </div>

      <!-- 安全提示 -->
      <div class="safety-card">
        <div class="card-header">
          <el-icon class="icon"><Warning /></el-icon>
          <h4>安全提示</h4>
        </div>
        <div class="card-body">
          <ul class="safety-list">
            <li>请在实验前仔细阅读所有步骤</li>
            <li>实验过程中如有问题，请及时向老师求助</li>
            <li>注意保存实验过程中的重要数据和结果</li>
            <li>遵守实验室安全规定</li>
          </ul>
        </div>
      </div>

      <!-- 控制按钮区域 -->
      <div class="action-area">
        <el-button
          type="primary"
          size="large"
          @click="startExperiment"
          :loading="isLoading"
        >
          <el-icon><VideoPlay /></el-icon>
          开始实验
        </el-button>

        <el-button
          v-if="canDistribute"
          type="success"
          size="large"
          @click="distributeToStudents"
        >
          <el-icon><Share /></el-icon>
          分发给学生
        </el-button>

        <el-button
          type="default"
          size="large"
          @click="showMonitor"
        >
          <el-icon><Monitor /></el-icon>
          实验监控
        </el-button>
      </div>
    </div>

    <!-- 实验进度跟踪 -->
    <div v-if="showProgress" class="progress-section">
      <div class="progress-header">
        <h4>实验进度</h4>
        <span class="progress-text">{{ progressPercentage }}%</span>
      </div>
      <el-progress
        :percentage="progressPercentage"
        :stroke-width="8"
        :show-text="false"
      />
      <div class="progress-details">
        <div class="detail-item">
          <span>已开始学生: {{ startedCount }}人</span>
        </div>
        <div class="detail-item">
          <span>完成率: {{ completionRate }}%</span>
        </div>
        <div class="detail-item">
          <span>平均用时: {{ averageTime }}分钟</span>
        </div>
      </div>
    </div>

    <!-- 学生状态面板 -->
    <div v-if="showStudentStatus" class="student-status-section">
      <div class="status-header">
        <h4>学生状态</h4>
        <div class="status-actions">
          <el-button size="small" @click="refreshStudentStatus">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
      <div class="student-list">
        <div
          v-for="student in studentStatusList"
          :key="student.id"
          class="student-item"
        >
          <el-avatar :size="32" :src="student.avatar" />
          <div class="student-info">
            <span class="student-name">{{ student.name }}</span>
            <el-tag
              :type="getStudentStatusType(student.status)"
              size="small"
            >
              {{ getStudentStatusLabel(student.status) }}
            </el-tag>
          </div>
          <div class="student-progress">
            <el-progress
              :percentage="student.progress"
              :stroke-width="4"
              :show-text="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 实验反馈区域 -->
    <div v-if="showFeedback" class="feedback-section">
      <div class="feedback-header">
        <h4>实验反馈</h4>
        <el-tag :type="getFeedbackTypeColor(feedbackSummary?.average)" size="small">
          {{ getFeedbackLabel(feedbackSummary?.average) }}
        </el-tag>
      </div>
      <div class="feedback-content">
        <div class="feedback-stats">
          <div class="stat-item">
            <span class="label">完成度评分:</span>
            <span class="value">{{ feedbackSummary?.completionScore || 0 }}/5</span>
          </div>
          <div class="stat-item">
            <span class="label">理解度评分:</span>
            <span class="value">{{ feedbackSummary?.understandingScore || 0 }}/5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI实验建议 -->
    <div v-if="showAISuggestions" class="ai-suggestions-section">
      <div class="suggestions-header">
        <h4>
          <el-icon><Magic /></el-icon>
          AI实验建议
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
  Microscope,
  Document,
  List,
  Warning,
  VideoPlay,
  Share,
  Monitor,
  Refresh,
  Magic
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
const currentStep = ref(0)
const progressPercentage = ref(0)
const startedCount = ref(0)
const completionRate = ref(0)
const averageTime = ref(0)
const showProgress = ref(false)
const showStudentStatus = ref(false)
const showFeedback = ref(false)
const studentStatusList = ref<any[]>([])
const feedbackSummary = ref<any>(null)
const aiSuggestions = ref<any[]>([])

// 计算属性
const canDistribute = computed(() => {
  return props.section.content?.notebook && props.section.content?.requiresCompute
})

// 实验类型标签
const getExperimentTypeLabel = (type: string): string => {
  const types = {
    'jupyter': 'Jupyter实验',
    'simulation': '模拟实验',
    'virtual': '虚拟实验',
    'hands_on': '动手实验',
    'observation': '观察实验'
  }
  return types[type] || 'Jupyter实验'
}

// 难度级别类型
const getDifficultyType = (level: string): string => {
  const levels = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  }
  return levels[level] || 'info'
}

const getDifficultyLabel = (level: string): string => {
  const labels = {
    'beginner': '入门级',
    'intermediate': '中级',
    'advanced': '高级'
  }
  return labels[level] || '中级'
}

// 反馈类型颜色
const getFeedbackTypeColor = (rating: number): string => {
  if (rating >= 4.5) return 'success'
  if (rating >= 3.5) return 'warning'
  return 'danger'
}

const getFeedbackLabel = (rating: number): string => {
  if (rating >= 4.5) return '优秀'
  if (rating >= 3.5) return '良好'
  return '需要改进'
}

// 学生状态类型
const getStudentStatusType = (status: string): string => {
  const statusMap = {
    'not_started': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'stuck': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStudentStatusLabel = (status: string): string => {
  const labelMap = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'stuck': '遇到困难'
  }
  return labelMap[status] || '未知'
}

// 方法
const startExperiment = async () => {
  try {
    isLoading.value = true

    // 广播实验开始事件
    await presenterStore.broadcastSectionChange({
      type: 'experiment_start',
      sectionId: props.section.id,
      section: props.section,
      timestamp: new Date()
    })

    // 更新显示状态
    showProgress.value = true
    currentStep.value = 0
    progressPercentage.value = 0

    ElMessage.success('实验环节已开始')
  } catch (error) {
    console.error('开始实验失败:', error)
    ElMessage.error('开始实验失败')
  } finally {
    isLoading.value = false
  }
}

const distributeToStudents = async () => {
  try {
    isLoading.value = true

    // 分发实验到学生端
    await classroomService.distributeExperiment({
      lessonId: presenterStore.currentLessonId,
      sectionId: props.section.id,
      experimentData: props.section.content
    })

    ElMessage.success('实验已分发到学生端')
  } catch (error) {
    console.error('分发实验失败:', error)
    ElMessage.error('分发实验失败')
  } finally {
    isLoading.value = false
  }
}

const showMonitor = () => {
  showStudentStatus.value = !showStudentStatus.value
  if (showStudentStatus.value) {
    refreshStudentStatus()
  }
}

const refreshStudentStatus = async () => {
  try {
    // 获取学生实验状态
    const status = await classroomService.getExperimentStatus({
      lessonId: presenterStore.currentLessonId,
      sectionId: props.section.id
    })

    studentStatusList.value = status.students
    startedCount.value = status.startedCount
    completionRate.value = status.completionRate
    averageTime.value = status.averageTime
    progressPercentage.value = status.overallProgress
  } catch (error) {
    console.error('获取学生状态失败:', error)
  }
}

// 更新进度数据
const updateProgress = (progress: number, started: number, completion: number, avgTime: number) => {
  progressPercentage.value = Math.round(progress)
  startedCount.value = started
  completionRate.value = Math.round(completion)
  averageTime.value = avgTime
  showProgress.value = true
}

// 更新反馈数据
const updateFeedback = (summary: any) => {
  feedbackSummary.value = summary
  showFeedback.value = true

  // 根据反馈生成AI建议
  if (summary && summary.completionScore < 3.5) {
    aiSuggestions.value = [
      {
        type: 'warning',
        title: '实验难度',
        content: '建议简化实验步骤，增加指导和提示，帮助学生更好地完成实验。'
      },
      {
        type: 'info',
        title: '时间管理',
        content: '考虑将实验分为多个小任务，设置中间检查点，确保学生按时完成。'
      }
    ]
  } else if (summary && summary.understandingScore < 3.5) {
    aiSuggestions.value = [
      {
        type: 'warning',
        title: '概念理解',
        content: '建议增加理论讲解和示例演示，帮助学生理解实验原理。'
      },
      {
        type: 'info',
        title: '互动支持',
        content: '考虑增加小组讨论环节，让学生互相交流实验心得。'
      }
    ]
  }
}

// 生命周期
onMounted(() => {
  // 初始化进度数据
  updateProgress(0, 0, 0, 0)

  // 如果是当前活跃环节，显示进度和学生状态
  if (props.section.isActive) {
    updateProgress(15, 8, 20, 12)
    updateFeedback({
      completionScore: 4.1,
      understandingScore: 3.8
    })

    // 模拟学生状态数据
    studentStatusList.value = [
      {
        id: '1',
        name: '张三',
        avatar: 'https://example.com/avatar1.jpg',
        status: 'completed',
        progress: 100
      },
      {
        id: '2',
        name: '李四',
        avatar: 'https://example.com/avatar2.jpg',
        status: 'in_progress',
        progress: 65
      },
      {
        id: '3',
        name: '王五',
        avatar: 'https://example.com/avatar3.jpg',
        status: 'in_progress',
        progress: 40
      },
      {
        id: '4',
        name: '赵六',
        avatar: 'https://example.com/avatar4.jpg',
        status: 'stuck',
        progress: 25
      }
    ]
  }
})

// 暴露方法供父组件调用
defineExpose({
  updateProgress,
  updateFeedback,
  refreshStudentStatus
})
</script>

<style scoped lang="scss">
.experiment-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.experiment-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.experiment-type-card,
.notebook-preview-card,
.steps-card,
.safety-card {
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

.experiment-info,
.notebook-meta {
  .info-item,
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

.dependencies {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .dependency-tag {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .more-deps {
    font-size: 12px;
    opacity: 0.8;
  }
}

.safety-list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 8px;
    font-size: 14px;

    &:before {
      content: '⚠️';
      position: absolute;
      left: 0;
      top: 0;
    }
  }
}

.action-area {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
}

.progress-section,
.student-status-section,
.feedback-section,
.ai-suggestions-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
}

.progress-header,
.status-header,
.feedback-header,
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

.student-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;

  .student-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .student-progress {
    flex: 1;
  }
}

.feedback-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;

  .stat-item {
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
  .experiment-section {
    padding: 16px;
    gap: 16px;
  }

  .action-area {
    flex-direction: column;
    align-items: stretch;
  }

  .experiment-content {
    gap: 12px;
  }

  .progress-section,
  .student-status-section,
  .feedback-section,
  .ai-suggestions-section {
    padding: 16px;
  }

  .progress-details,
  .feedback-stats {
    flex-direction: column;
    gap: 12px;
  }

  .dependencies {
    flex-direction: column;
    align-items: flex-start;
  }
}

// 动画效果
.experiment-type-card,
.notebook-preview-card,
.steps-card,
.safety-card {
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

.student-item {
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }
}
</style>