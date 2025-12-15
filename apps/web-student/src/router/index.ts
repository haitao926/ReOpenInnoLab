import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
    path: '/',
    name: 'StudentShell',
    component: () => import('@/components/layout/StudentShell.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/dashboard',
        name: 'StudentDashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: {
          title: '学习控制台',
          requiresAuth: true,
          icon: 'House'
        }
      },
      {
        path: '/courses',
        name: 'CourseList',
        redirect: '/dashboard',
        meta: {
          title: '课程',
          requiresAuth: true,
          icon: 'Reading'
        }
      },
      {
        path: '/assignments/:id/submit',
        name: 'AssignmentSubmission',
        component: () => import('@/views/assignments/Submission.vue'),
        meta: {
          title: '作业提交',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/lab',
        name: 'VirtualLab',
        redirect: '/dashboard',
        meta: {
          title: '虚拟实验',
          requiresAuth: true,
          icon: 'Monitor'
        }
      },
      {
        path: '/lab/agent',
        name: 'VirtualLabAgent',
        component: () => import('@/views/lab/Agent.vue'),
        meta: {
          title: '实验代理',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/profile',
        name: 'StudentProfile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: {
          title: '个人中心',
          icon: 'User',
          requiresAuth: true
        }
      },
      {
        path: '/settings',
        name: 'StudentSettings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: {
          title: '设置',
          icon: 'Setting',
          requiresAuth: true
        }
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/error/NotFoundView.vue'),
        meta: {
          title: '页面不存在',
          requiresAuth: true,
          hidden: true
        }
      }
    ]
  },
  {
    path: '/courses/:courseId',
    component: () => import('@/layouts/FocusedLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'CourseWorkspace',
        component: () => import('@/views/Course/CourseWorkspace.vue'),
        meta: {
          title: '课程学习',
          requiresAuth: true
        }
      },
      {
        path: 'activity/:activityId',
        name: 'CourseActivity',
        component: () => import('@/views/Course/CourseWorkspace.vue'),
        meta: {
          title: '课程活动',
          requiresAuth: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  document.title = to.meta?.title ? `${to.meta.title} - ReOpenInnoLab 学习平台` : 'ReOpenInnoLab 学习平台'

  // 检查是否需要认证
  if (to.meta?.requiresAuth !== false) {
    // 检查用户是否已登录
    if (!userStore.isAuthenticated) {
      // 尝试从本地存储恢复用户信息
      const token = localStorage.getItem('auth_token')
      const userInfo = localStorage.getItem('user_info')

      if (token && userInfo) {
        try {
          // 解析用户信息
          const userData = JSON.parse(userInfo)
          const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')

          // 设置用户状态
          userStore.$patch({
            token: token,
            user: userData,
            permissions: permissions
          })

          console.log('学生端：从本地存储恢复用户信息:', userData.name)
        } catch (error) {
          console.error('恢复用户信息失败:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_info')
          localStorage.removeItem('user_permissions')
        }
      }

      // 如果恢复后仍未登录，跳转到登录页
      if (!userStore.isAuthenticated) {
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }

  // 如果已登录用户访问登录页，重定向到控制台
  if (to.name === 'Login' && userStore.isAuthenticated) {
    next({ name: 'StudentDashboard' })
    return
  }

  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  // 可以在这里添加错误报告逻辑
})

export default router

// 导出路由配置供其他地方使用
export { routes }