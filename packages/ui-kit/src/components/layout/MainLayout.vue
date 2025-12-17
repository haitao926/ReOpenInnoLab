<template>
  <div class="main-layout" :class="layoutClasses">
    <!-- 背景氛围层 (Atmosphere Layer) -->
    <div class="main-layout__atmosphere"></div>

    <!-- 侧边栏 -->
    <AppSidebar
      :title="sidebarTitle"
      :logo="sidebarLogo"
      :logo-link="sidebarLogoLink"
      :menu-items="sidebarMenuItems"
      :collapsed="sidebarCollapsed"
      :width="sidebarWidth"
      :collapsed-width="sidebarCollapsedWidth"
      :version="sidebarVersion"
      :hoverable="sidebarHoverable"
      @toggle-collapse="handleSidebarToggle"
      @menu-click="handleSidebarMenuClick"
    />

    <!-- 主内容区域 -->
    <div class="main-layout__content" :class="contentClasses">
      <!-- 顶部导航 -->
      <AppHeader
        :title="headerTitle"
        :logo="headerLogo"
        :logo-link="headerLogoLink"
        :navigation-items="headerNavigationItems"
        :user="headerUser"
        :user-menu-items="headerUserMenuItems"
        :show-search="headerShowSearch"
        :search-placeholder="headerSearchPlaceholder"
        :show-notifications="headerShowNotifications"
        :notifications="headerNotifications"
        :show-theme-toggle="headerShowThemeToggle"
        :fixed="headerFixed"
        :transparent="headerTransparent"
        @search="handleHeaderSearch"
        @nav-click="handleHeaderNavClick"
        @notification-click="handleHeaderNotificationClick"
        @clear-notifications="handleHeaderClearNotifications"
        @user-menu-click="handleHeaderUserMenuClick"
        @theme-toggle="handleHeaderThemeToggle"
      />

      <!-- 页面内容 -->
      <main
        class="main-layout__main"
        :class="mainClasses"
        :style="mainStyles"
      >
        <div v-if="showBreadcrumb" class="main-layout__breadcrumb">
          <slot name="breadcrumb">
            <nav class="breadcrumb" aria-label="面包屑导航">
              <ol class="breadcrumb__list">
                <li
                  v-for="(item, index) in breadcrumbItems"
                  :key="index"
                  class="breadcrumb__item"
                >
                  <router-link
                    v-if="item.to && index < breadcrumbItems.length - 1"
                    :to="item.to"
                    class="breadcrumb__link"
                  >
                    {{ item.label }}
                  </router-link>
                  <span v-else-if="index < breadcrumbItems.length - 1" class="breadcrumb__separator">
                    /
                  </span>
                  <span v-else class="breadcrumb__current">{{ item.label }}</span>
                </li>
              </ol>
            </nav>
          </slot>
        </div>

        <div class="main-layout__page-content">
          <slot></slot>
        </div>
      </main>
    </div>

    <!-- 移动端遮罩层 -->
    <div
      v-if="showMobileOverlay"
      class="main-layout__mobile-overlay"
      @click="handleMobileOverlayClick"
    ></div>

    <!-- 全局加载状态 -->
    <div v-if="globalLoading" class="main-layout__loading">
      <div class="loading-spinner">
        <svg class="loading-spinner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
            <animate attributeName="stroke-dashoffset" dur="0.75s" values="31.416;15.708;0" repeatCount="indefinite" />
          </circle>
        </svg>
        <span class="loading-spinner__text">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

interface MenuItem {
  key: string
  label: string
  to?: string
  icon?: any
  badge?: string | number
  children?: MenuItem[]
  onClick?: () => void
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

interface Notification {
  id: string
  message: string
  timestamp: number
  read: boolean
  type?: 'info' | 'success' | 'warning' | 'error'
}

interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  // 侧边栏配置
  sidebarTitle?: string
  sidebarLogo?: string
  sidebarLogoLink?: string
  sidebarMenuItems?: MenuItem[]
  sidebarCollapsed?: boolean
  sidebarWidth?: number
  sidebarCollapsedWidth?: number
  sidebarVersion?: string
  sidebarHoverable?: boolean

  // 头部配置
  headerTitle?: string
  headerLogo?: string
  headerLogoLink?: string
  headerNavigationItems?: MenuItem[]
  headerUser?: User
  headerUserMenuItems?: UserMenuItem[]
  headerShowSearch?: boolean
  headerSearchPlaceholder?: string
  headerShowNotifications?: boolean
  headerNotifications?: Notification[]
  headerShowThemeToggle?: boolean
  headerFixed?: boolean
  headerTransparent?: boolean

  // 布局配置
  showBreadcrumb?: boolean
  breadcrumbItems?: BreadcrumbItem[]
  fluid?: boolean
  maxWidth?: number
  padding?: string | number
  globalLoading?: boolean
  loadingText?: string

  // 响应式配置
  mobileBreakpoint?: number
}

const props = withDefaults(defineProps<Props>(), {
  sidebarTitle: '智慧教学平台',
  sidebarCollapsed: false,
  sidebarWidth: 260,
  sidebarCollapsedWidth: 76,
  sidebarVersion: '1.0.0',
  sidebarHoverable: true,
  headerShowSearch: true,
  headerSearchPlaceholder: '全局搜索...',
  headerShowNotifications: true,
  headerShowThemeToggle: true,
  headerFixed: true,
  headerTransparent: false,
  showBreadcrumb: true,
  fluid: false,
  maxWidth: 1440,
  padding: 'base',
  globalLoading: false,
  loadingText: '加载中...',
  mobileBreakpoint: 768
})

const emit = defineEmits<{
  'sidebar-toggle': [collapsed: boolean]
  'sidebar-menu-click': [item: MenuItem]
  'header-search': [query: string]
  'header-nav-click': [item: MenuItem]
  'header-notification-click': [notification: Notification]
  'header-clear-notifications': []
  'header-user-menu-click': [item: UserMenuItem]
  'header-theme-toggle': [isDark: boolean]
}>()

const route = useRoute()

// 响应式状态
const sidebarCollapsed = ref(props.sidebarCollapsed)
const isMobile = ref(false)
const showMobileOverlay = ref(false)

// 计算属性
const layoutClasses = computed(() => [
  'main-layout',
  {
    'main-layout--mobile': isMobile.value,
    'main-layout--sidebar-collapsed': sidebarCollapsed.value,
    'main-layout--global-loading': props.globalLoading
  }
])

const contentClasses = computed(() => [
  'main-layout__content',
  {
    'main-layout__content--fluid': props.fluid,
    'main-layout__content--fixed-header': props.headerFixed
  }
])

const mainClasses = computed(() => [
  'main-layout__main',
  `main-layout__main--padding-${props.padding}`
])

const mainStyles = computed(() => {
  const styles: Record<string, string> = {}
  if (!props.fluid && props.maxWidth) {
    styles.maxWidth = `${props.maxWidth}px`
  }
  if (props.headerFixed) {
    styles.paddingTop = '64px'
  }
  return styles
})

// Methods
const handleSidebarToggle = (collapsed: boolean) => {
  sidebarCollapsed.value = collapsed
  if (isMobile.value) {
    showMobileOverlay.value = !collapsed
  }
  emit('sidebar-toggle', collapsed)
}

const handleSidebarMenuClick = (item: MenuItem) => {
  emit('sidebar-menu-click', item)
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
}

const handleHeaderSearch = (query: string) => emit('header-search', query)
const handleHeaderNavClick = (item: MenuItem) => emit('header-nav-click', item)
const handleHeaderNotificationClick = (n: Notification) => emit('header-notification-click', n)
const handleHeaderClearNotifications = () => emit('header-clear-notifications')
const handleHeaderUserMenuClick = (item: UserMenuItem) => emit('header-user-menu-click', item)
const handleHeaderThemeToggle = (isDark: boolean) => emit('header-theme-toggle', isDark)

const handleMobileOverlayClick = () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < props.mobileBreakpoint
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
}

const handleResize = () => checkMobile()

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(() => route.path, () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
})

defineExpose({
  toggleSidebar: () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    handleSidebarToggle(sidebarCollapsed.value)
  },
  collapseSidebar: () => {
    sidebarCollapsed.value = true
    handleSidebarToggle(true)
  },
  expandSidebar: () => {
    sidebarCollapsed.value = false
    handleSidebarToggle(false)
  }
})
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  /* Use variable for background, typically Slate-50 */
  background-color: var(--edu-color-gray-50);
  position: relative;
  /* Ensure atmosphere is behind */
  z-index: 0;

  &--mobile .main-layout__content {
    margin-left: 0;
  }

  &--sidebar-collapsed .main-layout__content {
    margin-left: v-bind('props.sidebarCollapsedWidth + "px"');
  }

  &--global-loading {
    pointer-events: none;
    user-select: none;
  }
}

/* 氛围背景层 */
.main-layout__atmosphere {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(249, 115, 22, 0.03) 0%, transparent 40%);
  background-size: cover;
}

.main-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: v-bind('props.sidebarWidth + "px"');
  transition: margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 0;
  
  &--fixed-header {
    /* Main padding added via inline style */
  }
}

.main-layout__main {
  flex: 1;
  padding: var(--spacing-base);
  margin: 0 auto;
  width: 100%;
  
  &--padding-xs { padding: 8px; }
  &--padding-sm { padding: 16px; }
  &--padding-base { padding: 24px; }
  &--padding-lg { padding: 32px; }
  &--padding-xl { padding: 48px; }
}

.main-layout__breadcrumb {
  margin-bottom: 24px;
}

.breadcrumb__list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 14px;
}

.breadcrumb__link {
  color: #64748b; /* Slate-500 */
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: #6366f1; /* Indigo-500 */
  }
}

.breadcrumb__separator {
  margin: 0 8px;
  color: #cbd5e1; /* Slate-300 */
}

.breadcrumb__current {
  color: #0f172a; /* Slate-900 */
  font-weight: 500;
}

.main-layout__page-content {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.main-layout__mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  z-index: 900; /* Below Header (1100), Above Content */
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;

  .main-layout--mobile & {
    opacity: 1;
    visibility: visible;
  }
}

.main-layout__loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner__icon {
  width: 48px;
  height: 48px;
  color: #6366f1;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dark Mode */
[data-theme="dark"] {
  .main-layout {
    background-color: #0f172a; /* Slate-900 */
  }
  
  .main-layout__atmosphere {
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(249, 115, 22, 0.05) 0%, transparent 40%);
  }
  
  .breadcrumb__link { color: #94a3b8; &:hover { color: #818cf8; } }
  .breadcrumb__separator { color: #475569; }
  .breadcrumb__current { color: #f1f5f9; }
  
  .main-layout__loading {
    background-color: rgba(15, 23, 42, 0.8);
  }
}
</style>
