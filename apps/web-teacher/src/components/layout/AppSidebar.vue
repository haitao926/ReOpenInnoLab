<template>
  <nav class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-top">
      <div class="brand" @click="navigateTo('/dashboard')">
        <img src="/logo.svg" alt="智能教育平台" class="brand-logo" />
        <transition name="fade">
          <div v-if="!isCollapsed" class="brand-text">
            <span class="brand-name">智能教育教师端</span>
            <span class="brand-tagline">Teaching Control Center</span>
          </div>
        </transition>
      </div>

      <div class="sidebar-section primary">
        <transition-group name="list" tag="div" class="nav-group">
          <button
            v-for="item in primaryNav"
            :key="item.path"
            type="button"
            class="nav-item"
            :class="{ active: activePath === item.path }"
            :aria-label="item.label"
            @click="navigateTo(item.path)"
          >
            <span class="nav-item-icon">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
            </span>
            <transition name="fade">
              <span v-if="!isCollapsed" class="nav-item-text">
                <span class="nav-item-title">{{ item.label }}</span>
                <span class="nav-item-description">{{ item.description }}</span>
              </span>
            </transition>
          </button>
        </transition-group>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div class="sidebar-section secondary">
        <span v-if="!isCollapsed" class="section-label">辅助模块</span>
        <div class="nav-group">
          <button
            v-for="item in secondaryNav"
            :key="item.path"
            type="button"
            class="nav-item nav-item--compact"
            :class="{ active: activePath === item.path }"
            :aria-label="item.label"
            @click="navigateTo(item.path)"
          >
            <span class="nav-item-icon">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
            </span>
            <transition name="fade">
              <span v-if="!isCollapsed" class="nav-item-text">
                <span class="nav-item-title">{{ item.label }}</span>
                <span v-if="item.description" class="nav-item-description">{{ item.description }}</span>
              </span>
            </transition>
          </button>
        </div>
      </div>

      <div class="sidebar-meta">
        <transition name="fade">
          <div v-if="!isCollapsed" class="meta-card">
            <div class="meta-status">
              <span class="status-dot" :class="onlineStatusClass"></span>
              <span>{{ onlineStatusText }}</span>
            </div>
            <div class="meta-version">版本 v1.0.0</div>
          </div>
        </transition>
        <button
          v-if="isCollapsed"
          type="button"
          class="meta-toggle"
          :aria-label="isCollapsed ? '展开导航' : '收起导航'"
          @click="appStore.toggleSidebar()"
        >
          <el-icon><Expand /></el-icon>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Expand } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

interface NavItem {
  path: string
  label: string
  description?: string
  icon: string
}

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const { isCollapsed, onlineStatus } = storeToRefs(appStore)

const primaryNav: NavItem[] = [
  {
    path: '/dashboard',
    label: '控制台',
    description: '今日任务与教学全景',
    icon: 'House'
  },
  {
    path: '/courses',
    label: '课程管理',
    description: '课程资源与内容编排',
    icon: 'Reading'
  },
  {
    path: '/experiences',
    label: '体验管理',
    description: '互动体验与沉浸内容管理',
    icon: 'Monitor'
  },
  {
    path: '/labs',
    label: '实验管理',
    description: '实验流程管理与监控',
    icon: 'Science'
  },
  {
    path: '/assignments',
    label: '作业管理',
    description: '作业批改与反馈闭环',
    icon: 'EditPen'
  },
  {
    path: '/analytics',
    label: '学习分析',
    description: '数据洞察与预警提醒',
    icon: 'TrendCharts'
  }
]

const secondaryNav: NavItem[] = [
  {
    path: '/classrooms',
    label: '班级控制台',
    description: '班级画像与学情跟踪',
    icon: 'School'
  },
  {
    path: '/resources',
    label: '资源中心',
    description: '素材资产与版权管理',
    icon: 'Collection'
  },
  {
    path: '/settings',
    label: '系统设置',
    description: '角色偏好与系统配置',
    icon: 'Setting'
  }
]

const navIndex = computed(() => [...primaryNav, ...secondaryNav])

const activePath = computed(() => {
  const current = route.path
  const match = navIndex.value.find(item =>
    current === item.path || current.startsWith(`${item.path}/`)
  )
  return match ? match.path : '/dashboard'
})

const onlineStatusClass = computed(() => (onlineStatus.value ? 'is-online' : 'is-offline'))
const onlineStatusText = computed(() => (
  onlineStatus.value ? '在线 · 学习数据实时同步' : '离线 · 将在联网后同步'
))

const navigateTo = (path: string) => {

  if (path !== route.path) {
    router.push(path)
  }

  if (typeof window !== 'undefined' && window.innerWidth < 960) {
    appStore.setSidebarCollapsed(true)
  }
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  padding: 24px clamp(12px, 2.5vw, 20px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.9) 100%);
  color: rgba(255, 255, 255, 0.88);
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% -20%, rgba(59, 130, 246, 0.4), transparent 55%),
    radial-gradient(circle at 90% 10%, rgba(147, 197, 253, 0.35), transparent 55%);
  opacity: 0.9;
  pointer-events: none;
}

.sidebar > * {
  position: relative;
  z-index: 1;
}

.sidebar.collapsed {
  padding: 24px 12px;
  align-items: center;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  border-radius: 16px;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);
}

.brand:hover {
  background: rgba(255, 255, 255, 0.08);
}

.brand-logo {
  width: 40px;
  height: 40px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
}

.brand-tagline {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 0.01em;
}

.sidebar.collapsed .brand {
  padding: 12px 10px;
  border-radius: 12px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  color: inherit;
  cursor: pointer;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.9));
  border-color: transparent;
  box-shadow: 0 18px 35px -25px rgba(59, 130, 246, 0.9);
}

.nav-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  flex-shrink: 0;
}

.nav-item.active .nav-item-icon {
  background: rgba(255, 255, 255, 0.16);
}

.nav-item-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.nav-item-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item--compact {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
}

.section-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.45);
  padding: 0 4px;
}

.sidebar-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-meta {
  display: flex;
  justify-content: center;
}

.meta-card {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
}

.status-dot.is-offline {
  background: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.14);
}

.meta-version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.meta-toggle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
}

.meta-toggle:hover {
  background: rgba(255, 255, 255, 0.16);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed .nav-item:hover {
  transform: none;
}

.sidebar.collapsed .nav-item-icon {
  width: 36px;
  height: 36px;
}

.sidebar.collapsed .nav-item-description,
.sidebar.collapsed .section-label {
  display: none;
}

.fade-enter-active,
.fade-leave-active,
.list-enter-active,
.list-leave-active {
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 960px) {
  .sidebar {
    padding-top: 36px;
    padding-bottom: 32px;
    border-radius: 0 24px 24px 0;
  }

  .sidebar.collapsed {
    padding-top: 24px;
  }

  .meta-toggle {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .brand,
  .fade-enter-active,
  .fade-leave-active,
  .list-enter-active,
  .list-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
