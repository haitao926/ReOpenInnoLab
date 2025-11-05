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
    name: 'Layout',
    component: () => import('@/components/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: {
          title: '控制台',
          icon: 'Dashboard',
          requiresAuth: true
        }
      },
      {
        path: '/courses',
        name: 'Courses',
        component: () => import('@/views/Courses/List.vue'),
        meta: {
          title: '课程管理',
          icon: 'Reading',
          requiresAuth: true
        }
      },
      {
        path: '/labs',
        name: 'LabLibrary',
        component: () => import('@/views/VirtualLab/LabLibrary.vue'),
        meta: {
          title: '实验管理',
          icon: 'Science',
          requiresAuth: true
        }
      },
      {
        path: '/experiences',
        name: 'ExperienceManagement',
        component: () => import('@/views/Experience/ExperienceManagementView.vue'),
        meta: {
          title: '体验管理',
          icon: 'Monitor',
          requiresAuth: true
        }
      },
      {
        path: '/labs/create',
        name: 'LabCreate',
        component: () => import('@/views/VirtualLab/LabEditor.vue'),
        meta: {
          title: '创建实验',
          icon: 'Plus',
          requiresAuth: true
        }
      },
      {
        path: '/labs/:id/edit',
        name: 'LabEdit',
        component: () => import('@/views/VirtualLab/LabEditor.vue'),
        meta: {
          title: '编辑实验',
          icon: 'Edit',
          requiresAuth: true
        }
      },
      {
        path: '/courses/create',
        name: 'CourseCreate',
        component: () => import('@/views/Courses/CourseCreateView.vue'),
        meta: {
          title: '创建课程',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/courses/:id',
        name: 'CourseDetail',
        component: () => import('@/views/Courses/CourseDetailView.vue'),
        meta: {
          title: '课程详情',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/courses/:id/edit',
        name: 'CourseEdit',
        component: () => import('@/views/Courses/CourseEditView.vue'),
        meta: {
          title: '编辑课程',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/classrooms',
        name: 'Classrooms',
        component: () => import('@/views/Class/ClassManagement.vue'),
        meta: {
          title: '班级控制台',
          icon: 'School',
          requiresAuth: true
        }
      },
      {
        path: '/resources',
        name: 'Resources',
        component: () => import('@/views/Resources/ResourceVaultView.vue'),
        meta: {
          title: '资源中心',
          icon: 'Collection',
          requiresAuth: true
        }
      },
      {
        path: '/assignments',
        name: 'Assignments',
        component: () => import('@/views/assignments/AssignmentsView.vue'),
        meta: {
          title: '作业管理',
          icon: 'EditPen',
          requiresAuth: true
        }
      },
      {
        path: '/assignments/create',
        name: 'AssignmentCreate',
        component: () => import('@/views/assignments/AssignmentCreateView.vue'),
        meta: {
          title: '布置作业',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/assignments/:id/grade',
        name: 'AssignmentGrade',
        component: () => import('@/views/assignments/AssignmentGradeView.vue'),
        meta: {
          title: '批改作业',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/AnalyticsView.vue'),
        meta: {
          title: '学习分析',
          icon: 'TrendCharts',
          requiresAuth: true
        }
      },
      // {
      //   path: '/profile',
      //   name: 'Profile',
      //   component: () => import('@/views/profile/ProfileView.vue'),
      //   meta: {
      //     title: '个人中心',
      //     icon: 'User',
      //     requiresAuth: true
      //   }
      // },
      {
        path: '/component-showcase',
        name: 'ComponentShowcase',
        component: () => import('@/components/ComponentShowcase.vue'),
        meta: {
          title: 'UI组件展示',
          icon: 'Grid',
          requiresAuth: false
        }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings/index.vue'),
        meta: {
          title: '系统设置',
          icon: 'Setting',
          requiresAuth: true
        }
      },
      // TODO: Create 404 page
      // {
      //   path: '/:pathMatch(.*)*',
      //   name: 'NotFound',
      //   component: () => import('@/views/error/NotFoundView.vue'),
      //   meta: {
      //     title: '页面不存在',
      //     requiresAuth: true,
      //     hidden: true
      //   }
      // }
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
  document.title = to.meta?.title ? `${to.meta.title} - 智能教育平台` : '智能教育平台'

  // 检查是否需要认证
  if (to.meta?.requiresAuth !== false) {
    // 检查用户是否已登录
    if (!userStore.isAuthenticated) {
      // 尝试从token获取用户信息
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          await userStore.getUserInfo()
        } catch (error) {
          console.error('获取用户信息失败:', error)
          localStorage.removeItem('auth_token')
        }
      }

      // 如果仍未登录，跳转到登录页
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
    next({ name: 'Dashboard' })
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
