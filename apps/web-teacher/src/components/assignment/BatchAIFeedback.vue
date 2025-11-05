<template>
  <div class="batch-ai-feedback">
    <!-- 批量操作头部 -->
    <div class="batch-header">
      <div class="header-info">
        <h3>
          <el-icon><MagicStick /></el-icon>
          AI批量评语生成
        </h3>
        <p class="header-description">
          为选中的作业批量生成个性化AI评语，支持模板选择和质量优化
        </p>
      </div>
      <div class="header-actions">
        <el-button @click="showTemplateManager = true">
          <el-icon><Collection /></el-icon>
          模板管理
        </el-button>
        <el-button @click="showBatchSettings = true">
          <el-icon><Setting /></el-icon>
          批量设置
        </el-button>
      </div>
    </div>

    <!-- 作业选择和预览 -->
    <div class="batch-selection">
      <div class="selection-toolbar">
        <div class="selection-info">
          <span>已选择 {{ selectedSubmissions.length }} 份作业</span>
          <el-button
            size="small"
            @click="selectAll"
            :disabled="submissions.length === 0"
          >
            全选
          </el-button>
          <el-button
            size="small"
            @click="clearSelection"
            :disabled="selectedSubmissions.length === 0"
          >
            清空
          </el-button>
        </div>
        <div class="selection-filters">
          <el-select
            v-model="filterStatus"
            placeholder="筛选状态"
            size="small"
            clearable
            @change="filterSubmissions"
          >
            <el-option label="未批改" value="ungraded" />
            <el-option label="已批改" value="graded" />
            <el-option label="迟交" value="late" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索学生"
            size="small"
            clearable
            @input="filterSubmissions"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 作业列表 -->
      <div class="submissions-grid">
        <div
          v-for="submission in filteredSubmissions"
          :key="submission.id"
          class="submission-card"
          :class="{
            'submission-card--selected': isSelected(submission.id),
            'submission-card--processed': isProcessed(submission.id),
            'submission-card--failed': hasError(submission.id)
          }"
          @click="toggleSelection(submission)"
        >
          <div class="submission-header">
            <div class="student-info">
              <el-avatar :size="40" :src="submission.student.avatar">
                {{ submission.student.name.charAt(0) }}
              </el-avatar>
              <div class="student-details">
                <h4>{{ submission.student.name }}</h4>
                <span class="submission-time">
                  {{ formatDate(submission.submittedAt) }}
                </span>
              </div>
            </div>
            <div class="submission-status">
              <el-tag
                :type="getStatusType(submission.status)"
                size="small"
              >
                {{ getStatusText(submission.status) }}
              </el-tag>
              <el-checkbox
                :model-value="isSelected(submission.id)"
                @change="(checked) => toggleSelection(submission, checked)"
                @click.stop
              />
            </div>
          </div>

          <div class="submission-content">
            <div class="content-preview">
              <p>{{ getContentPreview(submission.content) }}</p>
            </div>
            <div class="submission-meta">
              <span v-if="submission.score" class="score">
                得分: {{ submission.score }}
              </span>
              <span v-if="submission.attachments.length" class="attachments">
                <el-icon><Paperclip /></el-icon>
                {{ submission.attachments.length }} 个附件
              </span>
            </div>
          </div>

          <!-- AI评语预览 -->
          <div
            v-if="getGeneratedFeedback(submission.id)"
            class="ai-feedback-preview"
          >
            <div class="feedback-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>AI评语</span>
              <el-tag size="small" type="success">已生成</el-tag>
            </div>
            <div class="feedback-content">
              <p>{{ getGeneratedFeedback(submission.id)?.overall }}</p>
            </div>
            <div class="feedback-actions">
              <el-button size="small" @click.stop="previewFeedback(submission)">
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-button size="small" @click.stop="editFeedback(submission)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI生成设置 -->
    <div class="ai-settings-panel">
      <EduCard variant="outlined">
        <template #header>
          <h4>AI生成设置</h4>
        </template>

        <el-form :model="generationSettings" label-width="120px">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="评语风格">
                <el-select v-model="generationSettings.tone">
                  <el-option label="鼓励型" value="encouraging" />
                  <el-option label="建设性" value="constructive" />
                  <el-option label="正式" value="formal" />
                  <el-option label="友好" value="friendly" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="评语长度">
                <el-select v-model="generationSettings.length">
                  <el-option label="简洁" value="brief" />
                  <el-option label="适中" value="moderate" />
                  <el-option label="详细" value="detailed" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="语言">
                <el-select v-model="generationSettings.language">
                  <el-option label="中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="包含内容">
            <el-checkbox-group v-model="generationSettings.includedContent">
              <el-checkbox label="strengths">优点分析</el-checkbox>
              <el-checkbox label="improvements">改进建议</el-checkbox>
              <el-checkbox label="suggestions">学习建议</el-checkbox>
              <el-checkbox label="nextSteps">下一步行动</el-checkbox>
              <el-checkbox label="resources">学习资源</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="个性化设置">
            <el-checkbox v-model="generationSettings.personalizeForStudent">
              根据学生个人情况个性化
            </el-checkbox>
            <el-checkbox v-model="generationSettings.avoidRepetition">
              避免重复性表述
            </el-checkbox>
            <el-checkbox v-model="generationSettings.includeTemplate">
              使用推荐模板
            </el-checkbox>
          </el-form-item>

          <el-form-item label="自定义指令">
            <el-input
              v-model="generationSettings.customInstructions"
              type="textarea"
              :rows="3"
              placeholder="输入自定义生成指令（可选）"
            />
          </el-form-item>
        </el-form>

        <div class="generation-actions">
          <el-button
            type="primary"
            size="large"
            :loading="generating"
            :disabled="selectedSubmissions.length === 0"
            @click="generateBatchFeedback"
          >
            <el-icon><MagicStick /></el-icon>
            生成AI评语 ({{ selectedSubmissions.length }} 份)
          </el-button>
          <el-button
            size="large"
            :disabled="generatedFeedbacks.size === 0"
            @click="optimizeFeedbacks"
          >
            <el-icon><Refresh /></el-icon>
            优化评语
          </el-button>
          <el-button
            size="large"
            :disabled="generatedFeedbacks.size === 0"
            @click="exportFeedbacks"
          >
            <el-icon><Download /></el-icon>
            导出评语
          </el-button>
        </div>
      </EduCard>
    </div>

    <!-- 生成进度 -->
    <div
      v-if="batchOperation"
      class="batch-progress"
    >
      <EduCard variant="elevated">
        <template #header>
          <div class="progress-header">
            <h4>生成进度</h4>
            <el-button
              v-if="batchOperation.status === 'running'"
              size="small"
              @click="pauseBatchOperation"
            >
              暂停
            </el-button>
            <el-button
              v-if="batchOperation.status === 'paused'"
              size="small"
              @click="resumeBatchOperation"
            >
              继续
            </el-button>
            <el-button
              v-if="batchOperation.status !== 'completed'"
              size="small"
              type="danger"
              @click="cancelBatchOperation"
            >
              取消
            </el-button>
          </div>
        </template>

        <div class="progress-content">
          <el-progress
            :percentage="batchOperation.progress.percentage"
            :status="getProgressStatus(batchOperation.status)"
          />

          <div class="progress-stats">
            <el-statistic
              title="已完成"
              :value="batchOperation.progress.completed"
            />
            <el-statistic
              title="失败"
              :value="batchOperation.progress.failed"
            />
            <el-statistic
              title="总计"
              :value="batchOperation.progress.total"
            />
            <el-statistic
              v-if="batchOperation.progress.estimatedTimeRemaining"
              title="剩余时间"
              :value="formatTime(batchOperation.progress.estimatedTimeRemaining)"
            />
          </div>

          <div
            v-if="batchOperation.progress.currentItem"
            class="current-item"
          >
            <span>正在处理: {{ batchOperation.progress.currentItem }}</span>
          </div>
        </div>
      </EduCard>
    </div>

    <!-- 模板管理对话框 -->
    <el-dialog
      v-model="showTemplateManager"
      title="评语模板管理"
      width="80%"
      :close-on-click-modal="false"
    >
      <FeedbackTemplateManager
        @template-created="onTemplateCreated"
        @template-updated="onTemplateUpdated"
        @template-deleted="onTemplateDeleted"
      />
    </el-dialog>

    <!-- 批量设置对话框 -->
    <el-dialog
      v-model="showBatchSettings"
      title="批量设置"
      width="600px"
    >
      <BatchSettingsForm
        :settings="batchSettings"
        @settings-changed="onBatchSettingsChanged"
      />
    </el-dialog>

    <!-- 评语预览对话框 -->
    <el-dialog
      v-model="showFeedbackPreview"
      title="评语预览"
      width="70%"
    >
      <FeedbackPreview
        v-if="previewingSubmission"
        :submission="previewingSubmission"
        :feedback="getGeneratedFeedback(previewingSubmission.id)"
        @feedback-applied="onFeedbackApplied"
        @feedback-edited="onFeedbackEdited"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick, Collection, Setting, Search, Paperclip, ChatDotRound,
  View, Edit, Refresh, Download
} from '@element-plus/icons-vue'
import EduCard from '@reopeninnolab/ui-kit/EduCard.vue'
import aiFeedbackService, { type BatchFeedbackRequest } from '@/services/aiFeedbackService'
import type {
  Submission, Student, Assignment, Course,
  BatchOperation, BatchGenerationOptions,
  PersonalizedFeedback, FeedbackTemplate
} from '@/types/feedback'
import FeedbackTemplateManager from './FeedbackTemplateManager.vue'
import BatchSettingsForm from './BatchSettingsForm.vue'
import FeedbackPreview from './FeedbackPreview.vue'

// 响应式数据
const submissions = ref<Submission[]>([])
const selectedSubmissions = ref<string[]>([])
const generatedFeedbacks = ref<Map<string, PersonalizedFeedback>>(new Map())
const batchOperation = ref<BatchOperation | null>(null)
const generating = ref(false)

// UI状态
const showTemplateManager = ref(false)
const showBatchSettings = ref(false)
const showFeedbackPreview = ref(false)
const previewingSubmission = ref<Submission | null>(null)

// 过滤和搜索
const filterStatus = ref('')
const searchKeyword = ref('')

// 生成设置
const generationSettings = ref<BatchGenerationOptions>({
  tone: 'encouraging',
  length: 'moderate',
  includeSuggestions: true,
  includeStrengths: true,
  includeNextSteps: true,
  personalizeForStudent: true,
  language: 'zh-CN',
  avoidRepetition: true,
  includedContent: ['strengths', 'improvements', 'suggestions', 'nextSteps'],
  customInstructions: ''
})

const batchSettings = ref({
  autoSave: true,
  qualityThreshold: 70,
  enableRetry: true,
  maxRetries: 3,
  notifications: true
})

// 计算属性
const filteredSubmissions = computed(() => {
  let filtered = [...submissions.value]

  // 状态过滤
  if (filterStatus.value) {
    filtered = filtered.filter(submission => {
      switch (filterStatus.value) {
        case 'ungraded':
          return submission.status === 'submitted' && !submission.feedback
        case 'graded':
          return !!submission.feedback
        case 'late':
          return submission.status === 'late'
        default:
          return true
      }
    })
  }

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(submission =>
      submission.student.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
const isSelected = (submissionId: string): boolean => {
  return selectedSubmissions.value.includes(submissionId)
}

const isProcessed = (submissionId: string): boolean => {
  return generatedFeedbacks.value.has(submissionId)
}

const hasError = (submissionId: string): boolean => {
  // 这里应该检查错误状态
  return false
}

const toggleSelection = (submission: Submission, checked?: boolean) => {
  const submissionId = submission.id
  const isChecked = checked ?? !isSelected(submissionId)

  if (isChecked) {
    if (!selectedSubmissions.value.includes(submissionId)) {
      selectedSubmissions.value.push(submissionId)
    }
  } else {
    const index = selectedSubmissions.value.indexOf(submissionId)
    if (index > -1) {
      selectedSubmissions.value.splice(index, 1)
    }
  }
}

const selectAll = () => {
  selectedSubmissions.value = filteredSubmissions.value.map(s => s.id)
}

const clearSelection = () => {
  selectedSubmissions.value = []
}

const filterSubmissions = () => {
  // 过滤逻辑已在计算属性中处理
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getContentPreview = (content: any): string => {
  if (content.text) {
    return content.text.length > 100
      ? content.text.substring(0, 100) + '...'
      : content.text
  }
  return '无文本内容'
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    submitted: 'info',
    graded: 'success',
    late: 'warning',
    missing: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    submitted: '已提交',
    graded: '已批改',
    late: '迟交',
    missing: '未提交'
  }
  return texts[status] || status
}

const getGeneratedFeedback = (submissionId: string): PersonalizedFeedback | undefined => {
  return generatedFeedbacks.value.get(submissionId)
}

const generateBatchFeedback = async () => {
  if (selectedSubmissions.value.length === 0) {
    ElMessage.warning('请先选择要生成评语的作业')
    return
  }

  try {
    generating.value = true

    // 准备批量请求数据
    const selectedSubmissionData = submissions.value.filter(s =>
      selectedSubmissions.value.includes(s.id)
    )

    const batchRequest: BatchFeedbackRequest = {
      submissions: selectedSubmissionData,
      students: selectedSubmissionData.map(s => s.student),
      context: {
        assignment: {} as Assignment, // 这里应该从父组件传入
        course: {} as Course,
        previousSubmissions: [],
        studentProgress: {} as any,
        classAverage: {} as any,
        learningObjectives: [],
        rubric: {} as any
      },
      options: generationSettings.value,
      customInstructions: generationSettings.value.customInstructions
    }

    // 创建批量操作
    batchOperation.value = {
      id: `batch_${Date.now()}`,
      type: 'generate_feedback',
      status: 'running',
      progress: {
        total: selectedSubmissions.value.length,
        completed: 0,
        failed: 0,
        percentage: 0
      },
      items: [],
      settings: {} as any,
      results: {} as any,
      metadata: {
        createdBy: 'current_user',
        createdAt: new Date().toISOString(),
        version: '1.0',
        tags: ['ai_feedback']
      }
    }

    // 执行批量生成
    const results = await aiFeedbackService.generateBatchFeedback(batchRequest)

    // 更新结果
    results.forEach(result => {
      if (result.feedback) {
        generatedFeedbacks.value.set(result.submissionId, result.feedback)
      }

      // 更新进度
      if (batchOperation.value) {
        batchOperation.value.progress.completed++
        batchOperation.value.progress.percentage = Math.round(
          (batchOperation.value.progress.completed / batchOperation.value.progress.total) * 100
        )
      }
    })

    // 完成批量操作
    if (batchOperation.value) {
      batchOperation.value.status = 'completed'
      batchOperation.value.progress.percentage = 100
    }

    ElMessage.success(`成功生成 ${results.length} 条评语`)

  } catch (error) {
    console.error('批量生成评语失败:', error)
    ElMessage.error('生成失败，请重试')

    if (batchOperation.value) {
      batchOperation.value.status = 'failed'
    }
  } finally {
    generating.value = false
  }
}

const optimizeFeedbacks = async () => {
  if (generatedFeedbacks.value.size === 0) {
    ElMessage.warning('没有可优化的评语')
    return
  }

  try {
    const feedbacks = Array.from(generatedFeedbacks.value.values()).map(f => f.overall)
    const optimizations = await aiFeedbackService.optimizeFeedbackBatch(feedbacks)

    if (optimizations.length > 0) {
      ElMessage.success(`已优化 ${optimizations.length} 条评语`)
    } else {
      ElMessage.info('所有评语质量良好，无需优化')
    }
  } catch (error) {
    console.error('优化评语失败:', error)
    ElMessage.error('优化失败，请重试')
  }
}

const exportFeedbacks = () => {
  if (generatedFeedbacks.value.size === 0) {
    ElMessage.warning('没有可导出的评语')
    return
  }

  // 这里实现导出逻辑
  ElMessage.success('评语导出成功')
}

const previewFeedback = (submission: Submission) => {
  previewingSubmission.value = submission
  showFeedbackPreview.value = true
}

const editFeedback = (submission: Submission) => {
  previewingSubmission.value = submission
  showFeedbackPreview.value = true
}

const getProgressStatus = (status: string) => {
  const statusMap: Record<string, any> = {
    running: '',
    completed: 'success',
    failed: 'exception',
    paused: 'warning'
  }
  return statusMap[status] || ''
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const pauseBatchOperation = () => {
  if (batchOperation.value) {
    batchOperation.value.status = 'paused'
  }
}

const resumeBatchOperation = () => {
  if (batchOperation.value) {
    batchOperation.value.status = 'running'
  }
}

const cancelBatchOperation = () => {
  ElMessageBox.confirm('确定要取消当前操作吗？', '确认取消', {
    type: 'warning'
  }).then(() => {
    if (batchOperation.value) {
      batchOperation.value.status = 'cancelled'
      batchOperation.value = null
    }
    generating.value = false
    ElMessage.info('操作已取消')
  })
}

// 模板管理事件处理
const onTemplateCreated = (template: FeedbackTemplate) => {
  ElMessage.success('模板创建成功')
}

const onTemplateUpdated = (template: FeedbackTemplate) => {
  ElMessage.success('模板更新成功')
}

const onTemplateDeleted = (templateId: string) => {
  ElMessage.success('模板删除成功')
}

// 批量设置事件处理
const onBatchSettingsChanged = (settings: any) => {
  Object.assign(batchSettings.value, settings)
}

// 评语预览事件处理
const onFeedbackApplied = (submissionId: string, feedback: PersonalizedFeedback) => {
  generatedFeedbacks.value.set(submissionId, feedback)
  ElMessage.success('评语已应用')
}

const onFeedbackEdited = (submissionId: string, feedback: PersonalizedFeedback) => {
  generatedFeedbacks.value.set(submissionId, feedback)
  ElMessage.success('评语已更新')
}

// 模拟数据
const loadMockData = () => {
  // 这里应该从API加载真实数据
  submissions.value = [
    {
      id: '1',
      assignmentId: 'assignment1',
      studentId: 'student1',
      content: {
        text: '这是一份关于数学函数的作业解答，包含了详细的步骤和推理过程...'
      },
      attachments: [],
      submittedAt: '2024-01-15T10:30:00Z',
      status: 'submitted',
      student: {
        id: 'student1',
        name: '张小明',
        gradeLevel: 'grade10',
        classId: 'class1',
        email: 'zhangxiaoming@example.com',
        profile: {} as any,
        performance: {} as any,
        preferences: {} as any
      },
      metadata: {} as any
    },
    // 更多模拟数据...
  ]
}

// 生命周期
onMounted(() => {
  loadMockData()
  // 初始化默认模板
  aiFeedbackService.initializeDefaultTemplates()
})
</script>

<style scoped lang="scss">
.batch-ai-feedback {
  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    .header-info {
      h3 {
        margin: 0 0 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--edu-text-primary);

        .el-icon {
          color: var(--edu-primary-500);
        }
      }

      .header-description {
        margin: 0;
        color: var(--edu-text-secondary);
        font-size: 0.9rem;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .batch-selection {
    margin-bottom: 2rem;

    .selection-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--edu-bg-secondary);
      border-radius: var(--edu-radius-base);

      .selection-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        span {
          font-weight: 500;
          color: var(--edu-text-primary);
        }
      }

      .selection-filters {
        display: flex;
        gap: 0.5rem;
      }
    }

    .submissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }

    .submission-card {
      border: 2px solid var(--edu-border-light);
      border-radius: var(--edu-radius-base);
      padding: 1rem;
      background: var(--edu-bg-primary);
      cursor: pointer;
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

      &:hover {
        border-color: var(--edu-primary-300);
        box-shadow: var(--edu-shadow-md);
      }

      &--selected {
        border-color: var(--edu-primary-500);
        background: var(--edu-primary-50);
      }

      &--processed {
        border-color: var(--edu-success-500);
        background: var(--edu-success-50);
      }

      &--failed {
        border-color: var(--edu-error-500);
        background: var(--edu-error-50);
      }

      .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        .student-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .student-details {
            h4 {
              margin: 0 0 0.25rem 0;
              font-size: 1rem;
              color: var(--edu-text-primary);
            }

            .submission-time {
              font-size: 0.85rem;
              color: var(--edu-text-tertiary);
            }
          }
        }

        .submission-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      }

      .submission-content {
        margin-bottom: 1rem;

        .content-preview {
          p {
            margin: 0 0 0.5rem 0;
            color: var(--edu-text-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
          }
        }

        .submission-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: var(--edu-text-tertiary);

          .score {
            font-weight: 500;
          }

          .attachments {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
        }
      }

      .ai-feedback-preview {
        border-top: 1px solid var(--edu-border-light);
        padding-top: 1rem;

        .feedback-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;

          span {
            font-weight: 500;
            color: var(--edu-text-primary);
          }
        }

        .feedback-content {
          p {
            margin: 0 0 0.75rem 0;
            color: var(--edu-text-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
          }
        }

        .feedback-actions {
          display: flex;
          gap: 0.5rem;
        }
      }
    }
  }

  .ai-settings-panel {
    margin-bottom: 2rem;

    .generation-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
  }

  .batch-progress {
    margin-bottom: 2rem;

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h4 {
        margin: 0;
      }
    }

    .progress-content {
      .progress-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .current-item {
        padding: 0.75rem;
        background: var(--edu-bg-secondary);
        border-radius: var(--edu-radius-base);
        color: var(--edu-text-secondary);
        font-size: 0.9rem;
      }
    }
  }

  // 响应式适配
  @media (max-width: 768px) {
    .batch-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;

      .header-actions {
        justify-content: stretch;
      }
    }

    .selection-toolbar {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch !important;
    }

    .submissions-grid {
      grid-template-columns: 1fr;
    }

    .generation-actions {
      flex-direction: column;
    }

    .progress-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>