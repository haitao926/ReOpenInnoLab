<template>
  <div class="experience-renderer">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
      <p>正在加载体验内容...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <el-result icon="error" :title="error" :sub-title="errorDetail">
        <template #extra>
          <el-button type="primary" @click="retry">重试</el-button>
        </template>
      </el-result>
    </div>

    <!-- Experience Content -->
    <div v-else-if="experienceData" class="experience-content">
      <!-- Header -->
      <div class="experience-header">
        <h2>{{ experienceData.title }}</h2>
        <div class="experience-meta">
          <el-tag :type="getExperienceTypeTag(experienceData.type)">
            {{ getExperienceTypeLabel(experienceData.type) }}
          </el-tag>
          <span class="duration">预计时长: {{ experienceData.config.duration }} 分钟</span>
        </div>
      </div>

      <!-- Instructions -->
      <div v-if="experienceData.description" class="experience-instructions">
        <h3>体验说明</h3>
        <p>{{ experienceData.description }}</p>
      </div>

      <!-- Experience Container -->
      <div class="experience-container">
        <!-- Quiz Experience -->
        <div v-if="experienceData.type === 'quiz'" class="quiz-container">
          <QuizPlayer
            :questions="experienceData.content.questions"
            :config="experienceData.config"
            @complete="handleQuizComplete"
            @progress="handleProgress"
          />
        </div>

        <!-- Poll Experience -->
        <div v-else-if="experienceData.type === 'poll'" class="poll-container">
          <PollPlayer
            :poll="experienceData.content.poll"
            :config="experienceData.config"
            @complete="handlePollComplete"
            @vote="handleVote"
          />
        </div>

        <!-- Video Experience -->
        <div v-else-if="experienceData.type === 'video'" class="video-container">
          <VideoPlayer
            :video="experienceData.content.video"
            :config="experienceData.config"
            @complete="handleVideoComplete"
            @interaction="handleVideoInteraction"
          />
        </div>

        <!-- Custom HTML Experience -->
        <div v-else-if="experienceData.type === 'custom' || experienceData.type === 'html5'" class="custom-container">
          <iframe
            ref="experienceFrame"
            :src="experienceUrl"
            class="experience-frame"
            :sandbox="sandboxFlags"
            @load="handleFrameLoad"
          ></iframe>
        </div>
      </div>

      <!-- Floating Controls -->
      <div class="floating-controls">
        <el-button-group>
          <el-button v-if="canPause" size="small" @click="pauseExperience">
            <el-icon><VideoPause /></el-icon>
            暂停
          </el-button>
          <el-button v-if="canResume" size="small" @click="resumeExperience">
            <el-icon><VideoPlay /></el-icon>
            继续
          </el-button>
          <el-button v-if="canReset" size="small" @click="resetExperience">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <el-button size="small" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            全屏
          </el-button>
        </el-button-group>
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress" class="progress-bar">
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="8"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  VideoPause,
  RefreshRight,
  FullScreen
} from '@element-plus/icons-vue'
import { ExperienceApiService } from '@/api/experience'
import type { ExperienceTemplate, ExperienceRun } from '@/types/experience'
import QuizPlayer from './QuizPlayer.vue'
import PollPlayer from './PollPlayer.vue'
import VideoPlayer from './VideoPlayer.vue'

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
    interaction: [event: any]
    fullscreen: [isFullscreen: boolean]
  }>()

// 状态
const loading = ref(true)
const error = ref('')
const errorDetail = ref('')
const experienceData = ref<ExperienceTemplate>()
const experienceRun = ref<ExperienceRun>()
const experienceFrame = ref<HTMLIFrameElement>()
const progress = ref(0)
const progressStatus = ref<'success' | 'exception' | 'warning' | ''>('')
const canPause = ref(false)
const canResume = ref(false)
const canReset = ref(false)
const isFullscreen = ref(false)

// 计算属性
const showProgress = computed(() => {
  return experienceData.value?.config.showProgressBar !== false && props.mode === 'student'
})

const sandboxFlags = computed(() => {
  const flags = experienceData.value?.securityPolicy?.sandboxFlags || []
  return flags.join(' ')
})

const experienceUrl = computed(() => {
  if (!experienceRun.value || !experienceData.value) return ''

  const baseUrl = '/experience'
  const params = new URLSearchParams({
    runId: props.runId,
    experienceId: experienceData.value.id,
    mode: props.mode || 'student',
    ...experienceData.value.config
  })

  return `${baseUrl}?${params.toString()}`
})

// 方法
const loadExperience = async () => {
  loading.value = true
  error.value = ''

  try {
    // Load experience run
    experienceRun.value = await ExperienceApiService.getExperienceRun(props.runId)

    // Load experience template
    experienceData.value = await ExperienceApiService.getExperienceTemplate(
      experienceRun.value.experienceTemplateId
    )

    // PostMessage listener setup for custom HTML experiences
    if (experienceData.value.type === 'custom' || experienceData.value.type === 'html5') {
      window.addEventListener('message', handlePostMessage)
    }

    // Auto-start if configured
    if (props.autoStart) {
      setTimeout(() => startExperience(), 500)
    }

    emit('ready')
  } catch (err: any) {
    console.error('Failed to load experience:', err)
    error.value = '加载体验失败'
    errorDetail.value = err.message || '未知错误'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const startExperience = () => {
  if (!experienceData.value || !experienceRun.value) return

  canPause.value = true
  canReset.value = true
  canResume.value = false

  // Send start event to iframe
  if (experienceFrame.value?.contentWindow) {
    experienceFrame.value.contentWindow.postMessage({
      type: 'start',
      data: {
        runId: props.runId,
        config: experienceData.value.config,
        securityPolicy: experienceData.value.securityPolicy
      }
    }, '*')
  }

  emit('start')
}

const pauseExperience = () => {
  if (!experienceFrame.value?.contentWindow) return

  experienceFrame.value.contentWindow.postMessage({
    type: 'pause'
  }, '*')

  canPause.value = false
  canResume.value = true
}

const resumeExperience = () => {
  if (!experienceFrame.value?.contentWindow) return

  experienceFrame.value.contentWindow.postMessage({
    type: 'resume'
  }, '*')

  canPause.value = true
  canResume.value = false
}

const resetExperience = () => {
  if (!experienceFrame.value?.contentWindow) return

  experienceFrame.value.contentWindow.postMessage({
    type: 'reset'
  }, '*')

  progress.value = 0
  progressStatus.value = ''
  canPause.value = false
  canResume.value = false
}

const toggleFullscreen = () => {
  const container = document.querySelector('.experience-container') as HTMLElement
  if (!container) return

  if (!isFullscreen.value) {
    if (container.requestFullscreen) {
      container.requestFullscreen()
    } else if ((container as any).webkitRequestFullscreen) {
      (container as any).webkitRequestFullscreen()
    } else if ((container as any).msRequestFullscreen) {
      (container as any).msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    }
  }

  isFullscreen.value = !isFullscreen.value
  emit('fullscreen', isFullscreen.value)
}

const handlePostMessage = (event: MessageEvent) => {
  // Verify origin
  if (!experienceUrl.value || !event.origin.includes(window.location.hostname)) {
    return
  }

  const { type, data } = event.data

  switch (type) {
    case 'ready':
      console.log('Experience iframe ready')
      break

    case 'progress':
      progress.value = data.progress || 0
      emit('progress', progress.value)
      break

    case 'complete':
      progress.value = 100
      progressStatus.value = 'success'
      emit('complete', data.result)
      break

    case 'error':
      error.value = data.error || '体验发生错误'
      progressStatus.value = 'exception'
      emit('error', error.value)
      break

    case 'interaction':
      emit('interaction', data)
      break

    case 'resize':
      // Handle iframe resize
      if (experienceFrame.value && data.height) {
        experienceFrame.value.style.height = `${data.height}px`
      }
      break
  }
}

const handleFrameLoad = () => {
  console.log('Experience iframe loaded')
}

const handleQuizComplete = (result: any) => {
  progress.value = 100
  progressStatus.value = 'success'
  emit('complete', result)
}

const handlePollComplete = (result: any) => {
  progress.value = 100
  progressStatus.value = 'success'
  emit('complete', result)
}

const handleVideoComplete = (result: any) => {
  progress.value = 100
  progressStatus.value = 'success'
  emit('complete', result)
}

const handleVideoInteraction = (event: any) => {
  emit('interaction', event)
}

const handleVote = (vote: any) => {
  emit('interaction', { type: 'vote', data: vote })
}

const handleProgress = (progressValue: number) => {
  progress.value = progressValue
  emit('progress', progressValue)
}

const getExperienceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    quiz: '测验',
    poll: '投票',
    video: '互动视频',
    custom: '自定义',
    html5: 'HTML5'
  }
  return labels[type] || type
}

const getExperienceTypeTag = (type: string): string => {
  const tags: Record<string, string> = {
    quiz: 'primary',
    poll: 'success',
    video: 'warning',
    custom: 'info',
    html5: 'info'
  }
  return tags[type] || 'info'
}

const retry = () => {
  loadExperience()
}

// 生命周期
onMounted(() => {
  loadExperience()

  // Handle fullscreen change
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  window.removeEventListener('message', handlePostMessage)
})

// 监听 props 变化
watch(
  () => props.runId,
  () => {
    loadExperience()
  }
)
</script>

<style lang="scss" scoped>
  .experience-renderer {
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

  .experience-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .experience-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);

    h2 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    .experience-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);

      .duration {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
  }

  .experience-instructions {
    padding: var(--spacing-lg);
    background-color: var(--edu-color-blue-50);
    border-bottom: 1px solid var(--edu-color-blue-200);

    h3 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--edu-color-blue-700);
    }

    p {
      margin: 0;
      color: var(--edu-color-blue-600);
    }
  }

  .experience-container {
    flex: 1;
    position: relative;
    overflow: hidden;

    .quiz-container,
    .poll-container,
    .video-container {
      height: 100%;
      padding: var(--spacing-lg);
    }

    .custom-container {
      height: 100%;
    }

    .experience-frame {
      width: 100%;
      height: 100%;
      border: none;
      background-color: white;
    }
  }

  .floating-controls {
    position: absolute;
    top: var(--spacing-lg);
    right: var(--spacing-lg);
    z-index: 100;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    box-shadow: var(--edu-shadow-lg);
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

  // Fullscreen styles
  &:fullscreen {
    .experience-header,
    .experience-instructions {
      display: none;
    }
  }
</style>