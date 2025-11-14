<template>
  <UnifiedLayout
    variant="spacious"
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :show-breadcrumb="false"
    :page-actions="pageActions"
    :loading="loading"
    :loading-text="loadingText"
    :error="error"
    :error-message="errorMessage"
    :show-retry="true"
    @retry="loadDashboardData"
  >

    <div class="dashboard-content">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <h3>{{ todayCourses.length }}</h3>
            <p>今日课程</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ completedCount }}</h3>
            <p>已完成章节</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <h3>{{ overallProgress }}%</h3>
            <p>整体进度</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱</div>
          <div class="stat-info">
            <h3>{{ studyTime }}</h3>
            <p>学习时长</p>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <h2>快捷操作</h2>
        <div class="action-grid">
          <button class="action-btn" @click="goToCourses">
            <span class="btn-icon">📖</span>
            <span>我的课程</span>
          </button>

          <button class="action-btn" @click="goToAssignments">
            <span class="btn-icon">📝</span>
            <span>作业中心</span>
          </button>

          <button class="action-btn" @click="goToLab">
            <span class="btn-icon">🔬</span>
            <span>虚拟实验</span>
          </button>

          <button class="action-btn" @click="goToProfile">
            <span class="btn-icon">👤</span>
            <span>个人中心</span>
          </button>
        </div>
      </div>

      <!-- 学习洞察 -->
      <div v-if="learningInsights.length > 0" class="learning-insights">
        <h2>学习洞察</h2>
        <div class="insights-grid">
          <div
            v-for="insight in learningInsights"
            :key="insight.title"
            class="insight-card"
            :class="`insight-${insight.type}`"
          >
            <div class="insight-icon">
              <span v-if="insight.type === 'positive'">✨</span>
              <span v-else-if="insight.type === 'warning'">⚠️</span>
              <span v-else-if="insight.type === 'achievement'">🏆</span>
            </div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习进度 -->
      <div v-if="learningProgress.length > 0" class="learning-progress">
        <h2>学习进度</h2>
        <div class="progress-list">
          <div
            v-for="course in learningProgress"
            :key="course.courseId"
            class="progress-item"
          >
            <div class="progress-header">
              <h4>{{ course.courseTitle }}</h4>
              <span class="progress-stats">
                {{ course.completedChapters }}/{{ course.totalChapters }} 章节
              </span>
            </div>
            <div class="progress-bar">
              <el-progress
                :percentage="course.progress"
                :show-text="false"
                :stroke-width="8"
                class="course-progress"
              />
              <span class="progress-percentage">{{ course.progress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="recent-activity">
        <h2>最近活动</h2>
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon">
              <span>{{ getActivityIcon(activity.type) }}</span>
            </div>
            <div class="activity-content">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 即将到期 -->
      <div v-if="upcomingDeadlines.length > 0" class="upcoming-deadlines">
        <h2>即将到期</h2>
        <div class="deadlines-list">
          <div
            v-for="deadline in upcomingDeadlines"
            :key="deadline.id"
            class="deadline-item"
            :class="{
              'deadline-urgent': deadline.priority === 'high',
              'deadline-overdue': deadline.status === 'overdue'
            }"
          >
            <div class="deadline-icon">
              <span v-if="deadline.type === 'assignment'">📝</span>
              <span v-else-if="deadline.type === 'quiz'">📋</span>
              <span v-else-if="deadline.type === 'project'">🚀</span>
            </div>
            <div class="deadline-content">
              <h4>{{ deadline.title }}</h4>
              <p>{{ deadline.courseTitle }}</p>
              <span class="deadline-time">
                {{ formatDeadline(deadline.deadline) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 成就展示 -->
      <div v-if="achievements.length > 0" class="achievements-section">
        <h2>学习成就</h2>
        <div class="achievements-grid">
          <div
            v-for="achievement in achievements"
            :key="achievement.id"
            class="achievement-item"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-content">
              <h4>{{ achievement.title }}</h4>
              <p>{{ achievement.description }}</p>
              <span class="achievement-date">
                {{ formatDate(achievement.unlockedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UnifiedLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'
import { useDashboardStore } from '@/stores/dashboard'
import { useErrorHandler } from '@/services/error/error-handler.service'
import { useLoadingManager } from '@/services/loading/loading-manager.service'
import UnifiedLayout from '@/components/layout/UnifiedLayout.vue'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()
const dashboardStore = useDashboardStore()
const errorHandler = useErrorHandler()
const loadingManager = useLoadingManager()

// UnifiedLayout 数据
const pageTitle = computed(() => '学习控制台')
const pageSubtitle = computed(() => `欢迎回来，${userStore.displayName || userStore.name}！`)
const pageActions = computed(() => [
  {
    id: 'refresh',
    label: '刷新',
    icon: 'Refresh',
    handler: loadDashboardData
  }
])

// 状态管理 - 使用dashboardStore
const loading = computed(() => dashboardStore.loading)
const error = computed(() => dashboardStore.error)
const loadingText = ref('正在加载学习数据...')
const errorMessage = computed(() => dashboardStore.error || '加载学习数据失败，请稍后重试')

// 响应式数据 - 从stores获取
const todayCourses = computed(() => dashboardStore.todayCourses)
const completedCount = computed(() => dashboardStore.completedCount)
const overallProgress = computed(() => dashboardStore.overallProgress)
const studyTime = computed(() => dashboardStore.studyTimeFormatted)
const recentActivities = computed(() => dashboardStore.recentActivities)
const upcomingDeadlines = computed(() => dashboardStore.upcomingDeadlines)
const learningProgress = computed(() => dashboardStore.learningProgress)
const achievements = computed(() => dashboardStore.achievements)
const learningInsights = computed(() => dashboardStore.learningInsights)


// 方法
const goToCourses = () => {
  router.push('/courses')
}

const goToAssignments = () => {
  router.push('/assignments')
}

const goToLab = () => {
  router.push('/lab')
}

const goToProfile = () => {
  router.push('/profile')
}

const getActivityIcon = (type: string): string => {
  const icons = {
    course: '📚',
    lab: '🔬',
    assignment: '📝',
    quiz: '📋',
    ai: '🤖'
  }
  return icons[type as keyof typeof icons] || '📄'
}

const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

const formatDeadline = (deadline: Date): string => {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}天${hours}小时后`
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟后`
  } else if (minutes > 0) {
      return `${minutes}分钟后`
    } else {
      return '即将到期'
    }
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
    }
}

// 数据加载方法 - 使用dashboardStore
const loadDashboardData = async () => {
  const taskId = loadingManager.createTask({
    name: '加载学习数据',
    description: '正在获取课程、作业和学习进度数据...',
    cancelable: true,
    retryable: true,
    priority: 'high'
  })

  try {
    loadingManager.startTask(taskId)
    loadingManager.updateProgress(taskId, 20)

    // 使用包装器函数处理异步操作
    await loadingManager.wrapAsync(
      '加载仪表板数据',
      async () => {
        await dashboardStore.loadDashboardData()
        loadingManager.updateProgress(taskId, 80)
      },
      {
        category: 'dashboard',
        onRetry: async () => {
          await dashboardStore.loadDashboardData()
        }
      }
    )

    loadingManager.updateProgress(taskId, 100)
    loadingManager.completeTask(taskId)

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '加载学习数据失败'

    // 记录错误
    errorHandler.handleError({
      type: 'api',
      severity: 'medium',
      title: '仪表板加载失败',
      message: errorMessage,
      details: err instanceof Error ? err.stack : undefined,
      context: {
        action: 'loadDashboardData',
        url: window.location.href
      },
      retryable: true,
      retryAction: async () => {
        await loadDashboardData()
      }
    })

    loadingManager.failTask(taskId, errorMessage)
  }
}

// 生命周期
onMounted(async () => {
  await loadDashboardData()
})
</script>

<style scoped lang="scss">
.dashboard {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, rgba(91, 143, 249, 0.05), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 245, 250, 0.95) 100%);
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 16px;
    color: var(--edu-text-secondary);
    margin: 0;
  }
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--edu-primary-100) 0%, var(--edu-primary-200) 100%);
}

.stat-info {
  flex: 1;

  h3 {
    font-size: 24px;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0;
  }
}

.quick-actions {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 16px;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: white;
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    border-color: var(--edu-primary-300);
    background: var(--edu-primary-50);
    transform: translateY(-2px);
  }

  .btn-icon {
    font-size: 24px;
  }

  span:last-child {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }
}

.recent-activity {
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 16px;
  }
}

.activity-list {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--edu-primary-100);
  font-size: 20px;
}

.activity-content {
  flex: 1;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0 0 8px 0;
  }

  .activity-time {
    font-size: 12px;
    color: var(--edu-text-tertiary);
  }
}

// 学习洞察样式
.learning-insights {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 16px;
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid;

  &.insight-positive {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.2);
  }

  &.insight-warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.2);
  }

  &.insight-achievement {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.2);
  }
}

.insight-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.insight-content {
  flex: 1;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 4px 0;
  }

  p {
    font-size: 12px;
    color: var(--edu-text-secondary);
    margin: 0;
    line-height: 1.4;
  }
}

// 学习进度样式
.learning-progress {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 16px;
  }
}

.progress-list {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.progress-item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
  }

  .progress-stats {
    font-size: 12px;
    color: var(--edu-text-secondary);
    font-weight: 500;
  }
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;

  .course-progress {
    flex: 1;
  }

  .progress-percentage {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-primary-600);
    min-width: 40px;
    text-align: right;
  }
}

// 即将到期样式
.upcoming-deadlines {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 16px;
  }
}

.deadlines-list {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.deadline-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  margin-bottom: 12px;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: var(--edu-primary-300);
    background: var(--edu-primary-50);
  }

  &.deadline-urgent {
    border-color: var(--edu-danger-300);
    background: rgba(239, 68, 68, 0.05);
  }

  &.deadline-overdue {
    border-color: var(--edu-danger-500);
    background: rgba(239, 68, 68, 0.1);
  }
}

.deadline-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--edu-primary-100);
  flex-shrink: 0;
}

.deadline-content {
  flex: 1;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0 0 8px 0;
  }

  .deadline-time {
    font-size: 12px;
    color: var(--edu-text-tertiary);
    font-weight: 500;

    .deadline-urgent & {
      color: var(--edu-danger-600);
      font-weight: 600;
    }

    .deadline-overdue & {
      color: var(--edu-danger-700);
      font-weight: 700;
    }
  }
}

// 成就展示样式
.achievements-section {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 16px;
  }
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid var(--edu-border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    border-color: var(--edu-primary-300);
  }
}

.achievement-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--edu-primary-100) 0%, var(--edu-primary-200) 100%);
  flex-shrink: 0;
}

.achievement-content {
  flex: 1;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .achievement-date {
    font-size: 12px;
    color: var(--edu-text-tertiary);
    font-weight: 500;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .insights-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .deadline-item {
    padding: 12px;
  }

  .achievement-item {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 20px;
  }

  .action-btn {
    padding: 20px;
  }

  .insight-card {
    padding: 12px;
  }

  .progress-list,
  .deadlines-list {
    padding: 16px;
  }

  .achievement-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
}
</style>