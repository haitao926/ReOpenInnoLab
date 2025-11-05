<template>
  <div class="assignment-create-view">
    <!-- 页面头部 -->
    <div class="create-header">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/assignments" class="breadcrumb-link">作业管理</router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">布置作业</span>
        </div>
        <h1 class="page-title">布置新作业</h1>
      </div>
      <div class="header-actions">
        <EduButton variant="text" @click="saveDraft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存草稿
        </EduButton>
        <EduButton variant="secondary" @click="previewAssignment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11 8-11 8z"/>
            <path d="M8 12s2-4 4-4 4 4 4 4-2 4-4 4z"/>
          </svg>
          预览
        </EduButton>
        <EduButton variant="primary" :loading="publishing" @click="publishAssignment">
          发布作业
        </EduButton>
      </div>
    </div>

    <!-- 创建表单 -->
    <div class="create-content">
      <!-- 左侧：表单内容 -->
      <div class="form-section">
        <!-- 基本信息 -->
        <EduCard title="基本信息" variant="default" class="form-card">
          <div class="form-content">
            <div class="form-group">
              <label class="form-label required">作业标题</label>
              <EduInput
                v-model="assignmentData.title"
                placeholder="请输入作业标题"
                :error="errors.title"
                @input="validateField('title')"
              />
              <div v-if="errors.title" class="form-error">{{ errors.title }}</div>
            </div>

            <div class="form-group">
              <label class="form-label required">作业描述</label>
              <textarea
                v-model="assignmentData.description"
                class="form-textarea"
                placeholder="请详细描述作业要求、内容和目标..."
                rows="4"
                @input="validateField('description')"
              ></textarea>
              <div v-if="errors.description" class="form-error">{{ errors.description }}</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">选择课程</label>
                <select v-model="assignmentData.courseId" class="form-select" @change="validateField('courseId')">
                  <option value="">请选择课程</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.name }}
                  </option>
                </select>
                <div v-if="errors.courseId" class="form-error">{{ errors.courseId }}</div>
              </div>

              <div class="form-group">
                <label class="form-label required">作业类型</label>
                <select v-model="assignmentData.type" class="form-select" @change="validateField('type')">
                  <option value="">请选择类型</option>
                  <option value="exercise">练习题</option>
                  <option value="essay">作文</option>
                  <option value="report">实验报告</option>
                  <option value="project">项目作业</option>
                  <option value="presentation">演示报告</option>
                </select>
                <div v-if="errors.type" class="form-error">{{ errors.type }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">满分</label>
                <EduInput
                  v-model.number="assignmentData.totalScore"
                  type="number"
                  :min="1"
                  placeholder="请输入满分"
                  :error="errors.totalScore"
                  @input="validateField('totalScore')"
                />
                <div v-if="errors.totalScore" class="form-error">{{ errors.totalScore }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">难度等级</label>
                <select v-model="assignmentData.difficulty" class="form-select">
                  <option value="">请选择难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 作业内容 -->
        <EduCard title="作业内容" variant="default" class="form-card">
          <div class="content-editor">
            <!-- 内容类型选择 -->
            <div class="content-type-selector">
              <div class="type-tabs">
                <button
                  v-for="type in contentTypes"
                  :key="type.id"
                  class="type-tab"
                  :class="{ 'type-tab--active': activeContentType === type.id }"
                  @click="activeContentType = type.id"
                >
                  <component :is="type.icon" />
                  {{ type.name }}
                </button>
              </div>
            </div>

            <!-- 文本内容编辑器 -->
            <div v-if="activeContentType === 'text'" class="text-editor">
              <div class="editor-toolbar">
                <div class="toolbar-group">
                  <button class="toolbar-btn" @click="formatText('bold')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                    </svg>
                  </button>
                  <button class="toolbar-btn" @click="formatText('italic')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="19" y1="4" x2="10" y2="4"/>
                      <line x1="14" y1="20" x2="5" y2="20"/>
                      <line x1="15" y1="4" x2="9" y2="20"/>
                    </svg>
                  </button>
                  <button class="toolbar-btn" @click="formatText('underline')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
                      <line x1="4" y1="21" x2="20" y2="21"/>
                    </svg>
                  </button>
                </div>
                <div class="toolbar-group">
                  <button class="toolbar-btn" @click="insertList('ul')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="8" y1="6" x2="21" y2="6"/>
                      <line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/>
                      <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                  <button class="toolbar-btn" @click="insertList('ol')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="10" y1="6" x2="21" y2="6"/>
                      <line x1="10" y1="12" x2="21" y2="12"/>
                      <line x1="10" y1="18" x2="21" y2="18"/>
                      <path d="M4 6h1v4"/>
                      <path d="M4 10h2"/>
                      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
                    </svg>
                  </button>
                </div>
                <div class="toolbar-group">
                  <button class="toolbar-btn" @click="insertLink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>
                  <button class="toolbar-btn" @click="insertImage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div
                ref="textEditor"
                class="text-editor-content"
                contenteditable="true"
                @input="updateTextContent"
                @blur="validateField('content')"
              ></div>
              <div v-if="errors.content" class="form-error">{{ errors.content }}</div>
            </div>

            <!-- 文件上传 -->
            <div v-else-if="activeContentType === 'files'" class="files-editor">
              <div class="upload-area" :class="{ 'upload-area--dragover': isDragOver }"
                   @drop="handleDrop" @dragover.prevent @dragenter.prevent @dragleave="isDragOver = false">
                <div class="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div class="upload-text">
                  <h4>拖拽文件到此处上传</h4>
                  <p>或者点击选择文件</p>
                </div>
                <EduButton variant="outline" @click="selectFiles">选择文件</EduButton>
                <input ref="fileInput" type="file" multiple class="file-input" @change="handleFileSelect">
              </div>

              <div v-if="assignmentData.attachments.length" class="attachments-list">
                <h4>已上传文件</h4>
                <div
                  v-for="(file, index) in assignmentData.attachments"
                  :key="index"
                  class="attachment-item"
                >
                  <div class="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-size">{{ formatFileSize(file.size) }}</div>
                  </div>
                  <EduButton size="sm" variant="text" @click="removeAttachment(index)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </EduButton>
                </div>
              </div>
            </div>

            <!-- 在线资源 -->
            <div v-else-if="activeContentType === 'resources'" class="resources-editor">
              <div class="resource-input">
                <EduInput
                  v-model="resourceUrl"
                  placeholder="请输入在线资源链接..."
                  @keyup.enter="addResource"
                />
                <EduButton variant="outline" @click="addResource">添加</EduButton>
              </div>

              <div v-if="assignmentData.resources.length" class="resources-list">
                <div
                  v-for="(resource, index) in assignmentData.resources"
                  :key="index"
                  class="resource-item"
                >
                  <div class="resource-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div class="resource-info">
                    <div class="resource-title">{{ resource.title }}</div>
                    <div class="resource-url">{{ resource.url }}</div>
                  </div>
                  <EduButton size="sm" variant="text" @click="removeResource(index)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </EduButton>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 发布设置 -->
        <EduCard title="发布设置" variant="default" class="form-card">
          <div class="publish-settings">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">目标班级</label>
                <div class="class-selector">
                  <div
                    v-for="classItem in availableClasses"
                    :key="classItem.id"
                    class="class-checkbox"
                  >
                    <input
                      :id="`class-${classItem.id}`"
                      v-model="assignmentData.targetClasses"
                      type="checkbox"
                      :value="classItem.id"
                    />
                    <label :for="`class-${classItem.id}`" class="class-label">
                      {{ classItem.name }}
                    </label>
                  </div>
                </div>
                <div v-if="errors.targetClasses" class="form-error">{{ errors.targetClasses }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">开始时间</label>
                <input
                  v-model="assignmentData.startTime"
                  type="datetime-local"
                  class="form-input"
                  @change="validateField('startTime')"
                />
                <div v-if="errors.startTime" class="form-error">{{ errors.startTime }}</div>
              </div>

              <div class="form-group">
                <label class="form-label required">截止时间</label>
                <input
                  v-model="assignmentData.endTime"
                  type="datetime-local"
                  class="form-input"
                  @change="validateField('endTime')"
                />
                <div v-if="errors.endTime" class="form-error">{{ errors.endTime }}</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">发布说明</label>
              <textarea
                v-model="assignmentData.publishNote"
                class="form-textarea"
                placeholder="向学生说明作业要求、注意事项等..."
                rows="3"
              ></textarea>
            </div>

            <div class="notification-options">
              <div class="option-item">
                <label class="checkbox-label">
                  <input
                    v-model="assignmentData.sendNotification"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">向学生发送作业通知</span>
                </label>
              </div>
              <div class="option-item">
                <label class="checkbox-label">
                  <input
                    v-model="assignmentData.sendReminder"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">截止前24小时发送提醒</span>
                </label>
              </div>
              <div class="option-item">
                <label class="checkbox-label">
                  <input
                    v-model="assignmentData.allowLateSubmission"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">允许逾期提交</span>
                </label>
              </div>
            </div>
          </div>
        </EduCard>
      </div>

      <!-- 右侧：预览和模板 -->
      <div class="sidebar-section">
        <!-- 作业模板 -->
        <EduCard title="作业模板" variant="default" class="template-card">
          <div class="template-list">
            <div
              v-for="template in assignmentTemplates"
              :key="template.id"
              class="template-item"
              @click="useTemplate(template)"
            >
              <div class="template-icon">
                <component :is="template.icon" />
              </div>
              <div class="template-info">
                <div class="template-name">{{ template.name }}</div>
                <div class="template-description">{{ template.description }}</div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- AI助手 -->
        <EduCard title="AI助手" variant="elevated" class="ai-card">
          <div class="ai-assistant">
            <div class="ai-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 12h6m6 0h6"/>
              </svg>
            </div>
            <div class="ai-content">
              <div class="ai-suggestions">
                <h4>智能建议</h4>
                <div class="suggestion-list">
                  <button class="suggestion-btn" @click="generateAssignmentTitle">
                    生成作业标题
                  </button>
                  <button class="suggestion-btn" @click="generateAssignmentContent">
                    生成作业内容
                  </button>
                  <button class="suggestion-btn" @click="optimizeDifficulty">
                    优化难度设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 快速预览 -->
        <EduCard title="快速预览" variant="default" class="preview-card">
          <div class="assignment-preview">
            <div class="preview-header">
              <h3>{{ assignmentData.title || '作业标题' }}</h3>
              <div class="preview-meta">
                <EduTag :variant="getSubjectVariant(selectedCourse?.subject)" size="sm">
                  {{ selectedCourse?.name }}
                </EduTag>
                <span class="preview-score">{{ assignmentData.totalScore || 100 }}分</span>
              </div>
            </div>
            <div class="preview-description">
              {{ assignmentData.description || '作业描述将显示在这里...' }}
            </div>
            <div class="preview-deadline">
              <strong>截止时间：</strong>
              {{ assignmentData.endTime ? formatDateTime(assignmentData.endTime) : '未设置' }}
            </div>
          </div>
        </EduCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { EduButton, EduInput, EduCard, EduTag } from '@reopeninnolab/ui-kit'
import { formatDateTime } from '@/utils/date'

interface Course {
  id: string
  name: string
  subject: string
}

interface AssignmentTemplate {
  id: string
  name: string
  description: string
  icon: any
  data: Partial<AssignmentData>
}

interface AssignmentData {
  title: string
  description: string
  courseId: string
  type: string
  totalScore: number
  difficulty: string
  content: string
  attachments: File[]
  resources: Array<{ title: string; url: string }>
  targetClasses: string[]
  startTime: string
  endTime: string
  publishNote: string
  sendNotification: boolean
  sendReminder: boolean
  allowLateSubmission: boolean
}

const router = useRouter()

// 响应式数据
const assignmentData = ref<AssignmentData>({
  title: '',
  description: '',
  courseId: '',
  type: '',
  totalScore: 100,
  difficulty: '',
  content: '',
  attachments: [],
  resources: [],
  targetClasses: [],
  startTime: '',
  endTime: '',
  publishNote: '',
  sendNotification: true,
  sendReminder: true,
  allowLateSubmission: false
})

const errors = ref<Record<string, string>>({})
const publishing = ref(false)
const activeContentType = ref('text')
const isDragOver = ref(false)
const resourceUrl = ref('')
const fileInput = ref<HTMLInputElement>()
const textEditor = ref<HTMLElement>()

const courses = ref<Course[]>([
  { id: 'course1', name: '高中物理-力学', subject: 'physics' },
  { id: 'course2', name: '高中化学-有机', subject: 'chemistry' },
  { id: 'course3', name: '高中数学-函数', subject: 'math' },
  { id: 'course4', name: '高中生物-细胞', subject: 'biology' }
])

const availableClasses = ref([
  { id: 'class1', name: '高一1班' },
  { id: 'class2', name: '高一2班' },
  { id: 'class3', name: '高一3班' }
])

const contentTypes = ref([
  {
    id: 'text',
    name: '文本内容',
    icon: 'Document'
  },
  {
    id: 'files',
    name: '文件上传',
    icon: 'Folder'
  },
  {
    id: 'resources',
    name: '在线资源',
    icon: 'Link'
  }
])

const assignmentTemplates = ref<AssignmentTemplate[]>([
  {
    id: 'template1',
    name: '练习题模板',
    description: '包含选择题、填空题、简答题',
    icon: 'Document',
    data: {
      type: 'exercise',
      totalScore: 100,
      content: '一、选择题（每题5分，共25分）\n二、填空题（每空2分，共20分）\n三、简答题（共55分）'
    }
  },
  {
    id: 'template2',
    name: '实验报告模板',
    description: '科学实验报告标准格式',
    icon: 'Science',
    data: {
      type: 'report',
      totalScore: 100,
      content: '实验目的：\n实验原理：\n实验步骤：\n实验结果：\n分析与讨论：'
    }
  },
  {
    id: 'template3',
    name: '作文模板',
    description: '议论文写作模板',
    icon: 'Edit',
    data: {
      type: 'essay',
      totalScore: 100,
      content: '题目要求：\n写作要求：\n1. 中心明确，论点突出\n2. 结构完整，逻辑清晰\n3. 语言流畅，表达准确'
    }
  }
])

// 计算属性
const selectedCourse = computed(() => {
  return courses.value.find(c => c.id === assignmentData.value.courseId)
})

// 方法
const validateField = (field: string) => {
  delete errors.value[field]

  switch (field) {
    case 'title':
      if (!assignmentData.value.title.trim()) {
        errors.value.title = '请输入作业标题'
      }
      break
    case 'description':
      if (!assignmentData.value.description.trim()) {
        errors.value.description = '请输入作业描述'
      }
      break
    case 'courseId':
      if (!assignmentData.value.courseId) {
        errors.value.courseId = '请选择课程'
      }
      break
    case 'type':
      if (!assignmentData.value.type) {
        errors.value.type = '请选择作业类型'
      }
      break
    case 'totalScore':
      if (!assignmentData.value.totalScore || assignmentData.value.totalScore <= 0) {
        errors.value.totalScore = '请输入有效的满分'
      }
      break
    case 'content':
      if (activeContentType.value === 'text' && !assignmentData.value.content.trim()) {
        errors.value.content = '请输入作业内容'
      }
      break
    case 'targetClasses':
      if (assignmentData.value.targetClasses.length === 0) {
        errors.value.targetClasses = '请选择至少一个班级'
      }
      break
    case 'startTime':
      if (!assignmentData.value.startTime) {
        errors.value.startTime = '请选择开始时间'
      }
      break
    case 'endTime':
      if (!assignmentData.value.endTime) {
        errors.value.endTime = '请选择截止时间'
      } else if (assignmentData.value.startTime && assignmentData.value.endTime <= assignmentData.value.startTime) {
        errors.value.endTime = '截止时间必须晚于开始时间'
      }
      break
  }
}

const validateForm = (): boolean => {
  const fields = ['title', 'description', 'courseId', 'type', 'totalScore', 'targetClasses', 'startTime', 'endTime']
  if (activeContentType.value === 'text') {
    fields.push('content')
  }
  fields.forEach(field => validateField(field))
  return Object.keys(errors.value).length === 0
}

const getSubjectVariant = (subject?: string): string => {
  const variants: Record<string, string> = {
    physics: 'physics',
    chemistry: 'chemistry',
    math: 'math',
    biology: 'biology'
  }
  return variants[subject || ''] || 'default'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const saveDraft = () => {
  console.log('保存草稿')
}

const previewAssignment = () => {
  console.log('预览作业')
}

const publishAssignment = async () => {
  if (!validateForm()) {
    return
  }

  publishing.value = true
  try {
    // 模拟发布
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push('/assignments')
  } catch (error) {
    console.error('发布失败:', error)
  } finally {
    publishing.value = false
  }
}

// 文本编辑器方法
const formatText = (command: string) => {
  document.execCommand(command, false)
  updateTextContent()
}

const insertList = (type: string) => {
  const listHTML = type === 'ul' ? '<ul><li>列表项</li></ul>' : '<ol><li>列表项</li></ol>'
  document.execCommand('insertHTML', false, listHTML)
  updateTextContent()
}

const insertLink = () => {
  const url = prompt('请输入链接地址：')
  if (url) {
    document.execCommand('createLink', false, url)
    updateTextContent()
  }
}

const insertImage = () => {
  const url = prompt('请输入图片地址：')
  if (url) {
    document.execCommand('insertImage', false, url)
    updateTextContent()
  }
}

const updateTextContent = () => {
  if (textEditor.value) {
    assignmentData.value.content = textEditor.value.innerHTML
  }
}

// 文件上传方法
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  assignmentData.value.attachments.push(...files)
}

const selectFiles = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  assignmentData.value.attachments.push(...files)
}

const removeAttachment = (index: number) => {
  assignmentData.value.attachments.splice(index, 1)
}

// 资源管理方法
const addResource = () => {
  if (resourceUrl.value.trim()) {
    assignmentData.value.resources.push({
      title: `资源 ${assignmentData.value.resources.length + 1}`,
      url: resourceUrl.value
    })
    resourceUrl.value = ''
  }
}

const removeResource = (index: number) => {
  assignmentData.value.resources.splice(index, 1)
}

// 模板方法
const useTemplate = (template: AssignmentTemplate) => {
  Object.assign(assignmentData.value, template.data)
}

// AI助手方法
const generateAssignmentTitle = () => {
  console.log('生成作业标题')
}

const generateAssignmentContent = () => {
  console.log('生成作业内容')
}

const optimizeDifficulty = () => {
  console.log('优化难度设置')
}

// 生命周期
onMounted(() => {
  // 设置默认时间
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  assignmentData.value.startTime = now.toISOString().slice(0, 16)
  assignmentData.value.endTime = nextWeek.toISOString().slice(0, 16)
})
</script>

<style lang="scss" scoped>
.assignment-create-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
}

.create-header {
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
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.create-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.sidebar-section {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.form-card,
.template-card,
.ai-card,
.preview-card {
  flex-shrink: 0;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-label.required::after {
  content: '*';
  color: var(--edu-color-error-default);
  margin-left: var(--spacing-xs);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:focus {
    outline: none;
    border-color: var(--edu-primary-500);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
}

.form-textarea {
  resize: vertical;
  font-family: var(--font-family-sans);
  line-height: var(--line-height-normal);
}

.form-error {
  color: var(--edu-color-error-default);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}

// 内容编辑器
.content-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.content-type-selector {
  border-bottom: 1px solid var(--edu-color-gray-200);
}

.type-tabs {
  display: flex;
  gap: var(--spacing-sm);
}

.type-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: var(--text-primary);
    background-color: var(--edu-color-gray-50);
  }

  &--active {
    color: var(--edu-primary-500);
    border-bottom-color: var(--edu-primary-500);
  }
}

.text-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.editor-toolbar {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--edu-color-gray-50);
  border: 1px solid var(--edu-color-gray-200);
  border-radius: var(--radius-base);
}

.toolbar-group {
  display: flex;
  gap: var(--spacing-xs);
  padding-right: var(--spacing-sm);
  border-right: 1px solid var(--edu-color-gray-200);

  &:last-child {
    border-right: none;
  }
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: var(--edu-color-gray-100);
    color: var(--text-primary);
  }
}

.text-editor-content {
  min-height: 200px;
  padding: var(--spacing-base);
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: var(--edu-primary-500);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
}

// 文件上传
.files-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.upload-area {
  border: 2px dashed var(--edu-color-gray-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
  text-align: center;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  cursor: pointer;

  &:hover,
  &--dragover {
    border-color: var(--edu-primary-500);
    background-color: var(--edu-primary-50);
  }
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-base);
  color: var(--text-tertiary);

  svg {
    width: 100%;
    height: 100%;
  }
}

.upload-text {
  margin-bottom: var(--spacing-base);

  h4 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }
}

.file-input {
  display: none;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
  border: 1px solid var(--edu-color-gray-200);
}

.file-icon {
  width: 40px;
  height: 40px;
  background-color: var(--edu-color-gray-200);
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

.file-info {
  flex: 1;
}

.file-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.file-size {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

// 在线资源
.resources-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.resource-input {
  display: flex;
  gap: var(--spacing-sm);
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
  border: 1px solid var(--edu-color-gray-200);
}

.resource-icon {
  width: 40px;
  height: 40px;
  background-color: var(--edu-color-blue-100);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-color-blue-600);

  svg {
    width: 20px;
    height: 20px;
  }
}

.resource-info {
  flex: 1;
}

.resource-title {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.resource-url {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  word-break: break-all;
}

// 发布设置
.publish-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.class-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
}

.class-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.class-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.class-label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.notification-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  align-items: center;
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

// 模板卡片
.template-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.template-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--edu-color-gray-50);
  border-radius: var(--radius-base);
  border: 1px solid var(--edu-color-gray-200);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-100);
    border-color: var(--edu-primary-300);
  }
}

.template-icon {
  width: 40px;
  height: 40px;
  background-color: var(--edu-primary-100);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-primary-600);

  svg {
    width: 20px;
    height: 20px;
  }
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.template-description {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

// AI助手
.ai-assistant {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
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
  align-self: center;

  svg {
    width: 24px;
    height: 24px;
  }
}

.ai-content {
  flex: 1;
}

.ai-suggestions h4 {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.suggestion-btn {
  padding: var(--spacing-sm);
  background: none;
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  text-align: left;
  font-size: var(--font-size-sm);

  &:hover {
    background-color: var(--edu-primary-50);
    border-color: var(--edu-primary-300);
    color: var(--edu-primary-700);
  }
}

// 快速预览
.assignment-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.preview-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.preview-score {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.preview-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.preview-deadline {
  font-size: var(--font-size-sm);
  color: var(--text-primary);

  strong {
    color: var(--text-primary);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .create-content {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .create-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-base);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .type-tabs {
    flex-wrap: wrap;
  }

  .resource-input {
    flex-direction: column;
  }

  .class-selector {
    grid-template-columns: 1fr;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .form-input,
  .form-select,
  .form-textarea {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .text-editor-content {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .upload-area {
    border-color: var(--border-color);

    &:hover,
    &--dragover {
      border-color: var(--edu-primary-500);
      background-color: rgba(33, 150, 243, 0.1);
    }
  }

  .attachment-item,
  .resource-item,
  .template-item {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--border-color);
  }
}
</style>