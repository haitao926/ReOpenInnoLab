<template>
  <div class="student-status-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3 class="panel-title">
        <el-icon><User /></el-icon>
        学生状态
      </h3>
      <div class="panel-stats">
        <div class="stat-item">
          <span class="stat-value">{{ totalStudents }}</span>
          <span class="stat-label">总人数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ activeStudents }}</span>
          <span class="stat-label">在线</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ engagedStudents }}</span>
          <span class="stat-label">参与</span>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="panel-filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索学生姓名"
        size="small"
        clearable
        prefix-icon="Search"
      />
      <el-select
        v-model="statusFilter"
        placeholder="状态筛选"
        size="small"
        clearable
      >
        <el-option label="全部" value="" />
        <el-option label="在线" value="online" />
        <el-option label="离线" value="offline" />
        <el-option label="活跃" value="active" />
        <el-option label="需要关注" value="attention" />
      </el-select>
      <el-button size="small" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 学生列表 -->
    <div class="students-list" ref="studentsList">
      <div
        v-for="student in filteredStudents"
        :key="student.id"
        class="student-item"
        :class="getStudentClass(student)"
        @click="selectStudent(student)"
      >
        <!-- 学生基本信息 -->
        <div class="student-info">
          <el-avatar :size="32" :src="student.avatar">
            {{ student.name.charAt(0) }}
          </el-avatar>
          <div class="student-details">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-id">{{ student.studentId }}</div>
          </div>
        </div>

        <!-- 状态指示器 -->
        <div class="student-status">
          <div class="status-indicators">
            <div
              class="status-dot"
              :class="{
                'status-online': student.status === 'online',
                'status-offline': student.status === 'offline',
                'status-active': student.status === 'active'
              }"
              :title="getStatusText(student.status)"
            />
            <div
              v-if="student.needsAttention"
              class="attention-indicator"
              title="需要关注"
            >
              <el-icon><Warning /></el-icon>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-info">
            <el-progress
              :percentage="student.progress"
              :stroke-width="4"
              :show-text="false"
              :color="getProgressColor(student.progress)"
            />
            <span class="progress-text">{{ student.progress }}%</span>
          </div>
        </div>

        <!-- 互动统计 -->
        <div class="interaction-stats">
          <div class="stat">
            <el-icon><Pointer /></el-icon>
            <span>{{ student.interactions }}</span>
          </div>
          <div class="stat">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDuration(student.timeSpent) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="student-actions">
          <el-dropdown @command="handleStudentAction">
            <el-button size="small" text>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'message', student }">
                  发送消息
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'attention', student }">
                  关注提醒
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'details', student }">
                  查看详情
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'assist', student }" divided>
                  远程协助
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 面板底部 -->
    <div class="panel-footer">
      <div class="engagement-summary">
        <span class="summary-label">整体参与度:</span>
        <el-progress
          :percentage="averageEngagement"
          :stroke-width="6"
          :show-text="false"
          :color="getEngagementColor(averageEngagement)"
        />
        <span class="summary-value">{{ averageEngagement }}%</span>
      </div>

      <div class="quick-actions">
        <el-button size="small" @click="sendToAll">
          <el-icon><Bell /></el-icon>
          全体通知
        </el-button>
        <el-button size="small" @click="startPoll">
          <el-icon><PieChart /></el-icon>
          快速投票
        </el-button>
      </div>
    </div>

    <!-- 学生详情对话框 -->
    <el-dialog
      v-model="showStudentDetails"
      :title="`学生详情 - ${selectedStudent?.name}`"
      width="600px"
    >
      <div v-if="selectedStudent" class="student-details">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ selectedStudent.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(selectedStudent.status)">
                {{ getStatusText(selectedStudent.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="加入时间">
              {{ formatTime(selectedStudent.joinTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 学习进度 -->
        <div class="detail-section">
          <h4>学习进度</h4>
          <div class="progress-breakdown">
            <div class="progress-item">
              <span class="progress-label">整体进度</span>
              <el-progress :percentage="selectedStudent.progress" />
            </div>
            <div class="progress-item">
              <span class="progress-label">互动次数</span>
              <span class="progress-value">{{ selectedStudent.interactions }}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">学习时长</span>
              <span class="progress-value">{{ formatDuration(selectedStudent.timeSpent) }}</span>
            </div>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="detail-section">
          <h4>最近活动</h4>
          <div class="activity-timeline">
            <div
              v-for="(activity, index) in selectedStudent.recentActivities"
              :key="index"
              class="activity-item"
            >
              <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              <div class="activity-content">{{ activity.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="showMessageDialog"
      title="发送消息给学生"
      width="500px"
    >
      <el-input
        v-model="messageContent"
        type="textarea"
        :rows="4"
        placeholder="输入消息内容..."
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showMessageDialog = false">取消</el-button>
        <el-button type="primary" @click="sendMessage" :disabled="!messageContent.trim()">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Search,
  Refresh,
  Warning,
  Pointer,
  Clock,
  MoreFilled,
  Bell,
  PieChart
} from '@element-plus/icons-vue'

interface Student {
  id: string
  name: string
  studentId: string
  avatar?: string
  status: 'online' | 'offline' | 'active' | 'away'
  progress: number
  interactions: number
  timeSpent: number
  currentSection: number
  needsAttention: boolean
  joinTime: number
  lastActivity: number
  recentActivities?: Array<{
    timestamp: number
    description: string
    type: string
  }>
}

interface Props {
  lessonId: string
  currentSection: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  studentAction: [action: string, student: Student, data?: any]
  message: [studentId: string, content: string]
  attention: [studentId: string]
  assist: [studentId: string]
}>()

// 响应式数据
const studentsList = ref<HTMLElement>()
const searchQuery = ref('')
const statusFilter = ref('')
const showStudentDetails = ref(false)
const selectedStudent = ref<Student | null>(null)
const showMessageDialog = ref(false)
const messageContent = ref('')
const messageTarget = ref<string>('')

// 模拟学生数据
const students = ref<Student[]>([
  {
    id: '1',
    name: '张三',
    studentId: '2023001',
    avatar: '',
    status: 'online',
    progress: 75,
    interactions: 12,
    timeSpent: 1800,
    currentSection: 2,
    needsAttention: false,
    joinTime: Date.now() - 3600000,
    lastActivity: Date.now() - 120000,
    recentActivities: [
      { timestamp: Date.now() - 120000, description: '完成了体验练习', type: 'exercise' },
      { timestamp: Date.now() - 300000, description: '回答了问题', type: 'question' }
    ]
  },
  {
    id: '2',
    name: '李四',
    studentId: '2023002',
    avatar: '',
    status: 'active',
    progress: 60,
    interactions: 8,
    timeSpent: 1500,
    currentSection: 2,
    needsAttention: true,
    joinTime: Date.now() - 3700000,
    lastActivity: Date.now() - 60000,
    recentActivities: [
      { timestamp: Date.now() - 60000, description: '正在处理实验', type: 'experiment' }
    ]
  },
  {
    id: '3',
    name: '王五',
    studentId: '2023003',
    avatar: '',
    status: 'offline',
    progress: 45,
    interactions: 5,
    timeSpent: 900,
    currentSection: 1,
    needsAttention: false,
    joinTime: Date.now() - 3900000,
    lastActivity: Date.now() - 600000,
    recentActivities: [
      { timestamp: Date.now() - 600000, description: '观看视频内容', type: 'video' }
    ]
  },
  {
    id: '4',
    name: '赵六',
    studentId: '2023004',
    avatar: '',
    status: 'online',
    progress: 90,
    interactions: 15,
    timeSpent: 2100,
    currentSection: 3,
    needsAttention: false,
    joinTime: Date.now() - 3500000,
    lastActivity: Date.now() - 30000,
    recentActivities: [
      { timestamp: Date.now() - 30000, description: '提交了作业', type: 'assignment' }
    ]
  }
])

// 计算属性
const filteredStudents = computed(() => {
  let filtered = students.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.studentId.includes(query)
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(student => student.status === statusFilter.value)
  }

  return filtered.sort((a, b) => {
    // 优先显示需要关注的学生
    if (a.needsAttention !== b.needsAttention) {
      return a.needsAttention ? -1 : 1
    }
    // 然后按活跃度排序
    return b.lastActivity - a.lastActivity
  })
})

const totalStudents = computed(() => students.value.length)
const activeStudents = computed(() => students.value.filter(s => s.status === 'online' || s.status === 'active').length)
const engagedStudents = computed(() => students.value.filter(s => s.interactions > 0).length)
const averageEngagement = computed(() => {
  if (students.value.length === 0) return 0
  const totalProgress = students.value.reduce((sum, student) => sum + student.progress, 0)
  return Math.round(totalProgress / students.value.length)
})

// 方法
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getStudentClass = (student: Student): string => {
  const classes = []

  if (student.needsAttention) classes.push('needs-attention')
  if (student.status === 'active') classes.push('is-active')
  if (student.status === 'offline') classes.push('is-offline')
  if (student.progress === 100) classes.push('is-completed')

  return classes.join(' ')
}

const getStatusText = (status: string): string => {
  const statusMap = {
    online: '在线',
    offline: '离线',
    active: '活跃',
    away: '离开'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusTagType = (status: string): string => {
  const typeMap = {
    online: 'success',
    offline: 'info',
    active: 'warning',
    away: 'info'
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  if (progress >= 40) return '#f56c6c'
  return '#909399'
}

const getEngagementColor = (engagement: number): string => {
  if (engagement >= 80) return '#67c23a'
  if (engagement >= 60) return '#409eff'
  if (engagement >= 40) return '#e6a23c'
  return '#f56c6c'
}

const selectStudent = (student: Student) => {
  selectedStudent.value = student
  showStudentDetails.value = true
}

const handleStudentAction = ({ action, student }: { action: string, student: Student }) => {
  switch (action) {
    case 'message':
      messageTarget.value = student.id
      showStudentDetails.value = false
      showMessageDialog.value = true
      break
    case 'attention':
      sendAttentionToStudent(student)
      break
    case 'details':
      selectStudent(student)
      break
    case 'assist':
      sendAssistanceToStudent(student)
      break
  }
}

const sendMessage = () => {
  if (!messageContent.value.trim() || !messageTarget.value) return

  emit('message', messageTarget.value, messageContent.value.trim())
  ElMessage.success('消息已发送')

  messageContent.value = ''
  showMessageDialog.value = false
  messageTarget.value = ''
}

const sendAttentionToStudent = (student: Student) => {
  emit('attention', student.id)
  ElMessage.success(`已向 ${student.name} 发送关注提醒`)
}

const sendAssistanceToStudent = (student: Student) => {
  emit('assist', student.id)
  ElMessage.success(`已向 ${student.name} 发送协助请求`)
}

const refreshData = () => {
  // 模拟数据刷新
  ElMessage.success('数据已刷新')
}

const sendToAll = () => {
  ElMessage.info('全体通知功能开发中...')
}

const startPoll = () => {
  ElMessage.info('快速投票功能开发中...')
}

// 模拟实时数据更新
let updateInterval: NodeJS.Timeout | null = null

const startRealTimeUpdates = () => {
  updateInterval = setInterval(() => {
    // 随机更新一些学生状态
    const randomStudent = students.value[Math.floor(Math.random() * students.value.length)]

    // 更新最后活动时间
    randomStudent.lastActivity = Date.now()

    // 随机更新进度
    if (Math.random() > 0.7) {
      randomStudent.progress = Math.min(100, randomStudent.progress + Math.floor(Math.random() * 5))
    }

    // 随机更新互动次数
    if (Math.random() > 0.8) {
      randomStudent.interactions++
    }

    // 随机更新学习时长
    randomStudent.timeSpent += Math.floor(Math.random() * 30)
  }, 5000) // 每5秒更新一次
}

const stopRealTimeUpdates = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

// 生命周期
onMounted(() => {
  startRealTimeUpdates()
})

onUnmounted(() => {
  stopRealTimeUpdates()
})
</script>

<style lang="scss" scoped>
.student-status-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.panel-stats {
  display: flex;
  gap: 20px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #409eff;
    }

    .stat-label {
      font-size: 12px;
      color: #909399;
    }
  }
}

.panel-filters {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  .el-input {
    width: 200px;
  }

  .el-select {
    width: 120px;
  }
}

.students-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &.needs-attention {
    background: #fef0f0;
    border-left: 3px solid #f56c6c;
  }

  &.is-active {
    background: #f0f9ff;
    border-left: 3px solid #409eff;
  }

  &.is-offline {
    opacity: 0.6;
  }

  &.is-completed {
    background: #f0f9ff;
    border-left: 3px solid #67c23a;
  }
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.student-details {
  .student-name {
    font-weight: 500;
    color: #303133;
    font-size: 14px;
  }

  .student-id {
    font-size: 12px;
    color: #909399;
  }
}

.student-status {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.status-online {
      background: #67c23a;
    }

    &.status-offline {
      background: #909399;
    }

    &.status-active {
      background: #409eff;
      animation: pulse 2s infinite;
    }
  }

  .attention-indicator {
    color: #f56c6c;
    font-size: 16px;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-progress {
    flex: 1;
    min-width: 60px;
  }

  .progress-text {
    font-size: 12px;
    color: #606266;
    min-width: 30px;
    text-align: right;
  }
}

.interaction-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 80px;

  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #606266;

    .el-icon {
      font-size: 14px;
    }
  }
}

.student-actions {
  min-width: 40px;
  text-align: right;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
}

.engagement-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;

  .summary-label {
    font-size: 14px;
    color: #606266;
    min-width: 80px;
  }

  .el-progress {
    flex: 1;
    max-width: 200px;
  }

  .summary-value {
    font-size: 14px;
    font-weight: bold;
    color: #409eff;
    min-width: 40px;
  }
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.student-details {
  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      border-bottom: 1px solid #e4e7ed;
      padding-bottom: 8px;
    }
  }

  .progress-breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .progress-item {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .progress-label {
        font-size: 14px;
        color: #606266;
      }

      .progress-value {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }
    }
  }

  .activity-timeline {
    .activity-item {
      display: flex;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .activity-time {
        font-size: 12px;
        color: #909399;
        min-width: 60px;
      }

      .activity-content {
        flex: 1;
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .panel-stats {
    gap: 16px;
  }

  .panel-filters {
    flex-direction: column;
    gap: 8px;

    .el-input,
    .el-select {
      width: 100%;
    }
  }

  .student-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .student-info {
    min-width: auto;
  }

  .student-status {
    width: 100%;
  }

  .panel-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .engagement-summary {
    width: 100%;
  }

  .quick-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>