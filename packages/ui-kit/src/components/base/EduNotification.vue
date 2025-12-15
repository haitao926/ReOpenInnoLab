<template>
  <teleport to="body">
    <div class="edu-notification-container">
      <transition-group name="notification" tag="div">
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
            <div v-if="notification.message" class="notification-message">
              {{ notification.message }}
            </div>
          </div>
          <div class="notification-actions">
            <el-button
              type="text"
              :icon="Close"
              size="small"
              @click="removeNotification(notification.id)"
            />
          </div>
          <div
            v-if="notification.duration && notification.duration > 0"
            class="notification-progress"
          />
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import { Close, SuccessFilled, WarningFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const notifications = computed(() => appStore.notifications)

const getNotificationIcon = (type: string) => {
  const icons = {
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
    info: InfoFilled
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

const removeNotification = (id: string) => {
  appStore.removeNotification(id)
}

// 监听通知变化，自动移除有过期时间的通知
watch(notifications, (newNotifications) => {
  newNotifications.forEach(notification => {
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }
  })
}, { deep: true })
</script>

<style scoped>
.global-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 400px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid var(--el-color-primary);
  pointer-events: all;
  position: relative;
  overflow: hidden;
}

.notification-success {
  border-left-color: var(--el-color-success);
}

.notification-warning {
  border-left-color: var(--el-color-warning);
}

.notification-error {
  border-left-color: var(--el-color-error);
}

.notification-info {
  border-left-color: var(--el-color-info);
}

.notification-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.notification-success .notification-icon {
  color: var(--el-color-success);
}

.notification-warning .notification-icon {
  color: var(--el-color-warning);
}

.notification-error .notification-icon {
  color: var(--el-color-error);
}

.notification-info .notification-icon {
  color: var(--el-color-info);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.notification-actions {
  flex-shrink: 0;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.2;
  animation: progress 5s linear;
}

.notification-success .notification-progress {
  background: var(--el-color-success);
}

.notification-warning .notification-progress {
  background: var(--el-color-warning);
}

.notification-error .notification-progress {
  background: var(--el-color-error);
}

.notification-info .notification-progress {
  background: var(--el-color-info);
}

/* 动画 */
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .global-notification-container {
    left: 20px;
    right: 20px;
    top: 10px;
  }

  .notification-item {
    min-width: auto;
    max-width: none;
  }
}

/* 深色模式适配 */
.dark .notification-item {
  background: var(--el-bg-color-overlay);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>