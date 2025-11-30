<template>
  <div class="video-player">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="video" class="video-content">
      <!-- Video Container -->
      <div class="video-container" ref="videoContainer">
        <video
          ref="videoElement"
          :src="video.url"
          :poster="video.poster"
          class="video-element"
          @timeupdate="handleTimeUpdate"
          @ended="handleVideoEnd"
          @pause="handlePause"
          @play="handlePlay"
        />

        <!-- Custom Controls Overlay -->
        <div class="video-controls" :class="{ 'video-controls--visible': showControls }">
          <!-- Play/Pause Button -->
          <div class="control-center" @click="togglePlay">
            <el-icon v-if="!isPlaying" class="play-icon">
              <VideoPlay />
            </el-icon>
            <el-icon v-else class="pause-icon">
              <VideoPause />
            </el-icon>
          </div>

          <!-- Bottom Controls -->
          <div class="control-bar">
            <!-- Progress Bar -->
            <div class="progress-container" @click="seekTo">
              <div class="progress-bar">
                <div
                  class="progress-buffered"
                  :style="{ width: `${bufferedPercentage}%` }"
                ></div>
                <div
                  class="progress-played"
                  :style="{ width: `${playedPercentage}%` }"
                ></div>
                <div
                  class="progress-handle"
                  :style="{ left: `${playedPercentage}%` }"
                ></div>
              </div>
              <span class="time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </span>
            </div>

            <!-- Control Buttons -->
            <div class="control-buttons">
              <el-button-group>
                <el-button size="small" @click="toggleMute">
                  <el-icon v-if="isMuted">
                    <Mute />
                  </el-icon>
                  <el-icon v-else>
                    <Microphone />
                  </el-icon>
                </el-button>
                <el-button size="small" @click="toggleFullscreen">
                  <FullScreen />
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>

        <!-- Interaction Points -->
        <div
          v-for="point in interactionPoints"
          :key="point.id"
          class="interaction-point"
          :style="{ left: `${(point.time / duration) * 100}%` }"
          @click="triggerInteraction(point)"
        >
          <el-icon><Pointer /></el-icon>
          <div class="interaction-tooltip">
            {{ point.title }}
          </div>
        </div>
      </div>

      <!-- Video Info -->
      <div class="video-info">
        <h3>{{ video.title }}</h3>
        <p v-if="video.description">{{ video.description }}</p>
      </div>

      <!-- Chapters/Sections -->
      <div v-if="video.chapters && video.chapters.length" class="video-chapters">
        <h4>章节</h4>
        <div class="chapters-list">
          <div
            v-for="chapter in video.chapters"
            :key="chapter.id"
            class="chapter-item"
            :class="{ 'chapter-item--active': isChapterActive(chapter) }"
            @click="seekToChapter(chapter)"
          >
            <div class="chapter-thumbnail">
              <img v-if="chapter.thumbnail" :src="chapter.thumbnail" :alt="chapter.title" />
              <div v-else class="thumbnail-placeholder">
                <el-icon><VideoCamera /></el-icon>
              </div>
            </div>
            <div class="chapter-info">
              <div class="chapter-title">{{ chapter.title }}</div>
              <div class="chapter-time">{{ formatTime(chapter.startTime) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  VideoPlay,
  VideoPause,
  Mute,
  Microphone,
  FullScreen,
  Pointer,
  VideoCamera
} from '@element-plus/icons-vue'

const props = defineProps<{
    video: {
      url: string
      title: string
      description?: string
      poster?: string
      duration?: number
      chapters?: Array<{
        id: string
        title: string
        startTime: number
        endTime?: number
        thumbnail?: string
      }>
      interactions?: Array<{
        id: string
        time: number
        type: 'pause' | 'question' | 'link' | 'info'
        title: string
        content?: any
      }>
    }
    config?: {
      autoplay?: boolean
      controls?: boolean
      loop?: boolean
      speed?: number
    }
  }>()

const emit = defineEmits<{
    complete: [result: any]
    interaction: [event: any]
    progress: [progress: number]
  }>()

// 状态
const loading = ref(false)
const videoElement = ref<HTMLVideoElement>()
const videoContainer = ref<HTMLDivElement>()
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const bufferedTime = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const showControls = ref(true)
const controlsTimeout = ref<NodeJS.Timeout>()
const interactionPoints = ref(props.video.interactions || [])
const triggeredInteractions = ref<Set<string>>(new Set())

// 计算属性
const playedPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const bufferedPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (bufferedTime.value / duration.value) * 100
})

// 方法
const handleTimeUpdate = () => {
  if (!videoElement.value) return

  currentTime.value = videoElement.value.currentTime

  // Update buffered time
  if (videoElement.value.buffered.length > 0) {
    bufferedTime.value = videoElement.value.buffered.end(videoElement.value.buffered.length - 1)
  }

  // Check for interaction points
  checkInteractionPoints()

  // Emit progress
  emit('progress', playedPercentage.value)
}

const handleVideoEnd = () => {
  isPlaying.value = false
  const result = {
    duration: currentTime.value,
    interactionsTriggered: triggeredInteractions.value.size,
    chaptersCompleted: getCompletedChapters()
  }
  emit('complete', result)
}

const handlePlay = () => {
  isPlaying.value = true
  hideControls()
}

const handlePause = () => {
  isPlaying.value = false
  showControls.value = true
}

const togglePlay = () => {
  if (!videoElement.value) return

  if (isPlaying.value) {
    videoElement.value.pause()
  } else {
    videoElement.value.play()
  }
}

const toggleMute = () => {
  if (!videoElement.value) return

  isMuted.value = !isMuted.value
  videoElement.value.muted = isMuted.value
}

const toggleFullscreen = () => {
  if (!videoContainer.value) return

  if (!document.fullscreenElement) {
    videoContainer.value.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const seekTo = (event: MouseEvent) => {
  if (!videoElement.value || !videoContainer.value) return

  const rect = videoContainer.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const seekTime = percentage * duration.value

  videoElement.value.currentTime = seekTime
}

const seekToChapter = (chapter: any) => {
  if (!videoElement.value) return
  videoElement.value.currentTime = chapter.startTime
}

const isChapterActive = (chapter: any) => {
  return currentTime.value >= chapter.startTime &&
         (!chapter.endTime || currentTime.value <= chapter.endTime)
}

const getCompletedChapters = () => {
  if (!props.video.chapters) return 0
  return props.video.chapters.filter(chapter =>
    currentTime.value >= (chapter.endTime || chapter.startTime)
  ).length
}

const checkInteractionPoints = () => {
  interactionPoints.value.forEach(point => {
    if (
      !triggeredInteractions.value.has(point.id) &&
      Math.abs(currentTime.value - point.time) < 0.5
    ) {
      triggerInteraction(point)
    }
  })
}

const triggerInteraction = (point: any) => {
  if (triggeredInteractions.value.has(point.id)) return

  triggeredInteractions.value.add(point.id)

  // Handle different interaction types
  switch (point.type) {
    case 'pause':
      if (videoElement.value) {
        videoElement.value.pause()
      }
      showInteractionDialog(point)
      break

    case 'question':
      showInteractionDialog(point)
      break

    case 'link':
      if (point.content?.url) {
        window.open(point.content.url, '_blank')
      }
      break

    case 'info':
      showInteractionDialog(point)
      break
  }

  emit('interaction', {
    type: point.type,
    time: currentTime.value,
    data: point.content
  })
}

const showInteractionDialog = (point: any) => {
  // TODO: Show interaction dialog
  console.log('Interaction triggered:', point)
}

const hideControls = () => {
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }

  controlsTimeout.value = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const showControlsTemporarily = () => {
  showControls.value = true
  if (isPlaying.value) {
    hideControls()
  }
}

// 生命周期
onMounted(() => {
  if (videoElement.value) {
    videoElement.value.addEventListener('loadedmetadata', () => {
      duration.value = videoElement.value?.duration || 0
    })

    // Set initial volume
    videoElement.value.volume = volume.value

    // Auto-play if configured
    if (props.config?.autoplay) {
      videoElement.value.play()
    }
  }

  // Show controls on mouse move
  if (videoContainer.value) {
    videoContainer.value.addEventListener('mousemove', showControlsTemporarily)
  }
})

onUnmounted(() => {
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }
})
</script>

<style lang="scss" scoped>
  .video-player {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #000;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .video-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .video-container {
    flex: 1;
    position: relative;
    background-color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-element {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .video-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%);
    opacity: 0;
    transition: opacity var(--edu-duration-fast);
    pointer-events: none;

    &--visible {
      opacity: 1;
      pointer-events: all;
    }
  }

  .control-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--edu-duration-fast);

    &:hover {
      background-color: rgba(0, 0, 0, 0.9);
      transform: translate(-50%, -50%) scale(1.1);
    }

    .play-icon,
    .pause-icon {
      font-size: 36px;
      color: white;
    }
  }

  .control-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-lg);
  }

  .progress-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
  }

  .progress-bar {
    flex: 1;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    position: relative;
    transition: height var(--edu-duration-fast);

    &:hover {
      height: 8px;
    }
  }

  .progress-buffered {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
  }

  .progress-played {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: var(--edu-primary-500);
    border-radius: 2px;
  }

  .progress-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .time-display {
    color: white;
    font-size: var(--font-size-sm);
    font-family: monospace;
    min-width: 100px;
    text-align: right;
  }

  .control-buttons {
    display: flex;
    gap: var(--spacing-sm);
  }

  .interaction-point {
    position: absolute;
    top: 20px;
    transform: translateX(-50%);
    width: 32px;
    height: 32px;
    background-color: var(--edu-primary-500);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    animation: pulse 2s infinite;

    .el-icon {
      color: white;
      font-size: 16px;
    }

    &:hover .interaction-tooltip {
      opacity: 1;
    }
  }

  .interaction-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-base);
    font-size: var(--font-size-xs);
    white-space: nowrap;
    opacity: 0;
    transition: opacity var(--edu-duration-fast);
    pointer-events: none;
    margin-bottom: var(--spacing-xs);
  }

  .video-info {
    padding: var(--spacing-lg);
    background-color: white;

    h3 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      line-height: var(--line-height-relaxed);
    }
  }

  .video-chapters {
    padding: var(--spacing-lg);
    background-color: var(--edu-color-gray-50);
    max-height: 300px;
    overflow-y: auto;

    h4 {
      margin: 0 0 var(--spacing-base) 0;
      color: var(--text-primary);
    }
  }

  .chapters-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .chapter-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-sm);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: background-color var(--edu-duration-fast);

    &:hover {
      background-color: var(--edu-color-gray-100);
    }

    &--active {
      background-color: var(--edu-primary-50);
      border: 1px solid var(--edu-primary-200);
    }
  }

  .chapter-thumbnail {
    width: 80px;
    height: 45px;
    border-radius: var(--radius-base);
    overflow: hidden;
    background-color: var(--edu-color-gray-200);

    img {
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
      color: var(--edu-color-gray-400);
    }
  }

  .chapter-info {
    flex: 1;

    .chapter-title {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    .chapter-time {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(var(--edu-primary-500-rgb), 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(var(--edu-primary-500-rgb), 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(var(--edu-primary-500-rgb), 0);
    }
  }
</style>