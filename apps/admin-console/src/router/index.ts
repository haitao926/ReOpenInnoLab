import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      layout: 'auth'
    }
  },
  {
    path: '/auth/sso/callback',
    name: 'SSOCallback',
    component: () => import('@/views/auth/SSOCallbackView.vue'),
    meta: {
      title: 'SSO登录中...',
      requiresAuth: false,
      layout: 'auth'
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'Dashboard'
        }
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('@/views/tenants/TenantList.vue'),
        meta: {
          title: '租户管理',
          icon: 'OfficeBuilding',
          permission: 'tenant:read'
        }
      },
      {
        path: 'tenants/:id',
        name: 'TenantDetail',
        component: () => import('@/views/tenants/TenantDetail.vue'),
        meta: {
          title: '租户详情',
          hidden: true,
          permission: 'tenant:read'
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          permission: 'user:read'
        }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/courses/CourseList.vue'),
        meta: {
          title: '课程管理',
          icon: 'Reading',
          permission: 'course:read'
        }
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('@/views/resources/ResourceList.vue'),
        meta: {
          title: '资源管理',
          icon: 'Folder',
          permission: 'resource:read'
        }
      },
      {
        path: 'ai-content',
        name: 'AIContent',
        component: () => import('@/views/ai-content/AIContentManagement.vue'),
        meta: {
          title: 'AI内容监管',
          icon: 'Magic',
          permission: 'ai:read'
        }
      },
      {
        path: 'classrooms',
        name: 'Classrooms',
        component: () => import('@/views/classrooms/ClassroomMonitoring.vue'),
        meta: {
          title: '课堂监控',
          icon: 'Monitor',
          permission: 'classroom:read'
        }
      },
      {
        path: 'experiments',
        name: 'Experiments',
        component: () => import('@/views/experiments/ExperimentMonitoring.vue'),
        meta: {
          title: '实验监控',
          icon: 'DataAnalysis',
          permission: 'experiment:read'
        }
      },
      {
        path: 'audit',
        name: 'AuditLogs',
        component: () => import('@/views/audit/AuditLogList.vue'),
        meta: {
          title: '审计日志',
          icon: 'Document',
          permission: 'audit:read'
        }
      },
      {
        path: 'system-health',
        name: 'SystemHealth',
        component: () => import('@/views/system/SystemHealth.vue'),
        meta: {
          title: '系统健康',
          icon: 'CircleCheck',
          permission: 'system:read'
        }
      },
      {
        path: 'policies',
        name: 'Policies',
        component: () => import('@/views/policies/PolicyManagement.vue'),
        meta: {
          title: '策略管理',
          icon: 'Setting',
          permission: 'policy:read'
        }
      },
      {
        path: 'quotas',
        name: 'Quotas',
        component: () => import('@/views/quotas/QuotaManagement.vue'),
        meta: {
          title: '配额管理',
          icon: 'PieChart',
          permission: 'quota:read'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Admin Console`
  }

  // Check authentication
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      await authStore.checkAuth()
      if (!authStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }

    // Check permissions
    if (to.meta.permission && !authStore.hasPermission(to.meta.permission as string)) {
      next({ name: 'Dashboard' })
      return
    }
  }

  // Redirect authenticated users away from login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router