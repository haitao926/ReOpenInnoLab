<template>
  <div class="presenter-mode">
    <!-- 顶部控制栏 -->
    <div class="presenter-header">
      <div class="lesson-info">
        <h2 class="lesson-title">{{ lessonInfo?.title || '课程标题' }}</h2>
        <div class="lesson-meta">
          <el-tag :type="getSectionTypeColor(currentSection?.type)" size="small">
            {{ getSectionTypeLabel(currentSection?.type) }}
          </el-tag>
          <span class="section-indicator">
            {{ currentSectionIndex + 1 }} / {{ totalSections }}
          </span>
          <span class="timer">{{ formatTime(elapsedTime) }}</span>
        </div>
      </div>

      <div class="presenter-controls">
        <el-button-group>
          <el-button
            :icon="VideoCamera"
            size="small"
            @click="toggleRecording"
            :type="isRecording ? 'danger' : 'default'"
          >
            {{ isRecording ? '停止录制' : '开始录制' }}
          </el-button>
          <el-button :icon="FullScreen" size="small" @click="toggleFullscreen">
            全屏
          </el-button>
          <el-button :icon="Grid" size="small" @click="toggleAnnotationLayer">
            批注
          </el-button>
          <el-button :icon="ChatDotRound" size="small" @click="toggleAIPanel">
            AI助手
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="presenter-main">
      <!-- 左侧导航面板 -->
      <div class="presenter-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3>课程大纲</h3>
          <el-button
            :icon="sidebarCollapsed ? Expand : Fold"
            size="small"
            @click="toggleSidebar"
            text
          />
        </div>

        <div class="sections-list" v-if="!sidebarCollapsed">
          <div
            v-for="(section, index) in sections"
            :key="section.id"
            class="section-item"
            :class="{
              active: index === currentSectionIndex,
              completed: index < currentSectionIndex,
              upcoming: index > currentSectionIndex
            }"
            @click="goToSection(index)"
          >
            <div class="section-number">{{ index + 1 }}</div>
            <div class="section-content">
              <h4>{{ section.title }}</h4>
              <p class="section-type">{{ getSectionTypeLabel(section.type) }}</p>
              <div class="section-duration">
                <el-icon><Clock /></el-icon>
                {{ section.duration }}分钟
              </div>
            </div>
            <div class="section-status">
              <el-icon v-if="index < currentSectionIndex"><Check /></el-icon>
              <el-icon v-else-if="index === currentSectionIndex" class="current">
                <VideoPlay />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 中央播放区域 -->
      <div class="presenter-content">
        <div class="content-wrapper">
          <!-- 当前环节内容 -->
          <div class="section-content">
            <div class="section-header">
              <h3>{{ currentSection?.title }}</h3>
              <div class="objectives" v-if="currentSection?.objectives?.length">
                <span class="objectives-label">学习目标：</span>
                <el-tag
                  v-for="objective in currentSection.objectives"
                  :key="objective"
                  size="small"
                  type="info"
                  class="objective-tag"
                >
                  {{ objective }}
                </el-tag>
              </div>
            </div>

            <!-- 根据环节类型渲染不同内容 -->
            <div class="section-body">
              <!-- 课程引入 -->
              <IntroductionSection
                v-if="currentSection?.type === 'introduction'"
                :content="currentSection.content"
                @next="nextSection"
              />

              <!-- 新知讲解 -->
              <KnowledgeSection
                v-else-if="currentSection?.type === 'knowledge'"
                :content="currentSection.content"
                @next="nextSection"
              />

              <!-- 体验理解 -->
              <ExperienceSection
                v-else-if="currentSection?.type === 'experience'"
                :content="currentSection.content"
                @next="nextSection"
                @student-interaction="handleStudentInteraction"
              />

              <!-- 实验活动 -->
              <ExperimentSection
                v-else-if="currentSection?.type === 'experiment'"
                :content="currentSection.content"
                @next="nextSection"
                @experiment-status="handleExperimentStatus"
              />

              <!-- 作业测试 -->
              <AssignmentSection
                v-else-if="currentSection?.type === 'assignment'"
                :content="currentSection.content"
                @next="nextSection"
                @assignment-complete="handleAssignmentComplete"
              />
            </div>
          </div>

          <!-- 底部控制栏 -->
          <div class="presenter-controls-bottom">
            <div class="control-left">
              <el-button
                :icon="ArrowLeft"
                :disabled="currentSectionIndex === 0"
                @click="previousSection"
              >
                上一环节
              </el-button>
            </div>

            <div class="control-center">
              <el-button-group>
                <el-button
                  :icon="VideoPause"
                  v-if="isPlaying"
                  @click="pauseLesson"
                  type="warning"
                >
                  暂停
                </el-button>
                <el-button
                  :icon="VideoPlay"
                  v-else
                  @click="resumeLesson"
                  type="success"
                >
                  继续
                </el-button>
              </el-button-group>
            </div>

            <div class="control-right">
              <el-button
                type="primary"
                :icon="ArrowRight"
                :disabled="currentSectionIndex === totalSections - 1"
                @click="nextSection"
              >
                {{ currentSectionIndex === totalSections - 1 ? '结束课程' : '下一环节' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 批注层 -->
        <AnnotationLayer
          v-if="showAnnotationLayer"
          @close="hideAnnotationLayer"
          @save="saveAnnotation"
        />
      </div>

      <!-- 右侧信息面板 -->
      <div class="presenter-info-panel" v-if="showInfoPanel">
        <el-tabs v-model="activeInfoTab" tab-position="right">
          <el-tab-pane label="学生状态" name="students">
            <StudentStatusPanel
              :lesson-id="lessonId"
              :current-section="currentSectionIndex"
              @student-join="handleStudentJoin"
              @student-leave="handleStudentLeave"
            />
          </el-tab-pane>

          <el-tab-pane label="实时动态" name="activity">
            <ActivityFeed
              :lesson-id="lessonId"
              :events="lessonEvents"
            />
          </el-tab-pane>

          <el-tab-pane label="AI建议" name="ai">
            <AIPanel
              :lesson-id="lessonId"
              :current-section="currentSection"
              @suggestion-applied="handleAISuggestion"
            />
          </el-tab-pane>

          <el-tab-pane label="教学提示" name="tips">
            <TeachingTips
              :section-type="currentSection?.type"
              :duration="elapsedTime"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 课程结束对话框 -->
    <el-dialog
      v-model="showEndDialog"
      title="课程结束"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="lesson-summary">
        <h3>课程总结</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">总时长：</span>
            <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">参与学生：</span>
            <span class="stat-value">{{ studentCount }}人</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完成环节：</span>
            <span class="stat-value">{{ completedSections }}/{{ totalSections }}</span>
          </div>
        </div>

        <div class="end-actions">
          <el-button type="primary" @click="generateReport">
            <el-icon><Document /></el-icon>
            生成课堂报告
          </el-button>
          <el-button @click="assignHomework">
            <el-icon><EditPen /></el-icon>
            布置课后作业
          </el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="cancelEnd">继续上课</el-button>
        <el-button type="danger" @click="confirmEndLesson">
          确认结束
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoCamera, FullScreen, Grid, ChatDotRound, Expand, Fold,
  Clock, Check, VideoPlay, ArrowLeft, ArrowRight, VideoPause,
  Document, EditPen
} from '@element-plus/icons-vue'

import IntroductionSection from './sections/IntroductionSection.vue'
import KnowledgeSection from './sections/KnowledgeSection.vue'
import ExperienceSection from './sections/ExperienceSection.vue'
import ExperimentSection from './sections/ExperimentSection.vue'
import AssignmentSection from './sections/AssignmentSection.vue'
import AnnotationLayer from './components/AnnotationLayer.vue'
import StudentStatusPanel from './components/StudentStatusPanel.vue'
import ActivityFeed from './components/ActivityFeed.vue'
import AIPanel from './components/AIPanel.vue'
import TeachingTips from './components/TeachingTips.vue'

import { usePresenterStore } from '@/stores/presenter'
import { useClassroomStore } from '@/stores/classroom'
import type { LessonInfo, CourseSection } from '@/types/course'

const route = useRoute()
const router = useRouter()
const presenterStore = usePresenterStore()
const classroomStore = useClassroomStore()

// 响应式数据
const lessonId = computed(() => route.params.lessonId as string)
const classId = computed(() => route.params.classId as string)
const lessonInfo = ref<LessonInfo | null>(null)
const sections = ref<CourseSection[]>([])
const currentSectionIndex = ref(0)
const elapsedTime = ref(0)
const isPlaying = ref(false)
const isRecording = ref(false)
const sidebarCollapsed = ref(false)
const showAnnotationLayer = ref(false)
const showInfoPanel = ref(true)
const activeInfoTab = ref('students')
const showEndDialog = ref(false)
const studentCount = ref(0)
const lessonEvents = ref<any[]>([])

// 计时器
let timer: NodeJS.Timeout | null = null

// 计算属性
const currentSection = computed(() => sections.value[currentSectionIndex.value])
const totalSections = computed(() => sections.value.length)
const completedSections = computed(() => currentSectionIndex.value + 1)

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

const getSectionTypeLabel = (type: string): string => {
  const labels = {
    introduction: '课程引入',
    knowledge: '新知讲解',
    experience: '体验理解',
    experiment: '实验活动',
    assignment: '作业测试'
  }
  return labels[type as keyof typeof labels] || type
}

const getSectionTypeColor = (type: string): string => {
  const colors = {
    introduction: 'info',
    knowledge: '',
    experience: 'warning',
    experiment: 'success',
    assignment: 'danger'
  }
  return colors[type as keyof typeof colors] || ''
}

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const goToSection = (index: number) => {
  if (index >= 0 && index < totalSections.value) {
    currentSectionIndex.value = index
    presenterStore.setCurrentSection(index)
    broadcastSectionChange(index)
  }
}

const nextSection = () => {
  if (currentSectionIndex.value < totalSections.value - 1) {
    goToSection(currentSectionIndex.value + 1)
  } else {
    // 课程结束
    showEndDialog.value = true
  }
}

const previousSection = () => {
  if (currentSectionIndex.value > 0) {
    goToSection(currentSectionIndex.value - 1)
  }
}

const pauseLesson = () => {
  isPlaying.value = false
  stopTimer()
  presenterStore.pauseLesson()
  broadcastLessonState('paused')
}

const resumeLesson = () => {
  isPlaying.value = true
  startTimer()
  presenterStore.resumeLesson()
  broadcastLessonState('resumed')
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const toggleAnnotationLayer = () => {
  showAnnotationLayer.value = !showAnnotationLayer.value
}

const hideAnnotationLayer = () => {
  showAnnotationLayer.value = false
}

const toggleRecording = () => {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    ElMessage.success('开始录制课程')
  } else {
    ElMessage.info('停止录制')
  }
}

const toggleAIPanel = () => {
  showInfoPanel.value = !showInfoPanel.value
  if (showInfoPanel.value) {
    activeInfoTab.value = 'ai'
  }
}

const saveAnnotation = (annotation: any) => {
  presenterStore.saveAnnotation(annotation)
  ElMessage.success('批注已保存')
}

const broadcastSectionChange = (sectionIndex: number) => {
  // 通过WebSocket向学生端广播环节切换
  presenterStore.broadcastSectionChange(sectionIndex)
}

const broadcastLessonState = (state: string) => {
  presenterStore.broadcastLessonState(state)
}

const handleStudentJoin = (studentId: string) => {
  studentCount.value++
  lessonEvents.value.push({
    type: 'student_join',
    studentId,
    timestamp: Date.now()
  })
}

const handleStudentLeave = (studentId: string) => {
  studentCount.value = Math.max(0, studentCount.value - 1)
  lessonEvents.value.push({
    type: 'student_leave',
    studentId,
    timestamp: Date.now()
  })
}

const handleStudentInteraction = (data: any) => {
  lessonEvents.value.push({
    type: 'student_interaction',
    data,
    timestamp: Date.now()
  })
}

const handleExperimentStatus = (data: any) => {
  lessonEvents.value.push({
    type: 'experiment_status',
    data,
    timestamp: Date.now()
  })
}

const handleAssignmentComplete = (data: any) => {
  lessonEvents.value.push({
    type: 'assignment_complete',
    data,
    timestamp: Date.now()
  })
}

const handleAISuggestion = (suggestion: any) => {
  ElMessage.info(`AI建议：${suggestion.content}`)
}

const generateReport = async () => {
  try {
    const report = await presenterStore.generateLessonReport(lessonId.value)
    ElMessage.success('课堂报告生成成功')
    // 可以跳转到报告页面或下载报告
  } catch (error) {
    ElMessage.error('生成报告失败')
  }
}

const assignHomework = () => {
  // 跳转到作业布置页面
  router.push(`/assignments/create?lessonId=${lessonId.value}`)
}

const cancelEnd = () => {
  showEndDialog.value = false
}

const confirmEndLesson = async () => {
  try {
    await presenterStore.endLesson(lessonId.value)
    ElMessage.success('课程已结束')
    router.push(`/classrooms/${classId.value}`)
  } catch (error) {
    ElMessage.error('结束课程失败')
  }
}

// 键盘快捷键
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      if (!event.ctrlKey) previousSection()
      break
    case 'ArrowRight':
      if (!event.ctrlKey) nextSection()
      break
    case ' ':
      event.preventDefault()
      isPlaying.value ? pauseLesson() : resumeLesson()
      break
    case 'f':
    case 'F':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleFullscreen()
      }
      break
    case 'a':
    case 'A':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleAnnotationLayer()
      }
      break
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 使用真实的API获取课程信息
    const lesson = await presenterStore.getLessonInfo(lessonId.value)

    lessonInfo.value = lesson
    sections.value = lesson.chapters || []

    // 初始化classroom store
    classroomStore.initializeClassroom(lesson)

    // 连接WebSocket和开始课堂
    await presenterStore.connectToLesson(lessonId.value)
    classroomStore.startClassroom()

    // 开始播放
    isPlaying.value = true
    startTimer()

    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyboardShortcuts)

    ElMessage.success('进入课堂播放模式')
  } catch (error) {
    console.error('加载课程失败:', error)
    ElMessage.error('加载课程失败')
    router.back()
  }
})

onUnmounted(() => {
  stopTimer()

  // 结束课堂
  classroomStore.endClassroom()

  // 断开连接
  presenterStore.disconnectFromLesson()

  // 清理事件监听
  document.removeEventListener('keydown', handleKeyboardShortcuts)

  console.log('Presenter模式已清理')
})

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏时暂停
    if (isPlaying.value) {
      pauseLesson()
    }
  }
})
</script>

<style lang="scss" scoped>
.presenter-mode {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #fff;
  overflow: hidden;
}

.presenter-header {
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}

.lesson-info {
  .lesson-title {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .lesson-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;

    .section-indicator {
      color: #999;
    }

    .timer {
      font-family: 'Monaco', 'Menlo', monospace;
      color: #4CAF50;
    }
  }
}

.presenter-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.presenter-sidebar {
  width: 280px;
  background: rgba(0, 0, 0, 0.9);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;

  &.collapsed {
    width: 60px;
  }

  .sidebar-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
  }

  .sections-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .section-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid #4CAF50;
    }

    &.completed {
      opacity: 0.7;
    }

    &.upcoming {
      opacity: 0.5;
    }

    .section-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      margin-right: 12px;
    }

    .section-content {
      flex: 1;
      min-width: 0;

      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .section-type {
        margin: 0 0 4px 0;
        font-size: 12px;
        color: #999;
      }

      .section-duration {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #999;
      }
    }

    .section-status {
      margin-left: 8px;

      .current {
        color: #4CAF50;
      }
    }
  }
}

.presenter-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #1a1a1a;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.section-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.section-header {
  margin-bottom: 24px;

  h3 {
    margin: 0 0 12px 0;
    font-size: 24px;
    font-weight: 600;
  }

  .objectives {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .objectives-label {
      font-size: 14px;
      color: #999;
    }

    .objective-tag {
      margin: 0;
    }
  }
}

.section-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.presenter-controls-bottom {
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.control-left,
.control-center,
.control-right {
  display: flex;
  align-items: center;
}

.presenter-info-panel {
  width: 320px;
  background: rgba(0, 0, 0, 0.9);
  border-left: 1px solid rgba(255, 255, 255, 0.1);

  :deep(.el-tabs) {
    height: 100%;

    .el-tabs__content {
      height: calc(100% - 40px);
      overflow-y: auto;
    }
  }
}

.lesson-summary {
  h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .summary-stats {
    margin-bottom: 24px;

    .stat-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .stat-label {
        color: #666;
      }

      .stat-value {
        font-weight: 500;
      }
    }
  }

  .end-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .presenter-sidebar {
    position: absolute;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 50;
    transform: translateX(-100%);

    &:not(.collapsed) {
      transform: translateX(0);
    }
  }

  .presenter-info-panel {
    position: absolute;
    right: 0;
    top: 60px;
    bottom: 0;
    z-index: 50;
    transform: translateX(100%);
  }
}
</style>