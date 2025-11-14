<template>
  <div class="slide-player" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 工具栏 -->
    <div class="slide-toolbar" v-if="showControls">
      <div class="toolbar-left">
        <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>
        <span class="slide-title">{{ currentSlideTitle }}</span>
      </div>

      <div class="toolbar-center">
        <el-button-group>
          <el-button size="small" @click="previousSlide" :disabled="currentSlide === 0">
            <el-icon><ArrowLeft /></el-icon>
            上一页
          </el-button>
          <el-button size="small" @click="nextSlide" :disabled="currentSlide === totalSlides - 1">
            下一页
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-button-group>
          <el-button
            size="small"
            @click="toggleLaserPointer"
            :type="showLaserPointer ? 'primary' : 'default'"
          >
            <el-icon><Aim /></el-icon>
            激光笔
          </el-button>
          <el-button
            size="small"
            @click="toggleAnnotation"
            :type="showAnnotation ? 'primary' : 'default'"
          >
            <el-icon><EditPen /></el-icon>
            批注
          </el-button>
          <el-button size="small" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            全屏
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 幻灯片容器 -->
    <div
      class="slide-container"
      ref="slideContainer"
      @mousemove="handleMouseMove"
      @click="handleSlideClick"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="slide-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载幻灯片中...</span>
      </div>

      <!-- 幻灯片内容 -->
      <div v-else class="slide-content" ref="slideContent">
        <!-- 使用iframe或直接渲染HTML -->
        <iframe
          v-if="useIframe"
          :src="currentSlideUrl"
          class="slide-frame"
          frameborder="0"
          @load="onSlideLoad"
        />

        <!-- 直接渲染HTML内容 -->
        <div
          v-else
          class="slide-html"
          v-html="currentSlideContent"
        />

        <!-- 激光笔层 -->
        <div
          v-if="showLaserPointer"
          class="laser-pointer"
          :style="{ left: laserPosition.x + 'px', top: laserPosition.y + 'px' }"
        />

        <!-- 批注层 -->
        <canvas
          v-if="showAnnotation"
          ref="annotationCanvas"
          class="annotation-layer"
          @mousedown="startAnnotation"
          @mousemove="drawAnnotation"
          @mouseup="endAnnotation"
          @mouseout="endAnnotation"
        />

        <!-- 预览导航点 -->
        <div class="slide-navigation" v-if="showNavigation">
          <div
            v-for="slide in slides"
            :key="slide.id"
            class="nav-dot"
            :class="{ active: slide.id === currentSlideId }"
            @click.stop="goToSlide(slides.indexOf(slide))"
            :title="slide.title"
          />
        </div>
      </div>

      <!-- 进度条 -->
      <div class="slide-progress" v-if="showProgress">
        <div
          class="progress-bar"
          :style="{ width: progressPercentage + '%' }"
        />
      </div>
    </div>

    <!-- 缩略图侧边栏 -->
    <div class="slide-thumbnails" v-if="showThumbnails" :class="{ collapsed: thumbnailsCollapsed }">
      <div class="thumbnails-header">
        <span>幻灯片</span>
        <el-button
          size="small"
          text
          @click="toggleThumbnails"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>

      <div class="thumbnails-list" v-show="!thumbnailsCollapsed">
        <div
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="thumbnail-item"
          :class="{ active: index === currentSlide }"
          @click="goToSlide(index)"
        >
          <div class="thumbnail-number">{{ index + 1 }}</div>
          <div class="thumbnail-content">
            <div class="thumbnail-title">{{ slide.title }}</div>
            <div class="thumbnail-preview" v-if="slide.thumbnail">
              <img :src="slide.thumbnail" :alt="slide.title" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div class="shortcuts-hint" v-if="showShortcutsHint">
      <el-tag size="small">← → 切换幻灯片</el-tag>
      <el-tag size="small">空格 暂停/继续</el-tag>
      <el-tag size="small">F11 全屏</el-tag>
      <el-tag size="small">L 激光笔</el-tag>
      <el-tag size="small">A 批注</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Aim,
  EditPen,
  FullScreen,
  Loading
} from '@element-plus/icons-vue'

interface Slide {
  id: string
  title: string
  content?: string
  url?: string
  thumbnail?: string
  duration?: number
  notes?: string
}

interface Props {
  slides: Slide[]
  initialSlide?: number
  autoplay?: boolean
  interval?: number
  showControls?: boolean
  showNavigation?: boolean
  showProgress?: boolean
  showThumbnails?: boolean
  showShortcutsHint?: boolean
  useIframe?: boolean
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  initialSlide: 0,
  autoplay: false,
  interval: 5000,
  showControls: true,
  showNavigation: true,
  showProgress: true,
  showThumbnails: true,
  showShortcutsHint: false,
  useIframe: false,
  theme: 'light'
})

// Emits
const emit = defineEmits<{
  slideChange: [slideIndex: number, slide: Slide]
  play: []
  pause: []
  end: []
  annotation: [annotation: any]
  laserPointer: [position: { x: number, y: number }]
}>()

// 响应式数据
const currentSlide = ref(props.initialSlide)
const isPlaying = ref(props.autoplay)
const isFullscreen = ref(false)
const loading = ref(true)
const showLaserPointer = ref(false)
const showAnnotation = ref(false)
const thumbnailsCollapsed = ref(false)
const laserPosition = ref({ x: 0, y: 0 })
const controlsTimeout = ref<NodeJS.Timeout | null>(null)
const autoplayInterval = ref<NodeJS.Timeout | null>(null)

// DOM refs
const slideContainer = ref<HTMLElement>()
const slideContent = ref<HTMLElement>()
const annotationCanvas = ref<HTMLCanvasElement>()

// 计算属性
const totalSlides = computed(() => props.slides.length)
const currentSlideId = computed(() => props.slides[currentSlide.value]?.id)
const currentSlideTitle = computed(() => props.slides[currentSlide.value]?.title)
const currentSlideUrl = computed(() => props.slides[currentSlide.value]?.url)
const currentSlideContent = computed(() => props.slides[currentSlide.value]?.content)
const progressPercentage = computed(() => {
  if (totalSlides.value === 0) return 0
  return ((currentSlide.value + 1) / totalSlides.value) * 100
})

// 方法
const goToSlide = (index: number) => {
  if (index >= 0 && index < totalSlides.value) {
    currentSlide.value = index
    loading.value = true
    emit('slideChange', index, props.slides[index])

    nextTick(() => {
      setTimeout(() => {
        loading.value = false
      }, 100)
    })
  }
}

const nextSlide = () => {
  if (currentSlide.value < totalSlides.value - 1) {
    goToSlide(currentSlide.value + 1)
  } else {
    if (isPlaying.value) {
      pause()
    }
    emit('end')
  }
}

const previousSlide = () => {
  if (currentSlide.value > 0) {
    goToSlide(currentSlide.value - 1)
  }
}

const play = () => {
  isPlaying.value = true
  emit('play')

  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
  }

  autoplayInterval.value = setInterval(() => {
    nextSlide()
  }, props.interval)
}

const pause = () => {
  isPlaying.value = false
  emit('pause')

  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
    autoplayInterval.value = null
  }
}

const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    slideContainer.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const toggleLaserPointer = () => {
  showLaserPointer.value = !showLaserPointer.value
  showAnnotation.value = false
}

const toggleAnnotation = () => {
  showAnnotation.value = !showAnnotation.value
  showLaserPointer.value = false

  if (showAnnotation.value) {
    nextTick(() => {
      initAnnotationCanvas()
    })
  }
}

const toggleThumbnails = () => {
  thumbnailsCollapsed.value = !thumbnailsCollapsed.value
}

const initAnnotationCanvas = () => {
  if (!annotationCanvas.value || !slideContent.value) return

  const canvas = annotationCanvas.value
  const rect = slideContent.value.getBoundingClientRect()

  canvas.width = rect.width
  canvas.height = rect.height

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ff4757'
  }
}

// 批注相关
let isDrawing = false
let lastX = 0
let lastY = 0

const startAnnotation = (e: MouseEvent) => {
  if (!annotationCanvas.value) return

  isDrawing = true
  const rect = annotationCanvas.value.getBoundingClientRect()
  lastX = e.clientX - rect.left
  lastY = e.clientY - rect.top
}

const drawAnnotation = (e: MouseEvent) => {
  if (!isDrawing || !annotationCanvas.value) return

  const canvas = annotationCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(x, y)
  ctx.stroke()

  lastX = x
  lastY = y
}

const endAnnotation = () => {
  if (isDrawing && annotationCanvas.value) {
    const imageData = annotationCanvas.value.toDataURL()
    emit('annotation', {
      slideIndex: currentSlide.value,
      imageData,
      timestamp: Date.now()
    })
  }
  isDrawing = false
}

const clearAnnotations = () => {
  if (!annotationCanvas.value) return

  const ctx = annotationCanvas.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, annotationCanvas.value.width, annotationCanvas.value.height)
  }
}

// 激光笔相关
const handleMouseMove = (e: MouseEvent) => {
  if (showLaserPointer.value && slideContent.value) {
    const rect = slideContent.value.getBoundingClientRect()
    laserPosition.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    emit('laserPointer', laserPosition.value)
  }

  // 显示控制栏
  if (props.showControls) {
    showControlsTemporarily()
  }
}

const showControlsTemporarily = () => {
  const toolbar = slideContainer.value?.querySelector('.slide-toolbar')
  if (toolbar) {
    toolbar.classList.add('visible')

    if (controlsTimeout.value) {
      clearTimeout(controlsTimeout.value)
    }

    controlsTimeout.value = setTimeout(() => {
      toolbar.classList.remove('visible')
    }, 3000)
  }
}

const handleSlideClick = (e: MouseEvent) => {
  const rect = slideContent.value?.getBoundingClientRect()
  if (!rect) return

  // 点击左侧或右侧切换幻灯片
  const clickX = e.clientX - rect.left
  const clickPercent = clickX / rect.width

  if (clickPercent < 0.3) {
    previousSlide()
  } else if (clickPercent > 0.7) {
    nextSlide()
  }
}

const onSlideLoad = () => {
  loading.value = false
}

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      previousSlide()
      break
    case 'ArrowRight':
      e.preventDefault()
      nextSlide()
      break
    case ' ':
      e.preventDefault()
      togglePlay()
      break
    case 'Home':
      e.preventDefault()
      goToSlide(0)
      break
    case 'End':
      e.preventDefault()
      goToSlide(totalSlides.value - 1)
      break
    case 'F11':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'l':
    case 'L':
      e.preventDefault()
      toggleLaserPointer()
      break
    case 'a':
    case 'A':
      e.preventDefault()
      toggleAnnotation()
      break
    case 't':
    case 'T':
      e.preventDefault()
      toggleThumbnails()
      break
  }
}

// 生命周期
onMounted(() => {
  // 加载初始幻灯片
  goToSlide(props.initialSlide)

  // 绑定键盘事件
  document.addEventListener('keydown', handleKeyDown)

  // 自动播放
  if (props.autoplay) {
    play()
  }
})

onUnmounted(() => {
  // 清理定时器
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
  }
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }

  // 移除事件监听
  document.removeEventListener('keydown', handleKeyDown)
})

// 监听slides变化
watch(() => props.slides, (newSlides) => {
  if (newSlides.length === 0) return
  if (currentSlide.value >= newSlides.length) {
    goToSlide(0)
  }
}, { immediate: true })

// 监听autoplay变化
watch(() => props.autoplay, (newAutoplay) => {
  if (newAutoplay) {
    play()
  } else {
    pause()
  }
})

// 监听全屏状态变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})
</script>

<style lang="scss" scoped>
.slide-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
}

.slide-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  opacity: 0;
  transform: translateY(-100%);
  transition: all 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;

  .slide-counter {
    font-family: 'Monaco', monospace;
    font-size: 14px;
    font-weight: bold;
  }

  .slide-title {
    font-size: 14px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.toolbar-center {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.slide-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.slide-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;

  .el-icon {
    font-size: 48px;
  }
}

.slide-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.slide-html {
  width: 100%;
  height: 100%;
  background: white;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.laser-pointer {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff0000, #ff6666);
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
  animation: laserPulse 1s infinite alternate;
}

@keyframes laserPulse {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.annotation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 20;
}

.slide-navigation {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
  }

  &.active {
    background: white;
    width: 12px;
    height: 12px;
  }
}

.slide-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.progress-bar {
  height: 100%;
  background: #409eff;
  transition: width 0.3s ease;
}

.slide-thumbnails {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;
  z-index: 50;

  &.collapsed {
    transform: translateX(100%);
  }
}

.thumbnails-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 500;
}

.thumbnails-list {
  overflow-y: auto;
  max-height: calc(100% - 60px);
}

.thumbnail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(64, 158, 255, 0.2);
    border-left: 3px solid #409eff;
  }
}

.thumbnail-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.thumbnail-content {
  flex: 1;
  min-width: 0;
}

.thumbnail-title {
  color: white;
  font-size: 13px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thumbnail-preview {
  width: 100%;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.shortcuts-hint {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  z-index: 10;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .slide-toolbar {
    padding: 8px 12px;
  }

  .toolbar-left {
    .slide-title {
      max-width: 120px;
    }
  }

  .slide-thumbnails {
    width: 240px;
  }

  .shortcuts-hint {
    bottom: 10px;
    left: 10px;
    flex-wrap: wrap;
    max-width: calc(100% - 20px);
  }
}

/* 深色主题适配 */
.slide-player.dark-theme {
  .slide-html {
    background: #1a1a1a;
    color: white;
  }
}
</style>