<template>
  <div class="lab-editor">
    <!-- 页面头部 -->
    <div class="lab-editor__header">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/labs" class="breadcrumb-link">虚拟实验库</router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ isEditing ? '编辑实验' : '创建实验' }}</span>
        </div>
        <h1 class="page-title">{{ isEditing ? '编辑实验' : '创建新实验' }}</h1>
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
        <EduButton variant="secondary" @click="previewLab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11 8-11 8z"/>
            <path d="M8 12s2-4 4-4 4 4 4 4-2 4-4 4z"/>
          </svg>
          预览
        </EduButton>
        <EduButton
          variant="primary"
          :loading="publishing"
          @click="publishLab"
        >
          {{ isEditing ? '保存修改' : '发布实验' }}
        </EduButton>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="lab-editor__content">
      <!-- 左侧导航 -->
      <div class="editor-sidebar">
        <div class="sidebar-nav">
          <div
            v-for="(section, index) in editorSections"
            :key="section.id"
            class="nav-item"
            :class="{ 'nav-item--active': currentSection === section.id }"
            @click="currentSection = section.id"
          >
            <div class="nav-icon">
              <component :is="section.icon" />
            </div>
            <span class="nav-label">{{ section.label }}</span>
            <div
              v-if="getSectionValidationStatus(section.id)"
              class="nav-status"
              :class="`nav-status--${getSectionValidationStatus(section.id)}`"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧编辑区域 -->
      <div class="editor-main">
        <!-- 基本信息 -->
        <div v-if="currentSection === 'basic'" class="editor-section">
          <EduCard title="基本信息" variant="default">
            <div class="form-group">
              <label class="form-label required">实验标题</label>
              <EduInput
                v-model="labData.title"
                placeholder="请输入实验标题"
                :error="errors.title"
                @input="validateField('title')"
              />
              <div v-if="errors.title" class="form-error">{{ errors.title }}</div>
            </div>

            <div class="form-group">
              <label class="form-label required">实验描述</label>
              <textarea
                v-model="labData.description"
                class="form-textarea"
                placeholder="请详细描述实验内容、目的和预期效果"
                rows="4"
                @input="validateField('description')"
              ></textarea>
              <div v-if="errors.description" class="form-error">{{ errors.description }}</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">学科</label>
                <select v-model="labData.subject" class="form-select" @change="validateField('subject')">
                  <option value="">请选择学科</option>
                  <option value="physics">物理</option>
                  <option value="chemistry">化学</option>
                  <option value="math">数学</option>
                  <option value="biology">生物</option>
                  <option value="language">语文</option>
                  <option value="history">历史</option>
                  <option value="geography">地理</option>
                  <option value="english">英语</option>
                  <option value="art">美术</option>
                  <option value="music">音乐</option>
                  <option value="pe">体育</option>
                  <option value="it">信息技术</option>
                </select>
                <div v-if="errors.subject" class="form-error">{{ errors.subject }}</div>
              </div>

              <div class="form-group">
                <label class="form-label required">年级</label>
                <select v-model="labData.grade" class="form-select" @change="validateField('grade')">
                  <option value="">请选择年级</option>
                  <option :value="7">初一</option>
                  <option :value="8">初二</option>
                  <option :value="9">初三</option>
                  <option :value="10">高一</option>
                  <option :value="11">高二</option>
                  <option :value="12">高三</option>
                </select>
                <div v-if="errors.grade" class="form-error">{{ errors.grade }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">实验类型</label>
                <select v-model="labData.type" class="form-select" @change="validateField('type')">
                  <option value="">请选择类型</option>
                  <option value="simulation">模拟实验</option>
                  <option value="measurement">测量实验</option>
                  <option value="analysis">分析实验</option>
                  <option value="design">设计实验</option>
                </select>
                <div v-if="errors.type" class="form-error">{{ errors.type }}</div>
              </div>

              <div class="form-group">
                <label class="form-label required">难度等级</label>
                <select v-model="labData.difficulty" class="form-select" @change="validateField('difficulty')">
                  <option value="">请选择难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
                <div v-if="errors.difficulty" class="form-error">{{ errors.difficulty }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">预计时长（分钟）</label>
                <EduInput
                  v-model.number="labData.duration"
                  type="number"
                  placeholder="请输入预计时长"
                  :error="errors.duration"
                  @input="validateField('duration')"
                />
                <div v-if="errors.duration" class="form-error">{{ errors.duration }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">封面图片</label>
                <div class="image-upload">
                  <div v-if="labData.coverImage" class="image-preview">
                    <img :src="labData.coverImage" alt="封面预览" />
                    <button type="button" class="image-remove" @click="removeCoverImage">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <button v-else type="button" class="image-upload-btn" @click="uploadCoverImage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    上传封面
                  </button>
                </div>
              </div>
            </div>
          </EduCard>
        </div>

        <!-- 实验参数 -->
        <div v-if="currentSection === 'parameters'" class="editor-section">
          <EduCard title="实验参数设置" variant="default">
            <div class="parameter-section">
              <h3 class="section-title">基本参数</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">质量范围 (g)</label>
                  <div class="range-input">
                    <EduInput
                      v-model="labData.parameters.mass.min"
                      type="number"
                      placeholder="最小值"
                      @input="updateParameter('mass')"
                    />
                    <span>-</span>
                    <EduInput
                      v-model="labData.parameters.mass.max"
                      type="number"
                      placeholder="最大值"
                      @input="updateParameter('mass')"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">弹簧常数 (N/m)</label>
                  <div class="range-input">
                    <EduInput
                      v-model="labData.parameters.spring.min"
                      type="number"
                      placeholder="最小值"
                      @input="updateParameter('spring')"
                    />
                    <span>-</span>
                    <EduInput
                      v-model="labData.parameters.spring.max"
                      type="number"
                      placeholder="最大值"
                      @input="updateParameter('spring')"
                    />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">阻尼系数</label>
                  <EduInput
                    v-model="labData.parameters.damping"
                    type="number"
                    step="0.1"
                    placeholder="请输入阻尼系数"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">采样频率 (Hz)</label>
                  <EduInput
                    v-model="labData.parameters.samplingRate"
                    type="number"
                    placeholder="请输入采样频率"
                  />
                </div>
              </div>
            </div>

            <div class="parameter-section">
              <h3 class="section-title">实验目标</h3>
              <div class="objective-list">
                <div
                  v-for="(objective, index) in labData.objectives"
                  :key="index"
                  class="objective-item"
                >
                  <EduInput
                    v-model="labData.objectives[index]"
                    placeholder="请输入实验目标"
                  />
                  <button
                    type="button"
                    class="objective-remove"
                    @click="removeObjective(index)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <EduButton
                  variant="outline"
                  size="sm"
                  @click="addObjective"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  添加目标
                </EduButton>
              </div>
            </div>
          </EduCard>
        </div>

        <!-- 实验步骤 -->
        <div v-if="currentSection === 'steps'" class="editor-section">
          <EduCard title="实验步骤" variant="default">
            <div class="steps-editor">
              <div
                v-for="(step, index) in labData.steps"
                :key="step.id"
                class="step-item"
              >
                <div class="step-header">
                  <div class="step-number">{{ index + 1 }}</div>
                  <div class="step-controls">
                    <button
                      type="button"
                      class="step-control-btn"
                      @click="moveStepUp(index)"
                      :disabled="index === 0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="step-control-btn"
                      @click="moveStepDown(index)"
                      :disabled="index === labData.steps.length - 1"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="step-control-btn step-control-btn--danger"
                      @click="removeStep(index)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="step-content">
                  <div class="form-group">
                    <label class="form-label">步骤标题</label>
                    <EduInput
                      v-model="step.title"
                      placeholder="请输入步骤标题"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">步骤描述</label>
                    <textarea
                      v-model="step.description"
                      class="form-textarea"
                      placeholder="请详细描述该步骤的操作内容和要求"
                      rows="3"
                    ></textarea>
                  </div>

                  <div class="form-group">
                    <label class="form-label">预计时间（分钟）</label>
                    <EduInput
                      v-model.number="step.duration"
                      type="number"
                      placeholder="请输入预计时间"
                    />
                  </div>
                </div>
              </div>

              <EduButton
                variant="outline"
                @click="addStep"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                添加步骤
              </EduButton>
            </div>
          </EduCard>
        </div>

        <!-- 实验资源 -->
        <div v-if="currentSection === 'resources'" class="editor-section">
          <EduCard title="实验资源" variant="default">
            <div class="resources-editor">
              <!-- 理论知识 -->
              <div class="resource-section">
                <h3 class="section-title">理论知识</h3>
                <div class="form-group">
                  <label class="form-label">相关知识点</label>
                  <textarea
                    v-model="labData.resources.theory"
                    class="form-textarea"
                    placeholder="请输入与实验相关的理论知识、公式、定律等"
                    rows="4"
                  ></textarea>
                </div>
              </div>

              <!-- 参考资料 -->
              <div class="resource-section">
                <h3 class="section-title">参考资料</h3>
                <div class="reference-list">
                  <div
                    v-for="(reference, index) in labData.resources.references"
                    :key="index"
                    class="reference-item"
                  >
                    <EduInput
                      v-model="labData.resources.references[index].title"
                      placeholder="参考资料标题"
                    />
                    <EduInput
                      v-model="labData.resources.references[index].url"
                      placeholder="参考资料链接"
                    />
                    <button
                      type="button"
                      class="reference-remove"
                      @click="removeReference(index)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <EduButton
                    variant="outline"
                    size="sm"
                    @click="addReference"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加参考资料
                  </EduButton>
                </div>
              </div>

              <!-- 实验数据模板 -->
              <div class="resource-section">
                <h3 class="section-title">实验数据模板</h3>
                <div class="template-grid">
                  <div class="template-item">
                    <label class="template-label">数据记录表</label>
                    <select v-model="labData.resources.dataTemplate" class="form-select">
                      <option value="">选择模板</option>
                      <option value="basic">基础数据表</option>
                      <option value="advanced">高级数据表</option>
                      <option value="custom">自定义模板</option>
                    </select>
                  </div>

                  <div class="template-item">
                    <label class="template-label">实验报告模板</label>
                    <select v-model="labData.resources.reportTemplate" class="form-select">
                      <option value="">选择模板</option>
                      <option value="standard">标准报告</option>
                      <option value="detailed">详细报告</option>
                      <option value="simple">简化报告</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </EduCard>
        </div>

        <!-- 发布设置 -->
        <div v-if="currentSection === 'publish'" class="editor-section">
          <EduCard title="发布设置" variant="default">
            <div class="publish-settings">
              <div class="form-group">
                <label class="form-label">目标班级</label>
                <div class="class-selector">
                  <div
                    v-for="classItem in availableClasses"
                    :key="classItem.id"
                    class="class-checkbox"
                  >
                    <input
                      :id="`class-${classItem.id}`"
                      v-model="labData.publishSettings.targetClasses"
                      type="checkbox"
                      :value="classItem.id"
                    />
                    <label :for="`class-${classItem.id}`" class="class-label">
                      {{ classItem.name }}
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">开始时间</label>
                  <input
                    v-model="labData.publishSettings.startTime"
                    type="datetime-local"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">截止时间</label>
                  <input
                    v-model="labData.publishSettings.endTime"
                    type="datetime-local"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">发布通知</label>
                <div class="notification-options">
                  <label class="checkbox-label">
                    <input
                      v-model="labData.publishSettings.sendNotification"
                      type="checkbox"
                    />
                    向学生发送实验通知
                  </label>
                  <label class="checkbox-label">
                    <input
                      v-model="labData.publishSettings.sendReminder"
                      type="checkbox"
                    />
                    截止前24小时发送提醒
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">实验说明</label>
                <textarea
                  v-model="labData.publishSettings.description"
                  class="form-textarea"
                  placeholder="向学生说明实验要求、注意事项等"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </EduCard>
        </div>
      </div>
    </div>

    <!-- 自动保存提示 -->
    <div v-if="autoSaveStatus" class="auto-save-indicator">
      <div class="auto-save-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      </div>
      <span class="auto-save-text">{{ autoSaveStatus }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EduCard, EduButton, EduInput } from '@reopeninnolab/ui-kit'
import { formatDate } from '@/utils/date'

interface LabData {
  title: string
  description: string
  subject: string
  grade: number
  type: string
  difficulty: string
  duration: number
  coverImage: string
  parameters: {
    mass: { min: number; max: number }
    spring: { min: number; max: number }
    damping: number
    samplingRate: number
  }
  objectives: string[]
  steps: Array<{
    id: string
    title: string
    description: string
    duration: number
  }>
  resources: {
    theory: string
    references: Array<{ title: string; url: string }>
    dataTemplate: string
    reportTemplate: string
  }
  publishSettings: {
    targetClasses: string[]
    startTime: string
    endTime: string
    sendNotification: boolean
    sendReminder: boolean
    description: string
  }
}

const route = useRoute()
const router = useRouter()

// 响应式数据
const isEditing = computed(() => !!route.params.id)
const currentSection = ref('basic')
const publishing = ref(false)
const autoSaveStatus = ref('')

// 表单数据
const labData = reactive<LabData>({
  title: '',
  description: '',
  subject: '',
  grade: NaN,
  type: '',
  difficulty: '',
  duration: 30,
  coverImage: '',
  parameters: {
    mass: { min: 50, max: 200 },
    spring: { min: 5, max: 20 },
    damping: 0.1,
    samplingRate: 10
  },
  objectives: [''],
  steps: [
    {
      id: '1',
      title: '实验准备',
      description: '熟悉实验设备，检查实验器材',
      duration: 5
    }
  ],
  resources: {
    theory: '',
    references: [],
    dataTemplate: '',
    reportTemplate: ''
  },
  publishSettings: {
    targetClasses: [],
    startTime: '',
    endTime: '',
    sendNotification: true,
    sendReminder: true,
    description: ''
  }
})

// 表单验证
const errors = ref<Record<string, string>>({})

const validateField = (field: string) => {
  delete errors.value[field]

  switch (field) {
    case 'title':
      if (!labData.title.trim()) {
        errors.value.title = '请输入实验标题'
      }
      break
    case 'description':
      if (!labData.description.trim()) {
        errors.value.description = '请输入实验描述'
      }
      break
    case 'subject':
      if (!labData.subject) {
        errors.value.subject = '请选择学科'
      }
      break
    case 'grade':
      if (!labData.grade) {
        errors.value.grade = '请选择年级'
      }
      break
    case 'type':
      if (!labData.type) {
        errors.value.type = '请选择实验类型'
      }
      break
    case 'difficulty':
      if (!labData.difficulty) {
        errors.value.difficulty = '请选择难度等级'
      }
      break
    case 'duration':
      if (!labData.duration || labData.duration <= 0) {
        errors.value.duration = '请输入有效的预计时长'
      }
      break
  }
}

const validateForm = (): boolean => {
  const fields = ['title', 'description', 'subject', 'grade', 'type', 'difficulty', 'duration']
  fields.forEach(field => validateField(field))
  return Object.keys(errors.value).length === 0
}

// 编辑器导航
const editorSections = [
  { id: 'basic', label: '基本信息', icon: 'Info' },
  { id: 'parameters', label: '实验参数', icon: 'Settings' },
  { id: 'steps', label: '实验步骤', icon: 'List' },
  { id: 'resources', label: '实验资源', icon: 'Book' },
  { id: 'publish', label: '发布设置', icon: 'Send' }
]

const getSectionValidationStatus = (sectionId: string): string | null => {
  // 简化的验证状态逻辑
  switch (sectionId) {
    case 'basic':
      return labData.title && labData.description && labData.subject && labData.grade && labData.type ? 'valid' : null
    case 'parameters':
      return labData.parameters.mass && labData.parameters.spring ? 'valid' : null
    case 'steps':
      return labData.steps.length > 0 ? 'valid' : null
    default:
      return null
  }
}

// 可用班级数据
const availableClasses = ref([
  { id: 'class1', name: '高一1班' },
  { id: 'class2', name: '高一2班' },
  { id: 'class3', name: '高一3班' },
  { id: 'class4', name: '高二1班' },
  { id: 'class5', name: '高二2班' }
])

// 方法
const saveDraft = async () => {
  autoSaveStatus.value = '正在保存草稿...'
  // TODO: 实现保存草稿逻辑
  setTimeout(() => {
    autoSaveStatus.value = '草稿已保存'
    setTimeout(() => {
      autoSaveStatus.value = ''
    }, 2000)
  }, 1000)
}

const previewLab = () => {
  // TODO: 实现预览功能
  console.log('预览实验')
}

const publishLab = async () => {
  if (!validateForm()) {
    // 滚动到第一个错误字段
    const firstError = Object.keys(errors.value)[0]
    currentSection.value = 'basic'
    return
  }

  publishing.value = true

  try {
    // TODO: 实现发布逻辑
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push('/labs')
  } catch (error) {
    console.error('发布失败:', error)
  } finally {
    publishing.value = false
  }
}

const updateParameter = (paramType: string) => {
  // 更新参数时的逻辑
  console.log('更新参数:', paramType)
}

const addObjective = () => {
  labData.objectives.push('')
}

const removeObjective = (index: number) => {
  labData.objectives.splice(index, 1)
}

const addStep = () => {
  const newStep = {
    id: Date.now().toString(),
    title: '',
    description: '',
    duration: 5
  }
  labData.steps.push(newStep)
}

const removeStep = (index: number) => {
  labData.steps.splice(index, 1)
}

const moveStepUp = (index: number) => {
  if (index > 0) {
    const step = labData.steps.splice(index, 1)[0]
    labData.steps.splice(index - 1, 0, step)
  }
}

const moveStepDown = (index: number) => {
  if (index < labData.steps.length - 1) {
    const step = labData.steps.splice(index, 1)[0]
    labData.steps.splice(index + 1, 0, step)
  }
}

const addReference = () => {
  labData.resources.references.push({ title: '', url: '' })
}

const removeReference = (index: number) => {
  labData.resources.references.splice(index, 1)
}

const uploadCoverImage = () => {
  // TODO: 实现图片上传功能
  console.log('上传封面图片')
}

const removeCoverImage = () => {
  labData.coverImage = ''
}

// 自动保存
let autoSaveTimer: NodeJS.Timeout | null = null

const startAutoSave = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(() => {
    saveDraft()
  }, 30000) // 30秒自动保存
}

// 监听数据变化
watch(labData, () => {
  startAutoSave()
}, { deep: true })

// 生命周期
onMounted(() => {
  if (isEditing.value) {
    // TODO: 加载实验数据
    console.log('加载实验数据:', route.params.id)
  }
})

onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style lang="scss" scoped>
.lab-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
}

.lab-editor__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

.lab-editor__content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 240px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-nav {
  padding: var(--spacing-base) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  position: relative;

  &:hover {
    background-color: var(--edu-color-gray-100);
  }

  &--active {
    background-color: var(--edu-primary-50);
    color: var(--edu-primary-500);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: var(--edu-primary-500);
    }
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
}

.nav-label {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.nav-status {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;

  &--valid {
    background-color: var(--edu-color-success-default);
    color: white;
  }

  svg {
    width: 12px;
    height: 12px;
  }
}

.editor-main {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.editor-section {
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-base);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
}

.form-error {
  color: var(--edu-color-error-default);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}

.image-upload {
  margin-top: var(--spacing-sm);
}

.image-preview {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 24px;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: var(--radius-full);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }

  svg {
    width: 12px;
    height: 12px;
  }
}

.image-upload-btn {
  width: 200px;
  height: 120px;
  border: 2px dashed var(--edu-color-gray-300);
  border-radius: var(--radius-lg);
  background-color: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);

  &:hover {
    border-color: var(--edu-primary-500);
    color: var(--edu-primary-500);
    background-color: var(--edu-primary-50);
  }

  svg {
    width: 32px;
    height: 32px;
  }
}

.parameter-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-base) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--edu-color-gray-200);
}

.range-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.range-input span {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.objective-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.objective-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.objective-remove {
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-error-light);
    border-color: var(--edu-color-error-default);
    color: var(--edu-color-error-default);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.steps-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.step-item {
  border: 1px solid var(--edu-color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-base);
  background-color: var(--bg-elevated);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-base);
}

.step-number {
  width: 32px;
  height: 32px;
  background-color: var(--edu-primary-500);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

.step-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.step-control-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover:not(:disabled) {
    background-color: var(--edu-color-gray-100);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--danger:hover:not(:disabled) {
    background-color: var(--edu-color-error-light);
    border-color: var(--edu-color-error-default);
    color: var(--edu-color-error-default);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.resources-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.resource-section {
  margin-bottom: var(--spacing-xl);
}

.reference-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.reference-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.reference-remove {
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid var(--edu-color-gray-300);
  border-radius: var(--radius-base);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-error-light);
    border-color: var(--edu-color-error-default);
    color: var(--edu-color-error-default);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
}

.template-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.template-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.auto-save-indicator {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--edu-shadow-lg);
  z-index: var(--edu-z-dropdown);
}

.auto-save-icon {
  width: 20px;
  height: 20px;
  color: var(--edu-color-success-default);
}

.auto-save-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

// 响应式设计
@media (max-width: 1024px) {
  .lab-editor__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-base);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .editor-sidebar {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .lab-editor__content {
    flex-direction: column;
  }

  .editor-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-nav {
    display: flex;
    padding: var(--spacing-base);
    gap: var(--spacing-sm);
    overflow-x: auto;
  }

  .nav-item {
    flex-shrink: 0;
    padding: var(--spacing-sm);
    border-bottom: 2px solid transparent;

    &--active::before {
      display: none;
    }

    &--active {
      border-bottom-color: var(--edu-primary-500);
    }
  }

  .nav-label {
    display: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }

  .class-selector {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .lab-editor__header {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .editor-sidebar {
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
  }

  .nav-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .nav-item--active {
    background-color: rgba(33, 150, 243, 0.1);
  }

  .form-input,
  .form-select,
  .form-textarea {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .step-item {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .auto-save-indicator {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);
  }
}
</style>