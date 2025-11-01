<template>
  <header class="app-header">
    <div class="header-left">
      <el-button
        type="text"
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
      <!-- AI助手按钮 -->
      <el-button
        type="primary"
        :icon="MagicStick"
        circle
        class="ai-assistant-btn"
        @click="toggleAIAssistant"
      />

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
              type="text"
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
                  type="text"
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

      <!-- 主题切换 -->
      <el-button
        :icon="isDarkMode ? Sunny : Moon"
        circle
        @click="toggleTheme"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Expand,
  MagicStick,
  Bell,
  User,
  Setting,
  SwitchButton,
  Sunny,
  Moon,
  ArrowDown,
  Close,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

// 计算属性
const isDarkMode = computed(() => appStore.isDarkMode)
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

const toggleTheme = () => {
  const newTheme = appStore.theme === 'light' ? 'dark' : 'light'
  appStore.setTheme(newTheme)
}

const toggleAIAssistant = () => {
  // 触发AI助手显示/隐藏
  appStore.addNotification({
    type: 'info',
    title: 'AI助手',
    message: 'AI助手功能正在开发中...'
  })
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
  height: 60px;
  padding: 0 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 18px;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-assistant-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.ai-assistant-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.notification-panel {
  width: 100%;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 500;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: var(--el-fill-color-lighter);
}

.notification-item.unread {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
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
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}

.notification-message {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}
</style>