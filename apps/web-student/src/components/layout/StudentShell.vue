<template>
  <div class="student-shell">
    <!-- 顶部导航栏 -->
    <header class="shell-header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/dashboard" class="logo-link">
            <h1 class="app-title">ReOpenInnoLab</h1>
          </router-link>
          <nav class="main-nav">
            <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
              <el-icon><House /></el-icon>
              <span>学习台</span>
            </router-link>
            <router-link to="/courses" class="nav-item" :class="{ active: $route.path.startsWith('/courses') }">
              <el-icon><Reading /></el-icon>
              <span>课程</span>
            </router-link>
            <router-link to="/assignments" class="nav-item" :class="{ active: $route.path.startsWith('/assignments') }">
              <el-icon><Document /></el-icon>
              <span>作业</span>
            </router-link>
          </nav>
        </div>

        <div class="header-right">
          <!-- 全局搜索 -->
          <div class="search-container" v-if="showSearch">
            <GlobalSearch
              placeholder="搜索课程、作业、实验..."
              :expandable="false"
              @search="handleGlobalSearch"
              @result-click="handleSearchResult"
              @close="handleSearchClose"
            />
          </div>

          <!-- 通知中心 -->
          <el-badge :value="unreadNotifications" class="notification-badge">
            <el-button :icon="Bell" circle size="large" @click="toggleNotifications" />
          </el-badge>

          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-avatar">
              <el-avatar :src="userStore.avatar" :size="40">
                {{ userStore.name?.charAt(0) }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <!-- 面包屑导航 -->
    <div class="breadcrumb-container" v-if="showBreadcrumb">
      <div class="breadcrumb-content">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">学习控制台</el-breadcrumb-item>
          <el-breadcrumb-item
            v-for="item in breadcrumbItems"
            :key="item.path"
            :to="item.path ? { path: item.path } : undefined"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 主内容区域 -->
    <main class="shell-main">
      <router-view />
    </main>

    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawerVisible"
      title="通知中心"
      direction="rtl"
      size="400px"
    >
      <NotificationCenter />
    </el-drawer>

    <!-- 全局加载状态 -->
    <el-loading-service v-if="globalLoading" />

    <!-- 全局AI助手 -->
    <ContextAwareAIAssistant
      :activity-context="globalActivityContext"
      :show-label="true"
      :position="'bottom-right'"
      :floating-hints="true"
      :auto-open="false"
    />

    <!-- 全局状态管理 -->
    <GlobalStatus />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  House, Reading, Document, Search, Bell, User, Setting, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'
import NotificationCenter from '@/components/common/NotificationCenter.vue'
import ContextAwareAIAssistant from '@/components/ai/ContextAwareAIAssistant.vue'
import GlobalSearch from '@/components/search/GlobalSearch.vue'
import GlobalStatus from '@/components/common/GlobalStatus.vue'
import type { ActivityContext } from '@/types/course'
import type { SearchResult } from '@/services/search/search.service'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const courseStore = useCourseStore()

// 搜索功能
const showSearch = ref(true)

// 通知功能
const notificationDrawerVisible = ref(false)
const unreadNotifications = ref(3) // 临时数据，后续从store获取

// 全局加载状态
const globalLoading = ref(false)

// 全局AI上下文
const globalActivityContext = ref<ActivityContext | null>(null)

// 面包屑功能
const showBreadcrumb = computed(() => {
  // 在学习控制台不显示面包屑
  return route.name !== 'StudentDashboard'
})

const breadcrumbItems = computed(() => {
  const items: Array<{ title: string; path?: string }> = []

  // 根据路由生成面包屑
  if (route.path.startsWith('/courses')) {
    items.push({ title: '课程', path: '/courses' })

    if (route.params.courseId) {
      const course = courseStore.currentCourse
      items.push({
        title: course?.title || '课程学习',
        path: undefined // 当前页面不添加链接
      })
    }
  } else if (route.path.startsWith('/assignments')) {
    items.push({ title: '作业', path: '/assignments' })

    if (route.params.id) {
      items.push({ title: '作业提交', path: undefined })
    }
  } else if (route.path.startsWith('/lab')) {
    items.push({ title: '虚拟实验', path: '/lab' })

    if (route.name === 'VirtualLabAgent') {
      items.push({ title: '实验代理', path: undefined })
    }
  } else if (route.path.startsWith('/profile')) {
    items.push({ title: '个人中心', path: undefined })
  } else if (route.path.startsWith('/settings')) {
    items.push({ title: '设置', path: undefined })
  } else if (route.name === 'NotFound') {
    items.push({ title: '页面不存在', path: undefined })
  }

  return items
})

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + K 打开搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const searchInput = document.querySelector('.global-search .el-input__inner') as HTMLInputElement
    searchInput?.focus()
  }

  // ESC 关闭通知抽屉
  if (e.key === 'Escape' && notificationDrawerVisible.value) {
    notificationDrawerVisible.value = false
  }
}

const handleGlobalSearch = (query: string) => {
  console.log('Global search:', query)
  // 搜索逻辑已在GlobalSearch组件内部处理
}

const handleSearchResult = (result: SearchResult) => {
  console.log('Search result clicked:', result)
  // 导航逻辑已在GlobalSearch组件内部处理
}

const handleSearchClose = () => {
  console.log('Search closed')
}

const toggleNotifications = () => {
  notificationDrawerVisible.value = !notificationDrawerVisible.value
  if (notificationDrawerVisible.value) {
    unreadNotifications.value = 0 // 标记为已读
  }
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // 监听网络状态
  window.addEventListener('online', () => {
    ElMessage.success('网络已连接')
  })

  window.addEventListener('offline', () => {
    ElMessage.warning('网络已断开，部分功能可能受影响')
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.student-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-color);
}

.shell-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--edu-border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo-link {
  text-decoration: none;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--edu-primary-600);
  margin: 0;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--edu-text-secondary);
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--edu-primary-600);
  }

  &.active {
    background: var(--edu-primary-500);
    color: white;
  }

  .el-icon {
    font-size: 16px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-container {
  width: 350px;
  flex-shrink: 0;
}

.notification-badge {
  cursor: pointer;
}

.user-avatar {
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
}

.breadcrumb-container {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--edu-border-color);
  padding: 0 24px;
}

.breadcrumb-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 0;
}

.shell-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    height: 56px;
  }

  .header-left {
    gap: 16px;
  }

  .main-nav {
    gap: 4px;
  }

  .nav-item {
    padding: 6px 12px;
    font-size: 14px;

    span {
      display: none;
    }
  }

  .search-container {
    width: 250px;
  }

  .app-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .search-container {
    display: none;
  }
}
</style>