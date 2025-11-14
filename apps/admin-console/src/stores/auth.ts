import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import type { User, LoginRequest, LoginResponse } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))
  const permissions = ref<string[]>([])
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.name || 'Unknown')
  const userRole = computed(() => user.value?.role || 'guest')
  const hasPermission = computed(() => (permission: string) => {
    return permissions.value.includes(permission) || user.value?.role === 'super_admin'
  })

  // Actions
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      isLoading.value = true
      const response: LoginResponse = await authApi.login(credentials)

      token.value = response.token
      user.value = response.user
      permissions.value = response.permissions || []

      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
      localStorage.setItem('admin_permissions', JSON.stringify(response.permissions || []))

      ElMessage.success('登录成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      ElMessage.success('已退出登录')
      router.push({ name: 'Login' })
    }
  }

  const checkAuth = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    try {
      isLoading.value = true
      const response = await authApi.getCurrentUser()

      user.value = response.user
      permissions.value = response.permissions || []

      localStorage.setItem('admin_user', JSON.stringify(response.user))
      localStorage.setItem('admin_permissions', JSON.stringify(response.permissions || []))

      return true
    } catch (error) {
      clearAuth()
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await authApi.refreshToken()
      token.value = response.token
      localStorage.setItem('admin_token', response.token)
      return true
    } catch (error) {
      clearAuth()
      return false
    }
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    permissions.value = []
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_permissions')
  }

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const updatedUser = await authApi.updateProfile(profileData)
      user.value = updatedUser
      localStorage.setItem('admin_user', JSON.stringify(updatedUser))
      ElMessage.success('个人信息更新成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败')
      return false
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await authApi.changePassword({ oldPassword, newPassword })
      ElMessage.success('密码修改成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '密码修改失败')
      return false
    }
  }

  // Initialize from localStorage
  const initFromStorage = () => {
    const storedUser = localStorage.getItem('admin_user')
    const storedPermissions = localStorage.getItem('admin_permissions')

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
      }
    }

    if (storedPermissions) {
      try {
        permissions.value = JSON.parse(storedPermissions)
      } catch (error) {
        console.error('Failed to parse stored permissions:', error)
      }
    }
  }

  initFromStorage()

  return {
    // State
    user,
    token,
    permissions,
    isLoading,

    // Getters
    isAuthenticated,
    userName,
    userRole,
    hasPermission,

    // Actions
    login,
    logout,
    checkAuth,
    refreshToken,
    clearAuth,
    updateProfile,
    changePassword
  }
})