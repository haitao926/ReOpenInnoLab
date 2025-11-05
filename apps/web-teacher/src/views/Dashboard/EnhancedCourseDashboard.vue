<template>
  <div class="enhanced-course-dashboard">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            <span class="greeting">{{ greeting }}</span>
            <span class="teacher-name">{{ teacherName }}</span>
          </h1>
          <p class="welcome-subtitle">今天是个开始新课程的好日子</p>
          <div class="welcome-stats">
            <div class="stat-item">
              <div class="stat-number">{{ todayClasses }}</div>
              <div class="stat-label">今日课程</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ activeStudents }}</div>
              <div class="stat-label">活跃学生</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ pendingTasks }}</div>
              <div class="stat-label">待办任务</div>
            </div>
          </div>
        </div>
        <div class="welcome-visual">
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
          <div class="welcome-illustration">
            <el-icon class="main-icon"><Reading /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作卡片 -->
    <div class="quick-actions-section">
      <div class="section-header">
        <h2 class="section-title">快速操作</h2>
        <p class="section-subtitle">快速访问常用功能</p>
      </div>
      <div class="quick-actions-grid">
        <div
          v-for="action in quickActions"
          :key="action.id"
          class="action-card"
          :class="{ 'is-featured': action.featured }"
          @click="handleQuickAction(action)"
        >
          <div class="action-gradient" :style="action.gradient"></div>
          <div class="action-content">
            <div class="action-icon">
              <el-icon>
                <component :is="action.icon" />
              </el-icon>
            </div>
            <h3 class="action-title">{{ action.title }}</h3>
            <p class="action-description">{{ action.description }}</p>
            <div class="action-footer">
              <span class="action-count">{{ action.count }}</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="analytics-section">
      <div class="section-header">
        <h2 class="section-title">数据概览</h2>
        <div class="header-actions">
          <el-radio-group v-model="analyticsPeriod" size="small">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="semester">本学期</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="analytics-grid">
        <!-- 学习进度卡片 -->
        <div class="analytics-card learning-progress">
          <div class="card-header">
            <div class="header-info">
              <h3>学习进度</h3>
              <p>整体学习情况概览</p>
            </div>
            <div class="header-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
          </div>
          <div class="card-content">
            <div class="progress-overview">
              <div class="progress-circle">
                <el-progress
                  type="circle"
                  :percentage="overallProgress"
                  :width="120"
                  :stroke-width="8"
                  :color="progressColors"
                />
                <div class="progress-label">
                  <div class="progress-value">{{ overallProgress }}%</div>
                  <div class="progress-text">总体进度</div>
                </div>
              </div>
              <div class="progress-details">
                <div class="progress-item">
                  <div class="progress-info">
                    <span class="progress-label">已完成课程</span>
                    <span class="progress-value">{{ completedCourses }}/{{ totalCourses }}</span>
                  </div>
                  <el-progress :percentage="courseProgress" :show-text="false" :stroke-width="6" />
                </div>
                <div class="progress-item">
                  <div class="progress-info">
                    <span class="progress-label">实验完成</span>
                    <span class="progress-value">{{ completedExperiments }}/{{ totalExperiments }}</span>
                  </div>
                  <el-progress :percentage="experimentProgress" :show-text="false" :stroke-width="6" />
                </div>
                <div class="progress-item">
                  <div class="progress-info">
                    <span class="progress-label">作业提交</span>
                    <span class="progress-value">{{ submittedAssignments }}/{{ totalAssignments }}</span>
                  </div>
                  <el-progress :percentage="assignmentProgress" :show-text="false" :stroke-width="6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 学生表现卡片 -->
        <div class="analytics-card student-performance">
          <div class="card-header">
            <div class="header-info">
              <h3>学生表现</h3>
              <p>学习成果分析</p>
            </div>
            <div class="header-icon">
              <el-icon><Trophy /></el-icon>
            </div>
          </div>
          <div class="card-content">
            <div class="performance-grid">
              <div class="performance-metric">
                <div class="metric-icon excellent">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ excellentStudents }}</div>
                  <div class="metric-label">优秀学生</div>
                  <div class="metric-change positive">+{{ excellentChange }}%</div>
                </div>
              </div>
              <div class="performance-metric">
                <div class="metric-icon good">
                  <el-icon><SuccessFilled /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ goodStudents }}</div>
                  <div class="metric-label">良好学生</div>
                  <div class="metric-change positive">+{{ goodChange }}%</div>
                </div>
              </div>
              <div class="performance-metric">
                <div class="metric-icon average">
                  <el-icon><InfoFilled /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ averageStudents }}</div>
                  <div class="metric-label">中等学生</div>
                  <div class="metric-change neutral">{{ averageChange }}%</div>
                </div>
              </div>
            </div>
            <div class="performance-chart">
              <div class="chart-placeholder">
                <el-icon><DataLine /></el-icon>
                <span>成绩分布图表</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 课程活跃度卡片 -->
        <div class="analytics-card course-activity">
          <div class="card-header">
            <div class="header-info">
              <h3>课程活跃度</h3>
              <p>学生参与度统计</p>
            </div>
            <div class="header-icon">
              <el-icon><DataBoard /></el-icon>
            </div>
          </div>
          <div class="card-content">
            <div class="activity-stats">
              <div class="activity-item">
                <div class="activity-icon">
                  <el-icon><User /></el-icon>
                </div>
                <div class="activity-info">
                  <div class="activity-value">{{ dailyActiveUsers }}</div>
                  <div class="activity-label">日活跃用户</div>
                  <div class="activity-trend up">
                    <el-icon><CaretTop /></el-icon>
                    <span>{{ dailyActiveTrend }}%</span>
                  </div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="activity-info">
                  <div class="activity-value">{{ averageStudyTime }}</div>
                  <div class="activity-label">平均学习时长</div>
                  <div class="activity-trend up">
                    <el-icon><CaretTop /></el-icon>
                    <span>{{ studyTimeTrend }}%</span>
                  </div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="activity-info">
                  <div class="activity-value">{{ interactionRate }}%</div>
                  <div class="activity-label">互动率</div>
                  <div class="activity-trend down">
                    <el-icon><CaretBottom /></el-icon>
                    <span>{{ interactionTrend }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动时间线 -->
    <div class="recent-activity-section">
      <div class="section-header">
        <h2 class="section-title">最近活动</h2>
        <el-button text @click="viewAllActivities">
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="activity-timeline">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="timeline-item"
          :class="activity.type"
        >
          <div class="timeline-marker">
            <div class="marker-dot">
              <el-icon>
                <component :is="getActivityIcon(activity.type)" />
              </el-icon>
            </div>
            <div class="marker-line"></div>
          </div>
          <div class="timeline-content">
            <div class="activity-card">
              <div class="activity-header">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              </div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-meta">
                <el-tag :type="getActivityTagType(activity.type)" size="small">
                  {{ getActivityLabel(activity.type) }}
                </el-tag>
                <span class="activity-course">{{ activity.course }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐课程 -->
    <div class="recommended-courses-section">
      <div class="section-header">
        <h2 class="section-title">推荐课程</h2>
        <p class="section-subtitle">基于您的教学偏好推荐</p>
      </div>
      <div class="courses-carousel">
        <div class="carousel-container">
          <div
            v-for="course in recommendedCourses"
            :key="course.id"
            class="course-card"
          >
            <div class="course-cover">
              <img :src="course.coverImage" :alt="course.title" />
              <div class="course-overlay">
                <el-button type="primary" @click="previewCourse(course)">
                  预览课程
                </el-button>
              </div>
            </div>
            <div class="course-info">
              <h4 class="course-title">{{ course.title }}</h4>
              <p class="course-description">{{ course.description }}</p>
              <div class="course-meta">
                <div class="meta-item">
                  <el-icon><User /></el-icon>
                  <span>{{ course.studentCount }}学生</span>
                </div>
                <div class="meta-item">
                  <el-icon><Star /></el-icon>
                  <span>{{ course.rating }}</span>
                </div>
                <div class="meta-item">
                  <el-icon><Clock /></el-icon>
                  <span>{{ course.duration }}小时</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Reading, ArrowRight, TrendCharts, Trophy, Star, SuccessFilled, InfoFilled,
  DataLine, DataBoard, User, Clock, ChatDotRound, CaretTop, CaretBottom,
  Plus, Document, Monitor, School, MagicStick
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  count: string
  gradient: string
  featured?: boolean
}

interface Activity {
  id: string
  type: 'course' | 'assignment' | 'experiment' | 'student' | 'system'
  title: string
  description: string
  course: string
  timestamp: Date
}

interface RecommendedCourse {
  id: string
  title: string
  description: string
  coverImage: string
  studentCount: number
  rating: number
  duration: number
}

// 响应式数据
const teacherName = ref('张老师')
const analyticsPeriod = ref('week')
const currentTime = ref(new Date())

// 数据
const todayClasses = ref(3)
const activeStudents = ref(156)
const pendingTasks = ref(8)

const quickActions = ref<QuickAction[]>([
  {
    id: 'create-course',
    title: '创建课程',
    description: '开始创建新的课程内容',
    icon: 'Plus',
    count: '12 门课程',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    featured: true
  },
  {
    id: 'manage-students',
    title: '学生管理',
    description: '管理班级和学生信息',
    icon: 'User',
    count: '156 名学生',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'view-reports',
    title: '学习报告',
    description: '查看学生学习进展报告',
    icon: 'Document',
    count: '8 份报告',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'ai-assistant',
    title: 'AI助手',
    description: '使用AI优化教学内容',
    icon: 'MagicStick',
    count: 'AI增强',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    featured: true
  }
])

const overallProgress = ref(78)
const completedCourses = ref(12)
const totalCourses = ref(15)
const completedExperiments = ref(8)
const totalExperiments = ref(10)
const submittedAssignments = ref(45)
const totalAssignments = ref(52)

const excellentStudents = ref(28)
const excellentChange = ref(5)
const goodStudents = ref(68)
const goodChange = ref(3)
const averageStudents = ref(60)
const averageChange = ref(0)

const dailyActiveUsers = ref(89)
const dailyActiveTrend = ref(12)
const averageStudyTime = ref('2.5h')
const studyTimeTrend = ref(8)
const interactionRate = ref(87)
const interactionTrend = ref(2)

const recentActivities = ref<Activity[]>([
  {
    id: '1',
    type: 'course',
    title: '发布了新课程',
    description: '《高中物理必修一》已成功发布并开放给学生',
    course: '高一(1)班',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    type: 'assignment',
    title: '批改了作业',
    description: '完成了《数学函数练习》的批改，平均分85分',
    course: '高一(2)班',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: '3',
    type: 'experiment',
    title: '实验完成提醒',
    description: '《物理电路实验》有15名学生完成了实验',
    course: '高一(1)班',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: '4',
    type: 'student',
    title: '学生表现突出',
    description: '李四同学在《化学实验》中表现优秀',
    course: '高一(3)班',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
  }
])

const recommendedCourses = ref<RecommendedCourse[]>([
  {
    id: '1',
    title: 'Python编程入门',
    description: '适合初学者的Python编程基础课程',
    coverImage: '/images/python-course.jpg',
    studentCount: 234,
    rating: 4.8,
    duration: 12
  },
  {
    id: '2',
    title: '数据可视化艺术',
    description: '学习使用工具创建精美的数据可视化',
    coverImage: '/images/data-viz.jpg',
    studentCount: 156,
    rating: 4.6,
    duration: 8
  },
  {
    id: '3',
    title: 'AI教育应用',
    description: '探索AI在教育领域的创新应用',
    coverImage: '/images/ai-education.jpg',
    studentCount: 89,
    rating: 4.9,
    duration: 6
  }
])

// 计算属性
const greeting = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const progressColors = computed(() => [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
])

const courseProgress = computed(() => Math.round((completedCourses.value / totalCourses.value) * 100))
const experimentProgress = computed(() => Math.round((completedExperiments.value / totalExperiments.value) * 100))
const assignmentProgress = computed(() => Math.round((submittedAssignments.value / totalAssignments.value) * 100))

// 方法
const handleQuickAction = (action: QuickAction) => {
  ElMessage.success(`打开${action.title}功能`)
  // 这里可以导航到相应的页面
}

const getActivityIcon = (type: string) => {
  const icons = {
    course: 'Document',
    assignment: 'EditPen',
    experiment: 'Monitor',
    student: 'User',
    system: 'Setting'
  }
  return icons[type as keyof typeof icons] || 'InfoFilled'
}

const getActivityTagType = (type: string) => {
  const types = {
    course: 'primary',
    assignment: 'success',
    experiment: 'warning',
    student: 'info',
    system: 'danger'
  }
  return types[type as keyof typeof types] || 'info'
}

const getActivityLabel = (type: string) => {
  const labels = {
    course: '课程',
    assignment: '作业',
    experiment: '实验',
    student: '学生',
    system: '系统'
  }
  return labels[type as keyof typeof labels] || type
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return dayjs(timestamp).format('MM-DD HH:mm')
  }
}

const viewAllActivities = () => {
  ElMessage.info('查看全部活动')
}

const previewCourse = (course: RecommendedCourse) => {
  ElMessage.info(`预览课程: ${course.title}`)
}

// 生命周期
onMounted(() => {
  // 更新当前时间
  setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})
</script>

<style lang="scss" scoped>
.enhanced-course-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: var(--spacing-xl);
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.welcome-text {
  flex: 1;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 300;
  margin: 0 0 var(--spacing-base) 0;
  line-height: 1.2;

  .greeting {
    display: block;
    font-weight: 700;
    background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .teacher-name {
    font-size: 3.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.welcome-subtitle {
  font-size: 1.2rem;
  margin: 0 0 var(--spacing-xl) 0;
  opacity: 0.9;
}

.welcome-stats {
  display: flex;
  gap: var(--spacing-xl);
}

.stat-item {
  text-align: center;

  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: var(--spacing-xs);
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

.welcome-visual {
  position: relative;
  width: 300px;
  height: 300px;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;

  &.shape-1 {
    width: 80px;
    height: 80px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
  }

  &.shape-2 {
    width: 120px;
    height: 120px;
    top: 50%;
    right: 10%;
    animation-delay: 2s;
  }

  &.shape-3 {
    width: 60px;
    height: 60px;
    bottom: 20%;
    left: 30%;
    animation-delay: 4s;
  }
}

.welcome-illustration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .main-icon {
    font-size: 120px;
    opacity: 0.3;
    animation: pulse 4s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

.section-header {
  margin-bottom: var(--spacing-xl);

  .section-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .section-subtitle {
    color: var(--edu-text-secondary);
    margin: 0;
    font-size: 1rem;
  }

  .header-actions {
    margin-top: var(--spacing-base);
  }
}

.quick-actions-section {
  margin-bottom: var(--spacing-2xl);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  position: relative;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 200px;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  &.is-featured {
    grid-column: span 2;
    height: 240px;

    .action-content {
      padding: var(--spacing-2xl);
    }

    .action-title {
      font-size: 1.8rem;
    }

    .action-description {
      font-size: 1.1rem;
    }
  }
}

.action-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
}

.action-content {
  position: relative;
  z-index: 2;
  padding: var(--spacing-xl);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.action-icon {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: var(--spacing-lg);

  .el-icon {
    font-size: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.action-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.action-description {
  color: var(--edu-text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  line-height: 1.5;
}

.action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .action-count {
    font-size: 0.9rem;
    color: var(--edu-text-tertiary);
  }

  .action-arrow {
    color: var(--edu-primary-500);
    transition: transform 0.3s ease;
  }
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
}

.analytics-section {
  margin-bottom: var(--spacing-2xl);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.analytics-card {
  background: white;
  border-radius: 20px;
  padding: var(--spacing-xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);

  .header-info {
    h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--edu-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    p {
      color: var(--edu-text-secondary);
      margin: 0;
    }
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    .el-icon {
      font-size: 24px;
    }
  }
}

.progress-overview {
  display: flex;
  gap: var(--spacing-xl);
  align-items: center;
}

.progress-circle {
  position: relative;

  .progress-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;

    .progress-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--edu-text-primary);
      line-height: 1;
    }

    .progress-text {
      font-size: 0.8rem;
      color: var(--edu-text-secondary);
    }
  }
}

.progress-details {
  flex: 1;

  .progress-item {
    margin-bottom: var(--spacing-lg);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);

    .progress-label {
      color: var(--edu-text-secondary);
      font-size: 0.9rem;
    }

    .progress-value {
      font-weight: 600;
      color: var(--edu-text-primary);
    }
  }
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.performance-metric {
  text-align: center;

  .metric-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-base) auto;

    &.excellent {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    &.good {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    &.average {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .el-icon {
      font-size: 24px;
    }
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .metric-label {
    color: var(--edu-text-secondary);
    font-size: 0.9rem;
    margin-bottom: var(--spacing-xs);
  }

  .metric-change {
    font-size: 0.8rem;
    font-weight: 600;

    &.positive {
      color: var(--edu-success);
    }

    &.neutral {
      color: var(--edu-text-tertiary);
    }
  }
}

.performance-chart {
  height: 120px;
  background: var(--edu-bg-secondary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-text-tertiary);

  .chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);

    .el-icon {
      font-size: 32px;
    }
  }
}

.activity-stats {
  .activity-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-base) 0;
    border-bottom: 1px solid var(--edu-border-light);

    &:last-child {
      border-bottom: none;
    }
  }

  .activity-icon {
    width: 48px;
    height: 48px;
    background: var(--edu-bg-secondary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--edu-primary-500);

    .el-icon {
      font-size: 20px;
    }
  }

  .activity-info {
    flex: 1;

    .activity-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--edu-text-primary);
      margin-bottom: var(--spacing-xs);
    }

    .activity-label {
      color: var(--edu-text-secondary);
      font-size: 0.9rem;
      margin-bottom: var(--spacing-xs);
    }

    .activity-trend {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.8rem;
      font-weight: 600;

      &.up {
        color: var(--edu-success);
      }

      &.down {
        color: var(--edu-danger);
      }
    }
  }
}

.recent-activity-section {
  margin-bottom: var(--spacing-2xl);
}

.activity-timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-item {
  position: relative;
  margin-bottom: var(--spacing-xl);

  &:last-child .marker-line {
    display: none;
  }
}

.timeline-marker {
  position: absolute;
  left: -40px;
  top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .marker-dot {
    width: 32px;
    height: 32px;
    background: white;
    border: 3px solid var(--edu-border-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    .el-icon {
      font-size: 14px;
      color: var(--edu-text-secondary);
    }
  }

  .marker-line {
    width: 2px;
    height: calc(100% + 16px);
    background: var(--edu-border-light);
    margin-top: 8px;
  }
}

.timeline-item.course .marker-dot {
  border-color: var(--edu-primary-500);
  .el-icon {
    color: var(--edu-primary-500);
  }
}

.timeline-item.assignment .marker-dot {
  border-color: var(--edu-success);
  .el-icon {
    color: var(--edu-success);
  }
}

.timeline-item.experiment .marker-dot {
  border-color: var(--edu-warning);
  .el-icon {
    color: var(--edu-warning);
  }
}

.timeline-content {
  .activity-card {
    background: white;
    border-radius: 16px;
    padding: var(--spacing-lg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);

    .activity-title {
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 0;
    }

    .activity-time {
      font-size: 0.8rem;
      color: var(--edu-text-tertiary);
    }
  }

  .activity-description {
    color: var(--edu-text-secondary);
    margin-bottom: var(--spacing-base);
    line-height: 1.5;
  }

  .activity-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .activity-course {
      font-size: 0.8rem;
      color: var(--edu-text-tertiary);
    }
  }
}

.recommended-courses-section {
  margin-bottom: var(--spacing-2xl);
}

.courses-carousel {
  overflow-x: auto;
  padding: var(--spacing-sm) 0;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--edu-bg-secondary);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--edu-primary-300);
    border-radius: 4px;
  }
}

.carousel-container {
  display: flex;
  gap: var(--spacing-lg);
  min-width: fit-content;
}

.course-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width: 280px;
  flex-shrink: 0;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }
}

.course-cover {
  position: relative;
  height: 160px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .course-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .course-overlay {
    opacity: 1;
  }
}

.course-info {
  padding: var(--spacing-lg);

  .course-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 var(--spacing-sm) 0;
    line-height: 1.3;
  }

  .course-description {
    color: var(--edu-text-secondary);
    font-size: 0.9rem;
    margin: 0 0 var(--spacing-base) 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.8rem;
      color: var(--edu-text-tertiary);

      .el-icon {
        font-size: 12px;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .enhanced-course-dashboard {
    padding: var(--spacing-base);
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xl);
  }

  .welcome-title {
    font-size: 2rem;

    .teacher-name {
      font-size: 2.5rem;
    }
  }

  .welcome-stats {
    justify-content: center;
  }

  .welcome-visual {
    width: 200px;
    height: 200px;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .action-card.is-featured {
    grid-column: span 1;
    height: 200px;
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .progress-overview {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .performance-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-base);
  }

  .activity-timeline {
    padding-left: 30px;
  }

  .timeline-marker {
    left: -30px;
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .enhanced-course-dashboard {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .analytics-card,
  .activity-card,
  .course-card {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .action-card {
    background: var(--edu-bg-primary);
  }

  .action-icon {
    background: var(--edu-bg-secondary);
  }

  .performance-chart {
    background: var(--edu-bg-secondary);
  }

  .activity-icon {
    background: var(--edu-bg-secondary);
  }
}
</style>