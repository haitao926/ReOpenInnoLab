<template>
  <div class="course-workspace">
    <!-- 顶部课程导航 -->
    <header class="course-header">
      <div class="course-nav">
        <div class="course-info">
          <div class="course-switcher">
            <el-dropdown @command="switchCourse" placement="bottom-start">
              <el-button class="current-course-btn" text>
                <el-icon><Reading /></el-icon>
                {{ currentCourse?.title || '选择课程' }}
                <el-icon class="arrow-down"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="course in availableCourses"
                    :key="course.id"
                    :command="course.id"
                  >
                    {{ course.title }} - {{ course.className }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="course-meta">
            <el-tag :variant="getSubjectVariant(currentCourse?.subject || '')" size="small">
              {{ getSubjectName(currentCourse?.subject || '') }}
            </el-tag>
            <span class="classroom-info">{{ currentCourse?.className }}</span>
            <span class="teacher-info">{{ currentCourse?.teacherName }}</span>
          </div>
        </div>

        <div class="course-actions">
          <div class="study-period">{{ studyPeriod }}</div>
          <el-button
            class="ai-assistant-btn"
            type="primary"
            size="small"
            @click="toggleAIAssistant"
          >
            <el-icon><MagicStick /></el-icon>
            AI助手
          </el-button>
        </div>
      </div>

      <!-- 章节进度条 -->
      <div class="course-progress" v-if="currentCourse">
        <div class="progress-info">
          <span>课程进度</span>
          <span class="progress-text">{{ completedChapters }}/{{ totalChapters }} 章节</span>
        </div>
        <el-progress
          :percentage="progressPercentage"
          :stroke-width="8"
          :show-text="false"
          class="progress-bar"
        />
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="course-main">
      <!-- 左栏：章节导航 -->
      <aside class="chapter-sidebar">
        <div class="chapter-list">
          <div
            v-for="(chapter, index) in courseStore.currentChapters"
            :key="chapter.id"
            class="chapter-item"
            :class="{
              active: currentChapterIndex === index,
              completed: chapter.status === 'completed',
              locked: chapter.status === 'locked'
            }"
            @click="selectChapter(index)"
          >
            <div class="chapter-icon">
              <el-icon v-if="chapter.status === 'completed'"><Check /></el-icon>
              <el-icon v-else-if="chapter.status === 'locked'"><Lock /></el-icon>
              <el-icon v-else><Clock /></el-icon>
            </div>
            <div class="chapter-content">
              <h4 class="chapter-title">{{ chapter.title }}</h4>
              <p class="chapter-description">{{ chapter.description }}</p>
              <div class="chapter-meta">
                <span class="duration">{{ chapter.duration }}分钟</span>
                <span class="activities-count">{{ chapter.activities?.length || 0 }}个活动</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中栏：课程内容 -->
      <section class="course-content">
        <div v-if="currentChapter" class="chapter-content">
          <!-- 章节头部 -->
          <div class="chapter-header">
            <h2>{{ currentChapter.title }}</h2>
            <p>{{ currentChapter.description }}</p>
            <div class="chapter-objectives" v-if="currentChapter.objectives?.length">
              <h4>学习目标</h4>
              <ul>
                <li v-for="objective in currentChapter.objectives" :key="objective">
                  {{ objective }}
                </li>
              </ul>
            </div>
          </div>

          <!-- 活动内容 -->
          <div class="activities-container">
            <ChapterFlow
              :chapters="[currentChapter]"
              @activity-open="openActivityDrawer"
              @complete="completeActivity"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="请选择章节开始学习">
            <el-button type="primary" @click="selectChapter(0)">
              开始学习
            </el-button>
          </el-empty>
        </div>
      </section>

      <!-- 右栏：状态面板 -->
      <aside class="status-sidebar">
        <!-- 设备状态监控 -->
        <div class="status-panel">
          <h4>实验环境</h4>
          <DeviceStatusMonitor />
          <LocalAgentStatus />
        </div>

        <!-- 通知中心 -->
        <div class="status-panel">
          <h4>通知</h4>
          <NotificationCenter />
        </div>

        <!-- AI学习助手 -->
        <div class="status-panel ai-panel" v-if="showAIAssistant">
          <h4>AI学习助手</h4>
          <AILearningGuide
            :course="currentCourse"
            :chapter="currentChapter"
          />
        </div>
      </aside>
    </main>

    <!-- 活动抽屉 -->
    <ActivityDrawer
      v-model="activityDrawerVisible"
      :activity-context="currentActivityContext"
      @activity-complete="handleActivityComplete"
      @close="closeActivityDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Reading, ArrowDown, MagicStick, Check, Lock, Clock
} from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import ChapterFlow from '@/components/course/ChapterFlow.vue'
import ActivityDrawer from '@/components/course/ActivityDrawer.vue'
import DeviceStatusMonitor from '@/components/lab/DeviceStatusMonitor.vue'
import LocalAgentStatus from '@/components/lab/LocalAgentStatus.vue'
import NotificationCenter from '@/components/common/NotificationCenter.vue'
import AILearningGuide from '@/components/ai/AILearningGuide.vue'

interface ActivityContext {
  courseId: string
  chapterId: string
  activity: any
  type: 'knowledge' | 'experiment' | 'experience' | 'assignment'
}

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

// 课程相关状态
const currentChapterIndex = ref(0)
const showAIAssistant = ref(false)
const activityDrawerVisible = ref(false)
const currentActivityContext = ref<ActivityContext | null>(null)

// 计算属性
const currentCourse = computed(() => courseStore.currentCourse)
const currentChapter = computed(() => {
  return courseStore.currentChapters[currentChapterIndex.value]
})

const availableCourses = computed(() => courseStore.enrolledCourses)
const totalChapters = computed(() => courseStore.currentChapters.length)
const completedChapters = computed(() => {
  return courseStore.currentChapters.filter(chapter => chapter.status === 'completed').length
})

const progressPercentage = computed(() => {
  if (totalChapters.value === 0) return 0
  return Math.round((completedChapters.value / totalChapters.value) * 100)
})

const studyPeriod = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午学习时间'
  if (hour < 18) return '下午学习时间'
  return '晚上学习时间'
})

// 方法
const getSubjectVariant = (subject: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  const variants: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    ai: 'primary',
    it: 'info',
    'data-science': 'success',
    robotics: 'warning',
    maker: 'danger'
  }
  return variants[subject] || 'default'
}

const getSubjectName = (subject: string): string => {
  const map: Record<string, string> = {
    ai: '人工智能',
    it: '信息技术',
    'data-science': '数据科学',
    robotics: '智能机器人',
    maker: '创客实践'
  }
  return map[subject] || '综合'
}

const switchCourse = async (courseId: string) => {
  try {
    await courseStore.selectCourse(courseId)
    currentChapterIndex.value = 0
    ElMessage.success(`已切换到课程: ${courseStore.currentCourse?.title}`)
  } catch (error) {
    ElMessage.error('切换课程失败')
  }
}

const selectChapter = (index: number) => {
  const chapter = courseStore.currentChapters[index]
  if (chapter?.status === 'locked') {
    ElMessage.warning('该章节尚未解锁，请先完成前面的章节')
    return
  }

  currentChapterIndex.value = index
}

const toggleAIAssistant = () => {
  showAIAssistant.value = !showAIAssistant.value
}

const openActivityDrawer = (context: any) => {
  currentActivityContext.value = {
    courseId: courseStore.currentCourse!.id,
    chapterId: currentChapter.value!.id,
    activity: context.activity,
    type: context.type
  }
  activityDrawerVisible.value = true
}

const closeActivityDrawer = () => {
  activityDrawerVisible.value = false
  currentActivityContext.value = null
}

const completeActivity = async (activityId: string) => {
  try {
    await courseStore.completeActivity(currentChapter.value!.id, activityId)
    ElMessage.success('活动已完成!')
  } catch (error) {
    ElMessage.error('活动完成状态更新失败')
  }
}

const handleActivityComplete = (result: any) => {
  // 处理活动完成后的逻辑
  closeActivityDrawer()

  // 更新章节状态
  const chapter = currentChapter.value
  if (chapter) {
    const allCompleted = chapter.activities?.every(
      (activity: any) => activity.status === 'completed'
    )

    if (allCompleted) {
      courseStore.completeChapter(chapter.id)
      ElMessage.success(`恭喜完成章节: ${chapter.title}`)

      // 自动进入下一章节
      if (currentChapterIndex.value < totalChapters.value - 1) {
        setTimeout(() => {
          selectChapter(currentChapterIndex.value + 1)
        }, 2000)
      }
    }
  }
}

// 生命周期
onMounted(async () => {
  const courseId = route.params.courseId as string
  if (courseId) {
    await courseStore.selectCourse(courseId)
  } else {
    // 如果没有指定课程，选择第一个可用课程
    if (availableCourses.value.length > 0) {
      await courseStore.selectCourse(availableCourses.value[0].id)
    }
  }
})

// 监听路由参数变化
watch(() => route.params.courseId, async (newCourseId) => {
  if (newCourseId) {
    await courseStore.selectCourse(newCourseId as string)
    currentChapterIndex.value = 0
  }
})
</script>

<style scoped lang="scss">
.course-workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-color);
}

.course-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--edu-border-color);
  padding: 16px 24px;
}

.course-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.course-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-course-btn {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  padding: 8px 16px;

  .arrow-down {
    margin-left: 8px;
    transition: transform 0.2s ease;
  }

  &:hover .arrow-down {
    transform: translateY(2px);
  }
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.classroom-info, .teacher-info {
  font-size: 14px;
  color: var(--edu-text-secondary);
}

.course-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.study-period {
  font-size: 14px;
  color: var(--edu-text-secondary);
  font-weight: 500;
}

.course-progress {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--edu-text-secondary);
  min-width: 120px;
}

.progress-bar {
  flex: 1;
  max-width: 400px;
}

.course-main {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
}

.chapter-sidebar {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid var(--edu-border-color);
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }

  &.active {
    background: rgba(99, 102, 241, 0.12);
    border-color: var(--edu-primary-200);
  }

  &.completed {
    .chapter-icon {
      color: var(--edu-success-500);
      background: rgba(34, 197, 94, 0.1);
    }
  }

  &.locked {
    opacity: 0.6;
    cursor: not-allowed;

    .chapter-icon {
      color: var(--edu-text-disabled);
      background: rgba(0, 0, 0, 0.05);
    }
  }
}

.chapter-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--edu-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chapter-content {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.chapter-description {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--edu-text-disabled);
}

.course-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid var(--edu-border-color);
  padding: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.chapter-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--edu-border-color);
}

.chapter-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 12px 0;
}

.chapter-header p {
  font-size: 16px;
  color: var(--edu-text-secondary);
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.chapter-objectives h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 12px 0;
}

.chapter-objectives ul {
  margin: 0;
  padding-left: 20px;
}

.chapter-objectives li {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.activities-container {
  min-height: 400px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.status-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.status-panel {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid var(--edu-border-color);
  padding: 20px;
}

.status-panel h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 16px 0;
}

.ai-panel {
  flex: 1;
  min-height: 300px;
}

@media (max-width: 1200px) {
  .course-main {
    grid-template-columns: 240px 1fr 280px;
    gap: 16px;
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .course-header {
    padding: 12px 16px;
  }

  .course-nav {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .course-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .course-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    gap: 16px;
    padding: 16px;
  }

  .chapter-sidebar {
    max-height: 200px;
    order: -1;
  }

  .chapter-list {
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .chapter-item {
    min-width: 200px;
    flex-shrink: 0;
  }

  .status-sidebar {
    flex-direction: row;
    overflow-x: auto;
    max-height: none;
  }

  .status-panel {
    min-width: 280px;
    flex-shrink: 0;
  }
}
</style>