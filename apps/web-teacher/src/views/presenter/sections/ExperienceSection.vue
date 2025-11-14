<template>
  <div class="experience-section">
    <!-- 环节头部 -->
    <div class="section-header">
      <h3>{{ section.title }}</h3>
      <div class="section-meta">
        <span class="duration">{{ section.duration }}分钟</span>
        <el-tag type="warning" size="small">体验理解</el-tag>
      </div>
    </div>

    <!-- 环节描述 -->
    <div v-if="section.content?.description" class="section-description">
      {{ section.content.description }}
    </div>

    <!-- 体验内容主体 -->
    <div class="experience-content">
      <!-- 体验类型卡片 -->
      <div class="experience-type-card">
        <div class="card-header">
          <el-icon class="icon"><Compass /></el-icon>
          <h4>互动体验</h4>
        </div>
        <div class="card-body">
          <div class="experience-info">
            <div class="info-item">
              <label>体验类型:</label>
              <span>{{ getExperienceTypeLabel(section.content?.experienceType) }}</span>
            </div>
            <div class="info-item">
              <label>交互级别:</label>
              <el-tag
                :type="getInteractionLevelType(section.content?.interactionLevel)"
                size="small"
              >
                {{ getInteractionLevelLabel(section.content?.interactionLevel) }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>预计时长:</label>
              <span>{{ section.content?.duration || section.duration }}分钟</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 指导说明 -->
      <div v-if="section.content?.instructions" class="instructions-card">
        <div class="card-header">
          <el-icon class="icon"><Guide /></el-icon>
          <h4>指导说明</h4>
        </div>
        <div class="card-body">
          <div class="instructions-content">
            {{ section.content.instructions }}
          </div>
        </div>
      </div>

      <!-- 材料清单 -->
      <div v-if="section.content?.materials?.length" class="materials-card">
        <div class="card-header">
          <el-icon class="icon"><Folder /></el-icon>
          <h4>所需材料</h4>
        </div>
        <div class="card-body">
          <ul class="materials-list">
            <li v-for="(material, index) in section.content.materials" :key="index">
              {{ material }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 互动提示 -->
      <div class="interaction-hint">
        <el-alert
          title="互动提示"
          type="info"
          :closable="false"
          show-icon
        >
          这是一个互动体验环节，鼓励学生积极参与，通过实践加深理解。老师可以根据学生的反馈调整教学内容。
        </el-alert>
      </div>

      <!-- 开始体验按钮 -->
      <div class="action-area">
        <el-button
          type="primary"
          size="large"
          @click="startExperience"
          :loading="isLoading"
        >
          <el-icon><VideoPlay /></el-icon>
          开始体验
        </el-button>

        <el-button
          v-if="canPreview"
          type="default"
          size="large"
          @click="previewExperience"
        >
          <el-icon><View /></el-icon>
          预览
        </el-button>
      </div>
    </div>

    <!-- 进度跟踪 -->
    <div v-if="showProgress" class="progress-section">
      <div class="progress-header">
        <h4>体验进度</h4>
        <span class="progress-text">{{ progressPercentage }}%</span>
      </div>
      <el-progress
        :percentage="progressPercentage"
        :stroke-width="8"
        :show-text="false"
      />
      <div class="progress-details">
        <div class="detail-item">
          <span>已参与学生: {{ participantsCount }}人</span>
        </div>
        <div class="detail-item">
          <span>完成率: {{ completionRate }}%</span>
        </div>
      </div>
    </div>

    <!-- 互动反馈区域 -->
    <div v-if="showFeedback" class="feedback-section">
      <div class="feedback-header">
        <h4>互动反馈</h4>
        <el-tag :type="getFeedbackTypeColor(feedbackSummary?.average)" size="small">
          {{ getFeedbackLabel(feedbackSummary?.average) }}
        </el-tag>
      </div>
      <div class="feedback-content">
        <div class="feedback-stats">
          <div class="stat-item">
            <span class="label">平均满意度:</span>
            <span class="value">{{ feedbackSummary?.average?.toFixed(1) || 0 }}/5</span>
          </div>
          <div class="stat-item">
            <span class="label">活跃度:</span>
            <span class="value">{{ feedbackSummary?.engagement || 0 }}%</span>
          </div>
        </div>
        <div v-if="recentFeedback?.length" class="feedback-list">
          <h5>最新反馈</h5>
          <div
            v-for="(feedback, index) in recentFeedback.slice(0, 3)"
            :key="index"
            class="feedback-item"
          >
            <div class="feedback-header">
              <el-avatar
                :size="24"
                :src="feedback.studentAvatar"
              />
              <span class="student-name">{{ feedback.studentName }}</span>
              <el-rate
                v-model="feedback.rating"
                disabled
                size="small"
              />
            </div>
            <div class="feedback-content">
              {{ feedback.comment }}
            </div>
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
  Compass,
  Guide,
  Folder,
  VideoPlay,
  View,
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
const progressPercentage = ref(0)
const participantsCount = ref(0)
const completionRate = ref(0)
const showProgress = ref(false)
const showFeedback = ref(false)
const feedbackSummary = ref<any>(null)
const recentFeedback = ref<any[]>([])
const aiSuggestions = ref<any[]>([])

// 计算属性
const canPreview = computed(() => {
  return props.section.content?.allowPreview !== false
})

// 体验类型标签
const getExperienceTypeLabel = (type: string): string => {
  const types = {
    'interactive': '互动体验',
    'simulation': '模拟体验',
    'game': '游戏体验',
    'vr': 'VR体验',
    'ar': 'AR体验',
    'manual': '手动实践'
  }
  return types[type] || '互动体验'
}

// 交互级别标签
const getInteractionLevelType = (level: string): string => {
  const levels = {
    'low': 'info',
    'medium': 'warning',
    'high': 'danger'
  }
  return levels[level] || 'info'
}

const getInteractionLevelLabel = (level: string): string => {
  const labels = {
    'low': '轻度互动',
    'medium': '中度互动',
    'high': '高度互动'
  }
  return labels[level] || '中度互动'
}

// 反馈类型颜色
const getFeedbackTypeColor = (rating: number): string => {
  if (rating >= 4.5) return 'success'
  if (rating >= 3.5) return 'warning'
  return 'danger'
}

const getFeedbackLabel = (rating: number): string => {
  if (rating >= 4.5) return '非常满意'
  if (rating >= 3.5) return '基本满意'
  return '需要改进'
}

// 方法
const startExperience = async () => {
  try {
    isLoading.value = true

    // 广播体验开始事件
    await presenterStore.broadcastSectionChange({
      type: 'experience_start',
      sectionId: props.section.id,
      section: props.section,
      timestamp: new Date()
    })

    // 更新显示状态
    showProgress.value = true
    progressPercentage.value = 0

    ElMessage.success('体验环节已开始')
  } catch (error) {
    console.error('开始体验失败:', error)
    ElMessage.error('开始体验失败')
  } finally {
    isLoading.value = false
  }
}

const previewExperience = async () => {
  try {
    // 打开预览模态框或跳转到预览页面
    ElMessage.info('预览功能开发中...')
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error('预览失败')
  }
}

// 更新进度数据
const updateProgress = (progress: number, participants: number, completion: number) => {
  progressPercentage.value = Math.round(progress)
  participantsCount.value = participants
  completionRate.value = Math.round(completion)
}

// 更新反馈数据
const updateFeedback = (summary: any, feedback: any[]) => {
  feedbackSummary.value = summary
  recentFeedback.value = feedback
  showFeedback.value = true

  // 根据反馈生成AI建议
  if (summary && summary.average < 3.5) {
    aiSuggestions.value = [
      {
        type: 'warning',
        title: '参与度偏低',
        content: '建议增加互动元素，提高学生参与积极性。考虑使用游戏化元素或小组合作。'
      },
      {
        type: 'info',
        title: '内容调整',
        content: '根据学生反馈，建议简化复杂内容，增加实践机会。'
      }
    ]
  }
}

// 生命周期
onMounted(() => {
  // 初始化进度和反馈数据
  updateProgress(0, 0, 0)

  // 如果是当前活跃环节，显示进度和反馈
  // 这个数据应该从presenter store中获取
  // 暂时使用模拟数据
  if (props.section.isActive) {
    updateProgress(25, 12, 30)
    updateFeedback(
      { average: 4.2, engagement: 75 },
      [
        {
          studentName: '张三',
          studentAvatar: 'https://example.com/avatar1.jpg',
          rating: 4,
          comment: '很有趣的体验，希望能多一些互动。'
        },
        {
          studentName: '李四',
          studentAvatar: 'https://example.com/avatar2.jpg',
          rating: 4,
          comment: '内容很好，但希望能延长一些时间。'
        }
      ]
    )
  }
})

// 暴露方法供父组件调用
defineExpose({
  updateProgress,
  updateFeedback
})
</script>

<style scoped lang="scss">
.experience-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.experience-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.experience-type-card,
.instructions-card,
.materials-card {
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

.experience-info {
  .info-item {
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

.instructions-content,
.materials-list {
  font-size: 14px;
  line-height: 1.6;
}

.materials-list {
  margin: 0;
  padding: 0;

  li {
    margin-bottom: 8px;
    padding-left: 20px;
    position: relative;

    &:before {
      content: '•';
      position: absolute;
      left: 8px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.interaction-hint {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-area {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.progress-section,
.feedback-section,
.ai-suggestions-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
}

.progress-header,
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

.feedback-list {
  h5 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }
}

.feedback-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;

  .feedback-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .student-name {
      font-weight: 500;
    }
  }

  .feedback-content {
    font-size: 14px;
    opacity: 0.9;
    line-height: 1.4;
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
  .experience-section {
    padding: 16px;
    gap: 16px;
  }

  .action-area {
    flex-direction: column;
    align-items: stretch;
  }

  .experience-content {
    gap: 12px;
  }

  .progress-section,
  .feedback-section,
  .ai-suggestions-section {
    padding: 16px;
  }

  .feedback-stats {
    flex-direction: column;
    gap: 12px;
  }
}

// 动画效果
.experience-type-card,
.instructions-card,
.materials-card {
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
</style>