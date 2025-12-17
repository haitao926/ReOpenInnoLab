```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { AppSidebar } from '@reopeninnolab/ui-kit'
import AppHeader from './AppHeader.vue'
import AIAssistantFloat from '@/components/ai/AIAssistantFloat.vue'
import { useAppStore } from '@/stores/app'
import brandLogo from '@/assets/brand-logo.png'
import {
  Odometer,
  Reading,
  Pouring,
  ChatDotRound,
  Files,
  DataAnalysis,
  Setting,
  User
} from '@element-plus/icons-vue'

const appStore = useAppStore()

const layoutClasses = computed(() => ({
  'is-collapsed': appStore.isCollapsed
}))

const menuItems = [
  {
    key: 'dashboard',
    label: '控制台',
    to: '/dashboard',
    icon: Odometer
  },
  {
    key: 'class',
    label: '班级管理',
    to: '/class',
    icon: User
  },
  {
    key: 'courses',
    label: '课程管理',
    to: '/courses',
    icon: Reading
  },
  {
    key: 'labs',
    label: '实验管理',
    to: '/labs',
    icon: Pouring
  },
  {
    key: 'experience',
    label: '体验管理',
    to: '/experiences',
    icon: ChatDotRound
  }
]

const bottomMenuItems = [
  {
    key: 'resources',
    label: '资源中心',
    to: '/resources',
    icon: Files
  },
  {
    key: 'analytics',
    label: '学情分析',
    to: '/analytics',
    icon: DataAnalysis
  },
  {
    key: 'settings',
    label: '系统设置',
    to: '/settings',
    icon: Setting
  }
]

onMounted(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    appStore.setSidebarCollapsed(true)
  }
})
</script>

<template>
  <div class="main-layout" :class="layoutClasses">
    <aside class="layout-sidebar">
      <!-- 折叠按钮 -->
      <button type="button" class="sidebar-toggle-btn" @click="appStore.toggleSidebar">
        <svg
          class="sidebar-toggle-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline :points="appStore.isCollapsed ? '13 19 7 12 13 5' : '11 19 17 12 11 5'" />
        </svg>
      </button>

      <AppSidebar
        :collapsed="appStore.isCollapsed"
        :logo="brandLogo"
        title="ReOpenInnoLab"
        :menuItems="menuItems"
        :bottomMenuItems="bottomMenuItems"
        @toggleCollapse="appStore.toggleSidebar"
      />
    </aside>

    <div class="layout-main">
      <header class="layout-header">
        <AppHeader />
      </header>

      <main class="layout-content">
        <div class="content-scroller">
          <div class="content-surface">
            <router-view v-slot="{ Component }">
              <transition name="fade-slide" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </div>
      </main>
    </div>

    <AIAssistantFloat />
  </div>
</template>

<style scoped>
  .main-layout {
    min-height: 100vh; /* Let content drive height while keeping app feel */
    display: grid;
    grid-template-columns: var(--edu-sidebar-width) 1fr;
    background: var(--edu-color-gray-50);
    transition: grid-template-columns var(--edu-duration-normal) var(--edu-easing-smooth);
  }

  .main-layout.is-collapsed {
    grid-template-columns: var(--edu-sidebar-collapsed-width) 1fr;
  }

  .layout-sidebar {
    position: relative;
    background: #F9FAFB; /* Gaoding Style: Light Gray */
    border-right: 1px solid var(--edu-border-color-light);
    overflow: hidden;
    display: flex;
  }

  /* Custom Sidebar Toggle Button - distinct from header toggle */
  .sidebar-toggle-btn {
    display: none; /* Hidden as per user request for cleaner layout */
  }



  .layout-main {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: transparent;
    overflow: hidden;
  }

  .layout-header {
    position: sticky;
    top: 0;
    z-index: var(--edu-z-index-40); /* Standardized z-index */
    backdrop-filter: blur(14px);
    background: rgba(255, 255, 255, 0.8);
    border-bottom: 1px solid var(--edu-border-color-light);
    flex-shrink: 0;
  }

  .layout-content {
    flex: 1;
    position: relative;
    overflow: hidden; /* Internal scrolling handled by scroller */
  }

  .content-scroller {
    height: 100%;
    overflow-y: auto;
    padding: var(--edu-spacing-8) clamp(24px, 4vw, 48px);
    scroll-behavior: smooth;
  }

  .content-surface {
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    border: none;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition:
      opacity var(--edu-duration-normal) var(--edu-easing-smooth),
      transform var(--edu-duration-normal) var(--edu-easing-smooth);
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(12px);
  }

  @media (max-width: 1280px) {
    .main-layout {
      grid-template-columns: var(--edu-sidebar-collapsed-width) 1fr;
    }
  }

  @media (max-width: 960px) {
    .main-layout {
      grid-template-columns: 1fr;
    }

    .layout-sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      width: 260px;
      z-index: var(--edu-z-index-50);
      transform: translateX(-100%);
      transition: transform var(--edu-duration-normal) var(--edu-easing-smooth);
      box-shadow: var(--edu-shadow-lg);
    }

    .main-layout.is-collapsed .layout-sidebar {
      transform: translateX(-100%);
    }

    .main-layout:not(.is-collapsed) .layout-sidebar {
      transform: translateX(0);
    }

    .layout-main {
      min-height: 100vh;
      background: var(--edu-color-gray-50);
    }

    .content-scroller {
      padding: var(--edu-spacing-4);
      min-height: auto; /* 移动端不限制最小高度 */
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .main-layout,
    .layout-sidebar,
    .fade-enter-active,
    .fade-leave-active {
      transition-duration: 0ms !important;
    }
  }
</style>
