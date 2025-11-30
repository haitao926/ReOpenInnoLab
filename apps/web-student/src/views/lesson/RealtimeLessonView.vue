<template>
  <div class="realtime-lesson-view" :class="{ 'fullscreen': isFullscreen }">
    <!-- 连接状态指示器 -->
    <ConnectionStatus
      class="connection-status-badge"
      :status="displayConnectionStatus"
      :reconnect-attempts="reconnectAttempts"
      :last-error="lastError"
      show-retry
      @retry="reconnect"
    />

    <!-- 顶部信息栏 -->
    <header class="lesson-header" v-show="!isFullscreen">
      <div class="lesson-info">
        <h2>{{ lessonData?.title || '实时课堂' }}</h2>
        <span class="section-info" v-if="currentSection">
          {{ currentSection.title }} ({{ formatTime(currentSectionDuration) }})
        </span>
      </div>
      <div class="header-controls">
        <el-button @click="toggleFullscreen" :icon="FullScreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="lesson-main">
      <!-- 当前环节内容 -->
      <div class="content-area">
        <div v-if="connectionStatus === 'disconnected'" class="connection-lost">
          <el-result
            icon="warning"
            title="连接断开"
            sub-title="与课堂的连接已断开，正在尝试重新连接..."
          >
            <template #extra>
              <el-button type="primary" @click="reconnect">重新连接</el-button>
            </template>
          </el-result>
        </div>

        <div v-else-if="!currentSection" class="waiting-content">
          <el-empty description="等待教师开始课堂..." />
        </div>

        <LessonSectionRenderer
          v-else
          :section="currentSection"
          :section-progress="sectionProgress"
          :student-data="studentData"
          @interaction="handleInteraction"
          @progress-update="handleProgressUpdate"
        />

        <!-- 加载指示器 -->
        <div v-if="isLoading" class="loading-overlay">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
      </div>

      <!-- 侧边栏 -->
      <aside class="lesson-sidebar" v-show="!isFullscreen">
        <!-- 课程进度 -->
        <ProgressPanel
          v-if="lessonData?.sections?.length"
          :sections="lessonData.sections"
          :current-index="currentSectionIndex"
          :progress="lessonProgress"
          @select="handleSectionSelect"
        />

        <!-- 个人进度 -->
        <div class="personal-progress-card">
          <h3>我的进度</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ currentSectionCompletion }}%</div>
              <div class="stat-label">当前环节完成度</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ interactions.length }}</div>
              <div class="stat-label">互动次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatTime(totalTime) }}</div>
              <div class="stat-label">学习时长</div>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions-card">
          <h3>快速操作</h3>
          <el-space direction="vertical" style="width: 100%;">
            <el-button
              @click="raiseHand"
              :type="hasRaisedHand ? 'success' : 'primary'"
              :disabled="!isLessonActive"
            >
              <el-icon><Pointer /></el-icon>
              {{ hasRaisedHand ? '已举手' : '举手' }}
            </el-button>
            <el-button
              @click="askQuestion"
              type="info"
              :disabled="!isLessonActive"
            >
              <el-icon><QuestionFilled /></el-icon>
              提问
            </el-button>
            <el-button @click="toggleNotes">
              <el-icon><EditPen /></el-icon>
              {{ showNotes ? '隐藏笔记' : '显示笔记' }}
            </el-button>
          </el-space>
        </div>
      </aside>
    </main>

    <!-- 笔记面板 -->
    <div class="notes-panel" :class="{ 'show': showNotes }">
      <div class="notes-header">
        <h3>课堂笔记</h3>
        <el-button @click="showNotes = false" type="text">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="notes-content">
        <el-input
          v-model="notes"
          type="textarea"
          :rows="8"
          placeholder="在这里记录你的课堂笔记..."
          @input="saveNotes"
        />
      </div>
    </div>

    <!-- 浮动控制按钮 (全屏模式) -->
    <div class="floating-controls" v-show="isFullscreen">
      <el-button-group>
        <el-button @click="raiseHand" :type="hasRaisedHand ? 'success' : 'primary'" circle>
          <el-icon><Pointer /></el-icon>
        </el-button>
        <el-button @click="toggleNotes" circle>
          <el-icon><EditPen /></el-icon>
        </el-button>
        <el-button @click="exitFullscreen" circle>
          <el-icon><Close /></el-icon>
        </el-button>
      </el-button-group>
    </div>

    <!-- 互动弹窗 -->
    <el-dialog
      v-model="showQuestionDialog"
      title="向老师提问"
      width="500px"
    >
      <el-input
        v-model="questionText"
        type="textarea"
        :rows="4"
        placeholder="请输入你的问题..."
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showQuestionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion" :disabled="!questionText.trim()">
          提交问题
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Loading, FullScreen,
  Pointer, EditPen, QuestionFilled, Close
} from '@element-plus/icons-vue'
import { useLessonStore } from '@/stores/lesson'
import { useUserStore } from '@/stores/user'
import { useSocket } from '@/composables/useSocket'
import { useNotification } from '@/composables/useNotification'
import LessonSectionRenderer from '@/components/lesson/LessonSectionRenderer.vue'
import ConnectionStatus from '@/components/lesson/ConnectionStatus.vue'
import ProgressPanel from '@/components/lesson/ProgressPanel.vue'
import type { StudentInteraction, SectionProgress } from '@/types/lesson'

const route = useRoute()
const router = useRouter()
const lessonStore = useLessonStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const {
  connect,
  disconnect,
  submitStudentInteraction,
  connectionStatus,
  reconnectAttempts,
  lastError,
  onMessage,
  joinLesson
} = useSocket()
const { showNotification } = useNotification()

// 响应式数据
const lessonId = route.params.lessonId as string
const isLoading = ref(true)
const isFullscreen = ref(false)
const showNotes = ref(false)
const showQuestionDialog = ref(false)
const questionText = ref('')
const notes = ref('')
const hasRaisedHand = ref(false)
const currentSectionIndex = ref(0)
const sectionProgress = ref<SectionProgress>({
  completed: false,
  progress: 0,
  timeSpent: 0,
  interactions: []
})
const interactions = ref<StudentInteraction[]>([])
const startTime = ref<Date | null>(null)
const currentSectionStartTime = ref<Date | null>(null)
const messageDisposer = ref<(() => void) | null>(null)

// 计算属性
const lessonData = computed(() => lessonStore.currentLesson)
const currentSection = computed(() => {
  if (!lessonData.value?.sections) return null
  return lessonData.value.sections[currentSectionIndex.value]
})

const activeStudentId = computed(() => user.value?.studentId || user.value?.id || `student_${lessonId}`)
const studentRole = computed(() => (user.value?.role === 'teacher' ? 'teacher' : 'student'))
const resolvedClassroomId = computed(() => lessonData.value?.classroomId || (route.query.classroomId as string) || '')
const displayConnectionStatus = computed(() => connectionStatus.value || 'idle')


const lessonProgress = computed(() => {
  if (!lessonData.value?.sections) return 0
  return Math.round(((currentSectionIndex.value + 1) / lessonData.value.sections.length) * 100)
})

const isLessonActive = computed(() => lessonStore.isLessonActive)

const currentSectionDuration = computed(() => {
  if (!currentSectionStartTime.value) return 0
  return Date.now() - currentSectionStartTime.value.getTime()
})

const totalTime = computed(() => {
  if (!startTime.value) return 0
  return Date.now() - startTime.value.getTime()
})

const studentData = computed(() => ({
  studentId: activeStudentId.value,
  interactions: interactions.value,
  notes: notes.value,
  progress: sectionProgress.value,
  handRaised: hasRaisedHand.value
}))

const currentSectionCompletion = computed(() => Math.round(sectionProgress.value.progress))

// 方法
const connectToLesson = async () => {
  try {
    isLoading.value = true
    lessonStore.setConnectionState('connecting')

    const lesson = await lessonStore.initLesson(lessonId)
    const classroomId = resolvedClassroomId.value || lesson.classroomId

    if (!classroomId) {
      throw new Error('未找到课堂所属班级信息')
    }

    await connect('/lesson')

    const joined = joinLesson(
      lessonId,
      activeStudentId.value,
      studentRole.value,
      classroomId,
      {
        studentName: user.value?.name,
        school: user.value?.school,
        grade: user.value?.grade
      }
    )

    if (!joined) {
      throw new Error('加入课堂失败')
    }

    const savedNotes = localStorage.getItem(`lesson_notes_${lessonId}`)
    if (savedNotes) {
      notes.value = savedNotes
    }

    if (!messageDisposer.value) {
      messageDisposer.value = onMessage(handleSocketMessage)
    }

    lessonStore.setConnectionState('connected')
    ElMessage.success('成功连接到课堂')
  } catch (error) {
    console.error('连接课堂失败:', error)
    lessonStore.setConnectionState('error', {
      reason: error instanceof Error ? error.message : '连接失败'
    })
    ElMessage.error('连接课堂失败，请稍后重试')
    throw error
  } finally {
    isLoading.value = false
  }
}

const disconnectFromLesson = () => {
  saveNotes()
  messageDisposer.value?.()
  messageDisposer.value = null
  disconnect()
  lessonStore.clearCurrentLesson()
  lessonStore.setConnectionState('disconnected')
}

const reconnect = async () => {
  try {
    await connectToLesson()
  } catch (error) {
    console.error('课堂重连失败:', error)
  }
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

const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
  isFullscreen.value = false
}

const handleSectionSelect = (index: number) => {
  // 学生端只能查看当前环节，不能自由跳转
  if (index !== currentSectionIndex.value) {
    ElMessage.info('请跟随老师的节奏进行学习')
  }
}

const handleInteraction = (interaction: Omit<StudentInteraction, 'timestamp'>) => {
  const fullInteraction: StudentInteraction = {
    ...interaction,
    timestamp: new Date(),
    sectionIndex: currentSectionIndex.value
  }

  interactions.value.push(fullInteraction)

  // 发送互动数据到服务器
  submitStudentInteraction(
    lessonId,
    activeStudentId.value,
    interaction.type,
    {
      ...interaction,
      sectionIndex: currentSectionIndex.value
    }
  )
}

const handleProgressUpdate = (progress: SectionProgress) => {
  sectionProgress.value = progress

  // 发送进度更新到服务器
  submitStudentInteraction(
    lessonId,
    activeStudentId.value,
    'progress_update',
    {
      sectionIndex: currentSectionIndex.value,
      progress
    }
  )
}

const raiseHand = () => {
  hasRaisedHand.value = !hasRaisedHand.value

  submitStudentInteraction(
    lessonId,
    activeStudentId.value,
    'hand_raise',
    {
      raised: hasRaisedHand.value
    }
  )

  ElMessage.success(hasRaisedHand.value ? '已举手' : '已取消举手')
}

const askQuestion = () => {
  showQuestionDialog.value = true
}

const submitQuestion = () => {
  if (!questionText.value.trim()) return

  submitStudentInteraction(
    lessonId,
    activeStudentId.value,
    'question',
    {
      question: questionText.value.trim()
    }
  )

  ElMessage.success('问题已提交')
  questionText.value = ''
  showQuestionDialog.value = false
}

const toggleNotes = () => {
  showNotes.value = !showNotes.value
}

const saveNotes = () => {
  localStorage.setItem(`lesson_notes_${lessonId}`, notes.value)
}

const formatTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getSectionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'introduction': 'VideoPlay',
    'knowledge': 'Reading',
    'experience': 'Monitor',
    'experiment': 'SetUp',
    'assignment': 'EditPen'
  }
  return iconMap[type] || 'Document'
}

const getSectionTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    'introduction': '课程引入',
    'knowledge': '新知讲解',
    'experience': '体验理解',
    'experiment': '实验活动',
    'assignment': '作业测试'
  }
  return nameMap[type] || '未知环节'
}

// Socket.IO事件处理
const handleSocketMessage = (message: any) => {
  switch (message.type) {
    case 'section_changed':
      // 教师切换了环节
      currentSectionIndex.value = message.data.sectionIndex
      currentSectionStartTime.value = new Date()
      sectionProgress.value = {
        completed: false,
        progress: 0,
        timeSpent: 0,
        interactions: []
      }
      showNotification('环节切换', `进入${getSectionTypeName(currentSection.value?.type || '')}环节`, 'info')
      break

    case 'lesson_state_changed':
      // 课程状态变更
      const state = message.data.state
      switch (state) {
        case 'started':
          startTime.value = new Date()
          currentSectionIndex.value = 0
          currentSectionStartTime.value = new Date()
          hasRaisedHand.value = false
          showNotification('课堂开始', `${lessonData.value?.title} 已开始`, 'info')
          break
        case 'paused':
          showNotification('课堂暂停', '老师暂时暂停了课堂', 'warning')
          break
        case 'resumed':
          showNotification('课堂继续', '课堂已继续进行', 'success')
          break
        case 'ended':
          showNotification('课堂结束', '课堂已结束，感谢参与！', 'success')
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
          break
      }
      break

    case 'annotation_received':
      // 收到教师批注
      showNotification('新批注', '教师添加了新的批注', 'info')
      break

    case 'user_joined':
      // 有用户加入课堂
      if (message.data.role === 'teacher') {
        showNotification('教师加入', '教师已加入课堂', 'success')
      }
      break

    default:
      console.log('未处理的消息类型:', message.type, message.data)
  }
}

// 全屏状态监听
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const beforeUnloadHandler = () => {
  disconnectFromLesson()
}

// 生命周期
onMounted(async () => {
  try {
    await connectToLesson()
  } catch (error) {
    console.error('初始化课堂失败:', error)
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  beforeUnloadHandler()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

// 监听连接状态变化
watch(connectionStatus, (newStatus) => {
  lessonStore.setConnectionState(newStatus, lastError.value ? { reason: lastError.value } : undefined)

  if (newStatus === 'disconnected') {
    ElNotification({
      title: '连接断开',
      message: '与课堂的连接已断开，正在尝试重新连接...',
      type: 'warning',
      duration: 5000
    })
  } else if (newStatus === 'connected') {
    ElNotification({
      title: '连接恢复',
      message: '已重新连接到课堂',
      type: 'success',
      duration: 3000
    })
  }
})
</script>

<style scoped lang="scss">
.realtime-lesson-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;

  &.fullscreen {
    background: #000;
  }
}

.connection-status-badge {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .lesson-info {
    h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }

    .section-info {
      color: #6b7280;
      font-size: 14px;
    }
  }
}

.lesson-main {
  flex: 1;
  display: flex;
  overflow: hidden;

  .content-area {
    flex: 1;
    position: relative;
    padding: 24px;
    overflow-y: auto;

    .connection-lost,
    .waiting-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 100;

      .el-icon {
        font-size: 32px;
        color: #3b82f6;
      }
    }
  }

  .lesson-sidebar {
    width: 320px;
    background: white;
    border-left: 1px solid #e5e7eb;
    padding: 20px;
    overflow-y: auto;

    .progress-card,
    .personal-progress-card,
    .quick-actions-card {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    .progress-panel,
    .personal-progress-card,
    .quick-actions-card {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }
  }
}

.notes-panel {
  position: fixed;
  right: -400px;
  top: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 999;
  display: flex;
  flex-direction: column;

  &.show {
    right: 0;
  }

  .notes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .notes-content {
    flex: 1;
    padding: 20px;
  }
}

.floating-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;

  .el-button-group {
    .el-button {
      margin-bottom: 8px;
    }
  }
}

// 全屏模式样式
.realtime-lesson-view.fullscreen {
  .lesson-main {
    .content-area {
      padding: 0;
      background: #000;
    }
  }

  .connection-status {
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .lesson-sidebar {
    width: 280px;
  }

  .notes-panel {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .lesson-header {
    padding: 12px 16px;

    .lesson-info h2 {
      font-size: 20px;
    }
  }

  .lesson-main {
    flex-direction: column;

    .content-area {
      padding: 16px;
    }

    .lesson-sidebar {
      width: 100%;
      max-height: 300px;
    }
  }

  .notes-panel {
    width: 100%;
    right: -100%;
  }
}
</style>
