<template>
  <header class="app-header">
    <div class="header-left">
      <el-button
        link
        :icon="Expand"
        class="sidebar-toggle"
        @click="toggleSidebar"
      />
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="item in breadcrumbItems"
            :key="item.path"
            :to="item.path"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="header-right">
      <!-- 通知 -->
      <el-popover placement="bottom-end" :width="360" trigger="click">
        <template #reference>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-button :icon="Bell" circle />
          </el-badge>
        </template>
        <div class="notification-panel">
          <div class="notification-header">
            <span>通知</span>
            <el-button
              link
              size="small"
              @click="markAllAsRead"
            >
              全部已读
            </el-button>
          </div>
          <el-scrollbar max-height="400px">
            <div class="notification-list">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item"
                :class="{ unread: !notification.read }"
                @click="markAsRead(notification.id)"
              >
                <el-icon
                  :color="getNotificationColor(notification.type)"
                  class="notification-icon"
                >
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-message">{{ notification.message }}</div>
                </div>
                <el-button
                  link
                  :icon="Close"
                  size="small"
                  @click.stop="removeNotification(notification.id)"
                />
              </div>
            </div>
          </el-scrollbar>
        </div>
      </el-popover>

      <!-- 用户菜单 -->
      <el-dropdown @command="handleUserMenuCommand">
        <div class="user-info">
          <el-avatar :src="userAvatar" :size="32">
            {{ userName.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="username">{{ userName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 主题切换器 -->
      <ThemeSwitcher @theme-changed="handleThemeChanged" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Expand,
  Bell,
  User,
  Setting,
  SwitchButton,
  ArrowDown,
  Close,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

// 计算属性
const userName = computed(() => userStore.userName)
const userAvatar = computed(() => userStore.userAvatar)
const notifications = computed(() => appStore.notifications)
const unreadCount = computed(() => appStore.unreadNotificationsCount)

// 面包屑导航
const breadcrumbItems = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string
  }))
})

// 方法
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const handleThemeChanged = (theme: string) => {
  appStore.setTheme(theme)
}

const markAsRead = (id: string) => {
  appStore.markNotificationAsRead(id)
}

const markAllAsRead = () => {
  appStore.markAllNotificationsAsRead()
}

const removeNotification = (id: string) => {
  appStore.removeNotification(id)
}

const getNotificationIcon = (type: string) => {
  const icons = {
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
    info: InfoFilled
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

const getNotificationColor = (type: string) => {
  const colors = {
    success: '#67c23a',
    warning: '#e6a23c',
    error: '#f56c6c',
    info: '#909399'
  }
  return colors[type as keyof typeof colors] || '#909399'
}

const handleUserMenuCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push({ name: 'Profile' })
      break
    case 'settings':
      router.push({ name: 'Settings' })
      break
    case 'logout':
      userStore.logout()
      break
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--edu-header-height);
  padding: 0 clamp(20px, 4vw, 36px);
  background: transparent;
  border-bottom: none;
  box-shadow: none;
  position: relative;
  z-index: var(--edu-z-sticky);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.sidebar-toggle {
  font-size: var(--font-size-lg);
  padding: 8px;
  border-radius: 12px;
  color: var(--edu-text-primary);
  background: rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(8px);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(15, 23, 42, 0.12);
    transform: translateY(-1px);
  }
}

.breadcrumb {
  font-size: var(--font-size-sm);
}

.header-right {
  display: flex;
  align-items: center;
  gap: clamp(12px, 1.6vw, 18px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  background: rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);

  &:hover {
    background: rgba(15, 23, 42, 0.12);
  }
}

.username {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.notification-panel {
  width: 100%;
  background: var(--edu-bg-primary);
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.notification-list {
  padding: var(--spacing-sm) 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-base) var(--spacing-lg);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-bg-tertiary);
  }

  &.unread {
    background-color: var(--edu-primary-50);
    border-left: 3px solid var(--edu-primary-500);
  }
}

.notification-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-xs);
  color: var(--edu-text-primary);
}

.notification-message {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  line-height: var(--edu-leading-normal);
}

/* 深色模式适配 */
[data-theme="dark"] {
  .app-header {
    background: var(--edu-glass-bg-dark);
    border-color: var(--edu-border-dark);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .sidebar-toggle:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .user-info:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .notification-item {
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    &.unread {
      background-color: rgba(91, 143, 249, 0.1);
      border-left-color: var(--edu-primary-400);
    }
  }

  .notification-header {
    border-color: var(--edu-border-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 var(--spacing-base);
  }

  .header-left {
    gap: var(--spacing-sm);
  }

  .header-right {
    gap: var(--spacing-xs);
  }

  .breadcrumb {
    display: none;
  }

  .username {
    display: none;
  }
}

/* 无障碍优化 */
.sidebar-toggle:focus-visible,
.user-info:focus-visible {
  outline: 2px solid var(--edu-primary-500);
  outline-offset: 2px;
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .app-header,
  .sidebar-toggle,
  .user-info,
  .notification-item {
    transition-duration: 0.01ms !important;
  }
}
</style>
