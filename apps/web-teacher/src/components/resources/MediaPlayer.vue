<template>
  <div class="media-player" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 视频容器 -->
    <div class="video-container" ref="videoContainer">
      <!-- 视频元素 -->
      <video
        ref="videoElement"
        :src="currentSource"
        :poster="poster"
        :muted="muted"
        :autoplay="autoplay"
        :loop="loop"
        :preload="preload"
        :controls="showNativeControls"
        class="video-element"
        @loadstart="onLoadStart"
        @loadeddata="onLoadedData"
        @canplay="onCanPlay"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @timeupdate="onTimeUpdate"
        @progress="onProgress"
        @error="onError"
        @volumechange="onVolumeChange"
        @fullscreenchange="onFullscreenChange"
        @seeking="onSeeking"
        @seeked="onSeeked"
      />

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <div class="loading-text">{{ loadingText }}</div>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-overlay">
        <el-icon><VideoPlay /></el-icon>
        <div class="error-text">{{ errorMessage }}</div>
        <el-button size="small" @click="retry">重试</el-button>
      </div>

      <!-- 自定义控制栏 -->
      <div class="controls-overlay" v-if="!showNativeControls" :class="{ 'controls-visible': showControls }">
        <!-- 顶部控制栏 -->
        <div class="top-controls">
          <div class="video-title">{{ title }}</div>
          <div class="top-actions">
            <el-dropdown @command="handleQualityChange" v-if="qualities.length > 1">
              <el-button size="small" text>
                {{ currentQualityLabel }}
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="quality in qualities"
                    :key="quality.value"
                    :command="quality.value"
                    :class="{ active: quality.value === currentQuality }"
                  >
                    {{ quality.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown @command="handlePlaybackRateChange">
              <el-button size="small" text>
                {{ playbackRate }}x
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="rate in playbackRates"
                    :key="rate"
                    :command="rate"
                    :class="{ active: rate === playbackRate }"
                  >
                    {{ rate }}x
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" text @click="togglePictureInPicture">
              <el-icon><Picture /></el-icon>
            </el-button>
            <el-button size="small" text @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 中央播放按钮 -->
        <div class="center-controls" v-show="showPlayButton">
          <el-button
            type="primary"
            size="large"
            circle
            @click="togglePlay"
            class="play-button"
          >
            <el-icon v-if="isPlaying"><VideoPause /></el-icon>
            <el-icon v-else><VideoPlay /></el-icon>
          </el-button>
        </div>

        <!-- 底部控制栏 -->
        <div class="bottom-controls">
          <div class="progress-container">
            <div class="progress-bar" ref="progressBar" @click="seek">
              <div class="progress-buffered" :style="{ width: bufferedPercentage + '%' }"></div>
              <div class="progress-played" :style="{ width: playedPercentage + '%' }"></div>
              <div class="progress-handle" :style="{ left: playedPercentage + '%' }"></div>
            </div>
            <div class="time-display">
              <span>{{ formatTime(currentTime) }}</span>
              <span class="separator">/</span>
              <span>{{ formatTime(duration) }}</span>
            </div>
          </div>

          <div class="control-buttons">
            <el-button size="small" text @click="togglePlay">
              <el-icon v-if="isPlaying"><VideoPause /></el-icon>
              <el-icon v-else><VideoPlay /></el-icon>
            </el-button>
            <el-button size="small" text @click="skip(-10)">
              <el-icon><RefreshLeft /></el-icon>
              -10s
            </el-button>
            <el-button size="small" text @click="skip(10)">
              <el-icon><RefreshRight /></el-icon>
              +10s
            </el-button>
            <div class="volume-control">
              <el-button size="small" text @click="toggleMute">
                <el-icon v-if="muted"><Mute /></el-icon>
                <el-icon v-else><Microphone /></el-icon>
              </el-button>
              <div class="volume-slider" ref="volumeSlider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="volume * 100"
                  @input="changeVolume"
                  class="volume-input"
                />
              </div>
            </div>
            <el-dropdown @command="handleSubtitleChange" v-if="subtitles.length > 0">
              <el-button size="small" text>
                <el-icon><ChatDotRound /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="off" :class="{ active: currentSubtitle === 'off' }">
                    关闭字幕
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-for="subtitle in subtitles"
                    :key="subtitle.value"
                    :command="subtitle.value"
                    :class="{ active: subtitle.value === currentSubtitle }"
                  >
                    {{ subtitle.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 字幕显示 -->
      <div class="subtitle-overlay" v-if="currentSubtitle !== 'off' && currentSubtitleText">
        <div class="subtitle-text">{{ currentSubtitleText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Loading,
  VideoPlay,
  VideoPause,
  FullScreen,
  ArrowDown,
  Picture,
  RefreshLeft,
  RefreshRight,
  Mute,
  Microphone,
  ChatDotRound
} from '@element-plus/icons-vue'

interface VideoSource {
  src: string
  type: string
  label?: string
  quality?: string
}

interface VideoQuality {
  value: string
  label: string
  src: string
}

interface SubtitleTrack {
  value: string
  label: string
  src: string
  srclang: string
}

interface Props {
  src?: string | VideoSource[]
  poster?: string
  title?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  showNativeControls?: boolean
  qualities?: VideoQuality[]
  subtitles?: SubtitleTrack[]
  defaultQuality?: string
  defaultSubtitle?: string
  defaultPlaybackRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  muted: false,
  loop: false,
  preload: 'metadata',
  showNativeControls: false,
  qualities: () => [],
  subtitles: () => [],
  defaultQuality: 'auto',
  defaultSubtitle: 'off',
  defaultPlaybackRate: 1
})

// Emits
const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  timeupdate: [currentTime: number]
  seeking: [currentTime: number]
  seeked: [currentTime: number]
  loadstart: []
  loadeddata: []
  canplay: []
  error: [error: ErrorEvent]
  fullscreenchange: [isFullscreen: boolean]
  qualitychange: [quality: string]
  subtitlechange: [subtitle: string]
  playbackratechange: [rate: number]
}>()

// 响应式数据
const videoElement = ref<HTMLVideoElement>()
const videoContainer = ref<HTMLElement>()
const progressBar = ref<HTMLElement>()
const volumeSlider = ref<HTMLElement>()

const isPlaying = ref(false)
const isFullscreen = ref(false)
const loading = ref(false)
const error = ref(false)
const showControls = ref(true)
const showPlayButton = ref(true)

const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const playbackRate = ref(props.defaultPlaybackRate)
const currentQuality = ref(props.defaultQuality)
const currentSubtitle = ref(props.defaultSubtitle)
const currentSubtitleText = ref('')
const buffered = ref(0)

const loadingText = ref('加载中...')
const errorMessage = ref('')

// 计算属性
const currentSource = computed(() => {
  if (!props.src) return ''

  if (typeof props.src === 'string') {
    return props.src
  }

  if (Array.isArray(props.src)) {
    // 根据当前质量选择源
    if (currentQuality.value !== 'auto' && currentQuality.value !== '') {
      const qualitySource = props.src.find(source => source.quality === currentQuality.value)
      if (qualitySource) return qualitySource.src
    }

    // 返回第一个可用的源
    return props.src[0]?.src || ''
  }

  return props.src
})

const playedPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const bufferedPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (buffered.value / duration.value) * 100
})

const currentQualityLabel = computed(() => {
  if (currentQuality.value === 'auto') return '自动'
  const quality = props.qualities.find(q => q.value === currentQuality.value)
  return quality?.label || currentQuality.value
})

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

// 方法
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const play = () => {
  if (videoElement.value) {
    videoElement.value.play()
  }
}

const pause = () => {
  if (videoElement.value) {
    videoElement.value.pause()
  }
}

const togglePlay = () => {
  if (videoElement.value) {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }
}

const skip = (seconds: number) => {
  if (videoElement.value) {
    videoElement.value.currentTime = Math.max(0, Math.min(duration.value, currentTime.value + seconds))
  }
}

const seek = (e: MouseEvent) => {
  if (!progressBar.value || !videoElement.value) return

  const rect = progressBar.value.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const time = percent * duration.value

  videoElement.value.currentTime = time
}

const changeVolume = (e: Event) => {
  const input = e.target as HTMLInputElement
  const newVolume = parseFloat(input.value) / 100

  if (videoElement.value) {
    videoElement.value.volume = newVolume
  }
}

const toggleMute = () => {
  if (videoElement.value) {
    videoElement.value.muted = !videoElement.value.muted
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    videoContainer.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const togglePictureInPicture = async () => {
  if (videoElement.value) {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoElement.value.requestPictureInPicture()
      }
    } catch (error) {
      console.error('画中画功能不可用:', error)
      ElMessage.warning('画中画功能不可用')
    }
  }
}

const handleQualityChange = (quality: string) => {
  const oldTime = currentTime.value
  const oldPlaying = isPlaying.value

  currentQuality.value = quality

  // 重新加载视频并恢复播放状态
  nextTick(() => {
    if (videoElement.value) {
      videoElement.value.currentTime = oldTime
      if (oldPlaying) {
        videoElement.value.play()
      }
    }
  })

  emit('qualitychange', quality)
}

const handlePlaybackRateChange = (rate: number) => {
  playbackRate.value = rate
  if (videoElement.value) {
    videoElement.value.playbackRate = rate
  }
  emit('playbackratechange', rate)
}

const handleSubtitleChange = (subtitle: string) => {
  currentSubtitle.value = subtitle
  emit('subtitlechange', subtitle)
}

const retry = () => {
  error.value = false
  errorMessage.value = ''
  if (videoElement.value) {
    videoElement.value.load()
  }
}

// 视频事件处理
const onLoadStart = () => {
  loading.value = true
  emit('loadstart')
}

const onLoadedData = () => {
  if (videoElement.value) {
    duration.value = videoElement.value.duration
    volume.value = videoElement.value.volume
  }
  emit('loadeddata')
}

const onCanPlay = () => {
  loading.value = false
  emit('canplay')
}

const onPlay = () => {
  isPlaying.value = true
  showPlayButton.value = false
  emit('play')
}

const onPause = () => {
  isPlaying.value = false
  showPlayButton.value = true
  emit('pause')
}

const onEnded = () => {
  isPlaying.value = false
  showPlayButton.value = true
  if (!props.loop) {
    currentTime.value = 0
  }
  emit('ended')
}

const onTimeUpdate = () => {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
    updateBuffered()

    // 更新字幕
    updateSubtitle(currentTime.value)
  }
  emit('timeupdate', currentTime.value)
}

const onProgress = () => {
  updateBuffered()
}

const onError = (e: ErrorEvent) => {
  loading.value = false
  error.value = true
  errorMessage.value = '视频加载失败，请检查网络连接或视频格式'
  emit('error', e)
}

const onVolumeChange = () => {
  if (videoElement.value) {
    volume.value = videoElement.value.volume
  }
}

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
  emit('fullscreenchange', isFullscreen.value)
}

const onSeeking = () => {
  emit('seeking', currentTime.value)
}

const onSeeked = () => {
  emit('seeked', currentTime.value)
}

const updateBuffered = () => {
  if (videoElement.value && videoElement.value.buffered.length > 0) {
    buffered.value = videoElement.value.buffered.end(videoElement.value.buffered.length - 1)
  }
}

const updateSubtitle = (currentTime: number) => {
  // 简单的字幕显示逻辑，实际应用中可能需要更复杂的解析
  if (currentSubtitle.value === 'off') {
    currentSubtitleText.value = ''
    return
  }

  // 这里应该根据字幕文件和时间匹配来显示字幕
  // 暂时留空，实际项目中需要集成字幕解析库
}

// 控制栏显示/隐藏逻辑
let controlsTimeout: NodeJS.Timeout | null = null

const showControlsTemporarily = () => {
  showControls.value = true

  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }

  controlsTimeout = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

// 生命周期
onMounted(() => {
  // 键盘事件监听
  document.addEventListener('keydown', handleKeyDown)

  // 鼠标移动事件
  videoContainer.value?.addEventListener('mousemove', showControlsTemporarily)
  videoContainer.value?.addEventListener('mouseenter', showControlsTemporarily)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }
})

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  if (!videoElement.value) return

  switch (e.key) {
    case ' ':
    case 'k':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      e.preventDefault()
      skip(-5)
      break
    case 'ArrowRight':
      e.preventDefault()
      skip(5)
      break
    case 'ArrowUp':
      e.preventDefault()
      videoElement.value.volume = Math.min(1, videoElement.value.volume + 0.1)
      break
    case 'ArrowDown':
      e.preventDefault()
      videoElement.value.volume = Math.max(0, videoElement.value.volume - 0.1)
      break
    case 'm':
      e.preventDefault()
      toggleMute()
      break
    case 'f':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'c':
      e.preventDefault()
      toggleSubtitleChange()
      break
  }
}

const toggleSubtitleChange = () => {
  const subtitles = props.subtitles.map(s => s.value)
  const currentIndex = subtitles.indexOf(currentSubtitle.value)
  const nextIndex = (currentIndex + 1) % (subtitles.length + 1)

  if (nextIndex === subtitles.length) {
    handleSubtitleChange('off')
  } else {
    handleSubtitleChange(subtitles[nextIndex])
  }
}

// 监听源变化
watch(() => props.src, () => {
  if (videoElement.value) {
    videoElement.value.load()
  }
})
</script>

<style lang="scss" scoped>
.media-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;

  &.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
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
  background: rgba(0, 0, 0, 0.8);
  color: white;
  gap: 16px;
}

.loading-icon {
  font-size: 48px;
}

.loading-text,
.error-text {
  font-size: 16px;
}

.controls-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.7) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 0, 0, 0.7) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;

  &.controls-visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.controls-overlay * {
  pointer-events: auto;
}

.top-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  color: white;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
}

.top-actions {
  display: flex;
  gap: 8px;
}

.center-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.play-button {
  width: 64px;
  height: 64px;
  font-size: 24px;
}

.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  color: white;
}

.progress-container {
  margin-bottom: 12px;
}

.progress-bar {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 8px;
}

.progress-buffered,
.progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-buffered {
  background: rgba(255, 255, 255, 0.5);
}

.progress-played {
  background: #409eff;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.time-display {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-family: 'Monaco', monospace;
  gap: 4px;

  .separator {
    opacity: 0.7;
  }
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
  position: relative;
}

.volume-input {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    border: none;
    cursor: pointer;
  }
}

.subtitle-overlay {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  text-align: center;
  pointer-events: none;
}

.subtitle-text {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1.4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-controls {
    padding: 12px 16px;
  }

  .bottom-controls {
    padding: 12px 16px;
  }

  .video-title {
    font-size: 12px;
  }

  .control-buttons {
    gap: 12px;
  }

  .volume-slider {
    width: 60px;
  }

  .play-button {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>