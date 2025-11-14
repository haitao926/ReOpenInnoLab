<template>
  <div class="experience-runner">
    <!-- AI助手 -->
    <ContextAwareAIAssistant
      :activity-context="context"
      :show-label="false"
      :position="'bottom-right'"
      :floating-hints="true"
      :auto-open="false"
    />

    <!-- 配置检查 -->
    <div v-if="!config || !config.contentUrl" class="experience-error">
      <el-result
        icon="warning"
        title="体验配置错误"
        sub-title="缺少体验内容URL"
      >
        <template #extra>
          <el-button type="primary" @click="$emit('error', '体验配置不完整')">
            返回
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="experience-loading">
      <div class="loading-content">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <h3>正在加载体验内容</h3>
        <p>{{ loadingText }}</p>
        <el-progress :percentage="loadingProgress" :show-text="false" />
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="experience-error">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="retryLoading">重新加载</el-button>
          <el-button @click="$emit('error', error)">返回</el-button>
        </template>
      </el-result>
    </div>

    <!-- 体验内容 -->
    <div v-else-if="contentLoaded" class="experience-content">
      <!-- 体验控制栏 -->
      <div class="experience-controls">
        <div class="control-left">
          <el-tag type="success" size="sm">
            <el-icon><CircleCheck /></el-icon>
            体验进行中
          </el-tag>
          <span class="timer">{{ formatTime(elapsedTime) }}</span>
          <span class="progress">进度: {{ progress }}%</span>
        </div>
        <div class="control-right">
          <el-button
            v-if="config.fullscreen"
            size="small"
            @click="toggleFullscreen"
          >
            <el-icon>
              <component :is="isFullscreen ? 'Aim' : 'FullScreen'" />
            </el-icon>
            {{ isFullscreen ? '退出' : '全屏' }}
          </el-button>
          <el-button size="small" @click="showInstructions = !showInstructions">
            <el-icon><InfoFilled /></el-icon>
            {{ showInstructions ? '隐藏' : '显示' }}说明
          </el-button>
          <el-button size="small" type="success" @click="completeExperience">
            <el-icon><Check /></el-icon>
            完成体验
          </el-button>
        </div>
      </div>

      <!-- 说明面板 -->
      <div v-if="showInstructions" class="instructions-panel">
        <div class="instructions-content">
          <h4>
            <el-icon><InfoFilled /></el-icon>
            体验说明
          </h4>
          <div class="instructions-text">
            <p>{{ context.activity.description }}</p>
            <div v-if="context.activity.instructions" v-html="context.activity.instructions"></div>
          </div>
          <div v-if="context.activity.objectives?.length" class="objectives">
            <h5>体验目标</h5>
            <ul>
              <li v-for="objective in context.activity.objectives" :key="objective">
                {{ objective }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 体验渲染区域 -->
      <div class="experience-container" :class="{ fullscreen: isFullscreen }">
        <!-- HTML体验 -->
        <div
          v-if="config.experienceType === 'html'"
          class="html-experience"
          :style="{ height: experienceHeight }"
        >
          <iframe
            ref="experienceFrame"
            :src="contentUrl"
            class="experience-frame"
            :sandbox="sandboxAttributes"
            @load="handleFrameLoad"
            @error="handleFrameError"
          />
        </div>

        <!-- 游戏体验 -->
        <div
          v-else-if="config.experienceType === 'game'"
          class="game-experience"
          :style="{ height: experienceHeight }"
        >
          <iframe
            ref="experienceFrame"
            :src="contentUrl"
            class="experience-frame"
            :sandbox="sandboxAttributes"
            @load="handleFrameLoad"
          />
        </div>

        <!-- 仿真体验 -->
        <div
          v-else-if="config.experienceType === 'simulation'"
          class="simulation-experience"
          :style="{ height: experienceHeight }"
        >
          <iframe
            ref="experienceFrame"
            :src="contentUrl"
            class="experience-frame"
            :sandbox="sandboxAttributes"
            @load="handleFrameLoad"
          />
        </div>

        <!-- AR体验 -->
        <div
          v-else-if="config.experienceType === 'ar'"
          class="ar-experience"
          :style="{ height: experienceHeight }"
        >
          <div class="ar-placeholder">
            <el-icon><View /></el-icon>
            <h3>AR体验内容</h3>
            <p>需要支持WebXR的浏览器</p>
            <el-button type="primary" @click="startAR">启动AR体验</el-button>
          </div>
        </div>

        <!-- VR体验 -->
        <div
          v-else-if="config.experienceType === 'vr'"
          class="vr-experience"
          :style="{ height: experienceHeight }"
        >
          <div class="vr-placeholder">
            <el-icon><View /></el-icon>
            <h3>VR体验内容</h3>
            <p>需要VR头显设备</p>
            <el-button type="primary" @click="startVR">启动VR体验</el-button>
          </div>
        </div>

        <!-- 交互数据收集遮罩 -->
        <div
          v-if="config.dataCollection?.enabled"
          class="interaction-overlay"
          @click="handleInteraction"
          @mousemove="handleMouseMove"
          @scroll="handleScroll"
        ></div>
      </div>

      <!-- 体验统计 -->
      <div class="experience-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ interactionCount }}</div>
            <div class="stat-label">交互次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ scrollCount }}</div>
            <div class="stat-label">滚动次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatTime(elapsedTime) }}</div>
            <div class="stat-label">体验时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ progress }}%</div>
            <div class="stat-label">完成进度</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading,
  CircleCheck,
  FullScreen,
  Aim,
  InfoFilled,
  Check,
  View
} from '@element-plus/icons-vue'

import type {
  ExperienceConfig,
  ActivityContext,
  ActivityResult
} from '@/types/course'

// 导入AI助手
import ContextAwareAIAssistant from '@/components/ai/ContextAwareAIAssistant.vue'

interface Props {
  config: ExperienceConfig
  context: ActivityContext
}

interface Emits {
  'complete': [result: ActivityResult]
  'error': [error: Error | string]
  'progress': [progress: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('正在连接体验服务器...')
const error = ref<string | null>(null)
const contentLoaded = ref(false)
const isFullscreen = ref(false)
const showInstructions = ref(true)

// 体验状态
const startTime = ref<Date | null>(null)
const elapsedTime = ref(0)
const progress = ref(0)
const interactionCount = ref(0)
const scrollCount = ref(0)
const lastActivityTime = ref(Date.now())

// 引用
const experienceFrame = ref<HTMLIFrameElement | null>(null)

// 定时器
let timerInterval: number | null = null
let progressCheckInterval: number | null = null

// 计算属性
const contentUrl = computed(() => {
  return props.config.contentUrl
})

const experienceHeight = computed(() => {
  if (isFullscreen.value) {
    return '100vh'
  }
  return '500px'
})

const sandboxAttributes = computed(() => {
  const sandbox = ['allow-scripts', 'allow-same-origin']

  if (props.config.security?.allowedDomains?.length) {
    // 根据安全配置添加权限
    sandbox.push('allow-forms')
  }

  return sandbox.join(' ')
})

// 方法
const loadExperience = async () => {
  if (!props.config.contentUrl) {
    error.value = '体验内容URL不能为空'
    return
  }

  loading.value = true
  loadingProgress.value = 0
  error.value = null

  try {
    // 阶段1: 验证URL
    loadingText.value = '验证体验内容...'
    loadingProgress.value = 20
    await validateExperienceUrl()

    // 阶段2: 检查安全配置
    loadingText.value = '检查安全配置...'
    loadingProgress.value = 40
    await checkSecurityConfig()

    // 阶段3: 预加载资源
    loadingText.value = '预加载体验资源...'
    loadingProgress.value = 60
    await preloadResources()

    // 阶段4: 初始化交互监听
    loadingText.value = '初始化交互监听...'
    loadingProgress.value = 80
    initializeInteractionListeners()

    // 阶段5: 完成
    loadingText.value = '体验内容就绪'
    loadingProgress.value = 100

    await new Promise(resolve => setTimeout(resolve, 500))

    contentLoaded.value = true
    startTime.value = new Date()
    startTimer()
    startProgressTracking()

    ElMessage.success('体验内容加载成功')

  } catch (err) {
    console.error('Failed to load experience:', err)
    error.value = err instanceof Error ? err.message : '加载失败'
    ElMessage.error(`体验加载失败: ${error.value}`)
  } finally {
    loading.value = false
  }
}

const validateExperienceUrl = async () => {
  const url = new URL(props.config.contentUrl)

  // 验证协议
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('不支持的URL协议')
  }

  // 模拟验证
  await new Promise(resolve => setTimeout(resolve, 300))
}

const checkSecurityConfig = async () => {
  if (props.config.security?.sandbox) {
    // 沙箱模式已经通过iframe sandbox属性实现
    ElMessage.info('体验运行在安全沙箱模式')
  }

  // 模拟安全检查
  await new Promise(resolve => setTimeout(resolve, 200))
}

const preloadResources = async () => {
  // 预加载体验内容
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'document'
  link.href = props.config.contentUrl

  document.head.appendChild(link)

  // 模拟预加载
  await new Promise(resolve => setTimeout(resolve, 500))

  document.head.removeChild(link)
}

const initializeInteractionListeners = () => {
  // 初始化交互监听器
  if (props.config.dataCollection?.enabled) {
    ElMessage.info('已启用交互数据收集')
  }
}

const retryLoading = () => {
  loadExperience()
}

const startTimer = () => {
  timerInterval = window.setInterval(() => {
    if (startTime.value) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value.getTime()) / 1000)
    }
  }, 1000)
}

const startProgressTracking = () => {
  progressCheckInterval = window.setInterval(() => {
    // 基于时间和交互计算进度
    const timeProgress = Math.min((elapsedTime.value / 600) * 100, 60) // 10分钟达到60%
    const interactionProgress = Math.min((interactionCount.value / 20) * 40, 40) // 20次交互达到40%

    progress.value = Math.round(timeProgress + interactionProgress)
    emit('progress', progress.value)

    if (progress.value >= 100) {
      completeExperience()
    }
  }, 5000)
}

const handleFrameLoad = () => {
  // iframe加载完成
  ElMessage.success('体验内容已加载')
}

const handleFrameError = () => {
  error.value = '体验内容加载失败'
  ElMessage.error('体验内容加载失败')
}

const handleInteraction = (event: MouseEvent) => {
  if (!props.config.dataCollection?.enabled) return

  interactionCount.value++
  lastActivityTime.value = Date.now()

  // 记录交互数据
  const interactionData = {
    type: 'click',
    x: event.clientX,
    y: event.clientY,
    timestamp: new Date().toISOString()
  }

  console.log('Interaction recorded:', interactionData)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!props.config.dataCollection?.mouseTracking) return

  lastActivityTime.value = Date.now()

  // 节流处理鼠标移动
  const now = Date.now()
  if (now - lastActivityTime.value > 100) { // 100ms间隔
    const mouseData = {
      type: 'mousemove',
      x: event.clientX,
      y: event.clientY,
      timestamp: new Date().toISOString()
    }

    console.log('Mouse movement recorded:', mouseData)
  }
}

const handleScroll = (event: Event) => {
  if (!props.config.dataCollection?.enabled) return

  scrollCount.value++
  lastActivityTime.value = Date.now()

  const scrollData = {
    type: 'scroll',
    scrollTop: (event.target as HTMLElement).scrollTop,
    timestamp: new Date().toISOString()
  }

  console.log('Scroll recorded:', scrollData)
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const startAR = async () => {
  if (!navigator.xr) {
    ElMessage.error('您的浏览器不支持WebXR')
    return
  }

  try {
    const isSupported = await navigator.xr.isSessionSupported('immersive-ar')
    if (!isSupported) {
      ElMessage.error('您的设备不支持AR体验')
      return
    }

    ElMessage.success('启动AR体验...')
    // 实际AR启动逻辑
  } catch (error) {
    console.error('AR启动失败:', error)
    ElMessage.error('AR启动失败')
  }
}

const startVR = async () => {
  if (!navigator.xr) {
    ElMessage.error('您的浏览器不支持WebXR')
    return
  }

  try {
    const isSupported = await navigator.xr.isSessionSupported('immersive-vr')
    if (!isSupported) {
      ElMessage.error('您的设备不支持VR体验')
      return
    }

    ElMessage.success('启动VR体验...')
    // 实际VR启动逻辑
  } catch (error) {
    console.error('VR启动失败:', error)
    ElMessage.error('VR启动失败')
  }
}

const completeExperience = async () => {
  try {
    await ElMessageBox.confirm('确定要完成体验吗？', '完成确认', {
      confirmButtonText: '确定完成',
      cancelButtonText: '继续体验',
      type: 'info'
    })

    // 停止计时器
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    if (progressCheckInterval) {
      clearInterval(progressCheckInterval)
      progressCheckInterval = null
    }

    // 计算体验结果
    const result: ActivityResult = {
      success: true,
      score: Math.min(Math.round(progress.value), 100),
      maxScore: 100,
      feedback: generateFeedback(),
      artifacts: [
        {
          id: 'experience_data',
          name: '体验数据',
          type: 'data',
          content: {
            duration: elapsedTime.value,
            interactions: interactionCount.value,
            scrolls: scrollCount.value,
            progress: progress.value
          },
          createdAt: new Date()
        }
      ],
      analytics: {
        timeSpent: elapsedTime.value,
        interactions: interactionCount.value,
        errors: 0,
        hints: 0,
        retries: 0
      }
    }

    emit('complete', result)
    ElMessage.success('体验已完成！')

  } catch {
    // 用户取消
  }
}

const generateFeedback = (): string => {
  if (progress.value >= 90) {
    return '优秀！您充分体验了所有内容'
  } else if (progress.value >= 70) {
    return '良好！您体验了大部分内容'
  } else if (progress.value >= 50) {
    return '及格！建议您更深入地体验'
  } else {
    return '需要改进！建议您重新体验'
  }
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 生命周期
onMounted(() => {
  loadExperience()

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  // 清理定时器
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (progressCheckInterval) {
    clearInterval(progressCheckInterval)
  }
})
</script>

<style scoped lang="scss">
.experience-runner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 500px;
}

.experience-error,
.experience-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 300px;

  .loading-icon {
    font-size: 48px;
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.experience-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.experience-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  backdrop-filter: blur(8px);
}

.control-left,
.control-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timer {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: var(--edu-text-secondary);
  background: rgba(15, 23, 42, 0.04);
  padding: 4px 8px;
  border-radius: 6px;
}

.progress {
  font-size: 14px;
  color: var(--edu-primary-600);
  font-weight: 500;
}

.instructions-panel {
  background: rgba(99, 102, 241, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  overflow: hidden;
}

.instructions-content {
  padding: 20px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-primary-600);
    margin: 0 0 16px 0;
  }

  .instructions-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--edu-text-primary);
    margin-bottom: 16px;

    :deep(p) {
      margin: 0 0 12px 0;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .objectives {
    h5 {
      font-size: 14px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 0 0 8px 0;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        color: var(--edu-text-secondary);
        margin-bottom: 4px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.experience-container {
  position: relative;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
  }
}

.html-experience,
.game-experience,
.simulation-experience,
.ar-experience,
.vr-experience {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.experience-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.ar-placeholder,
.vr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  color: var(--edu-text-secondary);

  .el-icon {
    font-size: 64px;
    color: var(--edu-primary-500);
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

.interaction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: auto;
}

.experience-stats {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--edu-border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--edu-primary-600);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--edu-text-secondary);
  font-weight: 500;
}

// 响应式设计
@media (max-width: 768px) {
  .experience-runner {
    gap: 16px;
  }

  .experience-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .control-left,
  .control-right {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-value {
    font-size: 20px;
  }

  .instructions-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>