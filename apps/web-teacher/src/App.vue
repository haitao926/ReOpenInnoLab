<template>
  <div id="app" class="app-shell">
    <div v-if="globalLoading" class="global-loading">
      <el-icon class="is-loading" size="32">
        <Loading />
      </el-icon>
    </div>

    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>

    <GlobalNotification />
    <ErrorBoundary />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import type { WebSocketService } from '@/services/websocket'

import GlobalNotification from '@/components/common/GlobalNotification.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

const appStore = useAppStore()
const userStore = useUserStore()

const globalLoading = ref(true)
const autoCollapsed = ref(false)
const wsService = inject('wsService', null) as WebSocketService | null

const handleOnline = () => {
  appStore.setOnlineStatus(true)
  ElMessage.success('网络连接已恢复')
}

const handleOffline = () => {
  appStore.setOnlineStatus(false)
  ElMessage.warning('网络连接已断开，部分功能可能受限')
}

const handleResize = () => {
  if (typeof window === 'undefined') return

  const shouldCollapse = window.innerWidth < 1024

  if (shouldCollapse && !autoCollapsed.value) {
    autoCollapsed.value = true
    appStore.setSidebarCollapsed(true)
  } else if (!shouldCollapse && autoCollapsed.value) {
    autoCollapsed.value = false
    appStore.setSidebarCollapsed(false)
  }
}

const handleKeyboardShortcut = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    appStore.toggleAIAssistant()
  }

  if ((event.ctrlKey || event.metaKey) && event.key === '/') {
    event.preventDefault()
    appStore.toggleSidebar()
  }
}

onMounted(async () => {
  try {
    globalLoading.value = true

    if (!userStore.isAuthenticated) {
      await userStore.initializeAuth()
    }

    await appStore.initializeApp()
    appStore.initializeTheme()

    if (userStore.isAuthenticated && wsService) {
      try {
        await wsService.connect()
      } catch (error) {
        console.warn('WebSocket连接失败，应用将在离线模式下运行:', error)
        // WebSocket连接失败不应该阻止应用初始化
      }
    }
  } catch (error) {
    console.error('应用初始化失败:', error)
    ElMessage.error('应用初始化失败，请刷新页面重试')
  } finally {
    globalLoading.value = false
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeyboardShortcut)

  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeyboardShortcut)

  if (wsService) {
    wsService.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.app-shell {
  min-height: 100vh;
  background: var(--edu-color-gray-50);
  color: var(--edu-text-primary);
  position: relative;
}

.global-loading {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.page-enter-active,
.page-leave-active {
  transition: opacity var(--edu-duration-normal) var(--edu-easing-smooth),
    transform var(--edu-duration-normal) var(--edu-easing-smooth);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
