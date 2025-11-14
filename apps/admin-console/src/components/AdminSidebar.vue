<template>
  <div class="admin-sidebar h-full flex flex-col">
    <!-- Logo -->
    <div class="h-16 flex items-center justify-center border-b border-gray-700">
      <div v-if="!collapsed" class="flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <el-icon size="20"><Monitor /></el-icon>
        </div>
        <span class="text-white font-bold text-lg">Admin</span>
      </div>
      <div v-else class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <el-icon size="20"><Monitor /></el-icon>
      </div>
    </div>

    <!-- Navigation -->
    <el-scrollbar class="flex-1">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        background-color="#111827"
        text-color="#9ca3af"
        active-text-color="#3b82f6"
        router
      >
        <template v-for="item in menuItems" :key="item.name">
          <!-- Single Menu Item -->
          <el-menu-item
            v-if="!item.children && hasPermission(item.permission)"
            :index="item.path"
            :route="{ name: item.name }"
          >
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <template #title>
              <span class="menu-title">{{ item.title }}</span>
            </template>
          </el-menu-item>

          <!-- Submenu -->
          <el-sub-menu
            v-else-if="item.children && hasPermission(item.permission)"
            :index="item.name"
          >
            <template #title>
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span class="menu-title">{{ item.title }}</span>
            </template>

            <el-menu-item
              v-for="child in item.children"
              :key="child.name"
              :index="child.path"
              :route="{ name: child.name }"
            >
              <el-icon v-if="child.icon">
                <component :is="child.icon" />
              </el-icon>
              <template #title>
                <span class="menu-title">{{ child.title }}</span>
              </template>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>

    <!-- Collapse Toggle -->
    <div class="p-4 border-t border-gray-700">
      <el-button
        :icon="collapsed ? Expand : Fold"
        text
        class="w-full justify-center text-gray-400 hover:text-white"
        @click="$emit('toggle')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import {
  Monitor,
  Dashboard,
  OfficeBuilding,
  User,
  Reading,
  Folder,
  Magic,
  Monitor as ClassroomMonitor,
  DataAnalysis,
  Document,
  CircleCheck,
  Setting,
  PieChart,
  Expand,
  Fold
} from '@element-plus/icons-vue'

interface Props {
  collapsed: boolean
}

defineProps<Props>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// Computed
const activeMenu = computed(() => {
  return route.path
})

// Permission check
const hasPermission = (permission?: string) => {
  if (!permission) return true
  return authStore.hasPermission(permission)
}

// Menu items
const menuItems = computed(() => [
  {
    name: 'Dashboard',
    path: '/',
    title: t('navigation.dashboard'),
    icon: Dashboard,
    permission: null
  },
  {
    name: 'TenantGroup',
    path: '/tenants',
    title: t('navigation.tenants'),
    icon: OfficeBuilding,
    permission: 'tenant:read'
  },
  {
    name: 'UserGroup',
    path: '/users',
    title: t('navigation.users'),
    icon: User,
    permission: 'user:read'
  },
  {
    name: 'CourseGroup',
    path: '/courses',
    title: t('navigation.courses'),
    icon: Reading,
    permission: 'course:read'
  },
  {
    name: 'ResourceGroup',
    path: '/resources',
    title: t('navigation.resources'),
    icon: Folder,
    permission: 'resource:read'
  },
  {
    name: 'AIContentGroup',
    path: '/ai-content',
    title: t('navigation.aiContent'),
    icon: Magic,
    permission: 'ai:read'
  },
  {
    name: 'MonitoringGroup',
    title: '监控管理',
    icon: Monitor,
    permission: null,
    children: [
      {
        name: 'Classrooms',
        path: '/classrooms',
        title: t('navigation.classrooms'),
        icon: ClassroomMonitor,
        permission: 'classroom:read'
      },
      {
        name: 'Experiments',
        path: '/experiments',
        title: t('navigation.experiments'),
        icon: DataAnalysis,
        permission: 'experiment:read'
      }
    ]
  },
  {
    name: 'AuditLogs',
    path: '/audit',
    title: t('navigation.auditLogs'),
    icon: Document,
    permission: 'audit:read'
  },
  {
    name: 'SystemGroup',
    title: '系统管理',
    icon: Setting,
    permission: null,
    children: [
      {
        name: 'SystemHealth',
        path: '/system-health',
        title: t('navigation.systemHealth'),
        icon: CircleCheck,
        permission: 'system:read'
      },
      {
        name: 'Policies',
        path: '/policies',
        title: t('navigation.policies'),
        icon: Setting,
        permission: 'policy:read'
      },
      {
        name: 'Quotas',
        path: '/quotas',
        title: t('navigation.quotas'),
        icon: PieChart,
        permission: 'quota:read'
      }
    ]
  }
])
</script>

<style scoped>
.admin-sidebar {
  background: linear-gradient(180deg, #111827 0%, #1f2937 100%);
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

:deep(.el-sub-menu__title) {
  margin: 2px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-sub-menu__title:hover) {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 48px !important;
  margin: 2px 8px;
  border-radius: 6px;
}

:deep(.el-menu--collapse .el-sub-menu > .el-sub-menu__title) {
  padding: 0 20px;
}
</style>