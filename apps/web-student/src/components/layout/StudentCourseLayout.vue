<template>
  <div class="student-course-layout">
    <!-- AppBar 顶部导航 -->
    <header class="course-app-bar">
      <div class="app-bar-left">
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
                  v-for="course in todayCourses"
                  :key="course.id"
                  :command="course.id"
                >
                  {{ course.title }} - {{ course.className }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="classroom-info">
          <el-tag type="primary" size="small">{{ currentClassroom }}</el-tag>
        </div>
      </div>

      <div class="app-bar-right">
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
    </header>

    <!-- 三栏课程主体 -->
    <main class="course-main">
      <!-- 左栏：课程列表 + 进度 -->
      <aside class="course-sidebar-left">
        <div class="course-entry-section">
          <h3>今日课程</h3>
          <CourseEntryCard
            v-for="course in todayCourses"
            :key="course.id"
            :course="course"
            :active="currentCourse?.id === course.id"
            @click="enterCourse(course)"
            @enter-course="enterCourse"
          />
        </div>

        <div class="course-progress-section">
          <h4>学习进度</h4>
          <div class="progress-overview">
            <el-progress
              :percentage="overallProgress"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="progress-text">{{ completedChapters }}/{{ totalChapters }} 完成</span>
          </div>
        </div>
      </aside>

      <!-- 中央：课程流主体 -->
      <section class="course-content">
        <div class="course-header">
          <h2>{{ currentCourse?.title }}</h2>
          <p class="course-description">{{ currentCourse?.description }}</p>
        </div>

        <!-- 章节流 -->
        <div class="chapter-flow">
          <ChapterComponent
            :chapters="currentChapters"
            @activity-open="openActivityDrawer"
            @complete="completeChapter"
          />
        </div>
      </section>

      <!-- 右栏：AI Guide + 工具 -->
      <aside class="course-sidebar-right">
        <AILearningGuide
          v-if="aiAssistantEnabled"
          :course="currentCourse"
          :chapter="currentChapter"
        />

        <NotificationCenter />
        <DeviceStatusMonitor />
      </aside>
    </main>

    <!-- 活动抽屉 -->
    <ActivityDrawer
      v-model="activityDrawerVisible"
      :activity="currentActivity"
    />

    <!-- 底部课堂反馈条 -->
    <footer class="classroom-feedback-bar">
      <div class="feedback-item">
        <el-icon><User /></el-icon>
        <span>签到状态：{{ attendanceStatus }}</span>
      </div>
      <div class="feedback-item">
        <el-icon><Camera /></el-icon>
        <span>老师快照：{{ snapshotCount }} 张</span>
      </div>
      <div class="feedback-item ai-suggestion">
        <el-icon><MagicStick /></el-icon>
        <span>{{ aiSuggestion }}</span>
        <el-button size="small" @click="viewAIDetail">查看</el-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Reading,
  ArrowDown,
  MagicStick,
  User,
  Camera
} from '@element-plus/icons-vue'

// 组件导入
import CourseEntryCard from '@/components/course/CourseEntryCard.vue'
import ChapterComponent from '@/components/course/ChapterFlow.vue'
import AILearningGuide from '@/components/ai/AILearningGuide.vue'
import NotificationCenter from '@/components/common/NotificationCenter.vue'
import DeviceStatusMonitor from '@/components/lab/DeviceStatusMonitor.vue'
import ActivityDrawer from '@/components/course/ActivityDrawer.vue'

// Store 导入
import { useCourseStore } from '@/stores/course'
import type { Course, Activity } from '@/stores/course'

const courseStore = useCourseStore()

// 响应式数据
const activityDrawerVisible = ref(false)
const currentActivity = ref<Activity | null>(null)
const aiAssistantEnabled = ref(false)
const attendanceStatus = ref('未签到')
const snapshotCount = ref(0)
const aiSuggestion = ref('AI建议：建议重点关注Python基础语法')

// 计算属性 - 使用 store 数据
const todayCourses = computed(() => courseStore.todayCourses)
const currentCourse = computed(() => courseStore.currentCourse)
const currentChapters = computed(() => courseStore.currentChapters)
const currentChapter = computed(() => courseStore.currentChapter)

const currentClassroom = computed(() => {
  return currentCourse.value?.className || '未选择班级'
})

const studyPeriod = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午学习时段'
  if (hour < 14) return '午间休息'
  if (hour < 18) return '下午学习时段'
  return '晚间学习时段'
})

const overallProgress = computed(() => courseStore.overallProgress)
const completedChapters = computed(() => courseStore.completedChapters)
const totalChapters = computed(() => courseStore.totalChapters)

// 方法
const switchCourse = async (courseId: string) => {
  await courseStore.selectCourse(courseId)
  if (courseStore.currentCourse) {
    ElMessage({ message: `已切换到课程：${courseStore.currentCourse.title}`, type: 'success' })
  }
}

const enterCourse = async (course: Course) => {
  await courseStore.selectCourse(course.id)
  ElMessage({ message: `进入课程：${course.title}`, type: 'success' })
}


const completeChapter = async (chapterId: string) => {
  const success = await courseStore.completeChapter(chapterId)
  if (success) {
    const chapter = currentChapters.value.find(ch => ch.id === chapterId)
    if (chapter) {
      ElMessage({ message: `已完成章节：${chapter.title}`, type: 'success' })
    }
  }
}

const openActivityDrawer = (activity: Activity) => {
  currentActivity.value = activity
  activityDrawerVisible.value = true
}

const toggleAIAssistant = () => {
  aiAssistantEnabled.value = !aiAssistantEnabled.value
  ElMessage({ message: aiAssistantEnabled.value ? 'AI助手已启用' : 'AI助手已关闭', type: 'info' })
}

const viewAIDetail = () => {
  ElMessage({ message: '查看AI建议详情', type: 'info' })
}

// 生命周期
onMounted(async () => {
  // 加载今日课程数据
  await courseStore.loadTodayCourses()

  // 默认选择第一个课程
  if (courseStore.todayCourses.length > 0) {
    await switchCourse(courseStore.todayCourses[0].id)
  }
})
</script>

<style scoped lang="scss">
.student-course-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--fs-bg-primary);
  position: relative;
  overflow: hidden;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    background: var(--fs-gradient-futureschool);
    opacity: 0.1;
    z-index: var(--fs-z-background);
  }

  // 内容层
  > * {
    position: relative;
    z-index: var(--fs-z-content);
  }
}

.course-app-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--fs-spacing-4) var(--fs-spacing-6);
  background: var(--fs-bg-glass);
  backdrop-filter: var(--fs-glass-backdrop);
  border-bottom: 1px solid var(--fs-border-primary);
  position: sticky;
  top: 0;
  z-index: var(--fs-z-header);
}

.app-bar-left {
  display: flex;
  align-items: center;
  gap: var(--fs-spacing-5);
}

.current-course-btn {
  font-size: var(--fs-text-base);
  font-weight: var(--fs-font-weight-semibold);
  padding: var(--fs-spacing-2) var(--fs-spacing-4);
  border-radius: var(--fs-radius-lg);
  background: var(--fs-bg-glass-hover);
  border: 1px solid var(--fs-border-secondary);
  color: var(--fs-text-primary);
  transition: var(--fs-transition-fast);

  &:hover {
    background: var(--fs-bg-glass);
    border-color: var(--fs-primary-500);
    transform: translateY(-2px);
    box-shadow: var(--fs-shadow-glow-sm);
  }
}

.arrow-down {
  margin-left: var(--fs-spacing-1);
  transition: var(--fs-transition-fast);
}

.course-main {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr 300px;
  gap: var(--fs-spacing-6);
  padding: var(--fs-spacing-6);
  min-height: calc(100vh - 140px);
}

.course-sidebar-left {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-6);
}

.course-entry-section h3 {
  font-size: var(--fs-text-lg);
  font-weight: var(--fs-font-weight-bold);
  color: var(--fs-text-primary);
  margin-bottom: var(--fs-spacing-4);
}

.course-progress-section h4 {
  font-size: var(--fs-text-base);
  font-weight: var(--fs-font-weight-semibold);
  color: var(--fs-text-primary);
  margin-bottom: var(--fs-spacing-3);
}

.progress-overview {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-2);
}

.progress-text {
  font-size: var(--fs-text-sm);
  color: var(--fs-text-secondary);
  text-align: center;
}

.course-content {
  background: transparent;
  border-radius: 0;
  padding: 0;
}

.course-header {
  margin-bottom: var(--fs-spacing-8);
  text-align: center;
}

.course-header h2 {
  font-size: var(--fs-text-3xl);
  font-weight: var(--fs-font-weight-bold);
  color: var(--fs-text-primary);
  margin-bottom: var(--fs-spacing-2);
  background: var(--fs-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.course-description {
  font-size: var(--fs-text-base);
  color: var(--fs-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: var(--fs-line-height-relaxed);
}

.chapter-flow {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-6);
}

.course-sidebar-right {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-5);
}

.classroom-feedback-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--fs-spacing-4) var(--fs-spacing-6);
  background: var(--fs-bg-glass);
  backdrop-filter: var(--fs-glass-backdrop);
  border-top: 1px solid var(--fs-border-primary);
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: var(--fs-spacing-2);
  font-size: var(--fs-text-sm);
  color: var(--fs-text-secondary);
}

.ai-suggestion {
  display: flex;
  align-items: center;
  gap: var(--fs-spacing-3);
  color: var(--fs-primary-400);
  font-weight: var(--fs-font-weight-medium);
}

// 响应式设计
@media (max-width: 1200px) {
  .course-main {
    grid-template-columns: 280px 1fr;
    gap: var(--fs-spacing-5);
  }

  .course-sidebar-right {
    display: none;
  }
}

@media (max-width: 960px) {
  .course-main {
    grid-template-columns: 1fr;
    gap: var(--fs-spacing-4);
  }

  .course-sidebar-left {
    order: 2;
  }

  .course-content {
    order: 1;
  }

  .course-app-bar {
    padding: var(--fs-spacing-3) var(--fs-spacing-4);
  }

  .app-bar-left {
    gap: var(--fs-spacing-3);
  }

  .current-course-btn {
    font-size: var(--fs-text-sm);
    padding: var(--fs-spacing-1) var(--fs-spacing-3);
  }
}

@media (max-width: 768px) {
  .classroom-feedback-bar {
    flex-direction: column;
    gap: var(--fs-spacing-3);
    align-items: flex-start;
  }

  .course-header h2 {
    font-size: var(--fs-text-2xl);
  }

  .course-description {
    font-size: var(--fs-text-sm);
  }
}

@media (prefers-reduced-motion: reduce) {
  .current-course-btn,
  .arrow-down {
    transition: none;
  }
}
</style>