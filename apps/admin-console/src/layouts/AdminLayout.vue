<template>
  <div class="admin-layout h-full flex">
    <!-- Sidebar -->
    <div
      :class="[
        'sidebar flex-shrink-0 transition-all duration-300 bg-gray-900 text-white',
        sidebarCollapsed ? 'w-16' : 'w-64'
      ]"
    >
      <AdminSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="flex items-center gap-4">
          <!-- Notifications -->
          <el-badge :value="notificationCount" :hidden="notificationCount === 0">
            <el-button :icon="Bell" circle />
          </el-badge>

          <!-- Language Switcher -->
          <el-dropdown @command="changeLanguage">
            <el-button :icon="Globe" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
                <el-dropdown-item command="en-US">English</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Theme Toggle -->
          <el-button
            :icon="isDark ? Sunny : Moon"
            circle
            @click="toggleTheme"
          />

          <!-- User Menu -->
          <el-dropdown @command="handleUserCommand">
            <div class="flex items-center gap-2 cursor-pointer">
              <el-avatar :src="user?.avatar" :size="32">
                {{ user?.name?.charAt(0) }}
              </el-avatar>
              <span v-if="!sidebarCollapsed" class="text-sm font-medium">
                {{ user?.name }}
              </span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-6">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- System Status Bar -->
    <div class="system-status fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span class="text-xs text-gray-600">系统正常</span>
      </div>
      <el-divider direction="vertical" />
      <div class="text-xs text-gray-600">
        CPU: {{ systemStats.cpu }}% | 内存: {{ systemStats.memory }}%
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { ElMessage } from 'element-plus'
import {
  Bell,
  Globe,
  Moon,
  Sunny,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// State
const sidebarCollapsed = ref(false)
const notificationCount = ref(3)
const systemStats = ref({
  cpu: 25,
  memory: 68
})

// Computed
const user = computed(() => authStore.user)
const isDark = computed(() => themeStore.isDark)

// Breadcrumbs
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string
  }))
})

// Methods
const toggleTheme = () => {
  themeStore.toggleTheme()
}

const changeLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('admin-locale', lang)
  ElMessage.success(lang === 'zh-CN' ? '已切换到中文' : 'Switched to English')
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push({ name: 'UserProfile' })
      break
    case 'settings':
      router.push({ name: 'SystemSettings' })
      break
    case 'logout':
      await authStore.logout()
      break
  }
}

// Mock system stats update
let statsInterval: NodeJS.Timeout

onMounted(() => {
  statsInterval = setInterval(() => {
    systemStats.value = {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100)
    }
  }, 5000)
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})
</script>

<style scoped>
.admin-layout {
  background-color: #f9fafb;
}

.sidebar {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.system-status {
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-breadcrumb__inner.is-link) {
  color: #6b7280;
}

:deep(.el-breadcrumb__inner.is-link:hover) {
  color: #374151;
}
</style>