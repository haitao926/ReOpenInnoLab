<template>
  <div class="notification-system">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-item', `notification-${notification.type}`]"
        role="alert"
        :aria-live="notification.type === 'error' ? 'assertive' : 'polite'"
      >
        <el-icon class="notification-icon">
          <component :is="getNotificationIcon(notification.type)" />
        </el-icon>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div v-if="notification.actions" class="notification-actions">
            <el-button
              v-for="action in notification.actions"
              :key="action.text"
              :type="action.type || 'primary'"
              size="small"
              link
              @click="handleAction(notification, action)"
            >
              {{ action.text }}
            </el-button>
          </div>
        </div>
        <el-button
          v-if="notification.closable !== false"
          circle
          size="small"
          link
          @click="removeNotification(notification.id)"
          class="close-button"
          :aria-label="`关闭 ${notification.title}`"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </transition-group>

    <!-- 全局加载指示器 -->
    <div v-if="showGlobalLoading" class="global-loading" role="progressbar" aria-label="正在加载">
      <div class="loading-spinner">
        <el-icon class="spinner-icon"><Loading /></el-icon>
        <span class="loading-text">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Close, Loading, CircleCheck, CircleCloseFilled, Warning, InfoFilled
} from '@element-plus/icons-vue'

interface NotificationAction {
  text: string
  type?: 'primary' | 'success' | 'warning' | 'danger'
  handler: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  closable?: boolean
  actions?: NotificationAction[]
  timestamp?: Date
}

interface Props {
  loadingText?: string
  showGlobalLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: '正在处理...',
  showGlobalLoading: false
})

const emit = defineEmits<{
  notificationClose: [id: string]
  actionTriggered: [notification: Notification, action: NotificationAction]
}>()

const notifications = ref<Notification[]>([])

// 添加通知
const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  const id = Date.now().toString()
  const newNotification: Notification = {
    id,
    ...notification,
    timestamp: new Date()
  }

  notifications.value.push(newNotification)

  // 自动移除通知
  if (notification.duration && notification.duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, notification.duration)
  }

  return id
}

// 移除通知
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    const notification = notifications.value[index]
    notifications.value.splice(index, 1)
    emit('notificationClose', id)
  }
}

// 清除所有通知
const clearAllNotifications = () => {
  notifications.value = []
}

// 清除特定类型的通知
const clearNotificationsByType = (type: Notification['type']) => {
  notifications.value = notifications.value.filter(n => n.type !== type)
}

// 处理通知操作
const handleAction = (notification: Notification, action: NotificationAction) => {
  emit('actionTriggered', notification, action)
  action.handler()
}

// 获取通知图标
const getNotificationIcon = (type: Notification['type']) => {
  const icons = {
    success: CircleCheck,
    error: CircleCloseFilled,
    warning: Warning,
    info: InfoFilled
  }
  return icons[type] || InfoFilled
}

// 便捷方法
const showSuccess = (title: string, message: string, duration = 3000) => {
  return addNotification({ type: 'success', title, message, duration })
}

const showError = (title: string, message: string, duration = 5000, actions?: NotificationAction[]) => {
  return addNotification({ type: 'error', title, message, duration, actions })
}

const showWarning = (title: string, message: string, duration = 4000) => {
  return addNotification({ type: 'warning', title, message, duration })
}

const showInfo = (title: string, message: string, duration = 4000) => {
  return addNotification({ type: 'info', title, message, duration })
}

// 显示带操作的错误通知
const showLoginError = (message: string, onRetry?: () => void, onContact?: () => void) => {
  const actions: NotificationAction[] = []
  if (onRetry) {
    actions.push({
      text: '重试',
      type: 'primary',
      handler: onRetry
    })
  }
  if (onContact) {
    actions.push({
      text: '联系支持',
      handler: onContact
    })
  }

  return showError('登录失败', message, 0, actions)
}

// 暴露方法给父组件
defineExpose({
  addNotification,
  removeNotification,
  clearAllNotifications,
  clearNotificationsByType,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoginError
})
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.notification-system {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  max-width: 400px;
  pointer-events: none;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  transition: all 0.3s ease;
  pointer-events: auto;

  &:focus-within {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  &.notification-success {
    border-left-color: #38a169;
    background: linear-gradient(135deg, rgba(72, 187, 120, 0.1), rgba(255, 255, 255, 0.95));

    .notification-icon {
      color: #38a169;
    }
  }

  &.notification-error {
    border-left-color: #e53e3e;
    background: linear-gradient(135deg, rgba(252, 129, 129, 0.1), rgba(255, 255, 255, 0.95));

    .notification-icon {
      color: #e53e3e;
    }
  }

  &.notification-warning {
    border-left-color: #ed8936;
    background: linear-gradient(135deg, rgba(237, 137, 54, 0.1), rgba(255, 255, 255, 0.95));

    .notification-icon {
      color: #ed8936;
    }
  }

  &.notification-info {
    border-left-color: #3182ce;
    background: linear-gradient(135deg, rgba(49, 130, 206, 0.1), rgba(255, 255, 255, 0.95));

    .notification-icon {
      color: #3182ce;
    }
  }
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1e293b;
  font-size: 0.95rem;
}

.notification-message {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.close-button {
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

// 全局加载指示器
.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  pointer-events: auto;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.spinner-icon {
  font-size: 32px;
  color: #667eea;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

// 通知动画
.notification-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 响应式设计
@media (max-width: 768px) {
  .notification-system {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }

  .notification-item {
    padding: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .notification-icon {
    font-size: 18px;
  }

  .notification-title {
    font-size: 0.9rem;
  }

  .notification-message {
    font-size: 0.85rem;
  }

  .notification-actions {
    flex-direction: column;
    gap: 0.25rem;
  }

  .loading-spinner {
    padding: 1.5rem;
  }

  .spinner-icon {
    font-size: 24px;
  }

  .loading-text {
    font-size: 0.9rem;
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  .notification-item {
    background: #ffffff;
    border: 2px solid;

    &.notification-success {
      border-color: #065f46;
      background: #ecfdf5;
    }

    &.notification-error {
      border-color: #991b1b;
      background: #fef2f2;
    }

    &.notification-warning {
      border-color: #92400e;
      background: #fffbeb;
    }

    &.notification-info {
      border-color: #1e40af;
      background: #eff6ff;
    }
  }
}

// 减少动画偏好支持
@media (prefers-reduced-motion: reduce) {
  .notification-enter-active,
  .notification-leave-active,
  .notification-move {
    transition: none;
  }

  .spinner-icon {
    animation: none;
  }

  .notification-item {
    transition: none;
  }
}
</style>