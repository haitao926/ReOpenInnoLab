<template>
  <div class="realtime-lesson-view" :class="{ 'fullscreen': isFullscreen }">
    <!-- 连接状态指示器 -->
    <div class="connection-status" :class="connectionStatusClass">
      <el-icon v-if="connectionStatus === 'connected'"><CircleCheck /></el-icon>
      <el-icon v-else-if="connectionStatus === 'connecting'"><Loading /></el-icon>
      <el-icon v-else><CircleClose /></el-icon>
      <span>{{ connectionStatusText }}</span>
    </div>

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
        <div class="progress-card">
          <h3>课程进度</h3>
          <el-progress
            :percentage="lessonProgress"
            :stroke-width="8"
            :show-text="true"
            text-inside
          />
          <div class="sections-nav">
            <div
              v-for="(section, index) in lessonData?.sections || []"
              :key="index"
              :class="['section-item', {
                'active': index === currentSectionIndex,
                'completed': index < currentSectionIndex
              }]"
              @click="jumpToSection(index)"
            >
              <div class="section-icon">
                <el-icon>
                  <component :is="getSectionIcon(section.type)" />
                </el-icon>
              </div>
              <div class="section-info">
                <div class="section-title">{{ section.title }}</div>
                <div class="section-type">{{ getSectionTypeName(section.type) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 个人进度 -->
        <div class="personal-progress-card">
          <h3>我的进度</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ sectionProgress.completionRate }}%</div>
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
          <el-icon><FullScreenExit /></el-icon>
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
import { ElMessage, ElNotification } from 'element-plus'
import {
  CircleCheck, CircleClose, Loading, FullScreen,
  Pointer, EditPen, QuestionFilled, Close
} from '@element-plus/icons-vue'
import { useLessonStore } from '@/stores/lesson'
import { useSocket } from '@/composables/useSocket'
import { useNotification } from '@/composables/useNotification'
import LessonSectionRenderer from '@/components/lesson/LessonSectionRenderer.vue'
import type { StudentInteraction, SectionProgress } from '@/types/lesson'

const route = useRoute()
const router = useRouter()
const lessonStore = useLessonStore()
const {
  connect,
  disconnect,
  submitStudentInteraction,
  connectionStatus,
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

// 计算属性
const lessonData = computed(() => lessonStore.currentLesson)
const currentSection = computed(() => {
  if (!lessonData.value?.sections) return null
  return lessonData.value.sections[currentSectionIndex.value]
})

const connectionStatusClass = computed(() => ({
  'connected': connectionStatus.value === 'connected',
  'connecting': connectionStatus.value === 'connecting',
  'disconnected': connectionStatus.value === 'disconnected'
}))

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'disconnected': return '连接断开'
    default: return '未知状态'
  }
})

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
  interactions: interactions.value,
  notes: notes.value,
  progress: sectionProgress.value,
  handRaised: hasRaisedHand.value
}))

// 方法
const connectToLesson = async () => {
  try {
    isLoading.value = true

    // 连接Socket.IO
    await connect('/lesson')

    // 加入课程房间 - 这里需要真实的用户数据，暂时使用模拟数据
    const userId = 'student_' + Date.now() // 应该从用户store获取
    const classroomId = 'classroom_' + lessonId // 应该从课程数据获取

    if (joinLesson(lessonId, userId, 'student', classroomId)) {
      // 加载课程数据
      await lessonStore.loadLesson(lessonId)

      // 恢复笔记
      const savedNotes = localStorage.getItem(`lesson_notes_${lessonId}`)
      if (savedNotes) {
        notes.value = savedNotes
      }

      ElMessage.success('成功连接到课堂')
    } else {
      throw new Error('Failed to join lesson')
    }
  } catch (error) {
    console.error('连接课堂失败:', error)
    ElMessage.error('连接课堂失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const disconnectFromLesson = () => {
  saveNotes()
  disconnect()
  lessonStore.clearCurrentLesson()
}

const reconnect = () => {
  connectToLesson()
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

const jumpToSection = (index: number) => {
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
  const userId = 'student_' + Date.now() // 应该从用户store获取
  submitStudentInteraction(
    lessonId,
    userId,
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
  const userId = 'student_' + Date.now() // 应该从用户store获取
  submitStudentInteraction(
    lessonId,
    userId,
    'progress_update',
    {
      sectionIndex: currentSectionIndex.value,
      progress
    }
  )
}

const raiseHand = () => {
  hasRaisedHand.value = !hasRaisedHand.value

  const userId = 'student_' + Date.now() // 应该从用户store获取
  submitStudentInteraction(
    lessonId,
    userId,
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

  const userId = 'student_' + Date.now() // 应该从用户store获取
  submitStudentInteraction(
    lessonId,
    userId,
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

// 生命周期
onMounted(async () => {
  await connectToLesson()

  // 注册Socket.IO消息监听器
  const unsubscribe = onMessage(handleSocketMessage)

  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // 页面关闭前保存数据
  window.addEventListener('beforeunload', () => {
    saveNotes()
    unsubscribe() // 清理消息监听器
    disconnectFromLesson()
  })
})

onUnmounted(() => {
  saveNotes()
  disconnectFromLesson()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 监听连接状态变化
watch(connectionStatus, (newStatus) => {
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

.connection-status {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  &.connected {
    background: #f0f9ff;
    color: #1e40af;
    border: 1px solid #3b82f6;
  }

  &.connecting {
    background: #fef3c7;
    color: #d97706;
    border: 1px solid #f59e0b;
  }

  &.disconnected {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #ef4444;
  }

  .el-icon {
    font-size: 16px;
  }
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

    .sections-nav {
      margin-top: 16px;

      .section-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 8px;

        &:hover {
          background: #f9fafb;
        }

        &.active {
          background: #eff6ff;
          border: 1px solid #3b82f6;
        }

        &.completed {
          background: #f0fdf4;
          border: 1px solid #22c55e;
        }

        .section-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;

          .section-item.active & {
            background: #3b82f6;
            color: white;
          }

          .section-item.completed & {
            background: #22c55e;
            color: white;
          }
        }

        .section-info {
          flex: 1;

          .section-title {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 2px;
          }

          .section-type {
            font-size: 12px;
            color: #6b7280;
          }
        }
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