<template>
  <div class="interactive-preview">
    <!-- 预览工具栏 -->
    <div class="preview-toolbar">
      <div class="toolbar-left">
        <div class="preview-info">
          <h4>{{ content?.title || '互动内容预览' }}</h4>
          <div class="preview-meta">
            <el-tag :type="getTypeColor(content?.type)" size="small">
              {{ getTypeLabel(content?.type) }}
            </el-tag>
            <span class="duration">预计时长: {{ content?.duration }}分钟</span>
          </div>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-tooltip content="刷新预览">
            <el-button @click="reloadPreview">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="开发者工具">
            <el-button @click="toggleDevTools">
              <el-icon><Tools /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏模式">
            <el-button @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
        <el-button type="primary" @click="useInCourse">
          <el-icon><Plus /></el-icon>
          用于课程
        </el-button>
      </div>
    </div>

    <!-- 预览主体 -->
    <div class="preview-main">
      <!-- 加载状态 -->
      <div v-if="loading" class="preview-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>正在加载互动内容...</p>
        <el-progress :percentage="loadingProgress" :stroke-width="2" />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="preview-error">
        <el-icon class="error-icon"><Warning /></el-icon>
        <h4>加载失败</h4>
        <p>{{ errorMessage }}</p>
        <div class="error-actions">
          <el-button @click="reloadPreview">
            <el-icon><Refresh /></el-icon>
            重新加载
          </el-button>
          <el-button @click="showErrorDetails">
            <el-icon><View /></el-icon>
            查看详情
          </el-button>
        </div>
      </div>

      <!-- 预览内容 -->
      <div v-else class="preview-content">
        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <el-button-group size="small">
            <el-button @click="zoomOut">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button disabled>
              {{ Math.round(zoomLevel * 100) }}%
            </el-button>
            <el-button @click="zoomIn">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button @click="resetZoom">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
          </el-button-group>
        </div>

        <!-- 设备模拟 -->
        <div class="device-selector">
          <el-select v-model="currentDevice" size="small" @change="handleDeviceChange">
            <el-option
              v-for="device in devices"
              :key="device.key"
              :label="device.label"
              :value="device.key"
            >
              <div class="device-option">
                <el-icon><component :is="device.icon" /></el-icon>
                <span>{{ device.label }}</span>
                <span class="device-size">{{ device.width }}×{{ device.height }}</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- iframe 容器 -->
        <div class="iframe-container" :style="iframeContainerStyle">
          <iframe
            ref="previewFrame"
            :src="previewUrl"
            class="preview-iframe"
            :style="iframeStyle"
            frameborder="0"
            @load="handleIframeLoad"
            @error="handleIframeError"
            allowfullscreen
          />
        </div>

        <!-- 开发者工具面板 -->
        <div v-if="showDevTools" class="dev-tools-panel">
          <div class="dev-tools-header">
            <h5>开发者工具</h5>
            <el-button size="small" text @click="showDevTools = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="dev-tools-content">
            <el-tabs v-model="activeDevTab">
              <!-- 控制台 -->
              <el-tab-pane label="控制台" name="console">
                <div class="console-output">
                  <div
                    v-for="(log, index) in consoleLogs"
                    :key="index"
                    class="console-log"
                    :class="log.type"
                  >
                    <span class="log-timestamp">{{ formatLogTime(log.timestamp) }}</span>
                    <span class="log-level">{{ log.level.toUpperCase() }}</span>
                    <span class="log-message">{{ log.message }}</span>
                  </div>
                  <div v-if="consoleLogs.length === 0" class="console-empty">
                    暂无日志输出
                  </div>
                </div>
              </el-tab-pane>

              <!-- 网络 -->
              <el-tab-pane label="网络" name="network">
                <div class="network-requests">
                  <div
                    v-for="request in networkRequests"
                    :key="request.id"
                    class="network-item"
                  >
                    <div class="request-method">{{ request.method }}</div>
                    <div class="request-url">{{ request.url }}</div>
                    <div class="request-status" :class="getStatusClass(request.status)">
                      {{ request.status }}
                    </div>
                    <div class="request-size">{{ formatSize(request.size) }}</div>
                  </div>
                  <div v-if="networkRequests.length === 0" class="network-empty">
                    暂无网络请求
                  </div>
                </div>
              </el-tab-pane>

              <!-- 信息 -->
              <el-tab-pane label="信息" name="info">
                <div class="content-info">
                  <div class="info-item">
                    <label>标题:</label>
                    <span>{{ contentInfo.title || '未知' }}</span>
                  </div>
                  <div class="info-item">
                    <label>URL:</label>
                    <span class="info-url">{{ contentInfo.url || '未知' }}</span>
                  </div>
                  <div class="info-item">
                    <label>加载时间:</label>
                    <span>{{ contentInfo.loadTime || 0 }}ms</span>
                  </div>
                  <div class="info-item">
                    <label>文件大小:</label>
                    <span>{{ formatSize(contentInfo.size || 0) }}</span>
                  </div>
                  <div class="info-item">
                    <label>支持功能:</label>
                    <div class="features">
                      <el-tag
                        v-for="feature in contentInfo.features"
                        :key="feature"
                        size="small"
                        class="feature-tag"
                      >
                        {{ feature }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误详情对话框 -->
    <el-dialog
      v-model="showErrorDialog"
      title="错误详情"
      width="600px"
    >
      <div class="error-details">
        <el-alert
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon
        />
        <div class="error-stack">
          <h5>错误堆栈</h5>
          <pre>{{ errorStack }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="showErrorDialog = false">关闭</el-button>
        <el-button type="primary" @click="copyErrorDetails">
          <el-icon><CopyDocument /></el-icon>
          复制错误信息
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Tools, FullScreen, Plus, Loading, Warning, View, ZoomOut, ZoomIn,
  RefreshLeft, Monitor, Phone, Tablet, Iphone, Close, CopyDocument
} from '@element-plus/icons-vue'

interface InteractiveContent {
  id: string
  title: string
  type: 'html' | 'package' | 'simulation' | 'game'
  url: string
  duration: number
  settings: {
    fullscreen: boolean
    responsive: boolean
    resize: boolean
  }
}

interface Props {
  content?: InteractiveContent
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true
})

// 响应式数据
const loading = ref(false)
const loadingProgress = ref(0)
const error = ref(false)
const errorMessage = ref('')
const errorStack = ref('')
const showErrorDialog = ref(false)
const previewUrl = ref('')
const zoomLevel = ref(1)
const currentDevice = ref('desktop')
const showDevTools = ref(false)
const activeDevTab = ref('console')
const consoleLogs = ref<any[]>([])
const networkRequests = ref<any[]>([])
const contentInfo = ref<any>({})

const previewFrame = ref<HTMLIFrameElement>()

// 设备配置
const devices = [
  {
    key: 'desktop',
    label: '桌面端',
    icon: 'Monitor',
    width: 1920,
    height: 1080
  },
  {
    key: 'tablet',
    label: '平板',
    icon: 'Tablet',
    width: 768,
    height: 1024
  },
  {
    key: 'mobile',
    label: '手机',
    icon: 'Iphone',
    width: 375,
    height: 667
  }
]

// 计算属性
const currentDeviceConfig = computed(() => {
  return devices.find(device => device.key === currentDevice.value) || devices[0]
})

const iframeContainerStyle = computed(() => {
  const config = currentDeviceConfig.value
  return {
    width: `${config.width}px`,
    height: `${config.height}px`,
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: 'top left'
  }
})

const iframeStyle = computed(() => {
  const config = currentDeviceConfig.value
  return {
    width: `${config.width}px`,
    height: `${config.height}px`
  }
})

// 方法
const loadContent = async () => {
  if (!props.content?.url) return

  try {
    loading.value = true
    loadingProgress.value = 0
    error.value = false
    errorMessage.value = ''

    // 模拟加载进度
    const progressInterval = setInterval(() => {
      if (loadingProgress.value < 90) {
        loadingProgress.value += Math.random() * 30
      }
    }, 200)

    // 设置预览URL
    previewUrl.value = props.content.url

    // 等待iframe加载
    await new Promise((resolve) => {
      const checkLoad = () => {
        if (previewFrame.value?.contentDocument?.readyState === 'complete') {
          clearInterval(progressInterval)
          loadingProgress.value = 100
          setTimeout(resolve, 500)
        } else {
          setTimeout(checkLoad, 100)
        }
      }
      checkLoad()
    })

    // 收集内容信息
    await collectContentInfo()

  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}

const collectContentInfo = async () => {
  if (!previewFrame.value?.contentDocument) return

  try {
    const doc = previewFrame.value.contentDocument

    contentInfo.value = {
      title: doc.title || '未命名页面',
      url: previewUrl.value,
      loadTime: Date.now() - (loadingProgress.value > 0 ? Date.now() - 1000 : Date.now()),
      size: estimateContentSize(doc),
      features: detectFeatures(doc)
    }

    // 监听控制台输出
    setupConsoleInterception()

    // 监听网络请求
    setupNetworkInterception()

  } catch (err) {
    console.warn('收集内容信息失败:', err)
  }
}

const estimateContentSize = (doc: Document) => {
  const html = doc.documentElement.outerHTML
  return new Blob([html]).size
}

const detectFeatures = (doc: Document) => {
  const features = []

  // 检测常用功能
  if (doc.querySelector('canvas')) features.push('Canvas')
  if (doc.querySelector('video, audio')) features.push('媒体')
  if (doc.querySelector('[draggable]')) features.push('拖拽')
  if (doc.querySelector('input, textarea, select')) features.push('表单')
  if (doc.querySelector('svg')) features.push('SVG')
  if (doc.querySelector('.interactive, [onclick]')) features.push('交互')

  return features
}

const setupConsoleInterception = () => {
  if (!previewFrame.value?.contentWindow) return

  const originalLog = previewFrame.value.contentWindow.console.log
  const originalError = previewFrame.value.contentWindow.console.error
  const originalWarn = previewFrame.value.contentWindow.console.warn

  previewFrame.value.contentWindow.console.log = (...args) => {
    addConsoleLog('info', args.join(' '))
    originalLog.apply(previewFrame.value!.contentWindow!.console, args)
  }

  previewFrame.value.contentWindow.console.error = (...args) => {
    addConsoleLog('error', args.join(' '))
    originalError.apply(previewFrame.value!.contentWindow!.console, args)
  }

  previewFrame.value.contentWindow.console.warn = (...args) => {
    addConsoleLog('warning', args.join(' '))
    originalWarn.apply(previewFrame.value!.contentWindow!.console, args)
  }
}

const setupNetworkInterception = () => {
  if (!previewFrame.value?.contentWindow) return

  // 简单的网络请求监听
  const originalFetch = previewFrame.value.contentWindow.fetch
  previewFrame.value.contentWindow.fetch = async (...args) => {
    const startTime = Date.now()
    const url = args[0] as string

    try {
      const response = await originalFetch.apply(previewFrame.value!.contentWindow!.fetch, args)
      const endTime = Date.now()

      addNetworkRequest({
        id: Date.now(),
        method: 'GET',
        url,
        status: response.status,
        size: 0, // 实际环境中需要计算
        duration: endTime - startTime
      })

      return response
    } catch (err) {
      addNetworkRequest({
        id: Date.now(),
        method: 'GET',
        url,
        status: 0,
        size: 0,
        duration: Date.now() - startTime,
        error: err
      })
      throw err
    }
  }
}

const addConsoleLog = (level: string, message: string) => {
  consoleLogs.value.push({
    timestamp: Date.now(),
    level,
    message,
    type: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info'
  })

  // 限制日志数量
  if (consoleLogs.value.length > 100) {
    consoleLogs.value = consoleLogs.value.slice(-50)
  }
}

const addNetworkRequest = (request: any) => {
  networkRequests.value.push(request)

  // 限制请求记录数量
  if (networkRequests.value.length > 50) {
    networkRequests.value = networkRequests.value.slice(-25)
  }
}

const handleError = (err: any) => {
  error.value = true
  errorMessage.value = err.message || '加载失败'
  errorStack.value = err.stack || '无错误堆栈信息'
  console.error('预览加载失败:', err)
}

const reloadPreview = () => {
  consoleLogs.value = []
  networkRequests.value = []
  loadContent()
}

const toggleDevTools = () => {
  showDevTools.value = !showDevTools.value
}

const toggleFullscreen = () => {
  const container = previewFrame.value?.parentElement
  if (container?.requestFullscreen) {
    container.requestFullscreen()
  }
}

const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.1
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.1
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const handleDeviceChange = () => {
  // 设备切换时重置缩放
  zoomLevel.value = 1
}

const handleIframeLoad = () => {
  loading.value = false
  collectContentInfo()
}

const handleIframeError = (err: any) => {
  handleError(err)
}

const showErrorDetails = () => {
  showErrorDialog.value = true
}

const copyErrorDetails = () => {
  const errorText = `错误信息: ${errorMessage.value}\n\n错误堆栈:\n${errorStack.value}`
  navigator.clipboard.writeText(errorText).then(() => {
    ElMessage.success('错误信息已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const useInCourse = () => {
  ElMessage.success('已添加到课程选择器')
  // 这里可以触发事件通知父组件
}

const getTypeColor = (type?: string) => {
  const colors = {
    html: '',
    package: 'success',
    simulation: 'warning',
    game: 'danger'
  }
  return colors[type as keyof typeof colors] || ''
}

const getTypeLabel = (type?: string) => {
  const labels = {
    html: 'HTML单页',
    package: '互动包',
    simulation: '模拟器',
    game: '游戏'
  }
  return labels[type as keyof typeof labels] || type
}

const formatLogTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'redirect'
  if (status >= 400 && status < 500) return 'client-error'
  if (status >= 500) return 'server-error'
  return 'unknown'
}

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (newContent && props.autoLoad) {
    nextTick(() => {
      loadContent()
    })
  }
}, { immediate: true })

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'r':
        event.preventDefault()
        reloadPreview()
        break
      case '=':
      case '+':
        event.preventDefault()
        zoomIn()
        break
      case '-':
        event.preventDefault()
        zoomOut()
        break
      case '0':
        event.preventDefault()
        resetZoom()
        break
    }
  }

  if (event.key === 'F12') {
    event.preventDefault()
    toggleDevTools()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.interactive-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
}

.preview-info {
  h4 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-primary);
  }

  .preview-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .duration {
      font-size: var(--font-size-xs);
      color: var(--edu-text-secondary);
    }
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.preview-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-loading,
.preview-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--edu-text-secondary);
}

.loading-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-base);
  animation: spin 2s linear infinite;
  color: var(--edu-primary-500);
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-base);
  color: var(--edu-danger);
}

.preview-error h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--edu-text-primary);
}

.error-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.preview-content {
  flex: 1;
  position: relative;
  overflow: auto;
  background: var(--edu-bg-tertiary);
}

.zoom-controls {
  position: absolute;
  top: var(--spacing-base);
  right: var(--spacing-base);
  z-index: 10;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-base);
  box-shadow: var(--edu-shadow-md);
  padding: var(--spacing-xs);
}

.device-selector {
  position: absolute;
  top: var(--spacing-base);
  left: var(--spacing-base);
  z-index: 10;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-base);
  box-shadow: var(--edu-shadow-md);
}

.device-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .device-size {
    margin-left: auto;
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
  }
}

.iframe-container {
  margin: var(--spacing-xl) auto;
  background: white;
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
}

.preview-iframe {
  display: block;
  background: white;
}

.dev-tools-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: var(--edu-bg-primary);
  border-top: 1px solid var(--edu-border-light);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.dev-tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-base);
  border-bottom: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);

  h5 {
    margin: 0;
    color: var(--edu-text-primary);
    font-size: var(--font-size-sm);
  }
}

.dev-tools-content {
  flex: 1;
  overflow: hidden;
}

.console-output {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-sm);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: var(--font-size-xs);
}

.console-log {
  display: flex;
  gap: var(--spacing-sm);
  padding: 2px 0;
  border-bottom: 1px solid var(--edu-border-lighter);

  &.error {
    color: var(--edu-danger);
  }

  &.warning {
    color: var(--edu-warning);
  }

  &.info {
    color: var(--edu-text-secondary);
  }
}

.log-timestamp {
  color: var(--edu-text-tertiary);
  min-width: 80px;
}

.log-level {
  color: var(--edu-text-tertiary);
  min-width: 50px;
  font-weight: var(--font-weight-bold);
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.console-empty {
  text-align: center;
  color: var(--edu-text-tertiary);
  padding: var(--spacing-lg);
}

.network-requests {
  height: 100%;
  overflow-y: auto;
}

.network-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--edu-border-lighter);
  font-size: var(--font-size-xs);

  .request-method {
    min-width: 50px;
    font-weight: var(--font-weight-bold);
    color: var(--edu-primary-500);
  }

  .request-url {
    flex: 1;
    color: var(--edu-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .request-status {
    min-width: 40px;
    text-align: right;

    &.success {
      color: var(--edu-success);
    }

    &.client-error,
    &.server-error {
      color: var(--edu-danger);
    }

    &.redirect {
      color: var(--edu-warning);
    }
  }

  .request-size {
    min-width: 60px;
    text-align: right;
    color: var(--edu-text-tertiary);
  }
}

.network-empty {
  text-align: center;
  color: var(--edu-text-tertiary);
  padding: var(--spacing-lg);
}

.content-info {
  padding: var(--spacing-base);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-base);

  label {
    min-width: 80px;
    font-weight: var(--font-weight-medium);
    color: var(--edu-text-primary);
  }

  .info-url {
    font-family: monospace;
    font-size: var(--font-size-xs);
    color: var(--edu-text-secondary);
    word-break: break-all;
  }

  .features {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);

    .feature-tag {
      margin: 0;
    }
  }
}

.error-details {
  .error-stack {
    margin-top: var(--spacing-base);

    h5 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--edu-text-primary);
    }

    pre {
      background: var(--edu-bg-secondary);
      border: 1px solid var(--edu-border-light);
      border-radius: var(--edu-radius-base);
      padding: var(--spacing-base);
      font-family: monospace;
      font-size: var(--font-size-xs);
      color: var(--edu-text-secondary);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
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
  .preview-toolbar,
  .dev-tools-header {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .iframe-container {
    background: var(--edu-bg-secondary);
  }

  .preview-iframe {
    background: var(--edu-bg-primary);
  }

  .dev-tools-panel {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .zoom-controls,
  .device-selector {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-toolbar {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: center;
  }

  .zoom-controls,
  .device-selector {
    position: static;
    margin: var(--spacing-sm) auto;
  }

  .iframe-container {
    margin: var(--spacing-base);
  }

  .dev-tools-panel {
    height: 200px;
  }
}
</style>