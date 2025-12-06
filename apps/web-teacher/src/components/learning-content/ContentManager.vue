<template>
  <div class="interactive-experience-manager">
    <!-- 互动体验头部 -->
    <div class="manager-header">
      <div class="header-left">
        <h3>
          <el-icon><Monitor /></el-icon>
          互动体验管理
        </h3>
        <p class="header-description">上传和管理HTML互动内容，提供沉浸式学习体验</p>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="showUploadModal = true">
            <el-icon><Upload /></el-icon>
            上传互动内容
          </el-button>
          <el-button @click="refreshList">
            <el-icon><Refresh /></el-icon>
            刷新列表
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-controls">
        <EduInput
          v-model="searchKeyword"
          placeholder="搜索互动内容..."
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </EduInput>

        <el-select v-model="filterSubject" placeholder="适用学科" clearable class="subject-select">
          <el-option
            v-for="subject in subjects"
            :key="subject.value"
            :label="subject.label"
            :value="subject.value"
          />
        </el-select>

        <EduButton variant="secondary" @click="resetFilters" class="reset-btn">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </EduButton>
      </div>
    </div>

    <!-- 互动内容列表 -->
    <div class="content-grid">
      <EduCard
        v-for="content in filteredContentList"
        :key="content.id"
        variant="default"
        size="md"
        hoverable
        :title="content.title"
        :subtitle="content.description"
        :class="{ 'is-featured': content.featured }"
        class="content-card"
      >
        <template #header>
          <div class="card-header-content">
            <div class="content-type-badge">
              <EduTag :variant="getTypeVariant(content.type)" size="sm">
                {{ getTypeLabel(content.type) }}
              </EduTag>
            </div>
            <div class="content-actions">
              <el-dropdown @command="handleContentAction">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'edit', content }">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'duplicate', content }">
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'export', content }">
                      <el-icon><Download /></el-icon>
                      导出
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', content }" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <!-- 缩略图区域 -->
        <div class="card-thumbnail" @click="previewContent(content)">
          <div class="thumbnail-container">
            <img
              v-if="content.thumbnail"
              :src="content.thumbnail"
              :alt="content.title"
              class="thumbnail-image"
            />
            <div v-else class="thumbnail-placeholder">
              <el-icon class="content-type-icon">
                <component :is="getContentIcon(content.type)" />
              </el-icon>
            </div>
            <div class="thumbnail-overlay">
              <EduButton variant="primary" size="sm">
                <el-icon class="preview-icon"><View /></el-icon>
                预览
              </EduButton>
            </div>
          </div>
        </div>

        <!-- 元数据信息 -->
        <div class="content-meta">
          <div class="meta-item">
            <el-icon class="meta-icon meta-icon-user"><User /></el-icon>
            <span>{{ content.author }}</span>
          </div>
          <div class="meta-item">
            <el-icon class="meta-icon meta-icon-time"><Clock /></el-icon>
            <span>{{ formatDate(content.createdAt) }}</span>
          </div>
          <div class="meta-item">
            <el-icon class="meta-icon meta-icon-stats"><DataAnalysis /></el-icon>
            <span>{{ content.usageCount }}次使用</span>
          </div>
        </div>

        <!-- 标签 -->
        <div class="content-tags">
          <EduTag
            v-for="tag in content.tags"
            :key="tag"
            variant="default"
            size="sm"
            class="tag-item"
          >
            {{ tag }}
          </EduTag>
        </div>

        <!-- 底部操作区 -->
        <template #footer>
          <div class="content-footer">
            <div class="content-stats">
              <div class="stat-item">
                <span class="stat-label">评分</span>
                <div class="rating">
                  <el-icon
                    v-for="i in 5"
                    :key="i"
                    :class="{ 'is-active': i <= content.rating }"
                  >
                    <Star />
                  </el-icon>
                  <span class="rating-value">{{ content.rating }}/5</span>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-label">时长</span>
                <span>{{ content.duration }}分钟</span>
              </div>
            </div>
            <EduButton variant="primary" size="sm" @click="assignToCourse(content)">
              <el-icon><Plus /></el-icon>
              分配到课程
            </EduButton>
          </div>
        </template>
      </EduCard>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredContentList.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <h4>暂无互动内容</h4>
      <p>上传您的第一个HTML互动内容，开始创建沉浸式学习体验</p>
      <EduButton variant="primary" @click="showUploadModal = true">
        <el-icon><Upload /></el-icon>
        上传互动内容
      </EduButton>
    </div>

    <!-- 上传模态框 -->
    <el-dialog
      v-model="showUploadModal"
      title="上传互动内容"
      width="600px"
      :before-close="handleCloseUpload"
    >
      <div class="upload-content">
        <el-steps :active="uploadStep" align-center>
          <el-step title="选择文件" description="上传HTML或ZIP包" />
          <el-step title="配置并预览" description="设置基本信息并实时预览" />
        </el-steps>

        <div class="upload-form">
          <!-- 步骤1: 文件上传 -->
          <div v-if="uploadStep === 0" class="upload-step">
            <div class="upload-area">
              <el-upload
                drag
                :file-list="uploadFiles"
                :before-upload="beforeUpload"
                :http-request="handleFileUpload"
                :on-change="handleFileChange"
                accept=".html,.zip"
              >
                <el-icon class="el-icon--upload"><Upload /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 .html 文件或 .zip 压缩包（需包含 index.html），文件大小不超过 50MB
                  </div>
                </template>
              </el-upload>
            </div>

            <div v-if="uploadFiles.length > 0" class="upload-preview">
              <h4>文件预览</h4>
              <div class="file-list">
                <div
                  v-for="file in uploadFiles"
                  :key="file.uid"
                  class="file-item"
                >
                  <el-icon><Document /></el-icon>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-size">{{ formatFileSize(file.size) }}</div>
                  </div>
                  <div class="file-status">
                    <el-icon v-if="file.status === 'success'" class="success-icon">
                      <SuccessFilled />
                    </el-icon>
                    <el-icon v-else-if="file.status === 'uploading'" class="uploading-icon">
                      <Loading />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 步骤2: 内容配置 -->
          <div v-if="uploadStep === 1" class="config-step">
            <div class="config-layout">
              <!-- 左侧：表单配置 -->
              <div class="form-section">
                <el-form :model="contentForm" :rules="contentRules" label-width="100px">
              <el-form-item label="标题" prop="title">
                <el-input v-model="contentForm.title" placeholder="输入互动内容标题" />
              </el-form-item>
              <el-form-item label="描述" prop="description">
                <el-input
                  v-model="contentForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="描述这个互动内容的功能和用途"
                />
              </el-form-item>
              <el-form-item label="类型" prop="type">
                <el-select v-model="contentForm.type" placeholder="选择内容类型">
                  <el-option label="HTML单页" value="html" />
                  <el-option label="互动包" value="package" />
                  <el-option label="模拟器" value="simulation" />
                  <el-option label="游戏" value="game" />
                </el-select>
              </el-form-item>
              <el-form-item label="适用学科" prop="subject">
                <el-select v-model="contentForm.subject" placeholder="选择适用学科">
                  <el-option
                    v-for="subject in subjects"
                    :key="subject.value"
                    :label="subject.label"
                    :value="subject.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="年级" prop="grade">
                <el-select v-model="contentForm.grade" placeholder="选择适用年级">
                  <el-option
                    v-for="grade in grades"
                    :key="grade.value"
                    :label="grade.label"
                    :value="grade.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="预计时长" prop="duration">
                <el-input-number
                  v-model="contentForm.duration"
                  :min="1"
                  :max="120"
                  controls-position="right"
                />
                <span class="unit">分钟</span>
              </el-form-item>
              <el-form-item label="标签">
                <el-select
                  v-model="contentForm.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="添加标签"
                >
                  <el-option
                    v-for="tag in suggestedTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="预览设置">
                <el-checkbox-group v-model="contentForm.settings">
                  <el-checkbox label="fullscreen">支持全屏</el-checkbox>
                  <el-checkbox label="responsive">响应式设计</el-checkbox>
                  <el-checkbox label="resize">可调整大小</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
              </div>

              <!-- 右侧：AI 建议面板 -->
              <div class="ai-panel">
                <EduCard variant="glass" size="sm" class="ai-suggestions-card">
                  <template #header>
                    <div class="ai-panel-header">
                      <el-icon><Star /></el-icon>
                      <span>AI 智能建议</span>
                      <EduButton
                        variant="secondary"
                        size="sm"
                        @click="analyzeWithAI"
                        :loading="contentForm.isAnalyzing"
                        :disabled="uploadFiles.length === 0"
                      >
                        {{ contentForm.isAnalyzing ? '分析中...' : '重新分析' }}
                      </EduButton>
                    </div>
                  </template>

                  <!-- AI 元数据建议 -->
                  <div v-if="contentForm.aiSuggestions" class="ai-suggestions">
                    <div class="suggestion-group">
                      <h5>推荐标题</h5>
                      <p class="suggestion-text">{{ contentForm.aiSuggestions.title }}</p>
                      <EduButton variant="secondary" size="sm" @click="applySuggestion('title')">
                        采用
                      </EduButton>
                    </div>

                    <div class="suggestion-group">
                      <h5>推荐描述</h5>
                      <p class="suggestion-text">{{ contentForm.aiSuggestions.description }}</p>
                      <EduButton variant="secondary" size="sm" @click="applySuggestion('description')">
                        采用
                      </EduButton>
                    </div>

                    <div class="suggestion-group">
                      <h5>推荐标签</h5>
                      <div class="tags-suggestion">
                        <EduTag
                          v-for="tag in contentForm.aiSuggestions.tags"
                          :key="tag"
                          variant="default"
                          size="sm"
                          class="tag-item"
                        >
                          {{ tag }}
                        </EduTag>
                      </div>
                      <EduButton variant="secondary" size="sm" @click="applySuggestion('tags')">
                        采用全部
                      </EduButton>
                    </div>

                    <div class="suggestion-group">
                      <h5>适用年级</h5>
                      <p>{{ contentForm.aiSuggestions.gradeBand?.join(', ') }}</p>
                      <EduButton variant="secondary" size="sm" @click="applySuggestion('gradeBand')">
                        采用
                      </EduButton>
                    </div>
                  </div>

                  <!-- 安全分析结果 -->
                  <div v-if="contentForm.securityAnalysis" class="security-analysis">
                    <div class="analysis-group">
                      <h5>安全等级</h5>
                      <EduTag
                        :variant="contentForm.securityAnalysis.riskLevel === 'low' ? 'success' :
                               contentForm.securityAnalysis.riskLevel === 'medium' ? 'warning' : 'error'"
                        size="sm"
                      >
                        {{ contentForm.securityAnalysis.riskLevel }}
                      </EduTag>
                    </div>

                    <div v-if="contentForm.securityAnalysis.riskFlags?.length" class="analysis-group">
                      <h5>风险点</h5>
                      <ul class="risk-list">
                        <li v-for="risk in contentForm.securityAnalysis.riskFlags" :key="risk">
                          {{ risk }}
                        </li>
                      </ul>
                    </div>

                    <div v-if="contentForm.securityAnalysis.accessibilityIssues?.length" class="analysis-group">
                      <h5>可访问性建议</h5>
                      <ul class="accessibility-list">
                        <li v-for="issue in contentForm.securityAnalysis.accessibilityIssues" :key="issue">
                          {{ issue }}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- 空 AI 分析状态 -->
                  <div v-if="!contentForm.aiSuggestions && !contentForm.isAnalyzing" class="ai-empty">
                    <el-icon class="ai-icon"><Star /></el-icon>
                    <p>上传文件后，AI 将为您智能分析内容并生成元数据建议</p>
                  </div>
                </EduCard>
              </div>

              <!-- 简单预览区域 -->
              <div class="preview-section" v-if="uploadFiles.length > 0">
                <EduCard variant="glass" size="sm" class="preview-card">
                  <template #header>
                    <div class="preview-header">
                      <el-icon><View /></el-icon>
                      <span>快速预览</span>
                    </div>
                  </template>
                  <div class="preview-container-small">
                    <iframe
                      v-if="previewUrl"
                      :src="previewUrl"
                      class="preview-iframe-small"
                      frameborder="0"
                    />
                    <div v-else class="preview-placeholder-small">
                      <el-icon><Document /></el-icon>
                      <p>准备预览...</p>
                    </div>
                  </div>
                </EduCard>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseUpload">取消</el-button>
          <el-button v-if="uploadStep > 0" @click="previousStep">上一步</el-button>
          <el-button
            v-if="uploadStep < 1"
            type="primary"
            @click="nextStep"
            :disabled="!canProceed"
          >
            下一步
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="uploading"
            @click="completeUpload"
          >
            发布互动内容
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览模态框 -->
    <el-dialog
      v-model="showPreviewModal"
      :title="currentPreviewContent?.title"
      width="90%"
      fullscreen
      :before-close="handleClosePreview"
    >
      <div class="preview-modal">
        <div class="preview-toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button @click="reloadPreview">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button @click="toggleFullscreen">
                <el-icon><FullScreen /></el-icon>
                全屏
              </el-button>
            </el-button-group>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" @click="useInCourse">
              <el-icon><Plus /></el-icon>
              用于课程
            </el-button>
          </div>
        </div>
        <div class="preview-frame">
          <iframe
            v-if="currentPreviewContent?.url"
            :src="currentPreviewContent.url"
            class="content-iframe"
            frameborder="0"
            @load="handlePreviewLoad"
            @error="handlePreviewError"
          />
          <div v-else class="preview-error">
            <el-icon><Warning /></el-icon>
            <p>预览加载失败</p>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 分配到课程对话框 -->
    <el-dialog
      v-model="showAssignModal"
      title="分配到课程"
      width="500px"
    >
      <div class="assign-content">
        <el-form :model="assignForm" label-width="100px">
          <el-form-item label="选择课程">
            <el-select
              v-model="assignForm.courseId"
              placeholder="选择要分配的课程"
              style="width: 100%"
            >
              <el-option
                v-for="course in availableCourses"
                :key="course.id"
                :label="course.title"
                :value="course.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分配到章节">
            <el-select
              v-model="assignForm.chapterId"
              placeholder="选择章节（可选）"
              style="width: 100%"
              :disabled="!assignForm.courseId"
            >
              <el-option
                v-for="chapter in selectedCourseChapters"
                :key="chapter.id"
                :label="chapter.title"
                :value="chapter.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAssignModal = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor, Upload, Refresh, Search, RefreshLeft, View, MoreFilled,
  Edit, CopyDocument, Download, Delete, User, Clock, DataAnalysis,
  Star, Plus, Document, SuccessFilled, Loading, FullScreen, Warning
} from '@element-plus/icons-vue'
import { subjects, grades, suggestedTags } from '@/config/courseData'
import { EduCard, EduButton, EduInput, EduTag } from '@reopeninnolab/ui-kit'
import { AIService } from '@/services/ai'

// .acl 标准的交互体验数据结构
interface InteractiveExperienceACL {
  meta: {
    version: string
    type: "experience"
    id: string
    createdAt: string
    updatedAt: string
  }
  experienceInfo: {
    title: string
    description: string
    type: "html" | "package"
    subject: string
    gradeBand: string[]
    estimatedDuration: number
    tags: string[]
    entryPoint: string
  }
  resourceInfo: {
    storageRef: string
    hash: string
    size: number
    assets: string[]
  }
  securityInfo: {
    scanStatus: "pending" | "passed" | "failed"
    riskFlags: string[]
    cspHeaders: Record<string, string>
  }
  aiInsights?: {
    qualityScore: number
    suggestedTags: string[]
    accessibilityIssues: string[]
    recommendedGradeBand: string[]
  }
  deployment: {
    status: "draft" | "reviewing" | "published"
    version: number
    createdBy: string
    approvedBy?: string
  }
}

// 保持向后兼容的交互内容接口
type InteractiveContent = {
  id: string
  acl: InteractiveExperienceACL
  // 兼容旧接口的扩展属性
  thumbnail?: string
  rating: number
  usageCount: number
  featured: boolean
} & {
  // 便捷属性访问器 - 通过计算属性实现
  readonly title: string
  readonly description: string
  readonly type: string
  readonly subject: string
  readonly grade: string
  readonly tags: string[]
  readonly duration: number
  readonly url: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly status: string
  readonly author: string
}

// 创建交互内容对象的辅助函数
const createInteractiveContent = (
  id: string,
  acl: InteractiveExperienceACL,
  thumbnail?: string,
  rating = 0,
  usageCount = 0,
  featured = false
): InteractiveContent => {
  const base = {
    id,
    acl,
    thumbnail,
    rating,
    usageCount,
    featured
  }

  // 使用 Object.defineProperties 添加计算属性
  return Object.defineProperties(base, {
    title: {
      get: () => acl.experienceInfo.title,
      enumerable: true
    },
    description: {
      get: () => acl.experienceInfo.description,
      enumerable: true
    },
    type: {
      get: () => acl.experienceInfo.type,
      enumerable: true
    },
    subject: {
      get: () => acl.experienceInfo.subject,
      enumerable: true
    },
    grade: {
      get: () => acl.experienceInfo.gradeBand[0] || '',
      enumerable: true
    },
    tags: {
      get: () => acl.experienceInfo.tags,
      enumerable: true
    },
    duration: {
      get: () => acl.experienceInfo.estimatedDuration,
      enumerable: true
    },
    url: {
      get: () => acl.resourceInfo.storageRef,
      enumerable: true
    },
    createdAt: {
      get: () => new Date(acl.meta.createdAt),
      enumerable: true
    },
    updatedAt: {
      get: () => new Date(acl.meta.updatedAt),
      enumerable: true
    },
    status: {
      get: () => acl.deployment.status,
      enumerable: true
    },
    author: {
      get: () => acl.deployment.createdBy,
      enumerable: true
    }
  }) as InteractiveContent
}

// 响应式数据
const searchKeyword = ref('')
const filterType = ref('')
const filterSubject = ref('')
const contentList = ref<InteractiveContent[]>([])
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const showAssignModal = ref(false)
const currentPreviewContent = ref<InteractiveContent | null>(null)
const uploadStep = ref(0)
const uploadFiles = ref<any[]>([])
const uploading = ref(false)
const previewUrl = ref('')
const selectedContent = ref<InteractiveContent | null>(null)
const availableCourses = ref<any[]>([])
const selectedCourseChapters = ref<any[]>([])

// AI 服务实例
const aiServiceInstance = new AIService({
  providers: {
    openai: {
      name: 'OpenAI',
      apiKey: (globalThis as any).__VITE_OPENAI_API_KEY__ || 'demo-key',
      baseUrl: (globalThis as any).__VITE_AI_BASE_URL__ || 'http://localhost:8080',
      model: 'gpt-3.5-turbo'
    }
  },
  defaultProvider: 'openai',
  requestTimeout: 30000,
  maxRetries: 3
})

// 表单数据
const contentForm = ref({
  title: '',
  description: '',
  type: 'html',
  subject: '',
  grade: '',
  duration: 30,
  tags: [],
  settings: ['fullscreen', 'responsive'],
  aiSuggestions: null as any,
  securityAnalysis: null as any,
  isAnalyzing: false
})

const assignForm = ref({
  courseId: '',
  chapterId: ''
})

// 表单验证规则
const contentRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在10到500个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请输入预计时长', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '时长在1到120分钟之间', trigger: 'blur' }
  ]
}

// 计算属性
const filteredContentList = computed(() => {
  let filtered = contentList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(content =>
      content.title.toLowerCase().includes(keyword) ||
      content.description.toLowerCase().includes(keyword) ||
      content.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  if (filterSubject.value) {
    filtered = filtered.filter(content => content.subject === filterSubject.value)
  }

  return filtered.sort((a, b) => {
    // 精选内容优先
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    // 按使用次数排序
    return b.usageCount - a.usageCount
  })
})

const canProceed = computed(() => {
  switch (uploadStep.value) {
    case 0:
      return uploadFiles.value.length > 0
    case 1:
      return contentForm.value.title && contentForm.value.description && contentForm.value.subject
    default:
      return true
  }
})

// 方法
const loadContentList = async () => {
  try {
    // 模拟加载互动内容列表
    await new Promise(resolve => setTimeout(resolve, 500))

    const demoData: InteractiveContent[] = [
      createInteractiveContent(
        '1',
        {
          meta: {
            version: '1.0.0',
            type: 'experience',
            id: 'exp_001',
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-20T00:00:00Z'
          },
          experienceInfo: {
            title: '物理电路模拟器',
            description: '交互式电路搭建和实验模拟器，支持多种电子元件和测量工具',
            type: 'package',
            subject: 'physics',
            gradeBand: ['grade10'],
            estimatedDuration: 45,
            tags: ['物理', '电路', '模拟', '实验'],
            entryPoint: 'index.html'
          },
          resourceInfo: {
            storageRef: 'resource://experience/exp_001/v1',
            hash: 'sha256:abc123...',
            size: 2048576,
            assets: ['index.html', 'style.css', 'script.js', 'assets/']
          },
          securityInfo: {
            scanStatus: 'passed',
            riskFlags: [],
            cspHeaders: {
              'default-src': "'self'",
              'script-src': "'self' 'unsafe-inline'"
            }
          },
          aiInsights: {
            qualityScore: 92,
            suggestedTags: ['电路实验', '物理模拟'],
            accessibilityIssues: ['缺少alt属性'],
            recommendedGradeBand: ['grade9', 'grade10', 'grade11']
          },
          deployment: {
            status: 'published',
            version: 1,
            createdBy: '张老师'
          }
        },
        '/thumbnails/circuit-simulator.jpg',
        5,
        128,
        true
      ),
      createInteractiveContent(
        '2',
        {
          meta: {
            version: '1.0.0',
            type: 'experience',
            id: 'exp_002',
            createdAt: '2024-01-10T00:00:00Z',
            updatedAt: '2024-01-18T00:00:00Z'
          },
          experienceInfo: {
            title: '化学分子结构3D',
            description: '3D分子结构可视化工具，支持旋转、缩放和元素信息展示',
            type: 'html',
            subject: 'chemistry',
            gradeBand: ['grade11'],
            estimatedDuration: 30,
            tags: ['化学', '分子', '3D', '可视化'],
            entryPoint: 'index.html'
          },
          resourceInfo: {
            storageRef: 'resource://experience/exp_002/v1',
            hash: 'sha256:def456...',
            size: 1024000,
            assets: ['index.html', 'three.js', 'styles/']
          },
          securityInfo: {
            scanStatus: 'passed',
            riskFlags: [],
            cspHeaders: {
              'default-src': "'self'",
              'script-src': "'self' https://cdn.jsdelivr.net"
            }
          },
          deployment: {
            status: 'published',
            version: 1,
            createdBy: '李老师'
          }
        },
        undefined,
        4,
        89,
        false
      ),
      createInteractiveContent(
        '3',
        {
          meta: {
            version: '1.0.0',
            type: 'experience',
            id: 'exp_003',
            createdAt: '2024-01-08T00:00:00Z',
            updatedAt: '2024-01-22T00:00:00Z'
          },
          experienceInfo: {
            title: '数学函数图像绘制',
            description: '动态数学函数图像绘制工具，支持多种函数类型和参数调节',
            type: 'html',
            subject: 'math',
            gradeBand: ['grade9'],
            estimatedDuration: 25,
            tags: ['数学', '函数', '图像', '绘图'],
            entryPoint: 'index.html'
          },
          resourceInfo: {
            storageRef: 'resource://experience/exp_003/v1',
            hash: 'sha256:ghi789...',
            size: 512000,
            assets: ['index.html', 'plotter.js', 'math.css']
          },
          securityInfo: {
            scanStatus: 'passed',
            riskFlags: [],
            cspHeaders: {
              'default-src': "'self'",
              'script-src': "'self' 'unsafe-inline'"
            }
          },
          aiInsights: {
            qualityScore: 88,
            suggestedTags: ['函数图像', '数学工具'],
            accessibilityIssues: [],
            recommendedGradeBand: ['grade8', 'grade9', 'grade10']
          },
          deployment: {
            status: 'published',
            version: 1,
            createdBy: '王老师'
          }
        },
        undefined,
        4,
        156,
        true
      )
    ]

    contentList.value = demoData
  } catch (error) {
    console.error('加载互动内容失败:', error)
    ElMessage.error({ message: '加载互动内容失败', type: 'error' })
  }
}

const loadAvailableCourses = async () => {
  try {
    // 模拟加载可用课程
    availableCourses.value = [
      { id: 'course1', title: '高中物理必修一' },
      { id: 'course2', title: '高中化学必修一' },
      { id: 'course3', title: '高中数学必修一' }
    ]
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterSubject.value = ''
}

const refreshList = () => {
  loadContentList()
}

const getContentIcon = (type: string) => {
  const icons = {
    html: 'Document',
    package: 'FolderOpened',
    simulation: 'Monitor',
    game: 'Trophy'
  }
  return icons[type as keyof typeof icons] || 'Document'
}

const getTypeColor = (type: string) => {
  const colors = {
    html: '',
    package: 'success',
    simulation: 'warning',
    game: 'danger'
  }
  return colors[type as keyof typeof colors] || ''
}

const getTypeVariant = (type: string) => {
  const variants = {
    html: 'default',
    package: 'success',
    simulation: 'warning',
    game: 'danger'
  }
  return variants[type as keyof typeof variants] || 'default'
}

const getTypeLabel = (type: string) => {
  const labels = {
    html: 'HTML单页',
    package: '互动包',
    simulation: '模拟器',
    game: '游戏'
  }
  return labels[type as keyof typeof labels] || type
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const previewContent = (content: InteractiveContent) => {
  currentPreviewContent.value = content
  showPreviewModal.value = true
}

const handleContentAction = ({ action, content }: { action: string, content: InteractiveContent }) => {
  switch (action) {
    case 'edit':
      editContent(content)
      break
    case 'duplicate':
      duplicateContent(content)
      break
    case 'export':
      exportContent(content)
      break
    case 'delete':
      deleteContent(content)
      break
  }
}

const editContent = (content: InteractiveContent) => {
  ElMessage.info(`编辑功能开发中: ${content.title}`)
}

const duplicateContent = (content: InteractiveContent) => {
  ElMessage.success(`复制成功: ${content.title}`)
}

const exportContent = (content: InteractiveContent) => {
  ElMessage.info(`导出功能开发中: ${content.title}`)
}

const deleteContent = async (content: InteractiveContent) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除互动内容 "${content.title}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = contentList.value.findIndex(item => item.id === content.id)
    if (index > -1) {
      contentList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const assignToCourse = (content: InteractiveContent) => {
  selectedContent.value = content
  showAssignModal.value = true
}

const confirmAssign = () => {
  if (!assignForm.value.courseId) {
    ElMessage.warning({ message: '请选择课程', type: 'warning' })
    return
  }

  ElMessage.success({ message: `已将 "${selectedContent.value?.title}" 分配到课程`, type: 'success' })
  showAssignModal.value = false
  assignForm.value = { courseId: '', chapterId: '' }
}

// AI 功能：生成内容元数据
const generateContentMetadata = async (htmlContent: string) => {
  try {
    const prompt = `分析以下HTML内容，生成教育体验的元数据JSON格式：
    {
      "title": "简洁有吸引力的标题（不超过50字）",
      "description": "详细描述（100-200字）",
      "subject": "适用学科（physics/chemistry/math/biology等）",
      "gradeBand": ["适用年级数组"],
      "estimatedDuration": 预计完成时长（分钟）,
      "tags": ["标签数组", "5-8个相关标签"],
      "learningObjectives": ["学习目标数组", "2-3个目标"],
      "riskLevel": "安全风险等级（low/medium/high）"
    }

HTML内容：
${htmlContent.substring(0, 2000)}...

请严格按照JSON格式返回，不要包含其他文字。`

    const response = await aiServiceInstance.sendMessage(prompt, 'metadata-generation')

    try {
      const metadata = JSON.parse(response.content)
      return metadata
    } catch (parseError) {
      console.error('AI返回内容解析失败:', parseError)
      return null
    }
  } catch (error) {
    console.error('AI生成元数据失败:', error)
    return null
  }
}

// AI 功能：安全扫描建议
const generateSecuritySuggestions = async (htmlContent: string) => {
  try {
    const prompt = `作为Web安全专家，分析以下HTML代码的安全性问题，重点关注：
    1. XSS攻击风险（<script>标签、内联事件处理）
    2. 外部资源引用安全风险
    3. CSP策略建议
    4. 可访问性问题（图片alt属性、色彩对比度等）

HTML内容：
${htmlContent.substring(0, 3000)}...

请以JSON格式返回分析结果：
{
  "riskLevel": "low/medium/high",
  "riskFlags": ["风险点数组"],
  "cspRecommendations": {
    "script-src": "策略建议",
    "default-src": "策略建议"
  },
  "accessibilityIssues": ["可访问性问题数组"],
  "recommendations": ["改进建议数组"]
}`

    const response = await aiServiceInstance.sendMessage(prompt, 'security-analysis')

    try {
      const analysis = JSON.parse(response.content)
      return analysis
    } catch (parseError) {
      console.error('安全分析解析失败:', parseError)
      return null
    }
  } catch (error) {
    console.error('AI安全分析失败:', error)
    return null
  }
}

// AI 分析方法
const analyzeWithAI = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning({ message: '请先上传文件', type: 'warning' })
    return
  }

  try {
    contentForm.value.isAnalyzing = true

    // 读取上传文件的HTML内容
    const file = uploadFiles.value[0]
    let htmlContent = ''

    if (file.name.endsWith('.html')) {
      htmlContent = await readFileContent(file.raw)
    } else if (file.name.endsWith('.zip')) {
      // 对于ZIP文件，这里简化处理，实际应该解压并读取index.html
      htmlContent = '<html><body><h1>ZIP文件内容</h1></body></html>'
    }

    // 并行执行AI分析
    const [metadata, security] = await Promise.all([
      generateContentMetadata(htmlContent),
      generateSecuritySuggestions(htmlContent)
    ])

    if (metadata) {
      contentForm.value.aiSuggestions = metadata
      ElMessage.success({ message: 'AI元数据分析完成', type: 'success' })
    }

    if (security) {
      contentForm.value.securityAnalysis = security
      ElMessage.success({ message: 'AI安全分析完成', type: 'success' })
    }

  } catch (error) {
    console.error('AI分析失败:', error)
    ElMessage.error({ message: 'AI分析失败，请稍后重试', type: 'error' })
  } finally {
    contentForm.value.isAnalyzing = false
  }
}

// 读取文件内容
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = (e) => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsText(file)
  })
}

// 应用AI建议
const applySuggestion = (field: string) => {
  if (!contentForm.value.aiSuggestions) return

  switch (field) {
    case 'title':
      contentForm.value.title = contentForm.value.aiSuggestions.title
      break
    case 'description':
      contentForm.value.description = contentForm.value.aiSuggestions.description
      break
    case 'tags':
      contentForm.value.tags = [...contentForm.value.aiSuggestions.tags]
      break
    case 'gradeBand':
      // 映射年级到表单格式
      const gradeMap: Record<string, string> = {
        'grade1': '小学一年级',
        'grade2': '小学二年级',
        'grade3': '小学三年级',
        'grade4': '小学四年级',
        'grade5': '小学五年级',
        'grade6': '小学六年级',
        'grade7': '初中一年级',
        'grade8': '初中二年级',
        'grade9': '初中三年级',
        'grade10': '高中一年级',
        'grade11': '高中二年级',
        'grade12': '高中三年级'
      }
      contentForm.value.grade = contentForm.value.aiSuggestions.gradeBand?.[0] || ''
      break
  }

  ElMessage.success({ message: '已应用AI建议', type: 'success' })
}

const beforeUpload = (file: File) => {
  const fileName = file.name.toLowerCase()
  const isValidType = fileName.endsWith('.html') || fileName.endsWith('.zip')

  if (!isValidType) {
    ElMessage.error({ message: '只支持 .html 文件或 .zip 压缩包', type: 'error' })
    return false
  }

  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error({ message: '文件大小不能超过 50MB', type: 'error' })
    return false
  }

  return true
}

const handleFileUpload = async (options: any) => {
  const file = options.file

  try {
    // 模拟文件上传处理
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 标记文件上传成功
    file.status = 'success'
    file.percentage = 100

    ElMessage.success({ message: `文件 ${file.name} 上传成功`, type: 'success' })

    // 立即生成预览
    if (file.name.toLowerCase().endsWith('.html')) {
      const fileContent = await readFileContent(file.raw)
      previewUrl.value = URL.createObjectURL(new Blob([fileContent], { type: 'text/html' }))
    } else {
      // 对于ZIP文件，创建一个简单的预览
      previewUrl.value = URL.createObjectURL(new Blob([`
        <html>
          <head><title>${file.name}</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>📦 ZIP文件已上传</h2>
            <p>文件名: ${file.name}</p>
            <p>大小: ${(file.size / 1024).toFixed(2)} KB</p>
            <p style="color: #666; margin-top: 20px;">ZIP文件将在配置完成后解压和预览</p>
          </body>
        </html>
      `], { type: 'text/html' }))
    }

    // 自动触发AI分析
    if (uploadStep.value === 0) {
      setTimeout(() => {
        analyzeWithAI()
      }, 500)
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    file.status = 'fail'
    ElMessage.error({ message: '文件上传失败', type: 'error' })
  }
}

const handleFileChange = (file: any, fileList: any[]) => {
  uploadFiles.value = fileList
}

const handleFileRemove = (file: any, fileList: any[]) => {
  uploadFiles.value = fileList
}

const handleCloseUpload = () => {
  showUploadModal.value = false
  resetUploadForm()
}

const resetUploadForm = () => {
  uploadStep.value = 0
  uploadFiles.value = []
  contentForm.value = {
    title: '',
    description: '',
    type: 'html',
    subject: '',
    grade: '',
    duration: 30,
    tags: [],
    settings: ['fullscreen', 'responsive'],
    aiSuggestions: null,
    securityAnalysis: null,
    isAnalyzing: false
  }
  previewUrl.value = ''
}

const nextStep = () => {
  if (uploadStep.value < 1) {
    uploadStep.value++
    // 进入第二步时生成预览
    generatePreview()
  }
}

const previousStep = () => {
  if (uploadStep.value > 0) {
    uploadStep.value--
  }
}

const generatePreview = async () => {
  // 预览已在文件上传时生成，这里无需重复处理
  if (!previewUrl.value && uploadFiles.value.length > 0) {
    const file = uploadFiles.value[0]
    if (file.name.toLowerCase().endsWith('.html')) {
      const fileContent = await readFileContent(file.raw)
      previewUrl.value = URL.createObjectURL(new Blob([fileContent], { type: 'text/html' }))
    }
  }
}

const completeUpload = async () => {
  try {
    uploading.value = true

    // 模拟上传完成
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newContent: InteractiveContent = {
      id: `content_${Date.now()}`,
      title: contentForm.value.title,
      description: contentForm.value.description,
      type: contentForm.value.type as any,
      subject: contentForm.value.subject,
      grade: contentForm.value.grade,
      author: '当前用户',
      url: `/interactive/${Date.now()}/index.html`,
      tags: contentForm.value.tags,
      duration: contentForm.value.duration,
      rating: 0,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      featured: false
    }

    contentList.value.unshift(newContent)
    ElMessage.success('互动内容上传成功')
    showUploadModal.value = false
    resetUploadForm()
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const previewInNewWindow = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

const handleClosePreview = () => {
  showPreviewModal.value = false
  currentPreviewContent.value = null
}

const reloadPreview = () => {
  if (currentPreviewContent.value?.url) {
    const iframe = document.querySelector('.content-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.src = iframe.src
    }
  }
}

const toggleFullscreen = () => {
  const iframe = document.querySelector('.content-iframe') as HTMLIFrameElement
  if (iframe) {
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen()
    }
  }
}

const useInCourse = () => {
  if (currentPreviewContent.value) {
    assignToCourse(currentPreviewContent.value)
    showPreviewModal.value = false
  }
}

const handlePreviewLoad = () => {
  // 预览加载完成
}

const handlePreviewError = () => {
  ElMessage.error('预览加载失败')
}

// 监听课程选择变化
watch(() => assignForm.value.courseId, (newCourseId) => {
  if (newCourseId) {
    // 模拟加载课程章节
    selectedCourseChapters.value = [
      { id: 'chapter1', title: '第一章' },
      { id: 'chapter2', title: '第二章' },
      { id: 'chapter3', title: '第三章' }
    ]
  } else {
    selectedCourseChapters.value = []
    assignForm.value.chapterId = ''
  }
})

// 生命周期
onMounted(() => {
  loadContentList()
  loadAvailableCourses()
})
</script>

<style lang="scss" scoped>
.interactive-experience-manager {
  padding: var(--spacing-lg);
}

.manager-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);

  .header-left {
    h3 {
      margin: 0 0 var(--spacing-xs) 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-xl);
      color: var(--edu-text-primary);
    }

    .header-description {
      margin: 0;
      color: var(--edu-text-secondary);
      font-size: var(--font-size-sm);
    }
  }
}

.filter-section {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--edu-border-light);
}

.filter-controls {
  display: flex;
  gap: var(--spacing-base);
  align-items: center;
  flex-wrap: wrap;

  .search-input {
    flex: 1;
    min-width: 300px;
  }

  .subject-select {
    width: 200px;
  }

  .reset-btn {
    flex-shrink: 0;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.content-card {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  &.is-featured {
    border-color: var(--edu-primary-300);
    box-shadow: 0 0 0 2px var(--edu-primary-100);
  }
}

.card-thumbnail {
  position: relative;
  height: 200px;
  background: var(--edu-bg-secondary);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--edu-bg-tertiary);

  .el-icon {
    font-size: 48px;
    color: var(--edu-text-tertiary);
  }
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--edu-duration-fast) var(--edu-easing-in-out);
}

.thumbnail-container:hover .thumbnail-overlay {
  opacity: 1;
}

.content-type-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
}

.card-content {
  padding: var(--spacing-base);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.content-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
  line-height: var(--edu-leading-tight);
}

.content-actions {
  visibility: hidden;
}

.content-card:hover .content-actions {
  visibility: visible;
}

.content-description {
  margin: 0 0 var(--spacing-base) 0;
  color: var(--edu-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--edu-leading-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-base);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--edu-text-tertiary);

  .el-icon {
    font-size: 12px;
  }
}

.content-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-base);

  .tag-item {
    margin: 0;
  }
}

.content-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--edu-border-light);
}

.content-stats {
  display: flex;
  gap: var(--spacing-base);
}

.stat-item {
  .stat-label {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
    margin-bottom: 2px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    .el-icon {
      color: var(--edu-border-base);

      &.is-active {
        color: var(--edu-warning);
      }
    }

    .rating-value {
      font-size: var(--font-size-xs);
      color: var(--edu-text-secondary);
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--edu-text-tertiary);

  .empty-icon {
    font-size: 64px;
    margin-bottom: var(--spacing-base);
  }

  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--edu-text-secondary);
  }

  p {
    margin: 0 0 var(--spacing-lg) 0;
  }
}

.upload-content {
  .upload-form {
    margin-top: var(--spacing-lg);
  }
}

.upload-step,
.config-step,
.preview-step {
  padding: var(--spacing-lg) 0;
}

.config-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-lg);
  align-items: start;
}

.form-section {
  min-width: 0;
}

.ai-panel {
  position: sticky;
  top: var(--spacing-lg);
}

.ai-suggestions-card {
  max-height: 600px;
  overflow-y: auto;
}

.ai-panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);

  span {
    flex: 1;
  }
}

.ai-suggestions {
  .suggestion-group {
    margin-bottom: var(--spacing-lg);

    h5 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--edu-text-primary);
    }

    .suggestion-text {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-sm);
      color: var(--edu-text-secondary);
      line-height: var(--line-height-relaxed);
    }

    .tags-suggestion {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-sm);
    }
  }
}

.security-analysis {
  .analysis-group {
    margin-bottom: var(--spacing-lg);

    h5 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--edu-text-primary);
    }

    .risk-list,
    .accessibility-list {
      margin: var(--spacing-xs) 0 0 0;
      padding-left: var(--spacing-lg);
      font-size: var(--font-size-xs);
      color: var(--edu-text-secondary);

      li {
        margin-bottom: var(--spacing-xs);
      }
    }
  }
}

.ai-empty {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-base);
  color: var(--edu-text-tertiary);

  .ai-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-base);
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
  }
}

.preview-section {
  margin-top: var(--spacing-lg);
}

.preview-card {
  .preview-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: var(--font-weight-semibold);
  }
}

.preview-container-small {
  height: 200px;
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  overflow: hidden;
}

.preview-iframe-small {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-placeholder-small {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--edu-text-tertiary);

  .el-icon {
    font-size: 32px;
    margin-bottom: var(--spacing-sm);
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
  }
}

.upload-area {
  margin-bottom: var(--spacing-lg);
}

.upload-preview {
  h4 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--edu-text-primary);
  }
}

.file-list {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-base);
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--edu-border-light);

  &:last-child {
    border-bottom: none;
  }
}

.file-info {
  flex: 1;

  .file-name {
    font-weight: var(--font-weight-medium);
    color: var(--edu-text-primary);
  }

  .file-size {
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
  }
}

.file-status {
  .success-icon {
    color: var(--edu-success);
  }

  .uploading-icon {
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }
}

.unit {
  margin-left: var(--spacing-xs);
  color: var(--edu-text-secondary);
  font-size: var(--font-size-sm);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-base);

  h4 {
    margin: 0;
    color: var(--edu-text-primary);
  }
}

.preview-container {
  height: 400px;
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--edu-text-tertiary);

  .el-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-sm);
    animation: spin 2s linear infinite;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.preview-modal {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
}

.preview-frame {
  flex: 1;
  background: var(--edu-bg-primary);
}

.content-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-error {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--edu-text-tertiary);

  .el-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-sm);
    color: var(--edu-warning);
  }
}

.assign-content {
  padding: var(--spacing-base) 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .filter-section,
  .content-card {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .upload-area,
  .file-list,
  .preview-container {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;

    .search-input,
    .subject-select {
      width: 100%;
      min-width: unset;
    }
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-footer {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .content-stats {
    justify-content: space-around;
  }

  .config-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }

  .ai-panel {
    position: static;
  }
}

/* 交互体验组件图标样式 */
.content-type-icon,
.preview-icon {
  color: white;
  border-radius: 50%;
  padding: 4px;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
}

.content-type-icon {
  font-size: 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.preview-icon {
  font-size: 14px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}

.thumbnail-overlay:hover .preview-icon {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  transform: scale(1.1);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.5);
}

.meta-icon {
  color: white;
  border-radius: 6px;
  padding: 2px;
  font-size: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
}

.meta-icon-user {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.meta-icon-time {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.meta-icon-stats {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.content-card:hover .meta-icon {
  transform: translateY(-1px) scale(1.1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

/* 内容类型图标动态颜色 */
.thumbnail-placeholder:hover .content-type-icon {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
}

@media (max-width: 1024px) {
  .config-layout {
    grid-template-columns: 1fr;
  }

  .ai-panel {
    position: static;
  }
}
</style>