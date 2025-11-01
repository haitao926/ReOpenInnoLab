<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon subject-physics">
            <el-icon size="32"><Science /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCourses }}</div>
            <div class="stat-label">总课程数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon subject-math">
            <el-icon size="32"><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalStudents }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon subject-chemistry">
            <el-icon size="32"><EditPen /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingAssignments }}</div>
            <div class="stat-label">待批改作业</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon subject-language">
            <el-icon size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgCompletion }}%</div>
            <div class="stat-label">平均完成率</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="24" class="main-content">
      <!-- 左侧内容 -->
      <el-col :xs="24" :lg="16">
        <!-- 最近课程 -->
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近课程</span>
              <el-button type="primary" @click="$router.push('/courses')">
                查看全部
              </el-button>
            </div>
          </template>

          <el-table :data="recentCourses" style="width: 100%">
            <el-table-column prop="title" label="课程名称" min-width="200">
              <template #default="{ row }">
                <div class="course-info">
                  <div class="course-title">{{ row.title }}</div>
                  <div class="course-meta">
                    <el-tag :type="getSubjectTagType(row.subject)" size="small">
                      {{ getSubjectName(row.subject) }}
                    </el-tag>
                    <span class="course-grade">{{ row.grade }}年级</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="students" label="学生数" width="100" />
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="8" />
              </template>
            </el-table-column>
            <el-table-column prop="lastActivity" label="最后活动" width="150">
              <template #default="{ row }">
                {{ formatDate(row.lastActivity) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="text" @click="viewCourse(row.id)">
                  查看
                </el-button>
                <el-button type="text" @click="editCourse(row.id)">
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 学习动态 -->
        <el-card class="content-card" style="margin-top: 24px;">
          <template #header>
            <span class="card-title">学习动态</span>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="formatDateTime(activity.timestamp)"
              :type="getActivityType(activity.type)"
            >
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-meta">
                  <span>{{ activity.studentName }}</span>
                  <span class="activity-course">{{ activity.courseName }}</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 右侧内容 -->
      <el-col :xs="24" :lg="8">
        <!-- 快速操作 -->
        <el-card class="content-card">
          <template #header>
            <span class="card-title">快速操作</span>
          </template>

          <div class="quick-actions">
            <el-button type="primary" block @click="$router.push('/courses/create')">
              <el-icon><Plus /></el-icon>
              创建新课程
            </el-button>
            <el-button type="success" block style="margin-top: 12px;" @click="$router.push('/assignments/create')">
              <el-icon><DocumentAdd /></el-icon>
              布置新作业
            </el-button>
            <el-button type="info" block style="margin-top: 12px;" @click="$router.push('/labs')">
              <el-icon><Science /></el-icon>
              开启虚拟实验
            </el-button>
          </div>
        </el-card>

        <!-- 学科分布 -->
        <el-card class="content-card" style="margin-top: 24px;">
          <template #header>
            <span class="card-title">学科分布</span>
          </template>

          <div class="subject-chart">
            <div
              v-for="subject in subjectDistribution"
              :key="subject.subject"
              class="subject-item"
            >
              <div class="subject-info">
                <div class="subject-color" :class="`subject-${subject.subject}`"></div>
                <span class="subject-name">{{ getSubjectName(subject.subject) }}</span>
              </div>
              <div class="subject-stats">
                <span class="subject-count">{{ subject.count }}</span>
                <div class="subject-bar">
                  <div
                    class="subject-progress"
                    :style="{ width: `${(subject.count / maxSubjectCount) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 系统通知 -->
        <el-card class="content-card" style="margin-top: 24px;">
          <template #header>
            <span class="card-title">系统通知</span>
          </template>

          <div class="notifications">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
              :class="`notification-${notification.type}`"
            >
              <div class="notification-icon">
                <el-icon>
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">{{ formatDateTime(notification.timestamp) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Science,
  Reading,
  EditPen,
  TrendCharts,
  Plus,
  DocumentAdd
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { formatDate, formatDateTime } from '@/utils/date'

const router = useRouter()
const appStore = useAppStore()

// 统计数据
const stats = ref({
  totalCourses: 24,
  totalStudents: 486,
  pendingAssignments: 12,
  avgCompletion: 78
})

// 最近课程
const recentCourses = ref([
  {
    id: '1',
    title: '高中物理 - 力学基础',
    subject: 'physics',
    grade: '10',
    students: 32,
    progress: 65,
    lastActivity: new Date('2024-01-14')
  },
  {
    id: '2',
    title: '高中化学 - 有机化合物',
    subject: 'chemistry',
    grade: '11',
    students: 28,
    progress: 82,
    lastActivity: new Date('2024-01-13')
  },
  {
    id: '3',
    title: '高中数学 - 函数与图像',
    subject: 'math',
    grade: '10',
    students: 35,
    progress: 71,
    lastActivity: new Date('2024-01-12')
  }
])

// 学习动态
const recentActivities = ref([
  {
    id: '1',
    type: 'assignment',
    title: '完成作业：力学基础练习题',
    description: '学生提交了第3章练习题，得分92分',
    studentName: '张小明',
    courseName: '高中物理 - 力学基础',
    timestamp: new Date('2024-01-15T10:30:00')
  },
  {
    id: '2',
    type: 'course',
    title: '开始学习新章节',
    description: '学生开始学习第4章：动量守恒',
    studentName: '李小红',
    courseName: '高中物理 - 力学基础',
    timestamp: new Date('2024-01-15T09:15:00')
  },
  {
    id: '3',
    type: 'lab',
    title: '完成实验：弹簧振子',
    description: '学生成功完成振子实验，实验报告评分优秀',
    studentName: '王大伟',
    courseName: '高中物理 - 力学基础',
    timestamp: new Date('2024-01-14T15:45:00')
  }
])

// 学科分布
const subjectDistribution = ref([
  { subject: 'physics', count: 8 },
  { subject: 'chemistry', count: 6 },
  { subject: 'math', count: 7 },
  { subject: 'biology', count: 3 }
])

const maxSubjectCount = computed(() =>
  Math.max(...subjectDistribution.value.map(s => s.count))
)

// 系统通知
const notifications = ref([
  {
    id: '1',
    type: 'info',
    title: '系统更新通知',
    timestamp: new Date('2024-01-15T08:00:00')
  },
  {
    id: '2',
    type: 'warning',
    title: '作业批改提醒',
    timestamp: new Date('2024-01-14T16:30:00')
  },
  {
    id: '3',
    type: 'success',
    title: '课程创建成功',
    timestamp: new Date('2024-01-13T14:20:00')
  }
])

// 学科相关方法
const getSubjectName = (subject: string): string => {
  const subjects: Record<string, string> = {
    physics: '物理',
    chemistry: '化学',
    math: '数学',
    biology: '生物',
    language: '语文',
    history: '历史',
    geography: '地理',
    english: '英语',
    art: '美术',
    music: '音乐',
    pe: '体育',
    it: '信息技术'
  }
  return subjects[subject] || subject
}

const getSubjectTagType = (subject: string): string => {
  const tagTypes: Record<string, string> = {
    physics: 'primary',
    chemistry: 'success',
    math: 'warning',
    biology: 'info'
  }
  return tagTypes[subject] || ''
}

// 活动类型
const getActivityType = (type: string): string => {
  const types: Record<string, string> = {
    assignment: 'success',
    course: 'primary',
    lab: 'warning',
    quiz: 'info'
  }
  return types[type] || 'primary'
}

// 通知图标
const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    info: 'InfoFilled',
    warning: 'WarningFilled',
    success: 'SuccessFilled',
    error: 'CircleCloseFilled'
  }
  return icons[type] || 'InfoFilled'
}

// 事件处理
const viewCourse = (id: string) => {
  router.push(`/courses/${id}`)
}

const editCourse = (id: string) => {
  router.push(`/courses/${id}/edit`)
}

// 生命周期
onMounted(async () => {
  try {
    // 模拟加载数据
    appStore.setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.addNotification({
      type: 'error',
      title: '数据加载失败',
      message: '请刷新页面重试'
    })
  } finally {
    appStore.setLoading(false)
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1;
    color: var(--edu-text-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    color: var(--edu-text-secondary);
  }
}

.main-content {
  margin-top: 24px;
}

.content-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }
}

.course-info {
  .course-title {
    font-weight: 500;
    color: var(--edu-text-primary);
    margin-bottom: 4px;
  }

  .course-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--edu-text-secondary);
  }
}

.activity-content {
  .activity-title {
    font-weight: 500;
    color: var(--edu-text-primary);
    margin-bottom: 4px;
  }

  .activity-description {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin-bottom: 8px;
  }

  .activity-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--edu-text-placeholder);

    .activity-course {
      color: var(--color-primary-500);
    }
  }
}

.quick-actions {
  .el-button {
    justify-content: flex-start;
    gap: 8px;
  }
}

.subject-chart {
  .subject-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .subject-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .subject-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .subject-name {
    font-size: 14px;
    color: var(--edu-text-primary);
  }

  .subject-stats {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    max-width: 100px;
  }

  .subject-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
    min-width: 24px;
    text-align: right;
  }

  .subject-bar {
    flex: 1;
    height: 6px;
    background: var(--color-gray-200);
    border-radius: 3px;
    overflow: hidden;

    .subject-progress {
      height: 100%;
      background: var(--color-primary-500);
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }
}

.notifications {
  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--edu-border-color-light);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .notification-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    &.notification-info .notification-icon {
      background: var(--color-info-light);
      color: var(--color-info-default);
    }

    &.notification-warning .notification-icon {
      background: var(--color-warning-light);
      color: var(--color-warning-default);
    }

    &.notification-success .notification-icon {
      background: var(--color-success-light);
      color: var(--color-success-default);
    }

    .notification-content {
      flex: 1;
      min-width: 0;

      .notification-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--edu-text-primary);
        margin-bottom: 2px;
      }

      .notification-time {
        font-size: 12px;
        color: var(--edu-text-placeholder);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .main-content {
    margin-top: 16px;
  }

  .el-col {
    margin-bottom: 16px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .stat-card,
  .content-card {
    background: var(--color-gray-800);
    border-color: var(--edu-border-color);
  }

  .stat-value,
  .card-title,
  .activity-title,
  .subject-name,
  .subject-count,
  .notification-title {
    color: var(--edu-text-primary);
  }

  .subject-bar {
    background: var(--color-gray-700);
  }

  .notification-item {
    border-color: var(--color-gray-700);
  }
}
</style>