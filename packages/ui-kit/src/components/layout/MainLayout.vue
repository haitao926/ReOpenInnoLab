<template>
  <div class="main-layout" :class="layoutClasses">
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
                    {{ item.label }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  // 侧边栏默认配置
  sidebarTitle: '智慧教学平台',
  sidebarCollapsed: false,
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  sidebarVersion: '1.0.0',
  sidebarHoverable: true,

  // 头部默认配置
  headerShowSearch: true,
  headerSearchPlaceholder: '搜索...',
  headerShowNotifications: true,
  headerShowThemeToggle: true,
  headerFixed: true,
  headerTransparent: false,

  // 布局默认配置
  showBreadcrumb: true,
  fluid: false,
  maxWidth: 1200,
  padding: 'base',
  globalLoading: false,
  loadingText: '加载中...',

  // 响应式配置
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

// 方法
const handleSidebarToggle = (collapsed: boolean) => {
  sidebarCollapsed.value = collapsed

  if (isMobile.value) {
    showMobileOverlay.value = !collapsed
  }

  emit('sidebar-toggle', collapsed)
}

const handleSidebarMenuClick = (item: MenuItem) => {
  emit('sidebar-menu-click', item)

  // 移动端点击菜单后关闭侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
}

const handleHeaderSearch = (query: string) => {
  emit('header-search', query)
}

const handleHeaderNavClick = (item: MenuItem) => {
  emit('header-nav-click', item)
}

const handleHeaderNotificationClick = (notification: Notification) => {
  emit('header-notification-click', notification)
}

const handleHeaderClearNotifications = () => {
  emit('header-clear-notifications')
}

const handleHeaderUserMenuClick = (item: UserMenuItem) => {
  emit('header-user-menu-click', item)
}

const handleHeaderThemeToggle = (isDark: boolean) => {
  emit('header-theme-toggle', isDark)
}

const handleMobileOverlayClick = () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < props.mobileBreakpoint

  // 移动端自动收起侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
}

const handleResize = () => {
  checkMobile()
}

// 生命周期
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听路由变化，移动端自动关闭侧边栏
import { watch } from 'vue'
watch(() => route.path, () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true
    showMobileOverlay.value = false
  }
})

// 暴露方法
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
  background-color: var(--bg-primary);
  position: relative;

  &--mobile {
    .main-layout__content {
      margin-left: 0;
    }
  }

  &--sidebar-collapsed {
    .main-layout__content {
      margin-left: #{props.sidebarCollapsedWidth}px;
    }
  }

  &--global-loading {
    pointer-events: none;
    user-select: none;
  }
}

.main-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: #{props.sidebarWidth}px;
  transition: margin-left var(--edu-duration-normal) var(--edu-easing-in-out);
  min-width: 0;

  &--fixed-header {
    .main-layout__main {
      padding-top: 64px;
    }
  }
}

.main-layout__main {
  flex: 1;
  padding: var(--spacing-base);
  margin: 0 auto;
  transition: padding var(--edu-duration-normal) var(--edu-easing-in-out);

  &--padding-xs {
    padding: var(--spacing-xs);
  }

  &--padding-sm {
    padding: var(--spacing-sm);
  }

  &--padding-base {
    padding: var(--spacing-base);
  }

  &--padding-lg {
    padding: var(--spacing-lg);
  }

  &--padding-xl {
    padding: var(--spacing-xl);
  }

  &--padding-2xl {
    padding: var(--spacing-2xl);
  }
}

.main-layout__breadcrumb {
  margin-bottom: var(--spacing-base);
}

.breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb__list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: var(--font-size-sm);
}

.breadcrumb__item {
  display: flex;
  align-items: center;
}

.breadcrumb__item:not(:last-child)::after {
  content: '/';
  margin: 0 var(--spacing-sm);
  color: var(--text-tertiary);
}

.breadcrumb__link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    color: var(--edu-primary-500);
  }
}

.breadcrumb__separator {
  color: var(--text-tertiary);
}

.breadcrumb__current {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.main-layout__page-content {
  animation: fadeIn var(--edu-duration-normal) var(--edu-easing-in-out);
}

.main-layout__mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--edu-z-overlay);
  opacity: 0;
  visibility: hidden;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

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
  z-index: var(--edu-z-modal);
  backdrop-filter: blur(4px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-base);
}

.loading-spinner__icon {
  width: 40px;
  height: 40px;
  color: var(--edu-primary-500);
  animation: spin 1s linear infinite;
}

.loading-spinner__text {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-layout__content {
    margin-left: 0;
  }

  .main-layout__main {
    padding: var(--spacing-sm);
  }

  .main-layout__breadcrumb {
    margin-bottom: var(--spacing-sm);
  }

  .breadcrumb__list {
    font-size: var(--font-size-xs);
  }

  .breadcrumb__item:not(:last-child)::after {
    margin: 0 var(--spacing-xs);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .main-layout__loading {
    background-color: rgba(0, 0, 0, 0.8);
  }

  .breadcrumb__link:hover {
    color: var(--edu-primary-300);
  }
}
</style>