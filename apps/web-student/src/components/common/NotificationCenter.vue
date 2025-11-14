<template>
  <div class="notification-center">
    <div class="notification-header">
      <h4>通知中心</h4>
      <el-badge
        :value="unreadCount"
        :hidden="unreadCount === 0"
        class="notification-badge"
      >
        <el-button
          text
          size="small"
          @click="markAllAsRead"
        >
          全部已读
        </el-button>
      </el-badge>
    </div>

    <div class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-item', { 'is-unread': !notification.read }]"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          <el-icon :style="{ color: getNotificationColor(notification.type) }">
            <component :is="getNotificationIcon(notification.type)" />
          </el-icon>
        </div>

        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-time">{{ formatRelativeTime(notification.createdAt) }}</div>
        </div>

        <div class="notification-actions">
          <el-button
            v-if="notification.action"
            type="text"
            size="small"
            @click.stop="handleNotificationAction(notification)"
          >
            {{ notification.action.text }}
          </el-button>
          <el-button
            text
            size="small"
            @click.stop="removeNotification(notification.id)"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="notifications.length === 0" class="notification-empty">
        <el-empty description="暂无通知" />
      </div>
    </div>

    <div v-if="hasMore" class="notification-footer">
      <el-button
        text
        size="small"
        @click="loadMore"
        :loading="loading"
      >
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Bell,
  Warning,
  InfoFilled,
  SuccessFilled,
  Close
} from '@element-plus/icons-vue'

interface NotificationAction {
  text: string
  handler: () => void
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: Date
  action?: NotificationAction
}

// 响应式数据
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'info',
    title: '课程提醒',
    message: 'AI创意编程课程将在10分钟后开始',
    read: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    action: {
      text: '查看',
      handler: () => ElMessage.success('跳转到课程页面')
    }
  },
  {
    id: '2',
    type: 'success',
    title: '作业完成',
    message: 'Python基础练习已提交',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '3',
    type: 'warning',
    title: '实验环境',
    message: 'Virtual Lab Agent连接异常',
    read: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    action: {
      text: '重试',
      handler: () => ElMessage.info('正在重新连接...')
    }
  },
  {
    id: '4',
    type: 'info',
    title: '新作业',
    message: '老师布置了新的编程作业',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
])

const loading = ref(false)
const hasMore = ref(false)

// 计算属性
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 方法
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return SuccessFilled
    case 'warning':
      return Warning
    case 'error':
      return Warning
    case 'info':
    default:
      return InfoFilled
  }
}

const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'success':
      return 'var(--edu-success-500)'
    case 'warning':
      return 'var(--edu-warning-500)'
    case 'error':
      return 'var(--edu-danger-500)'
    case 'info':
    default:
      return 'var(--edu-info-500)'
  }
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const handleNotificationClick = (notification: Notification) => {
  if (!notification.read) {
    notification.read = true
  }
}

const handleNotificationAction = (notification: Notification) => {
  if (notification.action) {
    notification.action.handler()
  }
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
    ElMessage.success('通知已删除')
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => {
    n.read = true
  })
  ElMessage.success('所有通知已标记为已读')
}

const loadMore = async () => {
  loading.value = true
  try {
    // 模拟加载更多通知
    await new Promise(resolve => setTimeout(resolve, 1000))
    hasMore.value = false
    ElMessage.success('没有更多通知了')
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  // 模拟定期检查新通知
  setInterval(() => {
    const rand = Math.random()
    if (rand > 0.9) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'info',
        title: '新通知',
        message: '这是一条新的系统通知',
        read: false,
        createdAt: new Date()
      }
      notifications.value.unshift(newNotification)
    }
  }, 30000) // 每30秒检查一次
})
</script>

<style scoped lang="scss">
.notification-center {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  overflow: hidden;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.notification-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0;
}

.notification-badge {
  flex-shrink: 0;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);
  margin-bottom: 4px;

  &:hover {
    background: rgba(15, 23, 42, 0.04);
  }

  &.is-unread {
    background: rgba(99, 102, 241, 0.08);
    font-weight: 500;

    &:hover {
      background: rgba(99, 102, 241, 0.12);
    }
  }
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.04);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 16px;
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 11px;
  color: var(--edu-text-tertiary);
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notification-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  color: var(--edu-text-secondary);
}

.notification-footer {
  padding: 12px;
  text-align: center;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

// 滚动条样式
.notification-list::-webkit-scrollbar {
  width: 4px;
}

.notification-list::-webkit-scrollbar-track {
  background: transparent;
}

.notification-list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.2);
  border-radius: 2px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.3);
}

// 响应式设计
@media (max-width: 768px) {
  .notification-center {
    max-height: 300px;
  }

  .notification-header {
    padding: 12px 16px;
  }

  .notification-item {
    padding: 10px;
    gap: 10px;
  }

  .notification-icon {
    width: 28px;
    height: 28px;

    .el-icon {
      font-size: 14px;
    }
  }

  .notification-title {
    font-size: 13px;
  }

  .notification-message {
    font-size: 11px;
  }

  .notification-actions {
    flex-direction: column;
    gap: 2px;
  }
}
</style>