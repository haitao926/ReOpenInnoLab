<template>
  <div class="ai-course-workflow">
    <!-- 工作流头部 -->
    <header class="workflow-header">
      <div class="workflow-title-section">
        <h2 class="workflow-title">AI 课程工作流</h2>
        <p class="workflow-subtitle">智能化课程创建与管理流程</p>
      </div>
      <div class="workflow-actions">
        <el-button type="primary" @click="startNewWorkflow" :loading="isCreating">
          <el-icon><Plus /></el-icon>
          创建新工作流
        </el-button>
      </div>
    </header>

    <!-- 工作流步骤导航 -->
    <nav class="workflow-steps" role="navigation" aria-label="工作流步骤">
      <ol class="steps-list">
        <li
          v-for="(step, index) in workflowSteps"
          :key="step.id"
          :class="[
            'step-item',
            {
              'step-item--active': currentStep === index,
              'step-item--completed': index < currentStep,
              'step-item--disabled': index > currentStep + 1
            }
          ]"
        >
          <button
            class="step-button"
            @click="navigateToStep(index)"
            :disabled="index > currentStep + 1"
            :aria-current="currentStep === index ? 'step' : undefined"
            :aria-label="`步骤 ${index + 1}: ${step.title}${
              index > currentStep + 1 ? '（未解锁）' : ''
            }`"
          >
            <span class="step-number">{{ index + 1 }}</span>
            <span class="step-title">{{ step.title }}</span>
            <el-icon v-if="index < currentStep" class="step-check"><Check /></el-icon>
          </button>
        </li>
      </ol>
    </nav>

    <!-- 工作流内容区域 -->
    <main class="workflow-content" role="main">
      <component
        :is="currentStepComponent"
        :key="currentStep"
        v-bind="currentStepProps"
        @next="handleStepNext"
        @previous="handleStepPrevious"
        @complete="handleWorkflowComplete"
        @save="handleStepSave"
      />
    </main>

    <!-- 工作流进度 -->
    <footer class="workflow-footer">
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-text">整体进度</span>
          <span class="progress-percentage">{{ overallProgress }}%</span>
        </div>
        <el-progress
          :percentage="overallProgress"
          :stroke-width="8"
          :show-text="false"
          :color="progressColor"
        />
      </div>
      <div class="workflow-actions-footer">
        <el-button @click="saveWorkflow" :loading="isSaving">
          <el-icon><Document /></el-icon>
          保存草稿
        </el-button>
        <el-button @click="previewWorkflow" :disabled="!canPreview">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button
          type="primary"
          @click="publishWorkflow"
          :loading="isPublishing"
          :disabled="!canPublish"
        >
          <el-icon><Upload /></el-icon>
          发布课程
        </el-button>
      </div>
    </footer>

    <!-- AI 助手浮动窗口 -->
    <AIAssistantFloat
      v-if="showAIAssistant"
      :context="aiContext"
      @suggestion-applied="handleAISuggestionApplied"
      @close="hideAIAssistant"
    />

    <!-- 工作流保存确认对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="保存工作流"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="save-dialog-content">
        <el-form ref="saveFormRef" :model="saveForm" :rules="saveRules" label-width="100px">
          <el-form-item label="工作流名称" prop="name">
            <el-input v-model="saveForm.name" placeholder="请输入工作流名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="saveForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入工作流描述"
            />
          </el-form-item>
          <el-form-item label="标签">
            <el-select
              v-model="saveForm.tags"
              multiple
              filterable
              allow-create
              placeholder="添加标签"
              style="width: 100%"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSave" :loading="isSaving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Check,
  Document,
  View,
  Upload,
  MagicStick
} from '@element-plus/icons-vue'

import AIAssistantFloat from './AIAssistantFloat.vue'
import CourseBasicInfoStep from './workflow-steps/CourseBasicInfoStep.vue'
import CurriculumDesignStep from './workflow-steps/CurriculumDesignStep.vue'
import ResourcePreparationStep from './workflow-steps/ResourcePreparationStep.vue'
import AssessmentDesignStep from './workflow-steps/AssessmentDesignStep.vue'
import ReviewPublishStep from './workflow-steps/ReviewPublishStep.vue'

interface WorkflowStep {
  id: string
  title: string
  description: string
  component: string
  estimatedTime: string
  required: boolean
}

interface WorkflowData {
  basicInfo: any
  curriculum: any
  resources: any
  assessments: any
  review: any
}

interface SaveForm {
  name: string
  description: string
  tags: string[]
}

const props = defineProps<{
  initialStep?: number
  workflowData?: Partial<WorkflowData>
}>()

const emit = defineEmits<{
  'workflow-created': [data: WorkflowData]
  'workflow-updated': [data: WorkflowData]
  'step-changed': [step: number]
}>()

// 工作流步骤定义
const workflowSteps = ref<WorkflowStep[]>([
  {
    id: 'basic-info',
    title: '基本信息',
    description: '设置课程基本信息、目标和受众',
    component: 'CourseBasicInfoStep',
    estimatedTime: '5-10分钟',
    required: true
  },
  {
    id: 'curriculum',
    title: '课程设计',
    description: '设计课程大纲、教学目标和进度安排',
    component: 'CurriculumDesignStep',
    estimatedTime: '15-20分钟',
    required: true
  },
  {
    id: 'resources',
    title: '资源准备',
    description: '准备教学材料、课件和参考资源',
    component: 'ResourcePreparationStep',
    estimatedTime: '10-15分钟',
    required: false
  },
  {
    id: 'assessments',
    title: '评估设计',
    description: '设计作业、测验和考核方式',
    component: 'AssessmentDesignStep',
    estimatedTime: '10-15分钟',
    required: true
  },
  {
    id: 'review',
    title: '审核发布',
    description: '审核课程内容并发布',
    component: 'ReviewPublishStep',
    estimatedTime: '5-10分钟',
    required: true
  }
])

// 响应式数据
const currentStep = ref(props.initialStep || 0)
const workflowData = ref<WorkflowData>({
  basicInfo: {},
  curriculum: {},
  resources: {},
  assessments: {},
  review: {},
  ...props.workflowData
})

const isCreating = ref(false)
const isSaving = ref(false)
const isPublishing = ref(false)
const showAIAssistant = ref(false)
const showSaveDialog = ref(false)

const saveForm = ref<SaveForm>({
  name: '',
  description: '',
  tags: []
})

const availableTags = ref([
  '数学',
  '物理',
  '化学',
  '生物',
  '语文',
  '英语',
  '历史',
  '地理',
  '信息技术',
  'AI辅助',
  '实验课程',
  '理论基础'
])

// 计算属性
const currentStepComponent = computed(() => {
  const step = workflowSteps.value[currentStep.value]
  switch (step.component) {
    case 'CourseBasicInfoStep':
      return CourseBasicInfoStep
    case 'CurriculumDesignStep':
      return CurriculumDesignStep
    case 'ResourcePreparationStep':
      return ResourcePreparationStep
    case 'AssessmentDesignStep':
      return AssessmentDesignStep
    case 'ReviewPublishStep':
      return ReviewPublishStep
    default:
      return CourseBasicInfoStep
  }
})

const currentStepProps = computed(() => {
  const step = workflowSteps.value[currentStep.value]
  return {
    stepData: workflowData.value[step.id as keyof WorkflowData],
    isLastStep: currentStep.value === workflowSteps.value.length - 1,
    isFirstStep: currentStep.value === 0
  }
})

const overallProgress = computed(() => {
  return Math.round(((currentStep.value + 1) / workflowSteps.value.length) * 100)
})

const progressColor = computed(() => {
  if (overallProgress.value < 33) return '#f56c6c'
  if (overallProgress.value < 66) return '#e6a23c'
  return '#67c23a'
})

const canPreview = computed(() => {
  return currentStep.value > 0 && Object.values(workflowData.value).some(data => Object.keys(data).length > 0)
})

const canPublish = computed(() => {
  const requiredSteps = workflowSteps.value.filter(step => step.required)
  return requiredSteps.every(step => {
    const stepData = workflowData.value[step.id as keyof WorkflowData]
    return stepData && Object.keys(stepData).length > 0
  })
})

const aiContext = computed(() => ({
  currentStep: workflowSteps.value[currentStep.value].id,
  stepData: workflowData.value[workflowSteps.value[currentStep.value].id as keyof WorkflowData],
  overallProgress: overallProgress.value,
  workflowType: 'course-creation'
}))

// 表单验证规则
const saveRules = {
  name: [
    { required: true, message: '请输入工作流名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 方法
const startNewWorkflow = () => {
  ElMessageBox.confirm(
    '创建新的工作流将清除当前的数据，是否继续？',
    '确认创建',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    resetWorkflow()
    showAIAssistant.value = true
    ElMessage.success('新工作流已创建')
  }).catch(() => {
    // 用户取消
  })
}

const resetWorkflow = () => {
  currentStep.value = 0
  workflowData.value = {
    basicInfo: {},
    curriculum: {},
    resources: {},
    assessments: {},
    review: {}
  }
}

const navigateToStep = (stepIndex: number) => {
  if (stepIndex <= currentStep.value + 1) {
    currentStep.value = stepIndex
    emit('step-changed', stepIndex)
  }
}

const handleStepNext = () => {
  if (currentStep.value < workflowSteps.value.length - 1) {
    currentStep.value++
    emit('step-changed', currentStep.value)
    ElMessage.success(`进入${workflowSteps.value[currentStep.value].title}步骤`)
  }
}

const handleStepPrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('step-changed', currentStep.value)
  }
}

const handleStepSave = (stepData: any) => {
  const currentStepId = workflowSteps.value[currentStep.value].id
  workflowData.value[currentStepId as keyof WorkflowData] = stepData
  emit('workflow-updated', workflowData.value)
}

const handleWorkflowComplete = (finalData: any) => {
  workflowData.value = { ...workflowData.value, ...finalData }
  ElMessage.success('工作流已完成！')
  emit('workflow-created', workflowData.value)
}

const saveWorkflow = () => {
  showSaveDialog.value = true
  if (!saveForm.value.name) {
    saveForm.value.name = `课程工作流_${new Date().toLocaleDateString()}`
  }
}

const confirmSave = async () => {
  try {
    isSaving.value = true
    // 模拟保存 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    ElMessage.success('工作流已保存')
    showSaveDialog.value = false
    emit('workflow-updated', workflowData.value)
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

const previewWorkflow = () => {
  // 实现预览功能
  ElMessage.info('预览功能开发中...')
}

const publishWorkflow = async () => {
  try {
    isPublishing.value = true

    // 模拟发布 API 调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success('课程已成功发布！')
    emit('workflow-created', workflowData.value)
  } catch (error) {
    ElMessage.error('发布失败，请重试')
  } finally {
    isPublishing.value = false
  }
}

const handleAISuggestionApplied = (suggestion: any) => {
  ElMessage.success('AI 建议已应用')
  // 根据建议类型应用到相应的步骤数据
}

const hideAIAssistant = () => {
  showAIAssistant.value = false
}

// 监听步骤变化
watch(currentStep, (newStep) => {
  // 可以在这里添加步骤变化的逻辑
})
</script>

<style scoped lang="scss">
.ai-course-workflow {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--edu-bg-primary);
  border-radius: var(--density-radius-lg);
  overflow: hidden;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--density-padding-lg);
  background: linear-gradient(135deg, var(--edu-primary-50) 0%, var(--edu-secondary-50) 100%);
  border-bottom: 1px solid var(--edu-border-light);
}

.workflow-title-section {
  flex: 1;
}

.workflow-title {
  margin: 0 0 var(--density-spacing-sm) 0;
  font-size: var(--density-font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.workflow-subtitle {
  margin: 0;
  font-size: var(--density-font-size-base);
  color: var(--edu-text-secondary);
}

.workflow-actions {
  display: flex;
  gap: var(--density-spacing-sm);
}

.workflow-steps {
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
  padding: var(--density-padding-lg) var(--density-padding-xl);
}

.steps-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--density-spacing-lg);
  overflow-x: auto;
}

.step-item {
  flex: 1;
  min-width: 150px;
}

.step-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--density-spacing-sm);
  width: 100%;
  padding: var(--density-padding-base);
  background: transparent;
  border: 2px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  cursor: pointer;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
  position: relative;

  &:hover:not(:disabled) {
    border-color: var(--edu-primary-300);
    background: var(--edu-primary-50);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.step-item--active .step-button {
  border-color: var(--edu-primary-500);
  background: var(--edu-primary-100);
  color: var(--edu-primary-700);
}

.step-item--completed .step-button {
  border-color: var(--edu-success-500);
  background: var(--edu-success-50);
  color: var(--edu-success-700);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--edu-bg-primary);
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--density-font-size-sm);
}

.step-item--active .step-number {
  background: var(--edu-primary-500);
  color: white;
  border-color: var(--edu-primary-500);
}

.step-item--completed .step-number {
  background: var(--edu-success-500);
  color: white;
  border-color: var(--edu-success-500);
}

.step-title {
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
  line-height: var(--density-line-height-tight);
}

.step-check {
  position: absolute;
  top: var(--density-spacing-xs);
  right: var(--density-spacing-xs);
  color: var(--edu-success-500);
  font-size: 16px;
}

.workflow-content {
  flex: 1;
  padding: var(--density-padding-xl);
  overflow-y: auto;
}

.workflow-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--density-padding-lg) var(--density-padding-xl);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
  gap: var(--density-spacing-lg);
}

.progress-section {
  flex: 1;
  max-width: 300px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--density-spacing-sm);
}

.progress-text {
  font-size: var(--density-font-size-sm);
  color: var(--edu-text-secondary);
}

.progress-percentage {
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.workflow-actions-footer {
  display: flex;
  gap: var(--density-spacing-sm);
}

.save-dialog-content {
  padding: var(--density-spacing-base) 0;
}

// 响应式适配
@media (max-width: 768px) {
  .workflow-header {
    flex-direction: column;
    gap: var(--density-spacing-base);
    align-items: stretch;
  }

  .workflow-actions {
    justify-content: stretch;
  }

  .steps-list {
    flex-direction: column;
    gap: var(--density-spacing-base);
  }

  .step-item {
    min-width: auto;
  }

  .workflow-footer {
    flex-direction: column;
    gap: var(--density-spacing-base);
    align-items: stretch;
  }

  .progress-section {
    max-width: none;
  }

  .workflow-actions-footer {
    flex-direction: column;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .workflow-header {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(82, 196, 26, 0.1) 100%);
  }

  .workflow-steps,
  .workflow-footer {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .step-button,
  .workflow-footer,
  .workflow-header {
    transition: none;
  }
}
</style>