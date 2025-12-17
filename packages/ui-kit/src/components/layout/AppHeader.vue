<template>
  <header class="app-header" :class="headerClasses">
    <div class="app-header__container">
      <!-- Logo区域 (If needed in header, usually in sidebar) -->
      <div v-if="showLogo" class="app-header__logo">
        <router-link v-if="logoLink" :to="logoLink" class="app-header__logo-link">
          <img v-if="logo" :src="logo" :alt="title" class="app-header__logo-image" />
          <span v-else class="app-header__logo-text">{{ title }}</span>
        </router-link>
      </div>

      <!-- 面包屑/页面标题区域 -->
      <div class="app-header__left">
        <slot name="left"></slot>
      </div>

      <!-- 导航菜单 -->
      <nav v-if="showNavigation" class="app-header__nav">
        <ul class="app-header__nav-list">
          <li
            v-for="item in navigationItems"
            :key="item.key"
            class="app-header__nav-item"
          >
            <router-link
              v-if="item.to"
              :to="item.to"
              class="app-header__nav-link"
              :class="{ 'app-header__nav-link--active': isActive(item) }"
            >
              <component
                v-if="item.icon"
                :is="item.icon"
                class="app-header__nav-icon"
              />
              <span class="app-header__nav-text">{{ item.label }}</span>
              <span
                v-if="item.badge"
                class="app-header__nav-badge"
                :class="`app-header__nav-badge--${item.badge.type || 'default'}`"
              >
                {{ item.badge.text }}
              </span>
            </router-link>
            <!-- Other item types (a, button) omitted for brevity but should be consistent -->
          </li>
        </ul>
      </nav>

      <!-- 右侧操作区 -->
      <div class="app-header__actions">
        <!-- 搜索框 -->
        <div v-if="showSearch" class="app-header__search">
          <div class="app-header__search-wrapper">
            <svg class="app-header__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="app-header__search-input"
              @input="handleSearch"
              @keydown.enter="handleSearchSubmit"
            />
          </div>
        </div>

        <!-- 通知中心 -->
        <div v-if="showNotifications" class="app-header__notifications">
          <button
            type="button"
            class="app-header__action-btn"
            :class="{ 'app-header__action-btn--active': showNotificationPanel }"
            @click="toggleNotifications"
          >
            <div class="notification-icon-wrapper">
              <svg class="app-header__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span v-if="unreadCount > 0" class="notification-dot"></span>
            </div>
          </button>

          <!-- 通知下拉面板 (Glassmorphism) -->
          <transition name="fade-slide">
            <div
              v-if="showNotificationPanel"
              class="app-header__dropdown-panel"
            >
              <div class="app-header__dropdown-header">
                <h3 class="app-header__dropdown-title">通知</h3>
                <button
                  type="button"
                  class="app-header__text-btn"
                  @click="clearAllNotifications"
                >
                  全部已读
                </button>
              </div>
              <div class="app-header__notification-list">
                <div
                  v-for="notification in recentNotifications"
                  :key="notification.id"
                  class="app-header__notification-item"
                  :class="{ 'app-header__notification-item--unread': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="app-header__notification-content">
                    <div class="app-header__notification-message">
                      {{ notification.message }}
                    </div>
                    <div class="app-header__notification-time">
                      {{ formatTime(notification.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="recentNotifications.length === 0" class="app-header__dropdown-empty">
                暂无新通知
              </div>
            </div>
          </transition>
        </div>

        <!-- 主题切换 -->
        <button
          v-if="showThemeToggle"
          type="button"
          class="app-header__action-btn"
          @click="toggleTheme"
        >
          <svg v-if="isDarkTheme" class="app-header__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else class="app-header__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <!-- 用户菜单 -->
        <div v-if="user" class="app-header__user">
          <button
            type="button"
            class="app-header__user-btn"
            :class="{ 'app-header__user-btn--active': showUserMenu }"
            @click="toggleUserMenu"
          >
            <div class="app-header__user-avatar">
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.name"
                class="app-header__user-avatar-image"
              />
              <div v-else class="app-header__user-avatar-placeholder">
                {{ user.name?.charAt(0)?.toUpperCase() }}
              </div>
            </div>
            <div class="app-header__user-info">
              <div class="app-header__user-name">{{ user.name }}</div>
              <div class="app-header__user-role">{{ user.role }}</div>
            </div>
            <svg class="app-header__user-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <!-- 用户菜单下拉面板 -->
          <transition name="fade-slide">
            <div v-if="showUserMenu" class="app-header__dropdown-panel app-header__user-dropdown">
              <div class="app-header__dropdown-header">
                <div class="app-header__user-menu-name">{{ user.name }}</div>
                <div class="app-header__user-menu-email">{{ user.email }}</div>
              </div>
              <div class="app-header__dropdown-items">
                <button
                  v-for="item in userMenuItems"
                  :key="item.key"
                  type="button"
                  class="app-header__dropdown-item"
                  @click="handleUserMenuClick(item)"
                >
                  <component
                    v-if="item.icon"
                    :is="item.icon"
                    class="app-header__dropdown-icon"
                  />
                  {{ item.label }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      v-if="showNotificationPanel || showUserMenu"
      class="app-header__overlay"
      @click="closeAllDropdowns"
    ></div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface NavigationItem {
  key: string
  label: string
  to?: string
  href?: string
  icon?: any
  badge?: {
    text: string
    type?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  }
  onClick?: () => void
}

interface Notification {
  id: string
  message: string
  timestamp: number
  read: boolean
  type?: 'info' | 'success' | 'warning' | 'error'
}

interface User {
  name: string
  email?: string
  role?: string
  avatar?: string
}

interface UserMenuItem {
  key: string
  label: string
  icon?: any
  onClick?: () => void
}

interface Props {
  title?: string
  logo?: string
  logoLink?: string
  showLogo?: boolean
  navigationItems?: NavigationItem[]
  user?: User
  userMenuItems?: UserMenuItem[]
  showSearch?: boolean
  searchPlaceholder?: string
  showNotifications?: boolean
  notifications?: Notification[]
  showThemeToggle?: boolean
  fixed?: boolean
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '智慧教学平台',
  showLogo: false,
  showSearch: true,
  searchPlaceholder: '全局搜索...',
  showNotifications: true,
  showThemeToggle: true,
  fixed: true,
  transparent: false
})

const emit = defineEmits<{
  search: [query: string]
  navClick: [item: NavigationItem]
  notificationClick: [notification: Notification]
  clearNotifications: []
  userMenuClick: [item: UserMenuItem]
  themeToggle: [isDark: boolean]
}>()

const route = useRoute()
const router = useRouter()

// 响应式状态
const searchQuery = ref('')
const showNotificationPanel = ref(false)
const showUserMenu = ref(false)
const isDarkTheme = ref(false)

// 计算属性
const headerClasses = computed(() => [
  'app-header',
  {
    'app-header--fixed': props.fixed,
    'app-header--transparent': props.transparent
  }
])

const recentNotifications = computed(() => {
  return (props.notifications || []).slice(0, 5)
})

const unreadCount = computed(() => {
  return (props.notifications || []).filter(n => !n.read).length
})

// 方法
const isActive = (item: NavigationItem) => {
  if (item.to) {
    return route.path === item.to
  }
  return false
}

const handleNavClick = (item: NavigationItem) => {
  if (item.onClick) {
    item.onClick()
  }
  emit('navClick', item)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleSearchSubmit = () => {
  emit('search', searchQuery.value)
}

const toggleNotifications = () => {
  showNotificationPanel.value = !showNotificationPanel.value
  showUserMenu.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showNotificationPanel.value = false
}

const closeAllDropdowns = () => {
  showNotificationPanel.value = false
  showUserMenu.value = false
}

const handleNotificationClick = (notification: Notification) => {
  emit('notificationClick', notification)
  showNotificationPanel.value = false
}

const clearAllNotifications = () => {
  emit('clearNotifications')
}

const handleUserMenuClick = (item: UserMenuItem) => {
  if (item.onClick) {
    item.onClick()
  }
  emit('userMenuClick', item)
  showUserMenu.value = false
}

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  emit('themeToggle', isDarkTheme.value)
  document.documentElement.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light')
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

// Lifecycle and Event Listeners
onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkTheme.value = prefersDark
  
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element
    if (!target.closest('.app-header')) {
      closeAllDropdowns()
    }
  }
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

defineExpose({
  closeAllDropdowns,
  toggleNotifications,
  toggleUserMenu
})
</script>

<style lang="scss" scoped>
.app-header {
  /* Glassmorphism Header */
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  z-index: var(--edu-z-sticky);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

  &--fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  &--transparent {
    background-color: transparent;
    border-bottom: none;
    box-shadow: none;
  }
}

.app-header__container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 24px;
}

.app-header__logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 18px;
  
  &:hover {
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* Search Bar - Modern & Clean */
.app-header__search-wrapper {
  display: flex;
  align-items: center;
  background-color: rgba(241, 245, 249, 0.8); // Slate-100
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0 16px;
  min-width: 260px;
  height: 40px;
  transition: all 0.2s ease;

  &:focus-within {
    background-color: #fff;
    border-color: rgba(99, 102, 241, 0.3); // Indigo-300
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
}

.app-header__search-icon {
  width: 18px;
  height: 18px;
  color: #94a3b8; // Slate-400
  margin-right: 8px;
}

.app-header__search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  
  &::placeholder {
    color: #94a3b8;
  }
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Action Buttons (Notification, Theme) */
.app-header__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #64748b; // Slate-500
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(99, 102, 241, 0.1);
    color: #6366f1; // Indigo-500
  }
  
  &--active {
    background-color: rgba(99, 102, 241, 0.15);
    color: #6366f1;
  }
}

.app-header__action-icon {
  width: 20px;
  height: 20px;
}

.notification-icon-wrapper {
  position: relative;
  display: flex;
}

.notification-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #f97316; // Orange
  border: 2px solid #fff;
  border-radius: 50%;
}

/* Dropdown Panels - Premium Glass */
.app-header__dropdown-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 
    0 10px 30px -10px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: var(--edu-z-dropdown);
  overflow: hidden;
}

.app-header__dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.app-header__dropdown-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.app-header__text-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  
  &:hover {
    background: rgba(99, 102, 241, 0.1);
  }
}

.app-header__notification-list {
  max-height: 320px;
  overflow-y: auto;
}

.app-header__notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background-color: rgba(241, 245, 249, 0.5);
  }
  
  &--unread {
    background-color: rgba(99, 102, 241, 0.04);
    
    .app-header__notification-message {
      font-weight: 500;
      color: #1e293b;
    }
  }
}

.app-header__notification-message {
  font-size: 14px;
  color: #475569;
  margin-bottom: 4px;
}

.app-header__notification-time {
  font-size: 12px;
  color: #94a3b8;
}

/* User Profile */
.app-header__user-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: 1px solid transparent;
  padding: 4px 8px 4px 4px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover, &--active {
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
}

.app-header__user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.app-header__user-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-header__user-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.app-header__user-info {
  text-align: left;
}

.app-header__user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.app-header__user-role {
  font-size: 12px;
  color: #64748b;
}

/* User Dropdown */
.app-header__user-dropdown {
  width: 240px;
}

.app-header__dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f8fafc;
    color: #6366f1;
  }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* Dark Mode */
[data-theme="dark"] {
  .app-header {
    background: rgba(15, 23, 42, 0.8); // Slate-900 80%
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .app-header__search-wrapper {
    background-color: rgba(30, 41, 59, 0.6); // Slate-800
    
    &:focus-within {
      background-color: rgba(30, 41, 59, 1);
      border-color: rgba(99, 102, 241, 0.5);
    }
  }
  
  .app-header__action-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .app-header__dropdown-panel {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .app-header__dropdown-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .app-header__notification-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .app-header__user-btn:hover, 
  .app-header__user-btn--active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .app-header__dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>
