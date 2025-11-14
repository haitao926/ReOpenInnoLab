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
            <span class="nav-item-icon" :class="`nav-icon-${item.path.replace('/', '')}`">
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
            <span class="nav-item-icon" :class="`nav-icon-${item.path.replace('/', '')}`">
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
    path: '/analytics',
    label: '学习分析',
    description: '数据洞察与预警提醒',
    icon: 'TrendCharts'
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
  height: 100vh;
  padding: 20px clamp(10px, 2vw, 16px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #1e293b !important;
  color: #f1f5f9 !important;
  position: relative;
  overflow: hidden;
  border-right: 1px solid #334155;
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
  gap: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px; /* 为滚动条留出空间 */
  margin-bottom: 20px; /* 与底部区域的间距 */
  min-height: 0; /* 允许flex子元素缩小 */
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
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
  color: #f1f5f9 !important;
}

.brand-tagline {
  font-size: 12px;
  color: #cbd5e1 !important;
  letter-spacing: 0.01em;
}

.sidebar.collapsed .brand {
  padding: 12px 10px;
  border-radius: 12px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  color: #e2e8f0 !important;
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
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
  color: rgba(255, 255, 255, 0.92);
  flex-shrink: 0;
  font-size: 18px;
  position: relative;
  overflow: hidden;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
}

.nav-item-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  opacity: 0;
  transition: opacity var(--edu-duration-normal) var(--edu-easing-smooth);
}

.nav-item:hover .nav-item-icon {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.12) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-item:hover .nav-item-icon::before {
  opacity: 1;
}

.nav-item.active .nav-item-icon {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.16) 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.nav-item.active .nav-item-icon::before {
  opacity: 1;
}

.nav-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.nav-item-description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.64);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.nav-item--compact {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
}

.section-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #94a3b8 !important;
  padding: 0 4px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  margin: 0 -20px -20px -20px; /* 扩展到容器边缘，底部贴边 */
  border-top: 1px solid rgba(255, 255, 255, 0.08); /* 分隔线 */
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  margin-top: auto; /* 推到底部 */
  flex-shrink: 0; /* 防止底部区域被压缩 */
}

.sidebar-meta {
  display: flex;
  justify-content: center;
}

.meta-card {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1 !important;
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
  color: #94a3b8 !important;
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

/* 导航项特定颜色主题 */
.nav-icon-dashboard {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
}

.nav-icon-courses {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
}

.nav-icon-experiences {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
}

.nav-icon-labs {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
}

.nav-icon-assignments {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
}

.nav-icon-analytics {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
}

.nav-icon-classrooms {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
}

.nav-icon-resources {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%) !important;
}

.nav-icon-settings {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
}

/* 激活状态的特殊效果 */
.nav-item.active .nav-icon-dashboard,
.nav-item.active .nav-icon-courses,
.nav-item.active .nav-icon-experiences,
.nav-item.active .nav-icon-labs,
.nav-item.active .nav-icon-assignments,
.nav-item.active .nav-icon-analytics,
.nav-item.active .nav-icon-classrooms,
.nav-item.active .nav-icon-resources,
.nav-item.active .nav-icon-settings {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3) !important;
}

/* 悬停状态的特殊效果 */
.nav-item:hover .nav-icon-dashboard,
.nav-item:hover .nav-icon-courses,
.nav-item:hover .nav-icon-experiences,
.nav-item:hover .nav-icon-labs,
.nav-item:hover .nav-icon-assignments,
.nav-item:hover .nav-icon-analytics,
.nav-item:hover .nav-icon-classrooms,
.nav-item:hover .nav-icon-resources,
.nav-item:hover .nav-icon-settings {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
}
</style>
