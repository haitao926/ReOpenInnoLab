<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <AppSidebar />

    <!-- 主内容区 -->
    <div class="main-content" :class="{ collapsed: appStore.isCollapsed }">
      <!-- 顶部导航 -->
      <AppHeader />

      <!-- 页面内容 -->
      <main class="page-content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component, route }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- AI助手浮动组件 -->
    <AIAssistantFloat />

    <!-- 全局通知 -->
    <GlobalNotification />

    <!-- 错误边界 -->
    <ErrorBoundary />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import AIAssistantFloat from '@/components/ai/AIAssistantFloat.vue'
import GlobalNotification from '@/components/common/GlobalNotification.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const appStore = useAppStore()
const userStore = useUserStore()

// 初始化应用
onMounted(async () => {
  // 初始化应用设置
  appStore.initialize()

  // 初始化用户信息
  userStore.initializeFromStorage()

  // 如果有token，获取用户信息
  if (userStore.token) {
    try {
      await userStore.getUserInfo()
    } catch (error) {
      console.error('初始化用户信息失败:', error)
    }
  }
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.main-content {
  margin-left: 240px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-content.collapsed {
  margin-left: 64px;
}

.page-content {
  flex: 1;
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .main-content.collapsed {
    margin-left: 0;
  }

  .page-content {
    padding: 16px;
  }

  .content-wrapper {
    border-radius: 0;
    box-shadow: none;
  }
}

/* 深色模式适配 */
.dark .main-layout {
  background-color: var(--el-bg-color-page);
}

.dark .content-wrapper {
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>