<template>
  <div class="main-layout" :class="layoutClasses">
    <aside class="layout-sidebar">
      <AppSidebar />
    </aside>

    <div class="layout-main">
      <header class="layout-header">
        <AppHeader />
      </header>

      <main class="layout-content" role="main">
        <div class="content-scroller">
          <div class="content-surface">
            <router-view v-slot="{ Component, route }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
              </transition>
            </router-view>
          </div>
        </div>
      </main>
    </div>

    <AIAssistantFloat />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import AIAssistantFloat from '@/components/ai/AIAssistantFloat.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const layoutClasses = computed(() => ({
  'is-collapsed': appStore.isCollapsed
}))

onMounted(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    appStore.setSidebarCollapsed(true)
  }
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--edu-sidebar-width) 1fr;
  background: radial-gradient(circle at 0% 0%, rgba(91, 143, 249, 0.08), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(243, 245, 250, 0.9) 100%);
  transition: grid-template-columns var(--edu-duration-normal) var(--edu-easing-smooth);
}

.main-layout.is-collapsed {
  grid-template-columns: var(--edu-sidebar-collapsed-width) 1fr;
}

.layout-sidebar {
  position: relative;
  background: transparent;
  border-right: 1px solid var(--edu-border-color-light);
  backdrop-filter: blur(14px);
}

.layout-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: transparent;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: var(--edu-z-index-dropdown);
  backdrop-filter: blur(14px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.82) 100%);
  border-bottom: 1px solid rgba(209, 213, 219, 0.6);
}

.layout-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.content-scroller {
  height: 100%;
  overflow-y: auto;
  padding: 32px clamp(24px, 4vw, 48px);
}

.content-surface {
  min-height: calc(100vh - var(--edu-header-height));
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  border: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--edu-duration-normal) var(--edu-easing-smooth),
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
    z-index: calc(var(--edu-z-index-modal) - 50);
    transform: translateX(-100%);
    transition: transform var(--edu-duration-normal) var(--edu-easing-smooth);
    box-shadow: 12px 0 40px rgba(15, 23, 42, 0.25);
  }

  .main-layout.is-collapsed .layout-sidebar {
    transform: translateX(-100%);
  }

  .main-layout:not(.is-collapsed) .layout-sidebar {
    transform: translateX(0);
  }

  .layout-main {
    min-height: 100vh;
    background: var(--edu-color-white);
  }

  .content-scroller {
    padding: 16px;
  }

  .content-surface {
    background: transparent;
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .main-layout,
  .layout-sidebar,
  .fade-enter-active,
  .fade-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
