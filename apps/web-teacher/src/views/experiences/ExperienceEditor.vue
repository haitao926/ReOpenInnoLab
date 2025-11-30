<template>
  <div class="experience-editor">
    <!-- 页面头部 -->
    <div class="editor-header">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/experiences" class="breadcrumb-link">体验库</router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ isEditing ? '编辑体验' : '创建体验' }}</span>
        </div>
        <h1 class="page-title">{{ isEditing ? '编辑体验' : '创建新体验' }}</h1>
      </div>
      <div class="header-actions">
        <EduButton variant="text" @click="saveDraft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          保存草稿
        </EduButton>
        <EduButton variant="secondary" @click="previewExperience">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11 8-11 8z" />
            <path d="M8 12s2-4 4-4 4 4 4 4-2 4-4 4z" />
          </svg>
          预览
        </EduButton>
        <EduButton variant="primary" :loading="publishing" @click="publishExperience">
          {{ isEditing ? '保存修改' : '发布体验' }}
        </EduButton>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-content">
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
                <polyline points="20 6 9 17 4 12" />
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
              <label class="form-label required">体验标题</label>
              <EduInput
                v-model="experienceData.title"
                placeholder="请输入体验标题"
                :error="errors.title"
                @input="validateField('title')"
              />
              <div v-if="errors.title" class="form-error">{{ errors.title }}</div>
            </div>

            <div class="form-group">
              <label class="form-label required">体验类型</label>
              <div class="type-selector">
                <div
                  v-for="type in experienceTypes"
                  :key="type.value"
                  class="type-option"
                  :class="{ 'type-option--selected': experienceData.type === type.value }"
                  @click="experienceData.type = type.value"
                >
                  <div class="type-icon">
                    <component :is="type.icon" />
                  </div>
                  <div class="type-info">
                    <h4>{{ type.label }}</h4>
                    <p>{{ type.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">体验描述</label>
              <textarea
                v-model="experienceData.description"
                class="form-textarea"
                placeholder="请详细描述体验内容、目的和预期效果"
                rows="4"
                @input="validateField('description')"
              ></textarea>
              <div v-if="errors.description" class="form-error">{{ errors.description }}</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">学科</label>
                <select v-model="experienceData.metadata.subject" class="form-select">
                  <option value="">请选择学科</option>
                  <option value="math">数学</option>
                  <option value="physics">物理</option>
                  <option value="chemistry">化学</option>
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
              </div>

              <div class="form-group">
                <label class="form-label required">年级</label>
                <select v-model="experienceData.metadata.gradeLevel" class="form-select">
                  <option value="">请选择年级</option>
                  <option value="elementary">小学</option>
                  <option value="middle">初中</option>
                  <option value="high">高中</option>
                  <option value="university">大学</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">预计时长（分钟）</label>
                <EduInput
                  v-model.number="experienceData.config.duration"
                  type="number"
                  placeholder="请输入预计时长"
                />
              </div>

              <div class="form-group">
                <label class="form-label">难度等级</label>
                <select v-model="experienceData.metadata.difficulty" class="form-select">
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">标签</label>
              <div class="tag-inputs">
                <div v-for="(tag, index) in experienceData.tags" :key="index" class="tag-input">
                  <EduInput v-model="experienceData.tags[index]" placeholder="输入标签" />
                  <EduButton variant="text" size="sm" @click="removeTag(index)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </EduButton>
                </div>
                <EduButton variant="outline" size="sm" @click="addTag">+ 添加标签</EduButton>
              </div>
            </div>
          </EduCard>
        </div>

        <!-- 内容编辑 -->
        <div v-if="currentSection === 'content'" class="editor-section">
          <!-- Quiz 内容 -->
          <QuizBuilder
            v-if="experienceData.type === 'quiz'"
            v-model="experienceData.content.questions"
          />

          <!-- Poll 内容 -->
          <PollBuilder
            v-else-if="experienceData.type === 'poll'"
            v-model="experienceData.content.poll"
          />

          <!-- 视频内容 -->
          <VideoBuilder
            v-else-if="experienceData.type === 'video'"
            v-model="experienceData.content.video"
          />

          <!-- 自定义 HTML -->
          <HTMLBuilder
            v-else-if="experienceData.type === 'custom'"
            v-model="experienceData.content.html"
          />
        </div>

        <!-- 配置设置 -->
        <div v-if="currentSection === 'config'" class="editor-section">
          <EduCard title="运行配置" variant="default">
            <div class="form-group">
              <label>
                <input v-model="experienceData.config.allowRetries" type="checkbox" />
                允许重试
              </label>
              <EduInput
                v-if="experienceData.config.allowRetries"
                v-model.number="experienceData.config.maxRetries"
                type="number"
                placeholder="最大重试次数"
                :min="1"
                :max="5"
                class="mt-2"
              />
            </div>

            <div class="form-group">
              <label>
                <input v-model="experienceData.config.requireRealName" type="checkbox" />
                要求实名参与
              </label>
            </div>

            <div class="form-group">
              <label>
                <input v-model="experienceData.config.showResult" type="checkbox" />
                完成后显示结果
              </label>
            </div>

            <div class="form-group">
              <label>
                <input v-model="experienceData.config.showCorrectAnswer" type="checkbox" />
                显示正确答案
              </label>
            </div>

            <div class="form-group">
              <label>
                <input v-model="experienceData.config.allowSkip" type="checkbox" />
                允许跳过
              </label>
            </div>

            <div class="form-group">
              <label>
                <input v-model="experienceData.config.collectAnalytics" type="checkbox" />
                收集分析数据
              </label>
            </div>

            <div class="form-group">
              <label>及格分数（%）</label>
              <EduInput
                v-model.number="experienceData.config.passingScore"
                type="number"
                :min="0"
                :max="100"
              />
            </div>
          </EduCard>

          <EduCard title="安全策略" variant="default" class="mt-4">
            <div class="form-group">
              <label>内容安全策略 (CSP)</label>
              <textarea
                v-model="experienceData.securityPolicy.csp"
                class="form-textarea"
                placeholder="default-src 'self'; script-src 'self' 'unsafe-inline'"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Sandbox 权限</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    v-model="experienceData.securityPolicy.sandboxFlags"
                    type="checkbox"
                    value="allow-scripts"
                  />
                  允许脚本执行
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="experienceData.securityPolicy.sandboxFlags"
                    type="checkbox"
                    value="allow-same-origin"
                  />
                  允许同源请求
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="experienceData.securityPolicy.sandboxFlags"
                    type="checkbox"
                    value="allow-forms"
                  />
                  允许表单提交
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>允许的来源域名</label>
              <div class="domain-inputs">
                <div
                  v-for="(domain, index) in experienceData.securityPolicy.allowedOrigins"
                  :key="index"
                  class="domain-input"
                >
                  <EduInput
                    v-model="experienceData.securityPolicy.allowedOrigins[index]"
                    placeholder="https://example.com"
                  />
                  <EduButton variant="text" size="sm" @click="removeDomain(index)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </EduButton>
                </div>
                <EduButton variant="outline" size="sm" @click="addDomain">+ 添加域名</EduButton>
              </div>
            </div>
          </EduCard>
        </div>

        <!-- 预览设置 -->
        <div v-if="currentSection === 'preview'" class="editor-section">
          <EduCard title="预览与测试" variant="default">
            <div class="preview-container">
              <div class="preview-header">
                <h3>体验预览</h3>
                <div class="preview-actions">
                  <EduButton variant="outline" @click="testExperience">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    测试运行
                  </EduButton>
                  <EduButton variant="outline" @click="generateQRCode">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    生成二维码
                  </EduButton>
                </div>
              </div>

              <div class="preview-frame">
                <ExperiencePreview v-if="previewData" :experience="previewData" :mode="'preview'" />
                <div v-else class="preview-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <p>点击"测试运行"预览体验效果</p>
                </div>
              </div>
            </div>
          </EduCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { EduCard, EduButton, EduInput } from '@reopeninnolab/ui-kit'
  import { ExperienceApiService } from '@/api/experience'
  import QuizBuilder from '@/components/experiences/QuizBuilder.vue'
  import PollBuilder from '@/components/experiences/PollBuilder.vue'
  import VideoBuilder from '@/components/experiences/VideoBuilder.vue'
  import HTMLBuilder from '@/components/experiences/HTMLBuilder.vue'
  import ExperiencePreview from '@/components/experiences/ExperiencePreview.vue'
  import type {
    ExperienceTemplate,
    CreateExperienceTemplateDto,
    ExperienceContent,
    ExperienceConfig,
    SecurityPolicy,
    MessageSchema
  } from '@/types/experience'

  const route = useRoute()
  const router = useRouter()

  // 状态
  const isEditing = computed(() => !!route.params.id)
  const currentSection = ref('basic')
  const publishing = ref(false)
  const previewData = ref<ExperienceTemplate>()

  // 表单数据
  const experienceData = reactive<CreateExperienceTemplateDto>({
    type: 'quiz',
    title: '',
    description: '',
    content: {} as ExperienceContent,
    config: {
      duration: 10,
      allowRetries: false,
      maxRetries: 3,
      requireRealName: false,
      showResult: true,
      showCorrectAnswer: false,
      allowSkip: false,
      collectAnalytics: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      timeLimit: 0,
      passingScore: 60,
      gradeAutomatically: true,
      allowReview: false,
      showProgressBar: true,
      allowPause: false
    } as ExperienceConfig,
    securityPolicy: {
      csp: "default-src 'self'; script-src 'self' 'unsafe-inline'",
      sandboxFlags: ['allow-scripts', 'allow-same-origin'],
      allowedOrigins: [],
      allowedScripts: [],
      blockedDomains: [],
      allowCamera: false,
      allowMicrophone: false,
      allowFullscreen: true
    } as SecurityPolicy,
    postMessageSchema: {
      events: [
        { type: 'start', payload: {}, required: true },
        { type: 'progress', payload: { progress: 0 }, required: false },
        { type: 'complete', payload: { score: 0 }, required: true }
      ],
      schema: {}
    } as MessageSchema,
    tags: [],
    metadata: {
      gradeLevel: '',
      subject: '',
      topics: [],
      difficulty: 'medium',
      estimatedDuration: 10,
      learningObjectives: [],
      prerequisites: []
    }
  })

  // 表单验证
  const errors = ref<Record<string, string>>({})

  const experienceTypes = [
    {
      value: 'quiz',
      label: '测验',
      description: '创建选择题、填空题等多种题型',
      icon: 'QuizIcon'
    },
    {
      value: 'poll',
      label: '投票',
      description: '快速收集学生意见和反馈',
      icon: 'PollIcon'
    },
    {
      value: 'video',
      label: '互动视频',
      description: '带有点击、暂停等交互的视频',
      icon: 'VideoIcon'
    },
    {
      value: 'custom',
      label: '自定义 HTML',
      description: '上传或编写自定义的 HTML 互动内容',
      icon: 'CodeIcon'
    }
  ]

  // 编辑器导航
  const editorSections = [
    { id: 'basic', label: '基本信息', icon: 'Info' },
    { id: 'content', label: '内容编辑', icon: 'Edit' },
    { id: 'config', label: '配置设置', icon: 'Settings' },
    { id: 'preview', label: '预览测试', icon: 'Eye' }
  ]

  // 方法
  const validateField = (field: string) => {
    delete errors.value[field]

    switch (field) {
      case 'title':
        if (!experienceData.title.trim()) {
          errors.value.title = '请输入体验标题'
        }
        break
      case 'description':
        if (!experienceData.description.trim()) {
          errors.value.description = '请输入体验描述'
        }
        break
    }
  }

  const validateForm = (): boolean => {
    const fields = ['title', 'description']
    fields.forEach(field => validateField(field))
    return Object.keys(errors.value).length === 0
  }

  const getSectionValidationStatus = (sectionId: string): string | null => {
    switch (sectionId) {
      case 'basic':
        return experienceData.title && experienceData.description ? 'valid' : null
      case 'content':
        return hasContent() ? 'valid' : null
      default:
        return null
    }
  }

  const hasContent = (): boolean => {
    switch (experienceData.type) {
      case 'quiz':
        return experienceData.content.questions && experienceData.content.questions.length > 0
      case 'poll':
        return !!experienceData.content.poll
      case 'video':
        return !!experienceData.content.video
      case 'custom':
        return !!experienceData.content.html
      default:
        return false
    }
  }

  const saveDraft = async () => {
    // TODO: 实现保存草稿逻辑
    console.log('保存草稿')
  }

  const previewExperience = () => {
    currentSection.value = 'preview'
  }

  const testExperience = () => {
    previewData.value = {
      ...experienceData,
      id: 'preview',
      status: 'draft',
      version: 1,
      thumbnailUrl: '',
      previewUrl: '',
      createdBy: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resourceRef: ''
    }
  }

  const generateQRCode = () => {
    // TODO: 生成二维码
    console.log('生成二维码')
  }

  const publishExperience = async () => {
    if (!validateForm()) {
      currentSection.value = 'basic'
      return
    }

    publishing.value = true
    try {
      if (isEditing.value) {
        await ExperienceApiService.updateExperienceTemplate(
          route.params.id as string,
          experienceData
        )
      } else {
        await ExperienceApiService.createExperienceTemplate(experienceData)
      }
      router.push('/experiences')
    } catch (error) {
      console.error('发布失败:', error)
    } finally {
      publishing.value = false
    }
  }

  const addTag = () => {
    experienceData.tags.push('')
  }

  const removeTag = (index: number) => {
    experienceData.tags.splice(index, 1)
  }

  const addDomain = () => {
    experienceData.securityPolicy.allowedOrigins.push('')
  }

  const removeDomain = (index: number) => {
    experienceData.securityPolicy.allowedOrigins.splice(index, 1)
  }

  // 生命周期
  onMounted(() => {
    if (isEditing.value) {
      // TODO: 加载体验数据
      console.log('加载体验数据:', route.params.id)
    }
  })
</script>

<style lang="scss" scoped>
  .experience-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: var(--bg-primary);
  }

  .editor-header {
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

  .editor-content {
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

  .type-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-base);
  }

  .type-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-base);
    border: 2px solid var(--edu-color-gray-200);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      border-color: var(--edu-primary-300);
    }

    &--selected {
      border-color: var(--edu-primary-500);
      background-color: var(--edu-primary-50);
    }
  }

  .type-icon {
    width: 48px;
    height: 48px;
    color: var(--edu-primary-500);
  }

  .type-info h4 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--text-primary);
  }

  .type-info p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .tag-inputs,
  .domain-inputs {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .tag-input,
  .domain-input {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
  }

  .checkbox-label input[type='checkbox'] {
    width: 18px;
    height: 18px;
  }

  .preview-container {
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);

      h3 {
        margin: 0;
        color: var(--text-primary);
      }
    }

    .preview-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .preview-frame {
      height: 600px;
      border: 1px solid var(--edu-color-gray-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .preview-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);

      svg {
        width: 64px;
        height: 64px;
        margin-bottom: var(--spacing-base);
      }
    }
  }

  // 响应式设计
  @media (max-width: 1024px) {
    .type-selector {
      grid-template-columns: 1fr;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .editor-content {
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
  }
</style>
