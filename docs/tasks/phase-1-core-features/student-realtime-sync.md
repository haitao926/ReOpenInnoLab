# 学生端实时同步功能实现任务

**优先级**: 🔴 **最高优先级**
**阶段**: Phase 1 - 核心业务闭环
**预估工作量**: 3-4周
**影响范围**: apps/web-student/src/views/lesson/
**当前状态**: 基础架构存在，核心功能缺失

---

## 📋 任务描述

实现学生端的实时课堂同步功能，让学生能够实时接收教师的课堂内容，参与课堂互动，提交学习数据，实现真正的教-学协同。这是课程全景设计的核心学生端功能。

## 🎯 验收标准

### 核心功能验收
- [ ] 实时接收教师端播放状态
- [ ] 五环节内容正确渲染和同步
- [ ] 学习进度实时跟踪和上报
- [ ] 互动体验和实验活动支持
- [ ] 离线缓存和断线重连机制
- [ ] 学习数据自动收集和分析

### 用户体验验收
- [ ] 内容同步延迟 < 500ms
- [ ] 界面切换流畅无卡顿
- [ ] 网络异常时优雅降级
- [ ] 移动端适配良好
- [ ] 支持横竖屏切换

### 稳定性验收
- [ ] 支持2小时连续学习
- [ ] 内存使用稳定 < 200MB
- [ ] 断线重连成功率 > 95%
- [ ] 数据丢失率 < 0.1%

## 🔧 技术实现要点

### 1. 主学习界面
```vue
<!-- apps/web-student/src/views/lesson/RealtimeLessonView.vue -->
<template>
  <div class="realtime-lesson-view" :class="{ 'fullscreen': isFullscreen }">
    <!-- 连接状态指示器 -->
    <ConnectionStatus
      :status="connectionStatus"
      :reconnecting="isReconnecting"
    />

    <!-- 顶部信息栏 -->
    <header class="lesson-header">
      <div class="lesson-info">
        <h2>{{ currentLesson.title }}</h2>
        <div class="lesson-meta">
          <span class="teacher">{{ currentLesson.teacherName }}</span>
          <span class="class">{{ currentLesson.className }}</span>
          <span class="time">{{ formatTime(currentTime) }}</span>
        </div>
      </div>

      <div class="header-actions">
        <el-button @click="toggleFullscreen" size="small">
          <el-icon><FullScreen /></el-icon>
        </el-button>
        <el-button @click="showHelp" size="small">
          <el-icon><QuestionFilled /></el-icon>
        </el-button>
        <el-button @click="exitLesson" size="small" type="danger">
          <el-icon><Close /></el-icon>
          退出
        </el-button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="lesson-main">
      <!-- 当前环节内容 -->
      <div class="content-area">
        <LessonSectionRenderer
          :section="currentSection"
          :section-state="sectionState"
          :student-progress="studentProgress"
          @progress-update="handleProgressUpdate"
          @interaction-submit="handleInteractionSubmit"
          @error="handleSectionError"
        />
      </div>

      <!-- 侧边栏 - 学习状态和进度 -->
      <aside class="lesson-sidebar" v-if="!isMobile">
        <StudentProgressPanel
          :sections="lessonSections"
          :current-section="currentSectionIndex"
          :progress="studentProgress"
        />

        <InteractionPanel
          v-if="currentSection.allowInteraction"
          :section="currentSection"
          @submit="handleInteractionSubmit"
        />

        <QuickTools
          :available-tools="availableTools"
          @tool-select="handleToolSelect"
        />
      </aside>
    </main>

    <!-- 底部进度条 -->
    <footer class="lesson-footer">
      <div class="progress-info">
        <span class="section-title">{{ currentSection.title }}</span>
        <span class="section-type">{{ getSectionTypeLabel(currentSection.type) }}</span>
        <span class="progress-text">{{ progressPercentage }}% 完成</span>
      </div>

      <el-progress
        :percentage="progressPercentage"
        :stroke-width="6"
        :show-text="false"
      />
    </footer>

    <!-- 离线提示 -->
    <OfflinePrompt
      v-if="isOffline"
      :cached-content="cachedContent"
      @retry="handleRetryConnection"
    />

    <!-- 帮助弹窗 -->
    <HelpDialog
      v-model="helpVisible"
      :content="helpContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { LessonSectionRenderer } from '@/components/lesson'
import { ConnectionStatus } from '@/components/lesson'
import { StudentProgressPanel } from '@/components/lesson'
import { InteractionPanel } from '@/components/lesson'
import { QuickTools } from '@/components/lesson'
import { OfflinePrompt } from '@/components/lesson'
import { HelpDialog } from '@/components/lesson'
import { useLessonStore } from '@/stores/lesson'
import { useStudentStore } from '@/stores/student'
import { useNetworkStore } from '@/stores/network'
import { lessonSocket } from '@/services/websocket'
import type {
  Lesson,
  LessonSection,
  SectionState,
  StudentProgress,
  InteractionData,
  NetworkStatus
} from '@/types/lesson'

const route = useRoute()
const router = useRouter()
const lessonStore = useLessonStore()
const studentStore = useStudentStore()
const networkStore = useNetworkStore()

// 响应式数据
const lessonId = route.params.lessonId as string
const currentSectionIndex = ref(0)
const currentTime = ref(new Date())
const isFullscreen = ref(false)
const isOffline = ref(false)
const isReconnecting = ref(false)
const helpVisible = ref(false)
const studentProgress = ref<StudentProgress>({})
const sectionState = ref<SectionState>('loading')
const cachedContent = ref<any>(null)

// 计算属性
const currentLesson = computed(() => lessonStore.currentLesson)
const lessonSections = computed(() => currentLesson.value?.sections || [])
const currentSection = computed(() => lessonSections.value[currentSectionIndex.value])
const progressPercentage = computed(() => {
  const completed = Object.values(studentProgress.value)
    .filter(progress => progress.completed).length
  return lessonSections.value.length > 0
    ? Math.round((completed / lessonSections.value.length) * 100)
    : 0
})

const connectionStatus = computed(() => networkStore.status)
const isMobile = computed(() => window.innerWidth < 768)
const availableTools = computed(() => currentSection.value?.availableTools || [])

// 定时器
let timeTimer: number | null = null

// 方法
const initializeLesson = async () => {
  try {
    // 加载课程信息
    await lessonStore.loadLesson(lessonId)

    // 初始化WebSocket连接
    await lessonSocket.connect(lessonId)

    // 注册学生身份
    await lessonSocket.registerStudent({
      studentId: studentStore.currentStudent.id,
      lessonId,
      deviceInfo: getDeviceInfo()
    })

    // 检查缓存内容
    const cached = await lessonStore.getCachedLesson(lessonId)
    if (cached) {
      cachedContent.value = cached
    }

  } catch (error) {
    console.error('初始化课程失败:', error)
    ElMessage.error('无法连接到课堂，请检查网络连接')

    // 进入离线模式
    if (cachedContent.value) {
      enterOfflineMode()
    } else {
      await exitLesson()
    }
  }
}

const handleTeacherEvent = (event: any) => {
  switch (event.type) {
    case 'lesson:start':
      handleLessonStart(event.data)
      break
    case 'lesson:next':
      handleSectionChange(event.data.sectionIndex)
      break
    case 'lesson:previous':
      handleSectionChange(event.data.sectionIndex)
      break
    case 'lesson:pause':
      handleLessonPause(event.data)
      break
    case 'lesson:end':
      handleLessonEnd(event.data)
      break
    case 'annotation:add':
      handleAnnotationAdd(event.data)
      break
    default:
      console.log('未知事件类型:', event.type)
  }
}

const handleLessonStart = (data: any) => {
  currentSectionIndex.value = 0
  sectionState.value = 'active'
  recordStudentEvent('lesson_start', data)
}

const handleSectionChange = async (sectionIndex: number) => {
  if (sectionIndex < 0 || sectionIndex >= lessonSections.value.length) return

  // 保存当前环节进度
  await saveSectionProgress(currentSectionIndex.value)

  // 切换到新环节
  currentSectionIndex.value = sectionIndex
  sectionState.value = 'loading'

  try {
    // 加载新环节内容
    await loadSectionContent(sectionIndex)
    sectionState.value = 'active'

    recordStudentEvent('section_change', {
      fromSection: currentSectionIndex.value - 1,
      toSection: sectionIndex
    })

  } catch (error) {
    console.error('加载环节失败:', error)
    sectionState.value = 'error'
    ElMessage.error('加载内容失败，请重试')
  }
}

const loadSectionContent = async (sectionIndex: number) => {
  const section = lessonSections.value[sectionIndex]

  // 预加载资源
  if (section.resourceRefs?.length > 0) {
    await lessonStore.preloadResources(section.resourceRefs)
  }

  // 初始化学生进度
  if (!studentProgress.value[sectionIndex]) {
    studentProgress.value[sectionIndex] = {
      sectionIndex,
      startTime: new Date(),
      progress: 0,
      completed: false,
      interactions: [],
      timeSpent: 0
    }
  }
}

const handleProgressUpdate = async (progress: number) => {
  const sectionIndex = currentSectionIndex.value
  if (studentProgress.value[sectionIndex]) {
    studentProgress.value[sectionIndex].progress = progress
    studentProgress.value[sectionIndex].lastUpdate = new Date()

    // 实时上报进度
    recordStudentEvent('progress_update', {
      sectionIndex,
      progress
    })
  }
}

const handleInteractionSubmit = async (data: InteractionData) => {
  try {
    // 提交交互数据
    const result = await lessonStore.submitInteraction({
      lessonId,
      sectionIndex: currentSectionIndex.value,
      ...data
    })

    // 更新本地进度
    if (studentProgress.value[currentSectionIndex.value]) {
      studentProgress.value[currentSectionIndex.value].interactions.push({
        type: data.type,
        data: data.data,
        timestamp: new Date(),
        result: result
      })
    }

    // 实时上报
    lessonSocket.emit('student:interaction', {
      studentId: studentStore.currentStudent.id,
      lessonId,
      sectionIndex: currentSectionIndex.value,
      interaction: data
    })

    ElMessage.success('提交成功')

  } catch (error) {
    console.error('提交交互失败:', error)
    ElMessage.error('提交失败，请重试')
  }
}

const recordStudentEvent = async (eventType: string, data: any) => {
  try {
    const event = {
      studentId: studentStore.currentStudent.id,
      lessonId,
      sectionIndex: currentSectionIndex.value,
      eventType,
      data,
      timestamp: new Date(),
      deviceInfo: getDeviceInfo()
    }

    // 实时上报
    lessonSocket.emit('student:event', event)

    // 本地缓存
    await lessonStore.cacheStudentEvent(event)

  } catch (error) {
    console.error('记录学生事件失败:', error)
  }
}

const saveSectionProgress = async (sectionIndex: number) => {
  const progress = studentProgress.value[sectionIndex]
  if (!progress) return

  progress.endTime = new Date()
  progress.timeSpent = progress.endTime.getTime() - progress.startTime.getTime()
  progress.completed = progress.progress >= 100

  try {
    await lessonStore.saveSectionProgress(lessonId, sectionIndex, progress)
  } catch (error) {
    console.error('保存环节进度失败:', error)
  }
}

const enterOfflineMode = () => {
  isOffline.value = true
  ElMessage.warning('网络连接已断开，进入离线模式')
}

const handleRetryConnection = async () => {
  isReconnecting.value = true

  try {
    await lessonSocket.reconnect()
    isOffline.value = false
    ElMessage.success('网络连接已恢复')
  } catch (error) {
    ElMessage.error('重连失败，请稍后再试')
  } finally {
    isReconnecting.value = false
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

const showHelp = () => {
  helpVisible.value = true
}

const exitLesson = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出当前课程吗？',
      '确认退出',
      { type: 'warning' }
    )

    // 保存当前进度
    await saveSectionProgress(currentSectionIndex.value)

    // 断开连接
    lessonSocket.disconnect()

    // 跳转到课程列表
    router.push('/student/courses')

  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出课程失败:', error)
    }
  }
}

const getDeviceInfo = () => ({
  userAgent: navigator.userAgent,
  screenResolution: `${screen.width}x${screen.height}`,
  language: navigator.language,
  platform: navigator.platform,
  timestamp: new Date().toISOString()
})

const getSectionTypeLabel = (type: string) => {
  const labels = {
    introduction: '课程引入',
    knowledge: '新知讲解',
    experience: '体验理解',
    experiment: '实验活动',
    assignment: '作业测试'
  }
  return labels[type] || type
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听网络状态变化
watch(connectionStatus, (newStatus) => {
  if (newStatus === 'offline') {
    enterOfflineMode()
  } else if (newStatus === 'online' && isOffline.value) {
    handleRetryConnection()
  }
})

// 生命周期
onMounted(async () => {
  // 开始时间计时器
  timeTimer = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // 初始化课程
  await initializeLesson()

  // 监听教师事件
  lessonSocket.on('teacher:event', handleTeacherEvent)

  // 监听连接状态
  lessonSocket.on('connect', () => {
    isReconnecting.value = false
    if (isOffline.value) {
      handleRetryConnection()
    }
  })

  lessonSocket.on('disconnect', () => {
    isOffline.value = true
  })

  // 监听全屏状态
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(async () => {
  // 清理定时器
  if (timeTimer) {
    clearInterval(timeTimer)
  }

  // 保存进度
  await saveSectionProgress(currentSectionIndex.value)

  // 断开连接
  lessonSocket.disconnect()

  // 移除事件监听
  document.removeEventListener('fullscreenchange', () => {})
})
</script>

<style scoped lang="scss">
.realtime-lesson-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .lesson-info {
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }

    .lesson-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #606266;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.lesson-main {
  flex: 1;
  display: flex;
  overflow: hidden;

  .content-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .lesson-sidebar {
    width: 320px;
    background: #fff;
    border-left: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
}

.lesson-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e4e7ed;

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .section-title {
      font-weight: 600;
      color: #303133;
    }

    .section-type {
      padding: 2px 8px;
      background: #e1f3d8;
      color: #67c23a;
      border-radius: 4px;
      font-size: 12px;
    }

    .progress-text {
      color: #409eff;
      font-weight: 500;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .lesson-header {
    padding: 12px 16px;

    .lesson-info h2 {
      font-size: 16px;
    }

    .lesson-meta {
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
    }
  }

  .lesson-main {
    .lesson-sidebar {
      display: none;
    }
  }

  .lesson-footer {
    padding: 12px 16px;
  }
}

// 连接状态样式
.connection-status {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

// 离线模式样式
.offline-mode {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}
</style>
```

### 2. 环节渲染器组件
```vue
<!-- apps/web-student/src/components/lesson/LessonSectionRenderer.vue -->
<template>
  <div class="lesson-section-renderer" :class="sectionTypeClass">
    <!-- 加载状态 -->
    <div v-if="sectionState === 'loading'" class="loading-state">
      <el-skeleton animated>
        <template #template>
          <div class="loading-content">
            <el-skeleton-item variant="text" style="width: 60%; height: 32px;" />
            <el-skeleton-item variant="text" style="width: 80%; height: 200px;" />
            <el-skeleton-item variant="button" style="width: 120px; height: 40px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="sectionState === 'error'" class="error-state">
      <el-result
        icon="error"
        title="加载失败"
        sub-title="无法加载当前环节内容，请重试"
      >
        <template #extra>
          <el-button type="primary" @click="handleRetry">重试</el-button>
        </template>
      </el-result>
    </div>

    <!-- 正常内容 -->
    <div v-else class="section-content">
      <!-- 环节标题 -->
      <div class="section-header">
        <h2>{{ section.title }}</h2>
        <p v-if="section.description" class="section-description">
          {{ section.description }}
        </p>
      </div>

      <!-- 课程引入环节 -->
      <IntroductionSection
        v-if="section.type === 'introduction'"
        :section="section"
        :progress="sectionProgress"
        @progress-update="handleProgressUpdate"
        @interaction-submit="handleInteractionSubmit"
      />

      <!-- 新知讲解环节 -->
      <KnowledgeSection
        v-else-if="section.type === 'knowledge'"
        :section="section"
        :progress="sectionProgress"
        @progress-update="handleProgressUpdate"
        @interaction-submit="handleInteractionSubmit"
      />

      <!-- 体验理解环节 -->
      <ExperienceSection
        v-else-if="section.type === 'experience'"
        :section="section"
        :progress="sectionProgress"
        @progress-update="handleProgressUpdate"
        @interaction-submit="handleInteractionSubmit"
      />

      <!-- 实验活动环节 -->
      <ExperimentSection
        v-else-if="section.type === 'experiment'"
        :section="section"
        :progress="sectionProgress"
        @progress-update="handleProgressUpdate"
        @interaction-submit="handleInteractionSubmit"
      />

      <!-- 作业测试环节 -->
      <AssignmentSection
        v-else-if="section.type === 'assignment'"
        :section="section"
        :progress="sectionProgress"
        @progress-update="handleProgressUpdate"
        @interaction-submit="handleInteractionSubmit"
      />

      <!-- 未知环节类型 -->
      <div v-else class="unknown-section">
        <el-alert
          title="未知环节类型"
          :description="`环节类型 "${section.type}" 暂不支持，请联系教师。`"
          type="warning"
          show-icon
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IntroductionSection } from './sections'
import { KnowledgeSection } from './sections'
import { ExperienceSection } from './sections'
import { ExperimentSection } from './sections'
import { AssignmentSection } from './sections'
import type { CourseSection, StudentProgress, InteractionData } from '@/types/lesson'

interface Props {
  section: CourseSection
  sectionState: 'loading' | 'active' | 'error'
  studentProgress: StudentProgress
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'progress-update': [progress: number]
  'interaction-submit': [data: InteractionData]
  'error': [error: Error]
}>()

// 计算属性
const sectionTypeClass = computed(() => `section-${props.section.type}`)

const sectionProgress = computed(() =>
  props.studentProgress[props.section.index]?.progress || 0
)

// 方法
const handleProgressUpdate = (progress: number) => {
  emit('progress-update', progress)
}

const handleInteractionSubmit = (data: InteractionData) => {
  emit('interaction-submit', data)
}

const handleRetry = () => {
  // 触发重新加载
  emit('error', new Error('用户重试'))
}
</script>

<style scoped lang="scss">
.lesson-section-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #fff;
}

.loading-state,
.error-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  width: 80%;
  max-width: 600px;
}

.section-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}

.section-header {
  margin-bottom: 24px;
  text-align: center;

  h2 {
    margin: 0 0 12px 0;
    font-size: 28px;
    font-weight: 600;
    color: #303133;
  }

  .section-description {
    margin: 0;
    font-size: 16px;
    color: #606266;
    line-height: 1.6;
  }
}

.unknown-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

// 各环节类型样式
.section-introduction {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  .section-content {
    padding: 40px;
  }

  .section-header h2,
  .section-description {
    color: #fff;
  }
}

.section-knowledge {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.section-experience {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.section-experiment {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
}

.section-assignment {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #fff;
}
</style>
```

### 3. WebSocket服务
```typescript
// apps/web-student/src/services/websocket/lessonSocket.ts
import { io, Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'
import type { StudentInfo, TeacherEvent, StudentEvent } from '@shared-utils/websocket/types'

class LessonSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  async connect(lessonId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`/lesson/${lessonId}`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        })

        this.socket.on('connect', () => {
          console.log('WebSocket连接已建立')
          this.reconnectAttempts = 0
          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket连接已断开:', reason)
          this.handleDisconnect(reason)
        })

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket连接错误:', error)
          this.handleConnectError(error)
          reject(error)
        })

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`WebSocket重连成功，尝试次数: ${attemptNumber}`)
          ElMessage.success('连接已恢复')
        })

        this.socket.on('reconnect_error', (error) => {
          console.error('WebSocket重连失败:', error)
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            ElMessage.error('连接失败，请检查网络')
          }
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  async registerStudent(studentInfo: StudentInfo): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket未连接')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('student:register', studentInfo, (response: any) => {
        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket未连接，无法发送事件:', event)
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('重连次数已达上限')
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          if (this.socket) {
            await this.socket.connect()
            resolve()
          } else {
            reject(new Error('Socket实例不存在'))
          }
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }

  private handleDisconnect(reason: string): void {
    if (reason === 'io server disconnect') {
      // 服务器主动断开，需要重连
      this.reconnect()
    }
    ElMessage.warning('连接已断开，正在尝试重连...')
  }

  private handleConnectError(error: Error): void {
    console.error('连接错误:', error)
    ElMessage.error('连接失败，请检查网络')
  }
}

export const lessonSocket = new LessonSocketService()
```

## 📁 新增文件结构

```
apps/web-student/src/
├── views/
│   └── lesson/
│       ├── RealtimeLessonView.vue     # 主学习界面 ⭐
│       └── index.ts                   # 导出文件
├── components/
│   └── lesson/
│       ├── LessonSectionRenderer.vue  # 环节渲染器 ⭐
│       ├── ConnectionStatus.vue       # 连接状态 ⭐
│       ├── StudentProgressPanel.vue   # 学习进度面板 ⭐
│       ├── InteractionPanel.vue       # 交互面板 ⭐
│       ├── QuickTools.vue             # 快捷工具 ⭐
│       ├── OfflinePrompt.vue          # 离线提示 ⭐
│       ├── HelpDialog.vue             # 帮助弹窗 ⭐
│       ├── sections/                  # 各环节组件
│       │   ├── IntroductionSection.vue
│       │   ├── KnowledgeSection.vue
│       │   ├── ExperienceSection.vue
│       │   ├── ExperimentSection.vue
│       │   └── AssignmentSection.vue
│       └── index.ts
├── stores/
│   ├── lesson.ts                      # 课程状态管理 ⭐
│   ├── student.ts                     # 学生状态管理 ⭐
│   └── network.ts                     # 网络状态管理 ⭐
├── services/
│   └── websocket/
│       ├── lessonSocket.ts            # WebSocket服务 ⭐
│       └── index.ts
├── types/
│   ├── lesson.ts                      # 课程类型定义 ⭐
│   └── websocket.ts                   # WebSocket类型定义 ⭐
└── utils/
    ├── offline-cache.ts               # 离线缓存工具 ⭐
    ├── progress-tracker.ts            # 进度跟踪工具 ⭐
    └── device-info.ts                 # 设备信息工具 ⭐
```

## 🔗 依赖关系

**前置依赖**:
- [x] Vue 3 + TypeScript 环境就绪
- [x] 基础路由和状态管理
- [x] Element Plus UI库
- [ ] Socket.IO客户端库

**后端依赖**:
- [ ] classroom-service WebSocket接口
- [ ] 课程内容API接口
- [ ] 学生数据存储接口
- [ ] 离线数据同步接口

**横向依赖**:
- [ ] Presenter播放模式
- [ ] 资源渲染系统
- [ ] 网络状态监控

## 🧪 测试要求

### 单元测试
- [ ] WebSocket连接测试
- [ ] 环节渲染测试
- [ ] 进度跟踪测试
- [ ] 离线缓存测试

### 集成测试
- [ ] 实时同步功能测试
- [ ] 网络异常处理测试
- [ ] 数据提交测试

### E2E测试
- [ ] 完整学习流程测试
- [ ] 多设备同步测试
- [ ] 离线恢复测试

## 📝 开发步骤

### Week 1: 基础框架
1. 创建RealtimeLessonView主界面
2. 实现WebSocket连接和事件处理
3. 开发基础的状态管理
4. 添加连接状态指示

### Week 2: 环节渲染
1. 开发LessonSectionRenderer组件
2. 实现各环节的具体渲染组件
3. 添加进度跟踪功能
4. 集成交互提交机制

### Week 3: 离线和网络处理
1. 实现离线缓存机制
2. 开发断线重连功能
3. 添加网络状态监控
4. 实现数据同步策略

### Week 4: 优化和测试
1. 性能优化和内存管理
2. 移动端适配
3. 完整测试覆盖
4. 用户体验优化

## 🚨 风险与注意事项

1. **网络稳定性**: WebSocket连接在移动网络下可能不稳定
2. **数据一致性**: 离线数据与在线数据的同步冲突
3. **性能影响**: 实时同步可能影响设备性能
4. **用户体验**: 网络异常时的降级体验

## 📚 参考资料

- [Socket.IO客户端文档](https://socket.io/docs/v4/client-api/)
- [Service Worker离线缓存](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vue 3响应式系统](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [PWA最佳实践](https://web.dev/progressive-web-apps/)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-12-06
**当前状态**: 🔄 未开始
**负责人**: 前端开发团队
