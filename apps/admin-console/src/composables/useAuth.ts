import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const setupAuthGuard = (router: any) => {
  router.beforeEach(async (to: any, from: any, next: any) => {
    const authStore = useAuthStore()

    // Skip auth check for login page
    if (to.meta.requiresAuth === false) {
      next()
      return
    }

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      // Try to restore auth from storage
      const hasValidSession = await authStore.checkAuth()
      if (!hasValidSession) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }

    // Check role-based permissions
    if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
      next({ name: 'Dashboard' })
      return
    }

    next()
  })
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()

  const login = async (credentials: { username: string; password: string }) => {
    const success = await authStore.login(credentials)
    if (success) {
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect || { name: 'Dashboard' })
    }
    return success
  }

  const logout = () => {
    authStore.logout()
  }

  const checkPermission = (permission: string) => {
    return authStore.hasPermission(permission)
  }

  const requirePermission = (permission: string) => {
    if (!checkPermission(permission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    login,
    logout,
    checkPermission,
    requirePermission,
    hasPermission: authStore.hasPermission
  }
}