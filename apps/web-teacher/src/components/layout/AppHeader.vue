<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="header-right">
      <!-- 通知 -->
      <el-popover placement="bottom-end" :width="360" trigger="click" popper-class="notification-popper">
        <template #reference>
          <div class="icon-btn action-item">
            <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="notification-badge">
              <el-icon :size="20"><Bell /></el-icon>
            </el-badge>
          </div>
        </template>
        <!-- Popover Content (Keep existing) -->
        <div class="notification-panel">
          <div class="notification-header">
            <span>通知中心</span>
            <el-button link size="small" @click="markAllAsRead" type="primary">全部已读</el-button>
          </div>
          <el-scrollbar max-height="380px">
            <div v-if="notifications.length > 0" class="notification-list">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item"
                :class="{ unread: !notification.read }"
                @click="markAsRead(notification.id)"
              >
                <div class="notif-icon-box" :class="notification.type">
                  <component :is="getNotificationIcon(notification.type)" />
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-message">{{ notification.message }}</div>
                  <div class="notification-time">10分钟前</div>
                </div>
                <div class="notif-action" @click.stop="removeNotification(notification.id)">
                   <el-icon><Close /></el-icon>
                </div>
              </div>
            </div>
            <div v-else class="empty-notif">
               <el-icon :size="48" color="#e2e8f0"><Bell /></el-icon>
               <p>暂无新通知</p>
            </div>
          </el-scrollbar>
        </div>
      </el-popover>

      <div class="header-divider"></div>

      <!-- 用户菜单 -->
      <el-dropdown @command="handleUserMenuCommand" trigger="click">
        <div class="user-pill">
          <el-avatar :src="userAvatar" :size="32" class="user-avatar-img">
            {{ userName?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
          <div class="user-text">
             <span class="username">{{ userName || '用户' }}</span>
             <span class="user-role">教师</span>
          </div>
          <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown-menu">
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon> 个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon> 系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout" class="danger-item">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

// 计算属性
const userName = computed(() => userStore.userName)
const userAvatar = computed(() => userStore.userAvatar)
const notifications = computed(() => appStore.notifications)
const unreadCount = computed(() => appStore.unreadNotificationsCount)

// 页面标题
const pageTitle = computed(() => {
  return (route.meta.title as string) || 'ReOpenInnoLab'
})

// 方法
const toggleSidebar = () => {
  appStore.toggleSidebar()
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
  height: 64px; /* Fallback */
  height: var(--edu-header-height, 64px);
  padding: 0 var(--edu-spacing-5);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--edu-border-color-light);
  position: sticky;
  top: 0;
  z-index: var(--edu-z-index-20);
  transition: background-color var(--edu-duration-normal) var(--edu-easing-linear);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--edu-spacing-4);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-color-gray-900);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Icon Buttons (Theme, Bell) */
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: #64748B; /* Slate-500 */
  transition: all 0.2s;
  
  &:hover {
    background-color: #F1F5F9; /* Slate-100 */
    color: #0F172A;
  }
}

.notification-badge :deep(.el-badge__content) {
  border: 2px solid white;
  background-color: #F97316; /* Orange */
}

.header-divider {
  width: 1px;
  height: 24px;
  background-color: #E2E8F0; /* Slate-200 */
  margin: 0 4px;
}

/* User Pill */
.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px; /* Left padding smaller for avatar */
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background-color: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    border-color: #F1F5F9;
  }
}

.user-avatar-img {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  font-weight: 600;
  border: 2px solid white; /* Clean look */
}

.user-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
}

.user-role {
  font-size: 11px;
  color: #94A3B8;
}

.dropdown-arrow {
  font-size: 12px;
  color: #94A3B8;
  margin-left: 4px;
}

/* Notification Panel Styles */
.notification-panel {
  padding: 0;
}

.notification-header {
  padding: 16px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    font-weight: 600;
    color: #0F172A;
  }
}

.notification-list {
  padding: 0;
}

.notification-item {
  display: flex;
  padding: 16px;
  gap: 12px;
  border-bottom: 1px solid #F8FAFC;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
  
  &:hover {
    background-color: #F8FAFC;
    
    .notif-action {
      opacity: 1;
    }
  }
  
  &.unread {
    background-color: #F0F9FF; /* Very faint blue */
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #3B82F6;
    }
  }
}

.notif-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  
  &.info { background: #E0F2FE; color: #0EA5E9; }
  &.success { background: #DCFCE7; color: #16A34A; }
  &.warning { background: #FEF3C7; color: #D97706; }
  &.error { background: #FEE2E2; color: #DC2626; }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #64748B;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 11px;
  color: #94A3B8;
}

.notif-action {
  opacity: 0;
  color: #94A3B8;
  padding: 4px;
  transition: opacity 0.2s;
  
  &:hover { color: #EF4444; }
}

.empty-notif {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #94A3B8;
  gap: 12px;
  
  p { margin: 0; font-size: 13px; }
}

/* User Dropdown */
.danger-item {
  color: #EF4444;
  &:hover { background-color: #FEF2F2; color: #DC2626; }
}

/* 深色模式适配 (Simplified for now) */
[data-theme="dark"] {
  .icon-btn:hover { background-color: rgba(255,255,255,0.1); color: white; }
  .user-pill:hover { background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
  .username { color: #E2E8F0; }
  .user-role { color: #64748B; }
}
</style>
