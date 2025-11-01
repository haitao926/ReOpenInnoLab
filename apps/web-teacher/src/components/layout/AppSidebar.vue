<template>
  <aside class="app-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div v-if="!isCollapsed" class="logo">
        <img src="/logo.svg" alt="Logo" class="logo-icon" />
        <span class="logo-text">智能教育</span>
      </div>
      <div v-else class="logo-collapsed">
        <img src="/logo.svg" alt="Logo" class="logo-icon" />
      </div>
    </div>

    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="route.children && route.children.length > 0"
            :index="route.path"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="child.meta.icon" />
              </el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="route.path">
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <span>{{ route.meta?.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>

    <div class="sidebar-footer">
      <div v-if="!isCollapsed" class="footer-info">
        <div class="version">v1.0.0</div>
        <div class="status">
          <el-tag size="small" type="success">在线</el-tag>
        </div>
      </div>
      <el-button
        v-else
        type="text"
        :icon="Expand"
        class="expand-btn"
        @click="toggleSidebar"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Expand } from '@element-plus/icons-vue'
import {
  Dashboard,
  Reading,
  School,
  EditPen,
  Science,
  TrendCharts,
  User,
  Setting
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { routes } from '@/router'

const route = useRoute()
const appStore = useAppStore()

// 计算属性
const isCollapsed = computed(() => appStore.isCollapsed)
const activeMenu = computed(() => route.path)

// 菜单路由配置
const menuRoutes = computed(() => {
  const mainRoute = routes.find(r => r.name === 'Layout')
  if (!mainRoute || !mainRoute.children) return []

  return mainRoute.children
    .filter(child => !child.meta?.hidden && child.meta?.title)
    .map(child => ({
      path: child.path,
      meta: child.meta,
      children: child.children?.filter(subChild => !subChild.meta?.hidden) || []
    }))
})

// 方法
const toggleSidebar = () => {
  appStore.toggleSidebar()
}
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 240px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.app-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.sidebar-scrollbar {
  flex: 1;
  overflow-y: auto;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  height: 48px;
  line-height: 48px;
  margin: 2px 8px;
  border-radius: 6px;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.sidebar-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary);
  color: white;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  padding-left: 48px !important;
}

.sidebar-menu.collapsed .el-sub-menu .el-menu-item {
  padding-left: 20px !important;
}

.sidebar-footer {
  height: 60px;
  padding: 0 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.version {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-btn {
  width: 100%;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
  }

  .app-sidebar.mobile-open {
    transform: translateX(0);
  }

  .app-sidebar.collapsed {
    width: 240px;
  }
}

/* 深色模式适配 */
.dark .app-sidebar {
  background: var(--el-bg-color-page);
  border-right-color: var(--el-border-color);
}

.dark .sidebar-menu .el-menu-item:hover,
.dark .sidebar-menu .el-sub-menu__title:hover {
  background-color: var(--el-color-primary-dark-2);
}
</style>