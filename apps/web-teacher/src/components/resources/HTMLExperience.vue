<template>
  <div class="html-experience" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon is-loading"><Loading /></el-icon>
      <div class="loading-text">加载体验内容中...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-overlay">
      <el-icon><Warning /></el-icon>
      <div class="error-title">体验加载失败</div>
      <div class="error-message">{{ errorMessage }}</div>
      <div class="error-actions">
        <el-button size="small" @click="reload">重新加载</el-button>
        <el-button size="small" type="primary" @click="openInNewTab">新窗口打开</el-button>
      </div>
    </div>

    <!-- 体验容器 -->
    <div v-else class="experience-container">
      <!-- 工具栏 -->
      <div class="experience-toolbar" v-if="showControls" :class="{ 'toolbar-visible': showToolbar }">
        <div class="toolbar-left">
          <span class="experience-title">{{ title }}</span>
          <el-tag v-if="interactive" size="small" type="success">互动体验</el-tag>
        </div>

        <div class="toolbar-right">
          <el-button-group>
            <el-button
              size="small"
              @click="toggleFullscreen"
              :icon="FullScreen"
            >
              全屏
            </el-button>
            <el-button
              size="small"
              @click="restart"
              :icon="Refresh"
            >
              重置
            </el-button>
            <el-button
              size="small"
              @click="toggleTracking"
              :type="tracking ? 'primary' : 'default'"
            >
              <el-icon><View /></el-icon>
              跟踪
            </el-button>
            <el-button
              size="small"
              @click="showSettings = true"
              :icon="Setting"
            >
              设置
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- iframe容器 -->
      <div class="iframe-container" ref="iframeContainer">
        <iframe
          ref="iframeElement"
          :src="iframeSrc"
          class="experience-iframe"
          :sandbox="sandboxAttributes"
          :allow="allowAttributes"
          :style="iframeStyle"
          @load="onIframeLoad"
          @error="onIframeError"
        />

        <!-- 安全警告层 -->
        <div v-if="showSecurityWarning" class="security-warning">
          <el-icon><Warning /></el-icon>
          <div class="warning-content">
            <h4>安全提示</h4>
            <p>此内容在安全沙箱环境中运行，无法访问外部网络和本地文件</p>
            <el-button size="small" type="primary" @click="dismissSecurityWarning">
              我知道了
            </el-button>
          </div>
        </div>

        <!-- 交互反馈层 -->
        <div class="interaction-overlay" v-if="showInteractionFeedback">
          <div class="feedback-item" v-for="feedback in interactionFeedback" :key="feedback.id">
            <el-icon :color="feedback.color"><component :is="feedback.icon" /></el-icon>
            <span>{{ feedback.message }}</span>
          </div>
        </div>
      </div>

      <!-- 进度和状态栏 -->
      <div class="experience-footer" v-if="showFooter">
        <div class="progress-info">
          <span v-if="progress !== null">进度: {{ Math.round(progress * 100) }}%</span>
          <span v-if="score !== null">得分: {{ score }}</span>
          <span v-if="timeSpent">用时: {{ formatTime(timeSpent) }}</span>
        </div>

        <div class="status-indicators">
          <div class="indicator" v-if="connected" title="已连接">
            <el-icon color="#67c23a"><Link /></el-icon>
          </div>
          <div class="indicator" v-if="tracking" title="正在跟踪">
            <el-icon color="#409eff"><View /></el-icon>
          </div>
          <div class="indicator" v-if="interactive" title="可交互">
            <el-icon color="#e6a23c"><Pointer /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="体验设置"
      width="500px"
    >
      <el-form :model="settings" label-width="100px">
        <el-form-item label="缩放比例">
          <el-slider
            v-model="settings.zoom"
            :min="50"
            :max="200"
            :step="10"
            show-input
            :input-size="'small'"
          />
        </el-form-item>
        <el-form-item label="音量">
          <el-slider
            v-model="settings.volume"
            :min="0"
            :max="100"
            show-input
            :input-size="'small'"
          />
        </el-form-item>
        <el-form-item label="性能模式">
          <el-switch v-model="settings.performanceMode" />
        </el-form-item>
        <el-form-item label="显示控制栏">
          <el-switch v-model="settings.showControls" />
        </el-form-item>
        <el-form-item label="显示进度">
          <el-switch v-model="settings.showProgress" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetSettings">重置</el-button>
        <el-button type="primary" @click="applySettings">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Loading,
  Warning,
  FullScreen,
  Refresh,
  View,
  Setting,
  Link,
  Pointer
} from '@element-plus/icons-vue'

interface InteractionData {
  type: 'click' | 'scroll' | 'input' | 'hover' | 'focus' | 'submit'
  timestamp: number
  target?: string
  value?: any
  position?: { x: number, y: number }
}

interface InteractionFeedback {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  icon: string
  color: string
  timestamp: number
}

interface Props {
  url: string
  title?: string
  width?: number
  height?: number
  interactive?: boolean
  sandbox?: boolean
  allowFullscreen?: boolean
  allowScripts?: boolean
  allowSameOrigin?: boolean
  allowForms?: boolean
  showControls?: boolean
  showFooter?: boolean
  tracking?: boolean
  performanceMode?: boolean
  preload?: boolean
  customStyles?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  title: '互动体验',
  width: 800,
  height: 600,
  interactive: true,
  sandbox: true,
  allowFullscreen: false,
  allowScripts: true,
  allowSameOrigin: false,
  allowForms: true,
  showControls: true,
  showFooter: true,
  tracking: true,
  performanceMode: false,
  preload: true,
  customStyles: () => ({})
})

// Emits
const emit = defineEmits<{
  load: []
  error: [error: Error]
  interaction: [data: InteractionData]
  progress: [progress: number]
  complete: [result: any]
  fullscreen: [isFullscreen: boolean]
  tracking: [enabled: boolean]
}>()

// 响应式数据
const iframeElement = ref<HTMLIFrameElement>()
const iframeContainer = ref<HTMLElement>()

const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const isFullscreen = ref(false)
const showToolbar = ref(false)
const showSettings = ref(false)
const showSecurityWarning = ref(true)
const tracking = ref(props.tracking)

// 体验状态
const progress = ref<number | null>(null)
const score = ref<number | null>(null)
const connected = ref(false)
const timeSpent = ref(0)
const startTime = ref<number | null>(null)

// 交互反馈
const interactionFeedback = ref<InteractionFeedback[]>([])
const interactionHistory = ref<InteractionData[]>([])

// 设置
const settings = ref({
  zoom: 100,
  volume: 80,
  performanceMode: props.performanceMode,
  showControls: props.showControls,
  showProgress: true
})

// 计算属性
const sandboxAttributes = computed(() => {
  if (!props.sandbox) return ''

  const attributes = ['allow-same-origin']

  if (props.allowScripts) attributes.push('allow-scripts')
  if (props.allowForms) attributes.push('allow-forms')
  if (props.allowFullscreen) attributes.push('allow-fullscreen')
  if (props.allowSameOrigin) attributes.push('allow-same-origin')
  else attributes.push('allow-popups')

  return attributes.join(' ')
})

const allowAttributes = computed(() => {
  const allows = []

  if (props.allowFullscreen) allows.push('fullscreen')
  if (props.allowScripts) allows.push('scripts')

  return allows.join('; ')
})

const iframeSrc = computed(() => {
  const url = new URL(props.url, window.location.origin)

  // 添加体验参数
  url.searchParams.set('embed', 'true')
  url.searchParams.set('theme', 'light')
  url.searchParams.set('controls', settings.value.showControls ? 'true' : 'false')
  url.searchParams.set('tracking', tracking.value ? 'true' : 'false')

  return url.toString()
})

const iframeStyle = computed(() => {
  const baseStyles = {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px',
    background: 'white',
    transform: `scale(${settings.value.zoom / 100})`,
    transformOrigin: 'center center'
  }

  return {
    ...baseStyles,
    ...props.customStyles
  }
})

// 方法
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const reload = () => {
  loading.value = true
  error.value = false
  errorMessage.value = ''

  if (iframeElement.value) {
    iframeElement.value.src = iframeSrc.value
  }
}

const openInNewTab = () => {
  window.open(props.url, '_blank')
}

const restart = () => {
  // 重置体验状态
  progress.value = null
  score.value = null
  timeSpent.value = 0
  startTime.value = Date.now()
  interactionHistory.value = []
  interactionFeedback.value = []

  // 重新加载iframe
  reload()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    iframeContainer.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  emit('fullscreen', isFullscreen.value)
}

const toggleTracking = () => {
  tracking.value = !tracking.value
  emit('tracking', tracking.value)

  if (tracking.value) {
    startTime.value = Date.now()
    startTracking()
  } else {
    stopTracking()
  }
}

const dismissSecurityWarning = () => {
  showSecurityWarning.value = false
}

const applySettings = () => {
  showSettings.value = false
  ElMessage.success('设置已应用')
}

const resetSettings = () => {
  settings.value = {
    zoom: 100,
    volume: 80,
    performanceMode: false,
    showControls: true,
    showProgress: true
  }
}

const showControlsTemporarily = () => {
  showToolbar.value = true

  setTimeout(() => {
    showToolbar.value = false
  }, 3000)
}

// iframe事件处理
const onIframeLoad = () => {
  loading.value = false
  connected.value = true
  emit('load')

  // 开始跟踪
  if (tracking.value) {
    startTime.value = Date.now()
    startTracking()
  }

  // 设置postMessage监听
  setupPostMessageListener()

  // 隐藏安全警告
  setTimeout(() => {
    showSecurityWarning.value = false
  }, 5000)
}

const onIframeError = () => {
  loading.value = false
  error.value = true
  errorMessage.value = '体验内容加载失败，请检查网络连接或内容格式'
  emit('error', new Error(errorMessage.value))
}

// postMessage通信
const setupPostMessageListener = () => {
  const handleMessage = (event: MessageEvent) => {
    // 验证消息来源
    if (!props.url.includes(event.origin)) return

    const { type, data } = event.data

    switch (type) {
      case 'interaction':
        handleInteraction(data)
        break
      case 'progress':
        progress.value = data.progress
        emit('progress', data.progress)
        break
      case 'score':
        score.value = data.score
        break
      case 'complete':
        emit('complete', data)
        break
      case 'feedback':
        addFeedback(data)
        break
    }
  }

  window.addEventListener('message', handleMessage)

  // 清理函数
  return () => {
    window.removeEventListener('message', handleMessage)
  }
}

const handleInteraction = (data: InteractionData) => {
  if (!tracking.value) return

  const interaction: InteractionData = {
    ...data,
    timestamp: Date.now()
  }

  interactionHistory.value.push(interaction)
  emit('interaction', interaction)

  // 限制历史记录数量
  if (interactionHistory.value.length > 1000) {
    interactionHistory.value = interactionHistory.value.slice(-500)
  }
}

const addFeedback = (data: Partial<InteractionFeedback>) => {
  const feedback: InteractionFeedback = {
    id: `feedback_${Date.now()}_${Math.random()}`,
    type: data.type || 'info',
    message: data.message || '',
    icon: data.icon || 'InfoFilled',
    color: data.color || '#409eff',
    timestamp: Date.now()
  }

  interactionFeedback.value.push(feedback)

  // 限制反馈数量
  if (interactionFeedback.value.length > 5) {
    interactionFeedback.value = interactionFeedback.value.slice(-4)
  }

  // 自动清除
  setTimeout(() => {
    const index = interactionFeedback.value.findIndex(f => f.id === feedback.id)
    if (index > -1) {
      interactionFeedback.value.splice(index, 1)
    }
  }, 5000)
}

// 跟踪功能
let trackingInterval: NodeJS.Timeout | null = null

const startTracking = () => {
  if (trackingInterval) return

  trackingInterval = setInterval(() => {
    if (startTime.value) {
      timeSpent.value = Math.floor((Date.now() - startTime.value) / 1000)
    }
  }, 1000)
}

const stopTracking = () => {
  if (trackingInterval) {
    clearInterval(trackingInterval)
    trackingInterval = null
  }
}

// 生命周期
onMounted(() => {
  // 监听全屏状态
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // 预加载
  if (props.preload) {
    preloadContent()
  }
})

onUnmounted(() => {
  stopTracking()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const preloadContent = () => {
  // 创建隐藏的iframe进行预加载
  const preloadIframe = document.createElement('iframe')
  preloadIframe.style.display = 'none'
  preloadIframe.src = props.url

  document.body.appendChild(preloadIframe)

  preloadIframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(preloadIframe)
    }, 1000)
  }

  preloadIframe.onerror = () => {
    document.body.removeChild(preloadIframe)
  }
}

// 监听设置变化
watch(() => settings.value.showControls, (newValue) => {
  emit('update:showControls', newValue)
})
</script>

<style lang="scss" scoped>
.html-experience {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  &.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #000;
  }
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  gap: 16px;
  z-index: 10;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
}

.loading-text {
  font-size: 16px;
  color: #666;
}

.error-title {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.error-message {
  font-size: 14px;
  color: #666;
  text-align: center;
  max-width: 300px;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.experience-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.experience-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: white;
  z-index: 5;
  opacity: 0;
  transform: translateY(-100%);
  transition: all 0.3s ease;

  &.toolbar-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.experience-title {
  font-size: 14px;
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.iframe-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
}

.iframe-container:hover .experience-toolbar {
  opacity: 1;
  transform: translateY(0);
}

.experience-iframe {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.security-warning {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  text-align: center;
  z-index: 6;

  .el-icon {
    font-size: 48px;
    color: #e6a23c;
  }

  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
  }

  p {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
}

.interaction-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 7;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  animation: slideInRight 0.3s ease;
  max-width: 200px;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.experience-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 12px;
}

.progress-info {
  display: flex;
  gap: 16px;
}

.status-indicators {
  display: flex;
  gap: 8px;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .experience-toolbar {
    padding: 8px 12px;
    flex-direction: column;
    gap: 8px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .iframe-container {
    padding: 8px;
  }

  .experience-footer {
    padding: 8px 12px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .progress-info {
    justify-content: center;
  }
}

/* 性能模式 */
.performance-mode {
  .experience-toolbar {
    transition: none;
  }

  .experience-iframe {
    transition: none;
    image-rendering: pixelated;
  }

  .feedback-item {
    animation: none;
  }
}
</style>