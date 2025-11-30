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
        path: '/classrooms/:classId/lessons/:lessonId/present',
        name: 'PresenterMode',
        component: () => import('@/views/presenter/PresenterMode.vue'),
        meta: {
          title: '课堂播放',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: '/class',
        name: 'Class',
        component: () => import('@/views/Class/ClassManagement.vue'),
        meta: {
          title: '班级管理',
          icon: 'School',
          requiresAuth: true
        }
      },
      {
        path: '/classrooms',
        redirect: '/class'
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
      // 静态页面路由（不需要认证）
      {
        path: '/privacy',
        name: 'Privacy',
        component: () => import('@/views/legal/PrivacyView.vue'),
        meta: {
          title: '隐私政策',
          requiresAuth: false,
          layout: 'simple'
        }
      },
      {
        path: '/terms',
        name: 'Terms',
        component: () => import('@/views/legal/TermsView.vue'),
        meta: {
          title: '服务条款',
          requiresAuth: false,
          layout: 'simple'
        }
      },
      {
        path: '/help',
        name: 'Help',
        component: () => import('@/views/help/HelpView.vue'),
        meta: {
          title: '帮助中心',
          requiresAuth: false,
          layout: 'simple'
        }
      },
      {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/contact/ContactView.vue'),
        meta: {
          title: '联系我们',
          requiresAuth: false,
          layout: 'simple'
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
    console.log(`[路由守卫] 访问 ${to.path}, 当前认证状态:`, userStore.isAuthenticated)

    // 检查用户是否已登录
    if (!userStore.isAuthenticated) {
      console.log('[路由守卫] 用户未认证，尝试恢复...')

      // 尝试从本地存储恢复用户信息（支持两种token键以保持向后兼容）
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
      const userInfo = localStorage.getItem('user_info')

      console.log('[路由守卫] 本地存储状态:', { hasToken: !!token, hasUserInfo: !!userInfo })

      if (token && userInfo) {
        try {
          // 如果只有access_token，先统一为auth_token
          if (!localStorage.getItem('auth_token')) {
            localStorage.setItem('auth_token', token)
          }

          // 解析用户信息
          const userData = JSON.parse(userInfo)
          const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')

          // 直接设置用户状态，避免不必要的API调用
          userStore.$patch({
            token: token,
            user: userData,
            permissions: permissions
          })

          console.log('[路由守卫] 从本地存储恢复用户信息:', userData.name)
        } catch (error) {
          console.error('[路由守卫] 恢复用户信息失败:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_info')
          localStorage.removeItem('user_permissions')
        }
      }

      // 如果恢复后仍未登录，尝试API调用
      if (!userStore.isAuthenticated && token) {
        console.log('[路由守卫] 本地恢复失败，尝试API调用...')
        try {
          await userStore.getUserInfo()
          console.log('[路由守卫] API调用成功，认证状态:', userStore.isAuthenticated)
        } catch (error) {
          console.error('[路由守卫] 获取用户信息失败:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('access_token')
        }
      }

      // 如果仍未登录，跳转到登录页
      if (!userStore.isAuthenticated) {
        console.log(`[路由守卫] 最终认证失败，跳转到登录页。目标页面: ${to.fullPath}`)
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      } else {
        console.log(`[路由守卫] 认证成功，允许访问 ${to.path}`)
      }
    }
  }

  // 如果已登录用户访问登录页，重定向到控制台
  if (to.name === 'Login' && userStore.isAuthenticated) {
    console.log('[路由守卫] 已登录用户访问登录页，重定向到控制台')
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
