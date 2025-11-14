<template>
  <el-drawer
    v-model="drawerVisible"
    :title="activityContext?.activity.title"
    size="70%"
    direction="rtl"
    class="activity-drawer"
    destroy-on-close
    @closed="handleClose"
  >
    <template #header>
      <div class="activity-drawer-header">
        <div class="activity-title-section">
          <div class="activity-meta">
            <EduTag :variant="getActivityTypeVariant(activityContext?.activity.type || '')">
              {{ getActivityTypeName(activityContext?.activity.type || '') }}
            </EduTag>
            <EduTag :variant="getStatusVariant(activityContext?.activity.status || '')" size="sm">
              {{ getStatusText(activityContext?.activity.status || '') }}
            </EduTag>
          </div>
          <h3>{{ activityContext?.activity.title }}</h3>
          <p class="activity-description">{{ activityContext?.activity.description }}</p>
          <div class="activity-info">
            <span class="duration">预计用时: {{ formatDuration(activityContext?.activity.duration || 0) }}</span>
            <span class="difficulty">难度: {{ getDifficultyText(activityContext?.activity.difficulty || 'medium') }}</span>
          </div>
        </div>
        <div class="activity-actions">
          <el-button
            type="primary"
            size="large"
            @click="startActivity"
            :disabled="!canStartActivity"
            :loading="startingActivity"
          >
            <el-icon><CaretRight /></el-icon>
            {{ getActivityActionText() }}
          </el-button>
        </div>
      </div>
    </template>

    <div class="activity-drawer-content">
      <!-- 学习目标 -->
      <div v-if="activityContext?.activity.objectives?.length" class="activity-section">
        <h4>
          <el-icon><Target /></el-icon>
          学习目标
        </h4>
        <ul class="objectives-list">
          <li v-for="objective in activityContext.activity.objectives" :key="objective">
            {{ objective }}
          </li>
        </ul>
      </div>

      <!-- 活动说明 -->
      <div v-if="activityContext?.activity.instructions" class="activity-section">
        <h4>
          <el-icon><InfoFilled /></el-icon>
          活动说明
        </h4>
        <div class="instructions-content" v-html="activityContext.activity.instructions"></div>
      </div>

      <!-- 动态活动内容渲染器 -->
      <div class="activity-content-section">
        <!-- 知识学习活动 -->
        <KnowledgeRunner
          v-if="activityContext?.activity.type === 'knowledge'"
          :config="activityContext.activity.knowledgeConfig"
          :context="activityContext"
          @complete="handleActivityComplete"
          @error="handleActivityError"
        />

        <!-- 实验活动 -->
        <LabRunner
          v-else-if="activityContext?.activity.type === 'experiment'"
          :config="activityContext.activity.experimentConfig"
          :context="activityContext"
          @complete="handleActivityComplete"
          @error="handleActivityError"
        />

        <!-- 体验活动 -->
        <ExperienceRunner
          v-else-if="activityContext?.activity.type === 'experience'"
          :config="activityContext.activity.experienceConfig"
          :context="activityContext"
          @complete="handleActivityComplete"
          @error="handleActivityError"
        />

        <!-- 作业活动 -->
        <AssignmentRunner
          v-else-if="activityContext?.activity.type === 'assignment'"
          :config="activityContext.activity.assignmentConfig"
          :context="activityContext"
          @complete="handleActivityComplete"
          @error="handleActivityError"
        />
      </div>

      <!-- AI助手 -->
      <div v-if="activityContext?.activity.aiHints?.length" class="activity-section">
        <h4>
          <el-icon><MagicStick /></el-icon>
          AI学习助手
        </h4>
        <div class="ai-hints">
          <div
            v-for="hint in activityContext.activity.aiHints"
            :key="hint.id"
            class="ai-hint"
            :class="`hint-priority-${hint.priority}`"
          >
            <EduCard variant="elevated" size="sm">
              <div class="hint-content">
                <div class="hint-header">
                  <span class="hint-title">{{ hint.title }}</span>
                  <EduTag :variant="getHintVariant(hint.priority)" size="xs">
                    {{ getHintPriorityText(hint.priority) }}
                  </EduTag>
                </div>
                <p class="hint-text">{{ hint.content }}</p>
                <div v-if="hint.action" class="hint-actions">
                  <el-button
                    size="small"
                    type="primary"
                    @click="executeHintAction(hint)"
                  >
                    执行建议
                  </el-button>
                </div>
              </div>
            </EduCard>
          </div>
        </div>
      </div>

      <!-- 资源列表 -->
      <div v-if="activityContext?.activity.resourceRefs?.length" class="activity-section">
        <h4>
          <el-icon><FolderOpened /></el-icon>
          相关资源
        </h4>
        <div class="resources-grid">
          <div
            v-for="resourceRef in activityContext.activity.resourceRefs"
            :key="resourceRef.id"
            class="resource-item"
            @click="openResource(resourceRef)"
          >
            <EduCard variant="bordered" size="sm" class="resource-card">
              <div class="resource-content">
                <div class="resource-icon">
                  <el-icon><component :is="getResourceIcon(resourceRef.type)" /></el-icon>
                </div>
                <div class="resource-info">
                  <h5>{{ getResourceTitle(resourceRef) }}</h5>
                  <p class="resource-description">{{ getResourceDescription(resourceRef) }}</p>
                  <div class="resource-meta">
                    <span class="resource-type">{{ getResourceTypeName(resourceRef.type) }}</span>
                  </div>
                </div>
                <div class="resource-action">
                  <el-button size="small" type="text">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                </div>
              </div>
            </EduCard>
          </div>
        </div>
      </div>

      <!-- 评估信息 -->
      <div v-if="activityContext?.activity.assessment" class="activity-section">
        <h4>
          <el-icon><Medal /></el-icon>
          评估信息
        </h4>
        <div class="assessment-info">
          <div class="assessment-item">
            <span class="label">评估类型:</span>
            <span class="value">{{ getAssessmentTypeText(activityContext.activity.assessment.type) }}</span>
          </div>
          <div v-if="activityContext.activity.assessment.passingScore" class="assessment-item">
            <span class="label">及格分数:</span>
            <span class="value">{{ activityContext.activity.assessment.passingScore }}分</span>
          </div>
          <div v-if="activityContext.activity.assessment.maxAttempts" class="assessment-item">
            <span class="label">最大尝试次数:</span>
            <span class="value">{{ activityContext.activity.assessment.maxAttempts }}次</span>
          </div>
          <div v-if="activityContext.activity.assessment.timeLimit" class="assessment-item">
            <span class="label">时间限制:</span>
            <span class="value">{{ formatDuration(activityContext.activity.assessment.timeLimit) }}</span>
          </div>
        </div>
      </div>

      <!-- 进度信息 -->
      <div v-if="activityState" class="activity-section">
        <h4>
          <el-icon><TrendCharts /></el-icon>
          活动进度
        </h4>
        <div class="progress-info">
          <el-progress
            :percentage="activityState.progress"
            :status="activityState.status === 'completed' ? 'success' : 'primary'"
            :show-text="false"
          />
          <span class="progress-text">{{ activityState.progress }}%</span>
          <span v-if="activityState.duration" class="time-spent">
            用时: {{ formatTime(activityState.duration) }}
          </span>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CaretRight,
  Target,
  InfoFilled,
  MagicStick,
  FolderOpened,
  View,
  TrendCharts,
  Medal
} from '@element-plus/icons-vue'

import type {
  ActivityContext,
  Activity,
  ActivityExecutionState,
  ResourceRef,
  AIHint,
  ActivityAssessment,
  ActivityResult
} from '@/types/course'
import {
  canStartActivity,
  getActivityIcon,
  getActivityTypeName,
  formatActivityDuration
} from '@/utils/activity-utils'
import { aclUtils } from '@/utils/acl'
import EduCard from '@reopeninnolab/ui-kit'
import EduTag from '@reopeninnolab/ui-kit'

// 活动处理器组件
import KnowledgeRunner from './activity/KnowledgeRunner.vue'
import LabRunner from './activity/LabRunner.vue'
import ExperienceRunner from './activity/ExperienceRunner.vue'
import AssignmentRunner from './activity/AssignmentRunner.vue'

interface Props {
  modelValue: boolean
  activityContext?: ActivityContext | null
}

interface Emits {
  'update:modelValue': [value: boolean]
  'activity-complete': [result: ActivityResult]
  'close': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const startingActivity = ref(false)
const activityState = ref<ActivityExecutionState | null>(null)

// 计算属性
const canStartActivity = computed(() => {
  if (!props.activityContext) return false
  return canStartActivity(props.activityContext.activity) && !startingActivity.value
})

// 方法
const getActivityTypeVariant = (type: Activity['type']): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (type) {
    case 'knowledge':
      return 'info'
    case 'experiment':
      return 'warning'
    case 'experience':
      return 'success'
    case 'assignment':
      return 'primary'
    default:
      return 'default'
  }
}

const getActivityTypeName = (type: Activity['type']): string => {
  const nameMap = {
    knowledge: '知识学习',
    experiment: '实验活动',
    experience: '体验活动',
    assignment: '作业任务'
  }
  return nameMap[type] || '活动'
}

const getStatusVariant = (status: Activity['status']): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'primary'
    case 'available':
      return 'warning'
    case 'overdue':
      return 'danger'
    case 'locked':
      return 'info'
    default:
      return 'default'
  }
}

const getStatusText = (status: Activity['status']): string => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '进行中'
    case 'available':
      return '可开始'
    case 'overdue':
      return '已逾期'
    case 'locked':
      return '未解锁'
    default:
      return '未知'
  }
}

const getDifficultyText = (difficulty: Activity['difficulty']): string => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficultyMap[difficulty] || '中等'
}

const getHintVariant = (priority: AIHint['priority']): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (priority) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'default'
  }
}

const getHintPriorityText = (priority: AIHint['priority']): string => {
  const priorityMap = {
    high: '重要',
    medium: '一般',
    low: '提示'
  }
  return priorityMap[priority] || '未知'
}

const getAssessmentTypeText = (type: ActivityAssessment['type']): string => {
  const typeMap = {
    formative: '形成性评估',
    summative: '总结性评估',
    diagnostic: '诊断性评估'
  }
  return typeMap[type] || '评估'
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
}

const formatDuration = (minutes: number): string => {
  return formatActivityDuration(minutes)
}

const getResourceIcon = (type: ResourceRef['type']): string => {
  const iconMap = {
    ppt: 'Document',
    video: 'VideoCamera',
    html: 'Monitor',
    notebook: 'Document',
    assignment: 'EditPen',
    image: 'Picture',
    audio: 'Headphones',
    document: 'Document',
    dataset: 'Folder',
    model: 'Box',
    interactive: 'MagicStick'
  }
  return iconMap[type] || 'Document'
}

const getResourceTitle = (resourceRef: ResourceRef): string => {
  return resourceRef.metadata?.title || `资源-${resourceRef.id}`
}

const getResourceDescription = (resourceRef: ResourceRef): string => {
  return resourceRef.metadata?.description || `资源类型: ${resourceRef.type}`
}

const getResourceTypeName = (type: ResourceRef['type']): string => {
  const typeMap = {
    ppt: '演示文稿',
    video: '视频',
    html: '网页',
    notebook: 'Notebook',
    assignment: '作业',
    image: '图片',
    audio: '音频',
    document: '文档',
    dataset: '数据集',
    model: '模型',
    interactive: '交互内容'
  }
  return typeMap[type] || '资源'
}

const getActivityActionText = (): string => {
  if (!props.activityContext) return '开始活动'

  const { activity } = props.activityContext
  switch (activity.type) {
    case 'knowledge':
      return '开始学习'
    case 'experiment':
      return '开始实验'
    case 'experience':
      return '开始体验'
    case 'assignment':
      return '开始作业'
    default:
      return '开始活动'
  }
}

const startActivity = async () => {
  if (!props.activityContext || !canStartActivity.value) {
    return
  }

  startingActivity.value = true

  try {
    // 初始化活动状态
    activityState.value = {
      activityId: props.activityContext.activityId,
      status: 'starting',
      startTime: new Date(),
      progress: 0
    }

    // 根据活动类型调用相应的启动逻辑
    // 这里会在活动处理器组件中实现具体的启动逻辑
    ElMessage.info(`正在启动${getActivityTypeName(props.activityContext.activity.type)}...`)

    // 模拟启动过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    activityState.value = {
      ...activityState.value,
      status: 'running',
      progress: 20
    }

    ElMessage.success(`${getActivityTypeName(props.activityContext.activity.type)}已启动！`)

  } catch (error) {
    console.error('启动活动失败:', error)
    ElMessage.error('启动活动失败，请重试')

    activityState.value = {
      activityId: props.activityContext.activityId,
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    startingActivity.value = false
  }
}

const handleActivityComplete = (result: ActivityResult) => {
  activityState.value = {
    ...activityState.value!,
    status: 'completed',
    endTime: new Date(),
    progress: 100,
    result
  }

  emit('activity-complete', result)

  ElMessage.success('活动已完成！')

  // 延迟关闭抽屉
  setTimeout(() => {
    drawerVisible.value = false
  }, 2000)
}

const handleActivityError = (error: Error | string) => {
  const errorMessage = error instanceof Error ? error.message : error
  ElMessage.error(`活动错误: ${errorMessage}`)

  activityState.value = {
    activityId: props.activityContext?.activityId || '',
    status: 'error',
    error: errorMessage
  }
}

const executeHintAction = async (hint: AIHint) => {
  if (!hint.action) return

  try {
    ElMessage.info(`执行AI建议: ${hint.title}`)

    // 根据提示类型执行相应操作
    switch (hint.action.type) {
      case 'show':
        // 显示提示内容
        ElMessage.success(hint.content)
        break

      case 'navigate':
        // 跳转到指定页面
        if (hint.action.target) {
          // 这里可以实现页面跳转逻辑
          ElMessage.info(`即将跳转到: ${hint.action.target}`)
        }
        break

      case 'highlight':
        // 高亮显示特定内容
        ElMessage.info('已高亮相关内容')
        break

      case 'suggest':
        // 显示建议
        ElMessage.info(`建议: ${hint.action.data || hint.content}`)
        break

      case 'auto':
        // 自动执行操作
        await executeAutoAction(hint)
        break
    }

  } catch (error) {
    console.error('执行AI建议失败:', error)
    ElMessage.error('执行建议失败，请重试')
  }
}

const executeAutoAction = async (hint: AIHint): Promise<void> => {
  // 这里可以实现自动执行逻辑
  return new Promise(resolve => {
    setTimeout(() => {
      ElMessage.info(`自动完成: ${hint.title}`)
      resolve()
    }, 1000)
  })
}

const openResource = (resourceRef: ResourceRef) => {
  ElMessage.info(`打开资源: ${getResourceTitle(resourceRef)}`)
  // 这里可以实现资源打开逻辑，如新窗口打开、预览等
}

const handleClose = () => {
  emit('close')
  // 重置状态
  activityState.value = null
  startingActivity.value = false
}
</script>

<style scoped lang="scss">
.activity-drawer {
  :deep(.el-drawer__header) {
    padding: 0;
    margin-bottom: 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.activity-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
}

.activity-title-section {
  flex: 1;
  min-width: 0;
}

.activity-title-section h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
}

.activity-description {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.activity-actions {
  flex-shrink: 0;
  margin-left: 20px;
}

.activity-drawer-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.lab-preview-section,
.lab-status-section,
.lab-resources-section,
.exp-preview-section,
.exp-instructions-section,
.assignment-description-section,
.assignment-attachments-section,
.activity-common-section {
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 16px 0;
  }
}

.nbconvert-preview {
  background: rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
}

.preview-loading,
.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 12px;
  color: var(--edu-text-secondary);

  .el-icon {
    font-size: 32px;
  }
}

.preview-error {
  color: var(--edu-danger-500);
}

.preview-frame {
  width: 100%;
  height: 400px;
  border: none;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.resource-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--edu-primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.resource-info p {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.instructions-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--edu-text-primary);

  :deep(p) {
    margin: 0 0 12px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.description-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--edu-text-primary);

  :deep(p) {
    margin: 0 0 12px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(ul), :deep(ol) {
    margin: 12px 0;
    padding-left: 24px;
  }

  :deep(li) {
    margin-bottom: 6px;
  }
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
}

.attachment-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--edu-primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--edu-text-primary);
  display: block;
  margin-bottom: 2px;
}

.attachment-size {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.objective-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
}

.objective-item .el-icon {
  color: var(--edu-success-500);
  font-size: 16px;
  flex-shrink: 0;
}

.criteria-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.criterion-item {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
}

.criterion-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.criterion-weight {
  font-size: 14px;
  color: var(--edu-primary-600);
  font-weight: 500;
  margin-bottom: 6px;
}

.criterion-description {
  font-size: 14px;
  color: var(--edu-text-secondary);
  line-height: 1.5;
}

// 响应式设计
@media (max-width: 768px) {
  .activity-drawer-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
  }

  .activity-actions {
    margin-left: 0;
    width: 100%;
  }

  .activity-actions .el-button {
    width: 100%;
  }

  .activity-drawer-content {
    padding: 20px;
    gap: 24px;
  }

  .resource-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .preview-frame {
    height: 300px;
  }
}
</style>