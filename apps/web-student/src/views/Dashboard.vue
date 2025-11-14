<template>
  <div class="futureschool-dashboard">
    <!-- 背景层 -->
    <div class="dashboard-background">
      <div class="gradient-sphere sphere-1"></div>
      <div class="gradient-sphere sphere-2"></div>
      <div class="gradient-sphere sphere-3"></div>
      <div class="noise-overlay"></div>
    </div>

    <!-- 顶部导航 -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="welcome-block">
          <div class="time-greeting">
            <span class="current-time">{{ currentTime }}</span>
            <span class="greeting-text">{{ getSmartGreeting() }}</span>
          </div>
          <h1 class="user-welcome">
            你好，<span class="user-highlight">{{ userStore.displayName }}</span>
          </h1>
          <p class="academic-context">{{ currentAcademicContext }}</p>
        </div>

        <div class="status-indicators">
          <div class="learning-pulse">
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
            <span class="pulse-label">学习进行中</span>
          </div>
          <div class="ai-status">
            <div class="ai-indicator active"></div>
            <span class="ai-label">AI助手在线</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主控制台 -->
    <main class="dashboard-console">
      <!-- 今日焦点 -->
      <section class="focus-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">🎯</span>
            今日学习焦点
          </h2>
          <div class="context-badge">
            <span class="badge-day">{{ getDayInfo() }}</span>
            <span class="badge-period">{{ getCurrentPeriod() }}</span>
          </div>
        </div>

        <div class="focus-grid">
          <div
            v-for="course in todayFocusCourses"
            :key="course.id"
            class="focus-card"
            :class="{ 'active': course.isActive, 'urgent': course.isUrgent }"
            @click="enterLearningMode(course)"
          >
            <div class="card-luminaire">
              <div class="lumina-glow"></div>
            </div>

            <div class="card-content">
              <div class="course-meta">
                <span class="course-code">{{ course.code }}</span>
                <span class="course-credit">{{ course.credits }}学分</span>
              </div>

              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-instructor">{{ course.instructor }}</p>

              <div class="progress-indicator">
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
                </div>
                <span class="progress-percentage">{{ course.progress }}%</span>
              </div>

              <div class="course-actions">
                <button class="action-primary" :disabled="course.isLocked">
                  {{ course.isLocked ? '等待解锁' : (course.isActive ? '继续学习' : '开始学习') }}
                </button>
                <button class="action-secondary">
                  <el-icon><View /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 智能学习数据 -->
      <section class="intelligence-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">🧠</span>
            AI学习洞察
          </h2>
          <div class="refresh-indicator">
            <div class="refresh-pulse"></div>
            <span>实时更新</span>
          </div>
        </div>

        <div class="intelligence-grid">
          <!-- 学习状态 -->
          <div class="intel-card learning-state">
            <div class="card-header">
              <h3>学习状态</h3>
              <div class="status-score">
                <span class="score-value">{{ learningState.score }}</span>
                <span class="score-max">/100</span>
              </div>
            </div>
            <div class="state-visualization">
              <div class="state-radar">
                <div
                  class="radar-point"
                  v-for="point in learningState.radar"
                  :key="point.type"
                  :style="{
                    left: point.x + '%',
                    top: point.y + '%',
                    '--intensity': point.intensity
                  }"
                ></div>
              </div>
              <div class="state-metrics">
                <div class="metric-item" v-for="metric in learningState.metrics" :key="metric.label">
                  <span class="metric-label">{{ metric.label }}</span>
                  <span class="metric-value">{{ metric.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI建议 -->
          <div class="intel-card ai-suggestions">
            <div class="card-header">
              <h3>AI学习建议</h3>
              <div class="ai-confidence">
                <span class="confidence-label">置信度</span>
                <span class="confidence-value">{{ aiSuggestions.confidence }}%</span>
              </div>
            </div>
            <div class="suggestions-list">
              <div
                v-for="suggestion in aiSuggestions.items"
                :key="suggestion.id"
                class="suggestion-item"
                :class="suggestion.priority"
              >
                <div class="suggestion-icon">
                  <el-icon><component :is="getSuggestionIcon(suggestion.type)" /></el-icon>
                </div>
                <div class="suggestion-content">
                  <h4>{{ suggestion.title }}</h4>
                  <p>{{ suggestion.description }}</p>
                  <div class="suggestion-actions">
                    <button class="suggestion-apply">采纳</button>
                    <button class="suggestion-details">详情</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 成就系统 -->
          <div class="intel-card achievement-system">
            <div class="card-header">
              <h3>学习成就</h3>
              <div class="achievement-progress">
                <span class="progress-current">{{ achievements.current }}</span>
                <span class="progress-total">/ {{ achievements.total }}</span>
              </div>
            </div>
            <div class="achievements-showcase">
              <div
                v-for="achievement in achievements.recent"
                :key="achievement.id"
                class="achievement-badge"
                :class="{ 'unlocked': achievement.unlocked }"
              >
                <div class="badge-icon">
                  <el-icon><component :is="achievement.icon" /></el-icon>
                </div>
                <div class="badge-info">
                  <span class="badge-name">{{ achievement.name }}</span>
                  <span class="badge-desc">{{ achievement.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 学习时间线 -->
      <section class="timeline-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">⏰</span>
            学习时间线
          </h2>
          <div class="timeline-filters">
            <button
              v-for="filter in timelineFilters"
              :key="filter.value"
              class="filter-btn"
              :class="{ active: activeTimelineFilter === filter.value }"
              @click="setTimelineFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <div class="timeline-container">
          <div class="timeline-track">
            <div
              v-for="event in filteredTimeline"
              :key="event.id"
              class="timeline-event"
              :class="event.type"
            >
              <div class="event-marker">
                <div class="marker-dot"></div>
                <div class="marker-pulse"></div>
              </div>
              <div class="event-content">
                <div class="event-time">{{ formatEventTime(event.timestamp) }}</div>
                <h4 class="event-title">{{ event.title }}</h4>
                <p class="event-description">{{ event.description }}</p>
                <div v-if="event.metrics" class="event-metrics">
                  <span
                    v-for="metric in event.metrics"
                    :key="metric.label"
                    class="event-metric"
                  >
                    {{ metric.label }}: {{ metric.value }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 浮动操作面板 -->
    <div class="floating-panel">
      <button class="panel-btn ai-assistant" @click="toggleAIAssistant">
        <el-icon><ChatDotRound /></el-icon>
        <span>AI助手</span>
      </button>
      <button class="panel-btn quick-notes" @click="openQuickNotes">
        <el-icon><EditPen /></el-icon>
        <span>快速笔记</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  View,
  ChatDotRound,
  EditPen,
  TrendCharts,
  Trophy,
  Star,
  Lightning,
  Clock,
  Reading,
  DataAnalysis
} from '@element-plus/icons-vue'

import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

// 响应式数据
const currentTime = ref('')
const activeTimelineFilter = ref('today')

const todayFocusCourses = ref([
  {
    id: '1',
    code: 'CS101',
    title: 'Python编程基础',
    instructor: '李老师',
    credits: 3,
    progress: 65,
    isActive: true,
    isUrgent: false,
    isLocked: false
  },
  {
    id: '2',
    code: 'MATH201',
    title: '高等数学',
    instructor: '王老师',
    credits: 4,
    progress: 42,
    isActive: false,
    isUrgent: true,
    isLocked: false
  },
  {
    id: '3',
    code: 'PHY301',
    title: '物理实验',
    instructor: '张老师',
    credits: 2,
    progress: 18,
    isActive: false,
    isUrgent: false,
    isLocked: true
  }
])

const learningState = ref({
  score: 87,
  radar: [
    { type: 'focus', x: 30, y: 25, intensity: 0.8 },
    { type: 'understanding', x: 70, y: 20, intensity: 0.9 },
    { type: 'practice', x: 50, y: 60, intensity: 0.7 },
    { type: 'creativity', x: 25, y: 70, intensity: 0.6 },
    { type: 'collaboration', x: 75, y: 65, intensity: 0.8 }
  ],
  metrics: [
    { label: '专注度', value: '85%' },
    { label: '理解力', value: '92%' },
    { label: '练习量', value: '78%' }
  ]
})

const aiSuggestions = ref({
  confidence: 94,
  items: [
    {
      id: '1',
      type: 'focus',
      priority: 'high',
      title: '加强函数练习',
      description: '建议完成更多编程练习，加深对函数概念的理解'
    },
    {
      id: '2',
      type: 'schedule',
      priority: 'medium',
      title: '调整学习节奏',
      description: '根据你的学习模式，建议在下午2-4点学习数学效果最佳'
    },
    {
      id: '3',
      type: 'resource',
      priority: 'low',
      title: '推荐学习资源',
      description: '发现了一些适合你当前水平的Python教程'
    }
  ]
})

const achievements = ref({
  current: 12,
  total: 30,
  recent: [
    {
      id: '1',
      name: '连续学习',
      description: '连续7天完成学习任务',
      icon: Lightning,
      unlocked: true
    },
    {
      id: '2',
      name: '代码大师',
      description: '完成10个编程挑战',
      icon: Trophy,
      unlocked: true
    },
    {
      id: '3',
      name: '数学达人',
      description: '数学成绩达到A+',
      icon: Star,
      unlocked: false
    }
  ]
})

const timelineFilters = ref([
  { label: '今天', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '全部', value: 'all' }
])

const timelineEvents = ref([
  {
    id: '1',
    type: 'course',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    title: '完成Python章节学习',
    description: '学习了函数定义、参数传递和返回值',
    metrics: [
      { label: '学习时长', value: '45分钟' },
      { label: '正确率', value: '92%' }
    ]
  },
  {
    id: '2',
    type: 'assignment',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    title: '提交数学作业',
    description: '完成了微积分练习题第三章',
    metrics: [
      { label: '得分', value: '88/100' },
      { label: '用时', value: '35分钟' }
    ]
  },
  {
    id: '3',
    type: 'achievement',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    title: '获得学习成就',
    description: '解锁"连续学习"徽章',
    metrics: [
      { label: '连续天数', value: '7天' }
    ]
  }
])

// 计算属性
const currentAcademicContext = computed(() => {
  const semester = '2024年春季学期'
  const week = '第8周'
  return `${semester} ${week}`
})

const filteredTimeline = computed(() => {
  const now = new Date()
  return timelineEvents.value.filter(event => {
    if (activeTimelineFilter.value === 'today') {
      return event.timestamp.toDateString() === now.toDateString()
    } else if (activeTimelineFilter.value === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return event.timestamp >= weekAgo
    }
    return true
  })
})

// 方法
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const getSmartGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '早上好，新的一天充满可能'
  if (hour < 14) return '中午好，适当休息'
  if (hour < 18) return '下午好，保持专注'
  if (hour < 22) return '晚上好，继续加油'
  return '该休息了，明天再继续'
}

const getDayInfo = () => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  return now.toLocaleDateString('zh-CN', options)
}

const getCurrentPeriod = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午时段'
  if (hour < 14) return '午休时段'
  if (hour < 18) return '下午时段'
  return '晚间时段'
}

const getSuggestionIcon = (type: string) => {
  const icons: Record<string, any> = {
    'focus': TrendCharts,
    'schedule': Clock,
    'resource': Reading
  }
  return icons[type] || DataAnalysis
}

const formatEventTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  return '刚刚'
}

const enterLearningMode = (course: any) => {
  if (course.isLocked) {
    ElMessage.warning('该课程尚未解锁')
    return
  }
  courseStore.selectCourse(course.id)
  ElMessage.success(`进入学习模式：${course.title}`)
  router.push('/course/' + course.id)
}

const setTimelineFilter = (filter: string) => {
  activeTimelineFilter.value = filter
}

const toggleAIAssistant = () => {
  ElMessage.info('AI助手功能开发中...')
}

const openQuickNotes = () => {
  ElMessage.info('快速笔记功能开发中...')
}

// 生命周期
let timeInterval: number

onMounted(() => {
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)
  courseStore.loadTodayCourses()
})

onUnmounted(() => {
  clearInterval(timeInterval)
})
</script>

<style scoped lang="scss">
.futureschool-dashboard {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: var(--gradient-midnight);
  color: var(--text-primary);
}

// 背景系统
.dashboard-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: var(--blur-large);
  opacity: 0.6;
  animation: apple-float 25s ease-in-out infinite;

  &.sphere-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--apple-blue) 0%, transparent 70%);
    top: -150px;
    right: -150px;
    animation-delay: 0s;
  }

  &.sphere-2 {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, var(--apple-purple) 0%, transparent 70%);
    bottom: 10%;
    left: -100px;
    animation-delay: 8s;
  }

  &.sphere-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, var(--apple-pink) 0%, transparent 70%);
    top: 40%;
    right: 15%;
    animation-delay: 16s;
  }
}

.noise-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.01) 0%, transparent 50%);
  pointer-events: none;
}

@keyframes apple-float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translateY(-40px) rotate(90deg) scale(1.05);
    opacity: 0.7;
  }
  50% {
    transform: translateY(20px) rotate(180deg) scale(0.95);
    opacity: 0.5;
  }
  75% {
    transform: translateY(-15px) rotate(270deg) scale(1.02);
    opacity: 0.65;
  }
}

// Apple 风格顶部导航
.dashboard-header {
  position: relative;
  z-index: var(--z-fixed);
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-large);
  -webkit-backdrop-filter: var(--blur-large);
  border-bottom: 1px solid var(--border-separator-light);
  padding: var(--space-8) 0;
  box-shadow: var(--shadow-large);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-block {
  flex: 1;
}

.time-greeting {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.current-time {
  font-size: 3rem;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

.greeting-text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.user-welcome {
  font-size: 2.5rem;
  font-weight: 300;
  color: white;
  margin: 0 0 8px 0;
}

.user-highlight {
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.academic-context {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.status-indicators {
  display: flex;
  gap: 32px;
}

.learning-pulse {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.pulse-ring {
  width: 12px;
  height: 12px;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  position: relative;
}

.pulse-ring::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pulse-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  position: relative;

  &.active {
    animation: ai-pulse 2s ease-in-out infinite;
  }
}

@keyframes ai-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}

.ai-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

// 主控制台
.dashboard-console {
  position: relative;
  z-index: 5;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 300;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.5rem;
}

.context-badge {
  display: flex;
  gap: 12px;
}

.badge-day,
.badge-period {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-day {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-period {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

// 今日焦点
.focus-section {
  margin-bottom: 80px;
}

.focus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.focus-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.1);
  }

  &.active {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  &.urgent {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }
}

.card-luminaire {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
}

.lumina-glow {
  height: 100%;
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  animation: lumina-scan 3s ease-in-out infinite;
}

@keyframes lumina-scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.card-content {
  position: relative;
  z-index: 2;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.course-code {
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
}

.course-credit {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.course-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.course-instructor {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 24px 0;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.course-actions {
  display: flex;
  gap: 12px;
}

.action-primary {
  flex: 1;
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.action-secondary {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

// 智能学习数据
.intelligence-section {
  margin-bottom: 80px;
}

.intelligence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.intel-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 500;
  color: white;
  margin: 0;
}

.status-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
}

.score-max {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.state-visualization {
  position: relative;
}

.state-radar {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 24px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 20px;
}

.radar-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(59, 130, 246, var(--intensity));
  transform: translate(-50%, -50%);
}

.state-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

.metric-value {
  color: white;
  font-weight: 500;
}

.ai-confidence {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.confidence-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.confidence-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #10b981;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;

  &.high {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  &.medium {
    border-left-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  &.low {
    border-left-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.suggestion-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.suggestion-content p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.suggestion-apply,
.suggestion-details {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-apply {
  background: #3b82f6;
  color: white;

  &:hover {
    background: #2563eb;
  }
}

.suggestion-details {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.achievement-progress {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.progress-current {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f59e0b;
}

.progress-total {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.achievements-showcase {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  transition: all 0.2s ease;

  &.unlocked {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  &:not(.unlocked) {
    opacity: 0.5;
    filter: grayscale(1);
  }
}

.badge-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.badge-info {
  flex: 1;
}

.badge-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
}

.badge-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

// 学习时间线
.timeline-section {
  margin-bottom: 80px;
}

.timeline-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }
}

.timeline-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
}

.timeline-track {
  position: relative;
}

.timeline-event {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  position: relative;

  &:not(:last-child) {
    &::after {
      content: '';
      position: absolute;
      left: 19px;
      top: 60px;
      bottom: -20px;
      width: 2px;
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.3), transparent);
    }
  }
}

.event-marker {
  position: relative;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}

.marker-pulse {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 24px;
  height: 24px;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

.event-content {
  flex: 1;
}

.event-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.event-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.event-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.event-metrics {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.event-metric {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
}

// 浮动操作面板
.floating-panel {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-btn {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  span {
    font-size: 0.625rem;
    line-height: 1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .status-indicators {
    justify-content: center;
  }

  .current-time {
    font-size: 2rem;
  }

  .user-welcome {
    font-size: 1.75rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .focus-grid,
  .intelligence-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-console {
    padding: 24px 16px;
  }

  .floating-panel {
    bottom: 24px;
    right: 24px;
  }
}
</style>