<template>
  <div class="lab-renderer">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
      <p>正在加载实验环境...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <el-result icon="error" :title="error" :sub-title="errorDetail">
        <template #extra>
          <el-button type="primary" @click="retry">重试</el-button>
        </template>
      </el-result>
    </div>

    <!-- Lab Content -->
    <div v-else-if="labData" class="lab-content">
      <!-- Header -->
      <div class="lab-header">
        <h2>{{ labData.title }}</h2>
        <div class="lab-meta">
          <el-tag :type="getLabTypeTag(labData.labType)">
            {{ getLabTypeLabel(labData.labType) }}
          </el-tag>
          <el-tag :type="getDifficultyTag(labData.difficultyLevel)">
            {{ getDifficultyLabel(labData.difficultyLevel) }}
          </el-tag>
          <span class="duration">预计时长: {{ getEstimatedDuration(labData) }}</span>
        </div>
      </div>

      <!-- Instructions -->
      <div class="lab-instructions">
        <h3>实验说明</h3>
        <p>{{ labData.description }}</p>

        <!-- AI Instructions -->
        <div v-if="labData.aiDescription" class="ai-instructions">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>
              <span>AI 助手提示</span>
            </template>
            <p>{{ labData.aiDescription }}</p>
          </el-alert>
        </div>

        <!-- Learning Objectives -->
        <div v-if="labObjectives.length" class="objectives">
          <h4>学习目标</h4>
          <ul>
            <li v-for="objective in labObjectives" :key="objective">{{ objective }}</li>
          </ul>
        </div>
      </div>

      <!-- Lab Environment -->
      <div class="lab-environment">
        <!-- Notebook Viewer/Editor -->
        <div class="notebook-container">
          <div class="notebook-toolbar">
            <div class="toolbar-left">
              <el-button-group>
                <el-button size="small" @click="togglePreview">
                  <el-icon><View /></el-icon>
                  {{ showPreview ? '编辑模式' : '预览模式' }}
                </el-button>
                <el-button size="small" @click="runAllCells">
                  <el-icon><VideoPlay /></el-icon>
                  运行全部
                </el-button>
                <el-button size="small" @click="restartKernel">
                  <el-icon><RefreshRight /></el-icon>
                  重启内核
                </el-button>
              </el-button-group>
            </div>
            <div class="toolbar-right">
              <el-button size="small" @click="downloadNotebook">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button size="small" @click="saveNotebook">
                <el-icon><Document /></el-icon>
                保存
              </el-button>
            </div>
          </div>

          <!-- Jupyter Notebook iframe -->
          <div class="notebook-frame-container">
            <iframe
              ref="notebookFrame"
              :src="notebookUrl"
              class="notebook-frame"
              @load="handleNotebookLoad"
            ></iframe>
          </div>

          <!-- Loading overlay -->
          <div v-if="notebookLoading" class="notebook-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在启动 Jupyter 环境...</p>
          </div>
        </div>

        <!-- Lab Assistant Panel -->
        <div class="lab-assistant" :class="{ 'lab-assistant--collapsed': !assistantExpanded }">
          <div class="assistant-header" @click="toggleAssistant">
            <el-icon><ChatDotRound /></el-icon>
            <span>实验助手</span>
            <el-icon class="collapse-icon" :class="{ 'collapse-icon--expanded': assistantExpanded }">
              <ArrowDown />
            </el-icon>
          </div>

          <div v-if="assistantExpanded" class="assistant-content">
            <!-- Tabs -->
            <el-tabs v-model="activeAssistantTab" type="border-card">
              <!-- Hints Tab -->
              <el-tab-pane label="提示" name="hints">
                <div class="hints-panel">
                  <div v-if="hints.length === 0" class="empty-hints">
                    <p>暂无提示，继续实验探索吧！</p>
                  </div>
                  <div v-else class="hints-list">
                    <div
                      v-for="hint in hints"
                      :key="hint.id"
                      class="hint-item"
                      :class="{ 'hint-item--revealed': hint.revealed }"
                    >
                      <div class="hint-header" @click="revealHint(hint)">
                        <span>{{ hint.title }}</span>
                        <el-icon><ArrowRight /></el-icon>
                      </div>
                      <div v-if="hint.revealed" class="hint-content">
                        {{ hint.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- Resources Tab -->
              <el-tab-pane label="资源" name="resources">
                <div class="resources-panel">
                  <div v-if="resources.length === 0" class="empty-resources">
                    <p>暂无附加资源</p>
                  </div>
                  <div v-else class="resources-list">
                    <div
                      v-for="resource in resources"
                      :key="resource.id"
                      class="resource-item"
                      @click="openResource(resource)"
                    >
                      <el-icon class="resource-icon">
                        <component :is="getResourceIcon(resource.type)" />
                      </el-icon>
                      <div class="resource-info">
                        <div class="resource-name">{{ resource.filename }}</div>
                        <div class="resource-size">{{ formatFileSize(resource.size) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- Help Tab -->
              <el-tab-pane label="帮助" name="help">
                <div class="help-panel">
                  <div class="help-section">
                    <h4>快捷键</h4>
                    <ul>
                      <li><kbd>Shift + Enter</kbd> - 运行当前单元格</li>
                      <li><kbd>Ctrl + Enter</kbd> - 运行并选中下一个单元格</li>
                      <li><kbd>Alt + Enter</kbd> - 运行并在下方插入新单元格</li>
                      <li><kbd>Ctrl + S</kbd> - 保存 Notebook</li>
                    </ul>
                  </div>
                  <div class="help-section">
                    <h4>常见问题</h4>
                    <div class="faq-item">
                      <p><strong>Q: 内核无响应怎么办？</strong></p>
                      <p>A: 点击"重启内核"按钮重启 Jupyter 内核。</p>
                    </div>
                    <div class="faq-item">
                      <p><strong>Q: 如何导入数据文件？</strong></p>
                      <p>A: 在资源面板中找到文件，点击即可获取文件路径。</p>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress" class="progress-bar">
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="8"
        />
      </div>

      <!-- Completion Dialog -->
      <el-dialog
        v-model="completionDialogVisible"
        title="实验完成"
        width="500px"
        :close-on-click-modal="false"
      >
        <div class="completion-content">
          <el-result icon="success" title="恭喜完成实验！">
            <template #sub-title>
              <p>实验用时: {{ formatDuration(duration) }}</p>
              <p>运行单元格: {{ cellsExecuted }} / {{ totalCells }}</p>
            </template>
          </el-result>

          <div class="completion-actions">
            <el-button @click="viewResults">查看结果</el-button>
            <el-button type="primary" @click="submitExperiment">提交实验</el-button>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  View,
  VideoPlay,
  RefreshRight,
  Download,
  Document,
  ChatDotRound,
  ArrowDown,
  ArrowRight,
  Loading,
  Picture,
  DocumentText,
  VideoCamera,
  Files
} from '@element-plus/icons-vue'
import { LabApiService } from '@/api/lab'
import type { LabTemplate, LabRun } from '@/types/experiment'

const props = defineProps<{
    runId: string
    mode?: 'present' | 'preview' | 'student'
    autoStart?: boolean
  }>()

const emit = defineEmits<{
    ready: []
    start: []
    progress: [progress: number]
    complete: [result: any]
    error: [error: string]
    save: [notebook: any]
    interaction: [event: any]
  }>()

// 状态
const loading = ref(true)
const error = ref('')
const errorDetail = ref('')
const labData = ref<LabTemplate>()
const labRun = ref<LabRun>()
const notebookFrame = ref<HTMLIFrameElement>()
const notebookLoading = ref(false)
const showPreview = ref(false)
const assistantExpanded = ref(true)
const activeAssistantTab = ref('hints')
const completionDialogVisible = ref(false)
const progress = ref(0)
const progressStatus = ref<'success' | 'exception' | 'warning' | ''>('')
const duration = ref(0)
const cellsExecuted = ref(0)
const totalCells = ref(0)
const hints = ref<any[]>([])
const resources = ref<any[]>([])

// 计算属性
const showProgress = computed(() => {
  return props.mode === 'student'
})

const notebookUrl = computed(() => {
  if (!labData.value || !labRun.value) return ''

  const baseUrl = '/lab'
  const params = new URLSearchParams({
    runId: props.runId,
    templateId: labData.value.id,
    mode: props.mode || 'student',
    notebook: labData.value.notebookUrl,
    readOnly: showPreview.value ? 'true' : 'false'
  })

  return `${baseUrl}?${params.toString()}`
})

const labObjectives = computed(() => {
  return labData.value?.metadata?.learningObjectives || []
})

// 方法
const loadLab = async () => {
  loading.value = true
  error.value = ''

  try {
    // Load lab run
    labRun.value = await LabApiService.getLabRun(props.runId)

    // Load lab template
    labData.value = await LabApiService.getLabTemplate(labRun.value.labTemplateId)

    // Setup hints from course data if available
    if (labRun.value.courseData?.experiment?.hints) {
      hints.value = labRun.value.courseData.experiment.hints.map((hint: any, index: number) => ({
        id: `hint-${index}`,
        title: hint.title || `提示 ${index + 1}`,
        content: hint.content,
        revealed: false
      }))
    }

    // Load resources
    if (labData.value.resourceRefs) {
      resources.value = labData.value.resourceRefs
    }

    // PostMessage listener setup
    window.addEventListener('message', handlePostMessage)

    // Auto-start if configured
    if (props.autoStart) {
      setTimeout(() => startLab(), 500)
    }

    emit('ready')
  } catch (err: any) {
    console.error('Failed to load lab:', err)
    error.value = '加载实验失败'
    errorDetail.value = err.message || '未知错误'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const startLab = () => {
  if (!notebookFrame.value?.contentWindow) return

  notebookLoading.value = true
  emit('start')
}

const handleNotebookLoad = () => {
  notebookLoading.value = false

  // Get notebook metadata
  if (notebookFrame.value?.contentWindow) {
    notebookFrame.value.contentWindow.postMessage({
      type: 'getMetadata'
    }, '*')
  }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const runAllCells = () => {
  if (notebookFrame.value?.contentWindow) {
    notebookFrame.value.contentWindow.postMessage({
      type: 'runAllCells'
    }, '*')
  }
}

const restartKernel = () => {
  if (notebookFrame.value?.contentWindow) {
    notebookFrame.value.contentWindow.postMessage({
      type: 'restartKernel'
    }, '*')
    ElMessage.success('内核重启中...')
  }
}

const saveNotebook = () => {
  if (notebookFrame.value?.contentWindow) {
    notebookFrame.value.contentWindow.postMessage({
      type: 'save'
    }, '*')
  }
}

const downloadNotebook = () => {
  if (notebookFrame.value?.contentWindow) {
    notebookFrame.value.contentWindow.postMessage({
      type: 'download'
    }, '*')
  }
}

const toggleAssistant = () => {
  assistantExpanded.value = !assistantExpanded.value
}

const revealHint = (hint: any) => {
  hint.revealed = true

  // Track hint usage
  emit('interaction', {
    type: 'hint_revealed',
    data: { hintId: hint.id }
  })
}

const openResource = (resource: any) => {
  // Get resource path and send to notebook
  if (notebookFrame.value?.contentWindow) {
    notebookFrame.value.contentWindow.postMessage({
      type: 'loadResource',
      data: resource
    }, '*')
  }
}

const viewResults = () => {
  // TODO: Navigate to results view
  ElMessage.info('结果查看功能待实现')
}

const submitExperiment = () => {
  // Save final notebook
  saveNotebook()

  // Emit completion
  emit('complete', {
    duration: duration.value,
    cellsExecuted: cellsExecuted.value,
    totalCells: totalCells.value,
    notebookUrl: labData.value?.notebookUrl
  })

  completionDialogVisible.value = false
}

const handlePostMessage = (event: MessageEvent) => {
  // Verify origin
  if (!event.origin.includes(window.location.hostname)) {
    return
  }

  const { type, data } = event.data

  switch (type) {
    case 'ready':
      console.log('Notebook ready')
      break

    case 'metadata':
      totalCells.value = data.cellCount || 0
      break

    case 'cellExecuted':
      cellsExecuted.value += 1
      updateProgress()
      break

    case 'saved':
      emit('save', data.notebook)
      ElMessage.success('Notebook 已保存')
      break

    case 'error':
      error.value = data.error || 'Notebook 发生错误'
      progressStatus.value = 'exception'
      emit('error', error.value)
      break

    case 'progress':
      progress.value = data.progress || 0
      emit('progress', progress.value)
      break

    case 'complete':
      progress.value = 100
      progressStatus.value = 'success'
      completionDialogVisible.value = true
      break

    case 'duration':
      duration.value = data.duration || 0
      break
  }
}

const updateProgress = () => {
  if (totalCells.value > 0) {
    progress.value = Math.round((cellsExecuted.value / totalCells.value) * 100)
  }
}

const getLabTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    jupyter: 'Jupyter Notebook',
    python: 'Python',
    r: 'R 语言',
    markdown: 'Markdown'
  }
  return labels[type] || type
}

const getLabTypeTag = (type: string): string => {
  const tags: Record<string, string> = {
    jupyter: 'warning',
    python: 'primary',
    r: 'success',
    markdown: 'info'
  }
  return tags[type] || 'info'
}

const getDifficultyLabel = (level: string): string => {
  const labels: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家'
  }
  return labels[level] || level
}

const getDifficultyTag = (level: string): string => {
  const tags: Record<string, string> = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
    expert: 'danger'
  }
  return tags[level] || 'info'
}

const getEstimatedDuration = (lab: LabTemplate): string => {
  return lab.metadata?.estimatedDuration || '未知'
}

const getResourceIcon = (type: string) => {
  const icons: Record<string, any> = {
    image: Picture,
    video: VideoCamera,
    document: DocumentText,
    other: Files
  }
  return icons[type] || Files
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const retry = () => {
  loadLab()
}

// 生命周期
onMounted(() => {
  loadLab()
})

onUnmounted(() => {
  window.removeEventListener('message', handlePostMessage)
})

// 监听 props 变化
watch(
  () => props.runId,
  () => {
    loadLab()
  }
)
</script>

<style lang="scss" scoped>
  .lab-renderer {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-primary);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-xl);
    text-align: center;

    p {
      margin-top: var(--spacing-lg);
      color: var(--text-secondary);
    }
  }

  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-xl);
  }

  .lab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .lab-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);

    h2 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    .lab-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);

      .duration {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
  }

  .lab-instructions {
    padding: var(--spacing-lg);
    background-color: var(--edu-color-gray-50);
    border-bottom: 1px solid var(--edu-color-gray-200);

    h3 {
      margin: 0 0 var(--spacing-base) 0;
      color: var(--text-primary);
    }

    .ai-instructions {
      margin-top: var(--spacing-lg);
    }

    .objectives {
      margin-top: var(--spacing-lg);

      h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
      }

      ul {
        margin: 0;
        padding-left: var(--spacing-lg);
      }
    }
  }

  .lab-environment {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
  }

  .notebook-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .notebook-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-base);
    background-color: var(--edu-color-gray-100);
    border-bottom: 1px solid var(--edu-color-gray-200);
  }

  .notebook-frame-container {
    flex: 1;
    position: relative;
  }

  .notebook-frame {
    width: 100%;
    height: 100%;
    border: none;
    background-color: white;
  }

  .notebook-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 10;

    .loading-icon {
      font-size: 48px;
      color: var(--edu-primary-500);
      animation: spin 1s linear infinite;
    }

    p {
      margin-top: var(--spacing-lg);
      color: var(--text-secondary);
    }
  }

  .lab-assistant {
    width: 350px;
    background-color: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    transition: all var(--edu-duration-fast);
    display: flex;
    flex-direction: column;

    &--collapsed {
      width: 50px;

      .assistant-content {
        display: none;
      }
    }
  }

  .assistant-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-base);
    background-color: var(--edu-color-gray-100);
    border-bottom: 1px solid var(--edu-color-gray-200);
    cursor: pointer;

    .collapse-icon {
      transition: transform var(--edu-duration-fast);

      &--expanded {
        transform: rotate(180deg);
      }
    }
  }

  .assistant-content {
    flex: 1;
    overflow: hidden;
  }

  .hints-panel,
  .resources-panel,
  .help-panel {
    padding: var(--spacing-base);
    height: 100%;
    overflow-y: auto;
  }

  .empty-hints,
  .empty-resources {
    text-align: center;
    color: var(--text-secondary);
    padding: var(--spacing-xl);
  }

  .hint-item {
    border: 1px solid var(--edu-color-gray-200);
    border-radius: var(--radius-base);
    margin-bottom: var(--spacing-sm);
    overflow: hidden;

    &--revealed {
      border-color: var(--edu-primary-500);
    }

    .hint-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-sm) var(--spacing-base);
      background-color: var(--edu-color-gray-50);
      cursor: pointer;

      &:hover {
        background-color: var(--edu-color-gray-100);
      }
    }

    .hint-content {
      padding: var(--spacing-base);
      background-color: white;
      border-top: 1px solid var(--edu-color-gray-200);
    }
  }

  .resource-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: background-color var(--edu-duration-fast);

    &:hover {
      background-color: var(--edu-color-gray-100);
    }

    .resource-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--edu-color-gray-200);
      border-radius: var(--radius-base);
    }

    .resource-info {
      flex: 1;

      .resource-name {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .resource-size {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }
    }
  }

  .help-section {
    margin-bottom: var(--spacing-lg);

    h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    ul {
      margin: 0;
      padding-left: var(--spacing-lg);
    }

    kbd {
      background-color: var(--edu-color-gray-200);
      border: 1px solid var(--edu-color-gray-300);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-size: 0.8em;
    }
  }

  .faq-item {
    margin-bottom: var(--spacing-base);

    p {
      margin: var(--spacing-xs) 0;
    }
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-lg);
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
  }

  .completion-content {
    .completion-actions {
      display: flex;
      justify-content: center;
      gap: var(--spacing-base);
      margin-top: var(--spacing-lg);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>