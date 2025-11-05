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
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索互动内容..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterType" placeholder="内容类型" clearable>
            <el-option label="HTML单页" value="html" />
            <el-option label="互动包" value="package" />
            <el-option label="模拟器" value="simulation" />
            <el-option label="游戏" value="game" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterSubject" placeholder="适用学科" clearable>
            <el-option
              v-for="subject in subjects"
              :key="subject.value"
              :label="subject.label"
              :value="subject.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置筛选
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 互动内容列表 -->
    <div class="content-grid">
      <div
        v-for="content in filteredContentList"
        :key="content.id"
        class="content-card"
        :class="{ 'is-featured': content.featured }"
      >
        <div class="card-thumbnail">
          <div class="thumbnail-container">
            <img
              v-if="content.thumbnail"
              :src="content.thumbnail"
              :alt="content.title"
              class="thumbnail-image"
            />
            <div v-else class="thumbnail-placeholder">
              <el-icon>
                <component :is="getContentIcon(content.type)" />
              </el-icon>
            </div>
            <div class="thumbnail-overlay">
              <el-button
                type="primary"
                size="small"
                @click="previewContent(content)"
              >
                <el-icon><View /></el-icon>
                预览
              </el-button>
            </div>
          </div>
          <div class="content-type-badge">
            <el-tag :type="getTypeColor(content.type)" size="small">
              {{ getTypeLabel(content.type) }}
            </el-tag>
          </div>
        </div>

        <div class="card-content">
          <div class="content-header">
            <h4 class="content-title">{{ content.title }}</h4>
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

          <p class="content-description">{{ content.description }}</p>

          <div class="content-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ content.author }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(content.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>{{ content.usageCount }}次使用</span>
            </div>
          </div>

          <div class="content-tags">
            <el-tag
              v-for="tag in content.tags"
              :key="tag"
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>

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
            <div class="content-actions-footer">
              <el-button size="small" @click="assignToCourse(content)">
                <el-icon><Plus /></el-icon>
                分配到课程
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredContentList.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <h4>暂无互动内容</h4>
      <p>上传您的第一个HTML互动内容，开始创建沉浸式学习体验</p>
      <el-button type="primary" @click="showUploadModal = true">
        <el-icon><Upload /></el-icon>
        上传互动内容
      </el-button>
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
          <el-step title="内容配置" description="设置基本信息" />
          <el-step title="预览确认" description="预览并发布" />
        </el-steps>

        <div class="upload-form">
          <!-- 步骤1: 文件上传 -->
          <div v-if="uploadStep === 0" class="upload-step">
            <div class="upload-area">
              <el-upload
                drag
                multiple
                :file-list="uploadFiles"
                :before-upload="beforeUpload"
                :http-request="handleFileUpload"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                accept=".html,.css,.js,.zip,.json"
              >
                <el-icon class="el-icon--upload"><Upload /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 .html 单文件或包含 .html/.css/.js 的 .zip 压缩包，文件大小不超过 50MB
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

          <!-- 步骤3: 预览确认 -->
          <div v-if="uploadStep === 2" class="preview-step">
            <div class="preview-header">
              <h4>内容预览</h4>
              <div class="preview-actions">
                <el-button @click="previewInNewWindow">
                  <el-icon><View /></el-icon>
                  新窗口预览
                </el-button>
              </div>
            </div>
            <div class="preview-container">
              <iframe
                v-if="previewUrl"
                :src="previewUrl"
                class="preview-iframe"
                frameborder="0"
              />
              <div v-else class="preview-placeholder">
                <el-icon><Loading /></el-icon>
                <p>正在生成预览...</p>
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
            v-if="uploadStep < 2"
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
            完成上传
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

interface InteractiveContent {
  id: string
  title: string
  description: string
  type: 'html' | 'package' | 'simulation' | 'game'
  subject: string
  grade: string
  author: string
  thumbnail?: string
  url: string
  tags: string[]
  duration: number
  rating: number
  usageCount: number
  createdAt: Date
  updatedAt: Date
  featured: boolean
  settings: {
    fullscreen: boolean
    responsive: boolean
    resize: boolean
  }
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

// 表单数据
const contentForm = ref({
  title: '',
  description: '',
  type: 'html',
  subject: '',
  grade: '',
  duration: 30,
  tags: [],
  settings: ['fullscreen', 'responsive']
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

  if (filterType.value) {
    filtered = filtered.filter(content => content.type === filterType.value)
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
      return uploadFiles.value.length > 0 && uploadFiles.value.every(file => file.status === 'success')
    case 1:
      return contentForm.value.title && contentForm.value.description && contentForm.value.subject && contentForm.value.grade
    default:
      return true
  }
})

// 方法
const loadContentList = async () => {
  try {
    // 模拟加载互动内容列表
    await new Promise(resolve => setTimeout(resolve, 500))

    contentList.value = [
      {
        id: '1',
        title: '物理电路模拟器',
        description: '交互式电路搭建和实验模拟器，支持多种电子元件和测量工具',
        type: 'simulation',
        subject: 'physics',
        grade: 'grade10',
        author: '张老师',
        thumbnail: '/thumbnails/circuit-simulator.jpg',
        url: '/interactive/circuit-simulator/index.html',
        tags: ['物理', '电路', '模拟', '实验'],
        duration: 45,
        rating: 5,
        usageCount: 128,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        featured: true,
        settings: {
          fullscreen: true,
          responsive: true,
          resize: true
        }
      },
      {
        id: '2',
        title: '化学分子结构3D',
        description: '3D分子结构可视化工具，支持旋转、缩放和元素信息展示',
        type: 'html',
        subject: 'chemistry',
        grade: 'grade11',
        author: '李老师',
        url: '/interactive/molecule-3d/index.html',
        tags: ['化学', '分子', '3D', '可视化'],
        duration: 30,
        rating: 4,
        usageCount: 89,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        featured: false,
        settings: {
          fullscreen: true,
          responsive: false,
          resize: true
        }
      },
      {
        id: '3',
        title: '数学函数图像绘制',
        description: '动态数学函数图像绘制工具，支持多种函数类型和参数调节',
        type: 'html',
        subject: 'math',
        grade: 'grade9',
        author: '王老师',
        url: '/interactive/function-plotter/index.html',
        tags: ['数学', '函数', '图像', '绘图'],
        duration: 25,
        rating: 4,
        usageCount: 156,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-22'),
        featured: true,
        settings: {
          fullscreen: true,
          responsive: true,
          resize: false
        }
      }
    ]
  } catch (error) {
    console.error('加载互动内容失败:', error)
    ElMessage.error('加载互动内容失败')
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
  filterType.value = ''
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
    ElMessage.warning('请选择课程')
    return
  }

  ElMessage.success(`已将 "${selectedContent.value?.title}" 分配到课程`)
  showAssignModal.value = false
  assignForm.value = { courseId: '', chapterId: '' }
}

const beforeUpload = (file: File) => {
  const allowedTypes = ['text/html', 'application/zip', 'text/css', 'application/javascript', 'application/json']
  const isValidType = allowedTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith('.html') ||
    file.name.toLowerCase().endsWith('.zip') ||
    file.name.toLowerCase().endsWith('.css') ||
    file.name.toLowerCase().endsWith('.js') ||
    file.name.toLowerCase().endsWith('.json')

  if (!isValidType) {
    ElMessage.error('只支持 HTML、CSS、JavaScript 文件或 ZIP 压缩包')
    return false
  }

  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }

  return false // 阻止自动上传
}

const handleFileUpload = async (options: any) => {
  const file = options.file
  // 模拟文件上传
  await new Promise(resolve => setTimeout(resolve, 1000))
  ElMessage.success(`文件 ${file.name} 上传成功`)
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
    settings: ['fullscreen', 'responsive']
  }
  previewUrl.value = ''
}

const nextStep = () => {
  if (uploadStep.value < 2) {
    uploadStep.value++

    if (uploadStep.value === 2) {
      generatePreview()
    }
  }
}

const previousStep = () => {
  if (uploadStep.value > 0) {
    uploadStep.value--
  }
}

const generatePreview = async () => {
  try {
    // 模拟生成预览
    await new Promise(resolve => setTimeout(resolve, 1000))
    previewUrl.value = URL.createObjectURL(new Blob(['<html><body><h1>预览内容</h1></body></html>'], { type: 'text/html' }))
  } catch (error) {
    console.error('生成预览失败:', error)
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
      featured: false,
      settings: {
        fullscreen: contentForm.value.settings.includes('fullscreen'),
        responsive: contentForm.value.settings.includes('responsive'),
        resize: contentForm.value.settings.includes('resize')
      }
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
}
</style>