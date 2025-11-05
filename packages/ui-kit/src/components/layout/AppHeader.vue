<template>
  <header class="app-header" :class="headerClasses">
    <div class="app-header__container">
      <!-- Logo区域 -->
      <div class="app-header__logo">
        <router-link v-if="logoLink" :to="logoLink" class="app-header__logo-link">
          <img v-if="logo" :src="logo" :alt="title" class="app-header__logo-image" />
          <span v-else class="app-header__logo-text">{{ title }}</span>
        </router-link>
        <div v-else class="app-header__logo-content">
          <img v-if="logo" :src="logo" :alt="title" class="app-header__logo-image" />
          <span v-else class="app-header__logo-text">{{ title }}</span>
        </div>
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
            <a
              v-else-if="item.href"
              :href="item.href"
              class="app-header__nav-link"
              :class="{ 'app-header__nav-link--active': isActive(item) }"
              @click="handleNavClick(item)"
            >
              <component
                v-if="item.icon"
                :is="item.icon"
                class="app-header__nav-icon"
              />
              <span class="app-header__nav-text">{{ item.label }}</span>
            </a>
            <button
              v-else
              type="button"
              class="app-header__nav-link"
              :class="{ 'app-header__nav-link--active': isActive(item) }"
              @click="handleNavClick(item)"
            >
              <component
                v-if="item.icon"
                :is="item.icon"
                class="app-header__nav-icon"
              />
              <span class="app-header__nav-text">{{ item.label }}</span>
            </button>
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
            class="app-header__notification-btn"
            :class="{ 'app-header__notification-btn--has-unread': hasUnreadNotifications }"
            @click="toggleNotifications"
          >
            <svg class="app-header__notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span
              v-if="unreadCount > 0"
              class="app-header__notification-badge"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <!-- 通知下拉面板 -->
          <div
            v-if="showNotificationPanel"
            class="app-header__notification-panel"
          >
            <div class="app-header__notification-header">
              <h3 class="app-header__notification-title">通知</h3>
              <button
                type="button"
                class="app-header__notification-clear"
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
            <div v-if="recentNotifications.length === 0" class="app-header__notification-empty">
              暂无新通知
            </div>
          </div>
        </div>

        <!-- 用户菜单 -->
        <div v-if="user" class="app-header__user">
          <button
            type="button"
            class="app-header__user-btn"
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
          <div v-if="showUserMenu" class="app-header__user-menu">
            <div class="app-header__user-menu-header">
              <div class="app-header__user-menu-name">{{ user.name }}</div>
              <div class="app-header__user-menu-email">{{ user.email }}</div>
            </div>
            <div class="app-header__user-menu-items">
              <button
                v-for="item in userMenuItems"
                :key="item.key"
                type="button"
                class="app-header__user-menu-item"
                @click="handleUserMenuClick(item)"
              >
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="app-header__user-menu-icon"
                />
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 主题切换 -->
        <button
          v-if="showThemeToggle"
          type="button"
          class="app-header__theme-toggle"
          @click="toggleTheme"
        >
          <svg v-if="isDarkTheme" class="app-header__theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg v-else class="app-header__theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
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
  showSearch: true,
  searchPlaceholder: '搜索...',
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

const hasUnreadNotifications = computed(() => unreadCount.value > 0)

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

  // 应用主题到文档
  document.documentElement.setAttribute(
    'data-theme',
    isDarkTheme.value ? 'dark' : 'light'
  )
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

// 生命周期
onMounted(() => {
  // 检查系统主题偏好
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkTheme.value = prefersDark

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = (e: MediaQueryListEvent) => {
    isDarkTheme.value = e.matches
    document.documentElement.setAttribute(
      'data-theme',
      isDarkTheme.value ? 'dark' : 'light'
    )
  }

  mediaQuery.addEventListener('change', handleChange)

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleChange)
  })
})

// 点击外部关闭下拉菜单
onMounted(() => {
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

// 暴露方法
defineExpose({
  closeAllDropdowns,
  toggleNotifications,
  toggleUserMenu
})
</script>

<style lang="scss" scoped>
.app-header {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  z-index: var(--edu-z-sticky);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &--fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  &--transparent {
    background-color: transparent;
    border-bottom: none;
    backdrop-filter: blur(10px);
  }
}

.app-header__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: var(--spacing-lg);
}

.app-header__logo {
  flex-shrink: 0;
}

.app-header__logo-link,
.app-header__logo-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
}

.app-header__logo-link:hover {
  color: var(--edu-primary-500);
}

.app-header__logo-image {
  height: 32px;
  width: auto;
}

.app-header__logo-text {
  color: inherit;
}

.app-header__nav {
  flex: 1;
  display: flex;
  justify-content: center;
}

.app-header__nav-list {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-header__nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-base);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  border: none;
  background: none;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    background-color: var(--edu-color-gray-100);
  }

  &--active {
    color: var(--edu-primary-500);
    background-color: var(--edu-primary-50);
  }
}

.app-header__nav-icon {
  width: 16px;
  height: 16px;
}

.app-header__nav-text {
  white-space: nowrap;
}

.app-header__nav-badge {
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;

  &--default {
    background-color: var(--edu-color-gray-200);
    color: var(--text-secondary);
  }

  &--primary {
    background-color: var(--edu-primary-500);
    color: var(--text-on-primary);
  }

  &--success {
    background-color: var(--edu-color-success-default);
    color: var(--text-on-primary);
  }

  &--warning {
    background-color: var(--edu-color-warning-default);
    color: var(--text-on-primary);
  }

  &--error {
    background-color: var(--edu-color-error-default);
    color: var(--text-on-primary);
  }
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.app-header__search {
  position: relative;
}

.app-header__search-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--edu-color-gray-100);
  border-radius: var(--radius-full);
  padding: 0 var(--spacing-base);
  min-width: 240px;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &:focus-within {
    background-color: var(--bg-elevated);
    box-shadow: 0 0 0 2px var(--edu-primary-500);
  }
}

.app-header__search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  margin-right: var(--spacing-sm);
}

.app-header__search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) 0;

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.app-header__notifications {
  position: relative;
}

.app-header__notification-btn {
  position: relative;
  background: none;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-base);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    color: var(--text-primary);
    background-color: var(--edu-color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }
}

.app-header__notification-icon {
  width: 20px;
  height: 20px;
}

.app-header__notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: var(--edu-color-error-default);
  color: var(--text-on-primary);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
  padding: 2px 5px;
  border-radius: var(--radius-full);
  min-width: 16px;
  text-align: center;
}

.app-header__notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--spacing-sm);
  width: 320px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--edu-shadow-xl);
  z-index: var(--edu-z-dropdown);
  overflow: hidden;
}

.app-header__notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base);
  border-bottom: 1px solid var(--border-color);
}

.app-header__notification-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.app-header__notification-clear {
  background: none;
  border: none;
  color: var(--edu-primary-500);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-primary-50);
  }
}

.app-header__notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.app-header__notification-item {
  padding: var(--spacing-base);
  cursor: pointer;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--edu-color-gray-50);
  }

  &--unread {
    background-color: var(--edu-primary-50);
  }
}

.app-header__notification-message {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-xs);
}

.app-header__notification-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.app-header__notification-empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.app-header__user {
  position: relative;
}

.app-header__user-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: none;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }
}

.app-header__user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
}

.app-header__user-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-header__user-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--edu-primary-500);
  color: var(--text-on-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.app-header__user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.app-header__user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.app-header__user-role {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  line-height: var(--line-height-tight);
}

.app-header__user-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);
}

.app-header__user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--spacing-sm);
  width: 240px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--edu-shadow-xl);
  z-index: var(--edu-z-dropdown);
  overflow: hidden;
}

.app-header__user-menu-header {
  padding: var(--spacing-base);
  border-bottom: 1px solid var(--border-color);
}

.app-header__user-menu-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.app-header__user-menu-email {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.app-header__user-menu-items {
  padding: var(--spacing-xs);
}

.app-header__user-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  background: none;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-base);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: left;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-100);
  }
}

.app-header__user-menu-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.app-header__theme-toggle {
  background: none;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-base);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    color: var(--text-primary);
    background-color: var(--edu-color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }
}

.app-header__theme-icon {
  width: 20px;
  height: 20px;
}

.app-header__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--edu-z-overlay);
  background: transparent;
}

// 响应式设计
@media (max-width: 768px) {
  .app-header__container {
    padding: 0 var(--spacing-sm);
  }

  .app-header__nav {
    display: none;
  }

  .app-header__search-wrapper {
    min-width: 180px;
  }

  .app-header__user-info {
    display: none;
  }

  .app-header__notification-panel {
    width: 280px;
    right: -20px;
  }

  .app-header__user-menu {
    width: 200px;
    right: -20px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .app-header {
    background-color: var(--bg-primary);
    border-bottom-color: var(--border-color);
  }

  .app-header__search-wrapper {
    background-color: rgba(255, 255, 255, 0.1);

    &:focus-within {
      background-color: var(--bg-elevated);
    }
  }

  .app-header__nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .app-header__notification-panel,
  .app-header__user-menu {
    background-color: var(--bg-elevated);
    border-color: var(--border-color-strong);
  }

  .app-header__notification-item:hover,
  .app-header__user-menu-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>