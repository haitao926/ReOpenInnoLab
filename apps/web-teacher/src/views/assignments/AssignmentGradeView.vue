<template>
  <div class="assignment-grade-view">
    <!-- 页面头部 -->
    <div class="grade-header">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/assignments" class="breadcrumb-link">作业管理</router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">批改作业</span>
        </div>
        <h1 class="page-title">{{ assignment?.title }}</h1>
        <div class="assignment-meta">
          <EduTag :variant="getSubjectVariant(assignment?.course.subject)" size="sm">
            {{ assignment?.course.name }}
          </EduTag>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {{ assignment?.student.name }}
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ formatDate(assignment?.submitTime) }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <EduButton variant="text" @click="previousAssignment" :disabled="!hasPrevious">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          上一份
        </EduButton>
        <EduButton variant="text" @click="nextAssignment" :disabled="!hasNext">
          下一份
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </EduButton>
        <EduButton variant="secondary" @click="saveDraft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存草稿
        </EduButton>
        <EduButton variant="primary" :loading="submitting" @click="submitGrade">
          提交评分
        </EduButton>
      </div>
    </div>

    <div class="grade-content">
      <!-- 左侧：作业内容 -->
      <div class="assignment-content">
        <EduCard title="作业内容" variant="default" class="content-card">
          <div class="assignment-details">
            <div class="detail-section">
              <h3 class="section-title">作业要求</h3>
              <div class="requirement-content">
                <p>{{ assignment?.description }}</p>
                <div class="requirement-meta">
                  <div class="meta-item">
                    <span class="meta-label">作业类型：</span>
                    <span>{{ getTypeName(assignment?.type) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">满分：</span>
                    <span>{{ assignment?.totalScore }}分</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">截止时间：</span>
                    <span>{{ formatDateTime(assignment?.dueDate) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3 class="section-title">学生提交内容</h3>
              <div class="submission-content">
                <!-- 文本内容 -->
                <div v-if="assignment?.submission.text" class="text-content">
                  <div class="text-body" v-html="formattedSubmissionText"></div>
                </div>

                <!-- 附件内容 -->
                <div v-if="assignment?.submission.attachments?.length" class="attachments-section">
                  <h4 class="attachments-title">附件文件</h4>
                  <div class="attachments-list">
                    <div
                      v-for="attachment in assignment?.submission.attachments"
                      :key="attachment.id"
                      class="attachment-item"
                    >
                      <div class="attachment-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div class="attachment-info">
                        <div class="attachment-name">{{ attachment.name }}</div>
                        <div class="attachment-meta">
                          {{ formatFileSize(attachment.size) }} · {{ formatDate(attachment.uploadTime) }}
                        </div>
                      </div>
                      <div class="attachment-actions">
                        <EduButton size="sm" variant="text" @click="downloadAttachment(attachment)">
                          下载
                        </EduButton>
                        <EduButton size="sm" variant="text" @click="previewAttachment(attachment)">
                          预览
                        </EduButton>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 图片内容 -->
                <div v-if="assignment?.submission.images?.length" class="images-section">
                  <h4 class="images-title">图片内容</h4>
                  <div class="images-grid">
                    <div
                      v-for="image in assignment?.submission.images"
                      :key="image.id"
                      class="image-item"
                      @click="viewImage(image)"
                    >
                      <img :src="image.url" :alt="image.description" />
                      <div class="image-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                          <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- AI建议 -->
        <EduCard title="AI批改建议" variant="elevated" class="ai-suggestions">
          <div class="ai-content">
            <div class="ai-header">
              <div class="ai-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 12h6m6 0h6"/>
                </svg>
              </div>
              <div class="ai-info">
                <div class="ai-title">智能分析结果</div>
                <div class="ai-subtitle">基于作业内容和评分标准的分析建议</div>
              </div>
              <EduButton size="sm" variant="text" @click="refreshAIAnalysis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                刷新分析
              </EduButton>
            </div>

            <div class="ai-analysis">
              <div class="analysis-section">
                <h4 class="analysis-title">内容分析</h4>
                <div class="analysis-content">
                  <div class="analysis-item">
                    <div class="analysis-label">完成度：</div>
                    <div class="analysis-value">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: '85%' }"></div>
                      </div>
                      <span class="progress-text">85%</span>
                    </div>
                  </div>
                  <div class="analysis-item">
                    <div class="analysis-label">内容质量：</div>
                    <div class="analysis-value analysis-value--good">良好</div>
                  </div>
                  <div class="analysis-item">
                    <div class="analysis-label">创新性：</div>
                    <div class="analysis-value analysis-value--medium">中等</div>
                  </div>
                </div>
              </div>

              <div class="analysis-section">
                <h4 class="analysis-title">评分建议</h4>
                <div class="score-suggestion">
                  <div class="suggested-score">
                    <span class="score-label">建议分数：</span>
                    <span class="score-value">82-88分</span>
                  </div>
                  <div class="score-reason">
                    <strong>评分依据：</strong>
                    内容完整，逻辑清晰，但部分细节可以进一步完善
                  </div>
                </div>
              </div>

              <div class="analysis-section">
                <h4 class="analysis-title">改进建议</h4>
                <div class="suggestions-list">
                  <div class="suggestion-item">
                    <div class="suggestion-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <div class="suggestion-text">
                      可以增加更多实际案例来支撑论点
                    </div>
                  </div>
                  <div class="suggestion-item">
                    <div class="suggestion-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    </div>
                    <div class="suggestion-text">
                      结论部分可以更加深入和具体
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EduCard>
      </div>

      <!-- 右侧：评分和反馈 -->
      <div class="grade-panel">
        <EduCard title="评分" variant="default" class="score-card">
          <div class="score-section">
            <div class="score-input-group">
              <label class="score-label">分数</label>
              <div class="score-input-wrapper">
                <EduInput
                  v-model.number="gradeData.score"
                  type="number"
                  :min="0"
                  :max="assignment?.totalScore"
                  placeholder="请输入分数"
                  class="score-input"
                />
                <span class="score-total">/ {{ assignment?.totalScore }}</span>
              </div>
              <div class="score-percentage">
                {{ scorePercentage }}%
              </div>
            </div>

            <!-- 评分细则 -->
            <div class="rubric-section">
              <h4 class="rubric-title">评分细则</h4>
              <div class="rubric-items">
                <div
                  v-for="rubric in rubricItems"
                  :key="rubric.id"
                  class="rubric-item"
                >
                  <div class="rubric-header">
                    <div class="rubric-name">{{ rubric.name }}</div>
                    <div class="rubric-weight">({{ rubric.weight }}%)</div>
                  </div>
                  <div class="rubric-score">
                    <EduInput
                      v-model.number="rubric.score"
                      type="number"
                      :min="0"
                      :max="rubric.maxScore"
                      size="sm"
                    />
                    <span class="rubric-max">/ {{ rubric.maxScore }}</span>
                  </div>
                  <div class="rubric-feedback">
                    <textarea
                      v-model="rubric.feedback"
                      placeholder="此项评分说明..."
                      class="rubric-textarea"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <EduCard title="反馈意见" variant="default" class="feedback-card">
          <div class="feedback-section">
            <!-- 快速反馈 -->
            <div class="quick-feedback">
              <h4 class="feedback-title">快速反馈</h4>
              <div class="feedback-tags">
                <div
                  v-for="tag in quickFeedbackTags"
                  :key="tag.id"
                  class="feedback-tag"
                  :class="{ 'feedback-tag--selected': selectedFeedbackTags.includes(tag.id) }"
                  @click="toggleFeedbackTag(tag)"
                >
                  {{ tag.text }}
                </div>
              </div>
            </div>

            <!-- 详细反馈 -->
            <div class="detailed-feedback">
              <h4 class="feedback-title">详细反馈</h4>
              <textarea
                v-model="gradeData.feedback"
                placeholder="请输入对学生的详细反馈意见..."
                class="feedback-textarea"
                rows="8"
              ></textarea>
              <div class="feedback-tools">
                <EduButton size="sm" variant="text" @click="insertFeedbackTemplate('positive')">
                  插入表扬模板
                </EduButton>
                <EduButton size="sm" variant="text" @click="insertFeedbackTemplate('improvement')">
                  插入改进建议
                </EduButton>
                <EduButton size="sm" variant="text" @click="insertFeedbackTemplate('conclusion')">
                  插入总结模板
                </EduButton>
              </div>
            </div>

            <!-- 语音反馈 -->
            <div class="voice-feedback">
              <h4 class="feedback-title">语音反馈</h4>
              <div class="voice-recorder">
                <EduButton
                  :variant="isRecording ? 'danger' : 'secondary'"
                  @click="toggleRecording"
                  class="record-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  {{ isRecording ? '停止录音' : '开始录音' }}
                </EduButton>
                <div v-if="recordingTime" class="recording-time">
                  {{ formatRecordingTime(recordingTime) }}
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 提交选项 -->
        <EduCard title="提交选项" variant="default" class="submit-card">
          <div class="submit-options">
            <div class="option-item">
              <label class="checkbox-label">
                <input
                  v-model="gradeData.sendNotification"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-text">向学生发送通知</span>
              </label>
            </div>
            <div class="option-item">
              <label class="checkbox-label">
                <input
                  v-model="gradeData.allowResubmit"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-text">允许重新提交</span>
              </label>
            </div>
            <div v-if="gradeData.allowResubmit" class="resubmit-options">
              <EduInput
                v-model="gradeData.resubmitDeadline"
                type="datetime-local"
                placeholder="重新提交截止时间"
              />
            </div>
          </div>
        </EduCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EduButton, EduInput, EduCard, EduTag } from '@reopeninnolab/ui-kit'
import { formatDate, formatDateTime } from '@/utils/date'

interface Assignment {
  id: string
  title: string
  description: string
  type: string
  totalScore: number
  course: {
    name: string
    subject: string
  }
  student: {
    name: string
    avatar: string
  }
  submitTime: Date
  dueDate: Date
  submission: {
    text?: string
    attachments?: Array<{
      id: string
      name: string
      size: number
      uploadTime: Date
    }>
    images?: Array<{
      id: string
      url: string
      description: string
    }>
  }
}

interface RubricItem {
  id: string
  name: string
  weight: number
  maxScore: number
  score: number
  feedback: string
}

interface FeedbackTag {
  id: string
  text: string
  category: 'positive' | 'improvement' | 'suggestion'
}

const route = useRoute()
const router = useRouter()

// 响应式数据
const assignment = ref<Assignment>({
  id: '1',
  title: '力学基础练习题',
  description: '完成第3章课后练习题，重点掌握牛顿运动定律的应用。包括概念理解题、计算题和综合应用题。',
  type: 'exercise',
  totalScore: 100,
  course: {
    name: '高中物理-力学',
    subject: 'physics'
  },
  student: {
    name: '张小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
  },
  submitTime: new Date('2024-03-15T14:30:00'),
  dueDate: new Date('2024-03-14T23:59:59'),
  submission: {
    text: `牛顿第一定律（惯性定律）：物体在不受外力作用时，总保持静止状态或匀速直线运动状态。

第一题分析：
题目描述的是一个静止在水平面上的物体，当受到推力作用时的运动情况。根据牛顿第一定律，如果推力等于摩擦力，物体将保持静止状态；如果推力大于摩擦力，物体将开始做加速运动。

第二题分析：
这道题考察的是牛顿第二定律 F = ma 的应用。通过已知物体的质量和加速度，可以计算出所受的合外力。需要注意的是，合外力是所有力的矢量和。

第三题分析：
这是一个关于作用力与反作用力的题目。根据牛顿第三定律，作用力与反作用力大小相等、方向相反，作用在同一条直线上。`,
    attachments: [
      {
        id: 'att1',
        name: '力学练习题解答.pdf',
        size: 1024000,
        uploadTime: new Date('2024-03-15T14:25:00')
      }
    ],
    images: [
      {
        id: 'img1',
        url: 'https://picsum.photos/400/300?random=1',
        description: '受力分析图'
      }
    ]
  }
})

const gradeData = ref({
  score: 85,
  feedback: '作业完成得很好！对牛顿运动定律的理解比较准确，解题思路清晰。建议在受力分析时更加细致一些，特别是在考虑摩擦力的情况下。继续保持！',
  sendNotification: true,
  allowResubmit: false,
  resubmitDeadline: ''
})

const rubricItems = ref<RubricItem[]>([
  {
    id: 'rubric1',
    name: '概念理解',
    weight: 30,
    maxScore: 30,
    score: 28,
    feedback: '对基本概念掌握良好，定义准确'
  },
  {
    id: 'rubric2',
    name: '计算过程',
    weight: 40,
    maxScore: 40,
    score: 35,
    feedback: '计算步骤完整，但有些细节可以更完善'
  },
  {
    id: 'rubric3',
    name: '分析推理',
    weight: 20,
    maxScore: 20,
    score: 17,
    feedback: '逻辑思维清晰，推理过程合理'
  },
  {
    id: 'rubric4',
    name: '表达规范',
    weight: 10,
    maxScore: 10,
    score: 5,
    feedback: '需要加强书写的规范性和逻辑性'
  }
])

const quickFeedbackTags = ref<FeedbackTag[]>([
  { id: 'tag1', text: '思路清晰', category: 'positive' },
  { id: 'tag2', text: '计算准确', category: 'positive' },
  { id: 'tag3', text: '理解深入', category: 'positive' },
  { id: 'tag4', text: '需要更详细', category: 'improvement' },
  { id: 'tag5', text: '注意格式', category: 'improvement' },
  { id: 'tag6', text: '继续努力', category: 'suggestion' }
])

const selectedFeedbackTags = ref<string[]>([])
const submitting = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const hasPrevious = ref(true)
const hasNext = ref(true)

// 计算属性
const scorePercentage = computed(() => {
  if (!assignment.value || gradeData.value.score === undefined) return 0
  return Math.round((gradeData.value.score / assignment.value.totalScore) * 100)
})

const formattedSubmissionText = computed(() => {
  return assignment.value?.submission.text?.replace(/\n/g, '<br>') || ''
})

// 方法
const getSubjectVariant = (subject: string): string => {
  const variants: Record<string, string> = {
    physics: 'physics',
    chemistry: 'chemistry',
    math: 'math',
    biology: 'biology'
  }
  return variants[subject] || 'default'
}

const getTypeName = (type?: string): string => {
  const types: Record<string, string> = {
    exercise: '练习题',
    report: '实验报告',
    lab: '实验记录',
    essay: '作文'
  }
  return types[type || ''] || type || ''
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const previousAssignment = () => {
  console.log('上一份作业')
}

const nextAssignment = () => {
  console.log('下一份作业')
}

const saveDraft = () => {
  console.log('保存草稿')
}

const submitGrade = async () => {
  submitting.value = true
  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push('/assignments')
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const downloadAttachment = (attachment: any) => {
  console.log('下载附件:', attachment.name)
}

const previewAttachment = (attachment: any) => {
  console.log('预览附件:', attachment.name)
}

const viewImage = (image: any) => {
  console.log('查看图片:', image.description)
}

const refreshAIAnalysis = () => {
  console.log('刷新AI分析')
}

const toggleFeedbackTag = (tag: FeedbackTag) => {
  const index = selectedFeedbackTags.value.indexOf(tag.id)
  if (index > -1) {
    selectedFeedbackTags.value.splice(index, 1)
  } else {
    selectedFeedbackTags.value.push(tag.id)
  }
}

const insertFeedbackTemplate = (type: string) => {
  const templates: Record<string, string> = {
    positive: '你的作业完成得很好！特别是在某些方面表现出色，值得表扬。',
    improvement: '建议你在以下几个方面可以进一步改进和完善。',
    conclusion: '总体来说，这是一份不错的作业，继续努力！'
  }

  const template = templates[type] || ''
  gradeData.value.feedback += (gradeData.value.feedback ? '\n\n' : '') + template
}

const toggleRecording = () => {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    startRecordingTimer()
  } else {
    stopRecordingTimer()
  }
}

let recordingTimer: NodeJS.Timeout | null = null

const startRecordingTimer = () => {
  recordingTime.value = 0
  recordingTimer = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

const stopRecordingTimer = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  console.log('加载作业详情:', route.params.id)
})
</script>

<style lang="scss" scoped>
.assignment-grade-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
}

.grade-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--bg-elevated);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.header-content {
  flex: 1;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    color: var(--edu-primary-500);
  }
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.assignment-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  svg {
    width: 16px;
    height: 16px;
  }
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.grade-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.assignment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.content-card,
.ai-suggestions {
  flex-shrink: 0;
}

.assignment-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--edu-color-gray-200);
}

.requirement-content {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
}

.requirement-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-base);
  padding: var(--spacing-base);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
}

.requirement-meta .meta-item {
  font-size: var(--font-size-sm);
}

.meta-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.submission-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.text-content {
  padding: var(--spacing-base);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
  border-left: 4px solid var(--edu-primary-500);
}

.text-body {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
}

.attachments-section,
.images-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.attachments-title,
.images-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--bg-elevated);
  border: 1px solid var(--edu-color-gray-200);
  border-radius: var(--radius-base);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-50);
  }
}

.attachment-icon {
  width: 40px;
  height: 40px;
  background-color: var(--edu-color-gray-100);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);

  svg {
    width: 20px;
    height: 20px;
  }
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.attachment-meta {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.attachment-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-base);
}

.image-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-base);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity var(--edu-duration-fast) var(--edu-easing-in-out);

  .image-item:hover & {
    opacity: 1;
  }

  svg {
    width: 24px;
    height: 24px;
  }
}

// AI建议卡片
.ai-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.ai-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ai-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--edu-primary-500), var(--edu-color-secondary-500));
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  svg {
    width: 24px;
    height: 24px;
  }
}

.ai-info {
  flex: 1;
}

.ai-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.ai-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.ai-analysis {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.analysis-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.analysis-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.analysis-label {
  min-width: 80px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.analysis-value {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  &--good {
    color: var(--edu-color-success-default);
  }

  &--medium {
    color: var(--edu-color-warning-default);
  }
}

.progress-bar {
  width: 100px;
  height: 8px;
  background-color: var(--edu-color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--edu-color-success-default);
  transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.score-suggestion {
  padding: var(--spacing-base);
  background-color: var(--edu-primary-50);
  border: 1px solid var(--edu-primary-100);
  border-radius: var(--radius-base);
}

.suggested-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.score-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.score-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--edu-primary-500);
}

.score-reason {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
}

.suggestion-icon {
  width: 20px;
  height: 20px;
  color: var(--edu-primary-500);
  flex-shrink: 0;
  margin-top: 2px;

  svg {
    width: 16px;
    height: 16px;
  }
}

.suggestion-text {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

// 右侧评分面板
.grade-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.score-card,
.feedback-card,
.submit-card {
  flex-shrink: 0;
}

.score-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.score-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.score-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.score-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.score-input {
  flex: 1;
  :deep(.edu-input__inner) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
  }
}

.score-total {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.score-percentage {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  text-align: center;
}

.rubric-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.rubric-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
}

.rubric-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.rubric-item {
  padding: var(--spacing-base);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
  border: 1px solid var(--edu-color-gray-200);
}

.rubric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.rubric-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.rubric-weight {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.rubric-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.rubric-max {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.rubric-textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  resize: vertical;
  font-family: var(--font-family-sans);

  &:focus {
    outline: none;
    border-color: var(--edu-primary-500);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
}

.feedback-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.feedback-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
}

.feedback-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.feedback-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--edu-color-gray-100);
  border: 1px solid var(--edu-color-gray-200);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-200);
  }

  &--selected {
    background-color: var(--edu-primary-100);
    border-color: var(--edu-primary-300);
    color: var(--edu-primary-700);
  }
}

.feedback-textarea {
  width: 100%;
  padding: var(--spacing-base);
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  resize: vertical;
  font-family: var(--font-family-sans);

  &:focus {
    outline: none;
    border-color: var(--edu-primary-500);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
}

.feedback-tools {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.voice-recorder {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.record-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.recording-time {
  font-size: var(--font-size-sm);
  color: var(--edu-color-error-default);
  font-weight: var(--font-weight-medium);
}

.submit-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: var(--edu-primary-500);
}

.checkbox-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.resubmit-options {
  padding-left: var(--spacing-lg);
}

// 响应式设计
@media (max-width: 1200px) {
  .grade-content {
    flex-direction: column;
  }

  .grade-panel {
    width: 100%;
    order: -1;
  }

  .rubric-score {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}

@media (max-width: 768px) {
  .grade-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-base);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .assignment-meta {
    flex-wrap: wrap;
  }

  .images-grid {
    grid-template-columns: 1fr;
  }

  .feedback-tools {
    flex-direction: column;
  }

  .voice-recorder {
    flex-direction: column;
    align-items: flex-start;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .requirement-meta,
  .attachment-item,
  .rubric-item {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--border-color);
  }

  .text-content {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .score-suggestion {
    background-color: rgba(33, 150, 243, 0.1);
    border-color: rgba(33, 150, 243, 0.3);
  }

  .suggestion-item {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .feedback-tag {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--border-color);

    &--selected {
      background-color: rgba(33, 150, 243, 0.2);
      border-color: var(--edu-primary-500);
    }
  }
}
</style>