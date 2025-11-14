<template>
  <div class="activity-feed">
    <div class="feed-header">
      <h3>
        <el-icon><Bell /></el-icon>
        实时动态
      </h3>
      <div class="header-actions">
        <el-button size="small" circle @click="refreshFeed">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-button size="small" circle @click="clearFeed">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="feed-filters">
      <el-select
        v-model="selectedFilter"
        size="small"
        placeholder="筛选类型"
        style="width: 120px"
        @change="filterActivities"
      >
        <el-option label="全部" value="all" />
        <el-option label="学生" value="student" />
        <el-option label="系统" value="system" />
        <el-option label="互动" value="interaction" />
        <el-option label="作业" value="assignment" />
      </el-select>

      <el-switch
        v-model="autoRefresh"
        size="small"
        active-text="自动刷新"
        @change="toggleAutoRefresh"
      />
    </div>

    <div class="feed-content" ref="feedContainer">
      <div
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="activity-item"
        :class="activity.type"
      >
        <div class="activity-icon">
          <el-icon>
            <component :is="getActivityIcon(activity.type)" />
          </el-icon>
        </div>

        <div class="activity-body">
          <div class="activity-header">
            <span class="activity-title">{{ activity.title }}</span>
            <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
          </div>
          <div class="activity-description">
            {{ activity.description }}
          </div>

          <!-- 学生活动详情 -->
          <div v-if="activity.studentInfo" class="student-info">
            <el-avatar :size="24" :src="activity.studentInfo.avatar" />
            <span class="student-name">{{ activity.studentInfo.name }}</span>
            <el-tag
              v-if="activity.studentInfo.status"
              :type="getStudentStatusType(activity.studentInfo.status)"
              size="small"
            >
              {{ getStudentStatusLabel(activity.studentInfo.status) }}
            </el-tag>
          </div>

          <!-- 作业活动详情 -->
          <div v-if="activity.assignmentInfo" class="assignment-info">
            <div class="assignment-stats">
              <span>提交: {{ activity.assignmentInfo.submitted }}</span>
              <span>得分: {{ activity.assignmentInfo.score }}分</span>
            </div>
            <div v-if="activity.assignmentInfo.feedback" class="assignment-feedback">
              {{ activity.assignmentInfo.feedback }}
            </div>
          </div>

          <!-- 互动活动详情 -->
          <div v-if="activity.interactionInfo" class="interaction-info">
            <div class="interaction-type">
              {{ getInteractionTypeLabel(activity.interactionInfo.type) }}
            </div>
            <div v-if="activity.interactionInfo.content" class="interaction-content">
              {{ activity.interactionInfo.content }}
            </div>
          </div>
        </div>

        <div class="activity-actions">
          <el-button
            v-if="activity.canRespond"
            size="small"
            text
            @click="respondToActivity(activity)"
          >
            回应
          </el-button>
          <el-button
            v-if="activity.canView"
            size="small"
            text
            @click="viewDetails(activity)"
          >
            查看
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredActivities.length === 0" class="empty-state">
        <el-icon size="48"><Bell /></el-icon>
        <p>暂无动态</p>
      </div>
    </div>

    <div class="feed-footer">
      <el-button
        v-if="hasMore"
        text
        size="small"
        @click="loadMoreActivities"
        :loading="isLoadingMore"
      >
        加载更多
      </el-button>
    </div>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="活动详情"
      width="500px"
    >
      <div v-if="selectedActivity" class="activity-details">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-item">
            <label>类型:</label>
            <span>{{ getActivityTypeLabel(selectedActivity.type) }}</span>
          </div>
          <div class="detail-item">
            <label>时间:</label>
            <span>{{ formatFullTime(selectedActivity.timestamp) }}</span>
          </div>
          <div class="detail-item">
            <label>描述:</label>
            <span>{{ selectedActivity.description }}</span>
          </div>
        </div>

        <div v-if="selectedActivity.studentInfo" class="detail-section">
          <h4>学生信息</h4>
          <div class="student-detail">
            <el-avatar :size="40" :src="selectedActivity.studentInfo.avatar" />
            <div class="student-detail-info">
              <div class="name">{{ selectedActivity.studentInfo.name }}</div>
              <div class="status">
                <el-tag
                  :type="getStudentStatusType(selectedActivity.studentInfo.status)"
                  size="small"
                >
                  {{ getStudentStatusLabel(selectedActivity.studentInfo.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedActivity.metadata" class="detail-section">
          <h4>详细信息</h4>
          <pre class="metadata-content">{{ JSON.stringify(selectedActivity.metadata, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Bell,
  Refresh,
  Delete,
  User,
  ChatDotRound,
  DocumentChecked,
  Warning,
  Star,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: Date
  studentInfo?: {
    id: string
    name: string
    avatar: string
    status: string
  }
  assignmentInfo?: {
    submitted: boolean
    score: number
    feedback?: string
  }
  interactionInfo?: {
    type: string
    content: string
  }
  canRespond?: boolean
  canView?: boolean
  metadata?: any
}

const emit = defineEmits<{
  activityRespond: [activity: ActivityItem]
  activityView: [activity: ActivityItem]
}>()

// 响应式数据
const activities = ref<ActivityItem[]>([])
const selectedFilter = ref('all')
const autoRefresh = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const showDetailsDialog = ref(false)
const selectedActivity = ref<ActivityItem | null>(null)
const feedContainer = ref<HTMLElement>()
let refreshInterval: NodeJS.Timeout | null = null

// 计算属性
const filteredActivities = computed(() => {
  if (selectedFilter.value === 'all') {
    return activities.value
  }
  return activities.value.filter(activity => activity.type === selectedFilter.value)
})

// 活动图标映射
const getActivityIcon = (type: string) => {
  const iconMap = {
    'student': User,
    'system': Warning,
    'interaction': ChatDotRound,
    'assignment': DocumentChecked,
    'achievement': Star,
    'completed': CircleCheck
  }
  return iconMap[type] || Bell
}

// 活动类型标签
const getActivityTypeLabel = (type: string): string => {
  const typeMap = {
    'student': '学生活动',
    'system': '系统消息',
    'interaction': '互动交流',
    'assignment': '作业提交',
    'achievement': '学习成就',
    'completed': '任务完成'
  }
  return typeMap[type] || '其他'
}

// 学生状态类型
const getStudentStatusType = (status: string): string => {
  const statusMap = {
    'active': 'success',
    'idle': 'warning',
    'offline': 'info',
    'struggling': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStudentStatusLabel = (status: string): string => {
  const labelMap = {
    'active': '活跃',
    'idle': '空闲',
    'offline': '离线',
    'struggling': '需要帮助'
  }
  return labelMap[status] || '未知'
}

// 互动类型标签
const getInteractionTypeLabel = (type: string): string => {
  const typeMap = {
    'question': '提问',
    'answer': '回答',
    'discussion': '讨论',
    'feedback': '反馈'
  }
  return typeMap[type] || '互动'
}

// 时间格式化
const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return timestamp.toLocaleDateString('zh-CN')
}

const formatFullTime = (timestamp: Date): string => {
  return timestamp.toLocaleString('zh-CN')
}

// 方法
const addActivity = (activity: Partial<ActivityItem>) => {
  const fullActivity: ActivityItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    canRespond: false,
    canView: true,
    ...activity
  } as ActivityItem

  activities.value.unshift(fullActivity)

  // 限制活动数量，保留最新100条
  if (activities.value.length > 100) {
    activities.value = activities.value.slice(0, 100)
  }

  // 滚动到顶部显示新活动
  nextTick(() => {
    if (feedContainer.value) {
      feedContainer.value.scrollTop = 0
    }
  })
}

const filterActivities = () => {
  // 筛选逻辑已在计算属性中处理
}

const refreshFeed = async () => {
  try {
    // 模拟刷新最新活动
    ElMessage.success('动态已刷新')
  } catch (error) {
    console.error('刷新动态失败:', error)
    ElMessage.error('刷新失败')
  }
}

const clearFeed = () => {
  activities.value = []
  ElMessage.success('动态已清空')
}

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    refreshFeed()
  }, 30000) // 每30秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const loadMoreActivities = async () => {
  try {
    isLoadingMore.value = true

    // 模拟加载更多历史活动
    setTimeout(() => {
      // 这里应该调用API获取更多数据
      isLoadingMore.value = false
      hasMore.value = false // 模拟没有更多数据
    }, 1000)
  } catch (error) {
    console.error('加载更多失败:', error)
    isLoadingMore.value = false
  }
}

const respondToActivity = (activity: ActivityItem) => {
  emit('activityRespond', activity)
}

const viewDetails = (activity: ActivityItem) => {
  selectedActivity.value = activity
  showDetailsDialog.value = true
  emit('activityView', activity)
}

// 模拟活动数据
const generateMockActivities = () => {
  const mockActivities = [
    {
      type: 'student',
      title: '张三加入了课堂',
      description: '学生张三成功加入了当前课堂',
      studentInfo: {
        id: '1',
        name: '张三',
        avatar: 'https://example.com/avatar1.jpg',
        status: 'active'
      }
    },
    {
      type: 'assignment',
      title: '李四提交了作业',
      description: '学生李四完成了并提交了课堂作业',
      studentInfo: {
        id: '2',
        name: '李四',
        avatar: 'https://example.com/avatar2.jpg',
        status: 'active'
      },
      assignmentInfo: {
        submitted: true,
        score: 85,
        feedback: '回答准确，理解良好'
      }
    },
    {
      type: 'interaction',
      title: '王五提出了问题',
      description: '学生在实验环节遇到了困难',
      studentInfo: {
        id: '3',
        name: '王五',
        avatar: 'https://example.com/avatar3.jpg',
        status: 'struggling'
      },
      interactionInfo: {
        type: 'question',
        content: '老师，第二步的代码运行出错，请问是什么原因？'
      },
      canRespond: true
    },
    {
      type: 'system',
      title: '系统提醒',
      description: '实验环节即将结束，请督促学生提交结果'
    },
    {
      type: 'achievement',
      title: '赵六完成实验',
      description: '学生赵六第一个完成了实验任务',
      studentInfo: {
        id: '4',
        name: '赵六',
        avatar: 'https://example.com/avatar4.jpg',
        status: 'active'
      }
    }
  ]

  mockActivities.forEach((activity, index) => {
    setTimeout(() => {
      addActivity(activity)
    }, index * 1000)
  })
}

// 生命周期
onMounted(() => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }

  // 生成初始模拟数据
  generateMockActivities()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 暴露方法供父组件调用
defineExpose({
  addActivity,
  refreshFeed,
  clearFeed
})
</script>

<style scoped lang="scss">
.activity-feed {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.feed-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.feed-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    background: #f8f9fa;
    border-color: #e4e7ed;
  }

  &.student {
    border-left: 3px solid #409eff;
  }

  &.system {
    border-left: 3px solid #e6a23c;
  }

  &.interaction {
    border-left: 3px solid #67c23a;
  }

  &.assignment {
    border-left: 3px solid #909399;
  }

  &.achievement {
    border-left: 3px solid #f56c6c;
  }
}

.activity-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;

  .student & {
    background: #409eff;
  }

  .system & {
    background: #e6a23c;
  }

  .interaction & {
    background: #67c23a;
  }

  .assignment & {
    background: #909399;
  }

  .achievement & {
    background: #f56c6c;
  }
}

.activity-body {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .activity-title {
    font-weight: 500;
    color: #303133;
    font-size: 14px;
  }

  .activity-time {
    font-size: 12px;
    color: #909399;
  }
}

.activity-description {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;

  .student-name {
    font-size: 13px;
    color: #303133;
  }
}

.assignment-info {
  margin-top: 8px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;

  .assignment-stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #606266;
    margin-bottom: 4px;
  }

  .assignment-feedback {
    font-size: 12px;
    color: #67c23a;
    font-style: italic;
  }
}

.interaction-info {
  margin-top: 8px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;

  .interaction-type {
    font-size: 12px;
    color: #409eff;
    margin-bottom: 4px;
  }

  .interaction-content {
    font-size: 13px;
    color: #303133;
    line-height: 1.4;
  }
}

.activity-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;

  .el-icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.feed-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.activity-details {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
      border-bottom: 1px solid #ebeef5;
      padding-bottom: 8px;
    }
  }

  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    label {
      font-weight: 500;
      color: #606266;
      min-width: 80px;
      margin-right: 12px;
    }

    span {
      color: #303133;
    }
  }

  .student-detail {
    display: flex;
    align-items: center;
    gap: 12px;

    .student-detail-info {
      .name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }
    }
  }

  .metadata-content {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    color: #606266;
    line-height: 1.4;
    max-height: 200px;
    overflow-y: auto;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .feed-header {
    padding: 12px;
  }

  .feed-filters {
    padding: 8px 12px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .activity-item {
    padding: 8px;
    gap: 8px;
  }

  .activity-body {
    .activity-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }

  .activity-actions {
    flex-direction: row;
  }
}
</style>