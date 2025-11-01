<template>
  <div id="app" class="education-platform">
    <!-- 全局加载状态 -->
    <div v-if="globalLoading" class="global-loading">
      <el-loading-service />
    </div>

    <!-- 应用主布局 -->
    <el-container class="app-container">
      <!-- 顶部导航栏 -->
      <el-header class="app-header">
        <AppHeader />
      </el-header>

      <el-container class="main-container">
        <!-- 侧边导航 -->
        <el-aside v-if="showSidebar" class="app-sidebar" :width="sidebarWidth">
          <AppSidebar />
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="app-main">
          <router-view v-slot="{ Component, route }">
            <transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>

    <!-- AI助手悬浮按钮 -->
    <AIAssistantFloat />

    <!-- 全局通知组件 -->
    <GlobalNotification />

    <!-- 错误边界 -->
    <ErrorBoundary />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 组件导入
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AIAssistantFloat from '@/components/ai/AIAssistantFloat.vue'
import GlobalNotification from '@/components/common/GlobalNotification.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

// Store
const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()

// 响应式数据
const globalLoading = ref(false)

// 计算属性
const showSidebar = computed(() => {
  return !route.meta.hideSidebar && appStore.sidebarVisible
})

const sidebarWidth = computed(() => {
  return appStore.sidebarCollapsed ? '64px' : '240px'
})

// 生命周期
onMounted(async () => {
  try {
    globalLoading.value = true

    // 初始化用户信息
    if (!userStore.isAuthenticated) {
      await userStore.initializeAuth()
    }

    // 初始化应用配置
    await appStore.initializeApp()

    // 初始化主题
    appStore.initializeTheme()

    // 连接WebSocket
    const wsService = inject('wsService') as WebSocketService
    if (userStore.isAuthenticated) {
      await wsService.connect()
    }

  } catch (error) {
    console.error('应用初始化失败:', error)
    ElMessage.error('应用初始化失败，请刷新页面重试')
  } finally {
    globalLoading.value = false
  }

  // 监听在线状态
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('resize', handleResize)

  // 断开WebSocket连接
  const wsService = inject('wsService') as WebSocketService
  wsService.disconnect()
})

// 事件处理
const handleOnline = () => {
  appStore.setOnlineStatus(true)
  ElMessage.success('网络连接已恢复')
}

const handleOffline = () => {
  appStore.setOnlineStatus(false)
  ElMessage.warning('网络连接已断开，部分功能可能受限')
}

const handleResize = () => {
  // 移动端自动收起侧边栏
  if (window.innerWidth < 768) {
    appStore.setSidebarCollapsed(true)
  }
}

// 键盘快捷键
const handleKeyboardShortcut = (event: KeyboardEvent) => {
  // Ctrl/Cmd + K: 打开AI助手
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    appStore.toggleAIAssistant()
  }

  // Ctrl/Cmd + /: 切换侧边栏
  if ((event.ctrlKey || event.metaKey) && event.key === '/') {
    event.preventDefault()
    appStore.toggleSidebar()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcut)
})
</script>

<style lang="scss" scoped>
.education-platform {
  height: 100vh;
  overflow: hidden;
  background: var(--edu-bg-color);
}

.app-container {
  height: 100%;
}

.app-header {
  background: var(--edu-header-bg);
  border-bottom: 1px solid var(--edu-border-color);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}

.main-container {
  height: calc(100% - 60px);
}

.app-sidebar {
  background: var(--edu-sidebar-bg);
  border-right: 1px solid var(--edu-border-color);
  transition: width 0.3s var(--edu-ease-smooth);
  overflow: hidden;
}

.app-main {
  padding: 0;
  background: var(--edu-main-bg);
  overflow-y: auto;
  position: relative;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

// 页面切换动画
.page-enter-active,
.page-leave-active {
  transition: all 0.3s var(--edu-ease-smooth);
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 响应式设计
@media (max-width: 768px) {
  .app-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1001;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .app-main {
    padding: 16px;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .app-header {
    border-bottom-width: 2px;
  }

  .app-sidebar {
    border-right-width: 2px;
  }
}

// 减少动画模式
@media (prefers-reduced-motion: reduce) {
  .app-sidebar {
    transition: none;
  }

  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>