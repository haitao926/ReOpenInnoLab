import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { User, LoginRequest, RegisterRequest } from '@/types/user'
import { authApi, setUserInfo, getUserInfo, clearAuthData } from '@/api/auth.secure'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()

  // 状态 - 使用响应式变量
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const initialized = ref(false)

  // 数据源标记
  const dataSource = computed(() => import.meta.env.VITE_ENABLE_MOCK_API === 'true' ? 'Mock' : 'Live')

  // 计算属性 - 基于安全的API方法
  const isAuthenticated = computed(() => authApi.isAuthenticated() && !!user.value)
  const userRole = computed(() => user.value?.role || 'guest')
  const userName = computed(() => user.value?.name || '未登录用户')
  const userAvatar = computed(() => user.value?.avatar || '')
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id || '')

  // 权限检查方法
  const hasPermission = computed(() => (permission: string) => authApi.hasPermission(permission))
  const hasRole = computed(() => (role: string) => authApi.hasRole(role))
  const permissions = computed(() => authApi.getCurrentPermissions())

  // 动作
  const login = async (credentials: LoginRequest) => {
    try {
      isLoading.value = true

      // 严格验证输入
      const email = credentials.username || credentials.email
      const password = credentials.password

      if (!email || !password || email === 'undefined' || password === 'undefined') {
        throw new Error('用户名和密码不能为空')
      }

      // 使用安全的API调用，不记录敏感信息
      const response = await authApi.login({
        email: email,
        password: password,
        remember: credentials.remember
      })

      // 更新本地状态
      user.value = response.user

      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      isLoading.value = true

      const response = await authApi.register(userData)
      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (allDevices = false) => {
    try {
      if (authApi.isAuthenticated()) {
        if (allDevices) {
          await authApi.logoutAll()
        } else {
          await authApi.logout()
        }
      }
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清理本地状态
      user.value = null
      initialized.value = false

      // 重定向到登录页
      router.push({ name: 'Login' })
    }
  }

  const refreshUserInfo = async () => {
    try {
      isLoading.value = true

      const response = await authApi.getUserInfo()
      user.value = response.user

      return response
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateUserInfo = async (userData: Partial<User>) => {
    try {
      isLoading.value = true

      const response = await authApi.updateUserInfo(userData)

      // 重新获取用户信息以确保数据一致性
      await refreshUserInfo()

      return response
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      isLoading.value = true

      const response = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      })

      return response
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 初始化认证状态
  const initializeAuth = async () => {
    if (initialized.value) {
      return
    }

    try {
      // 避免在服务器端渲染时访问 localStorage
      if (typeof window === 'undefined') {
        return
      }

      // 从安全的API获取用户信息
      const storedUser = getUserInfo()

      if (storedUser && authApi.isAuthenticated()) {
        user.value = storedUser

        // 验证token仍然有效
        try {
          await refreshUserInfo()
        } catch (error) {
          console.warn('Token验证失败，清除认证状态:', error)
          clearAuthData()
          user.value = null
        }
      }
    } catch (error) {
      console.error('初始化认证失败:', error)
      clearAuthData()
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  // 强制重新初始化
  const forceReinitialize = () => {
    initialized.value = false
    return initializeAuth()
  }

  // 清除损坏的数据
  const clearCorruptedData = () => {
    clearAuthData()
    user.value = null
    initialized.value = false
    console.log('已清理所有损坏的认证数据')
  }

  // 验证当前状态
  const validateAuthState = () => {
    const isAuthValid = authApi.isAuthenticated()

    if (!isAuthValid && user.value) {
      console.warn('认证状态不一致，清除本地状态')
      clearCorruptedData()
      return false
    }

    return isAuthValid
  }

  // 检查是否需要刷新token
  const shouldRefreshToken = () => {
    const token = authApi.getAccessToken()
    if (!token) {
      return false
    }

    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      const payload = JSON.parse(atob(parts[1]))
      const now = Date.now() / 1000
      const timeUntilExpiry = payload.exp - now

      // 如果token在5分钟内过期，则刷新
      return timeUntilExpiry < 300 // 5分钟
    } catch {
      return false
    }
  }

  // 主动刷新token
  const refreshTokenIfNeeded = async () => {
    if (shouldRefreshToken() && authApi.isAuthenticated()) {
      try {
        await authApi._refreshToken()
        await refreshUserInfo()
        return true
      } catch (error) {
        console.error('Token刷新失败:', error)
        clearCorruptedData()
        return false
      }
    }
    return true
  }

  // 获取用户详细信息（用于调试和开发）
  const getDebugInfo = () => {
    if (import.meta.env.DEV) {
      return {
        isAuthenticated: isAuthenticated.value,
        user: user.value,
        hasAccessToken: !!authApi.getAccessToken(),
        hasRefreshToken: !!authApi.getRefreshToken(),
        permissions: permissions.value,
        initialized: initialized.value
      }
    }
    return null
  }

  return {
    // 状态
    user,
    isLoading,
    initialized,

    // 计算属性
    isAuthenticated,
    userRole,
    userName,
    userAvatar,
    userEmail,
    userId,
    hasPermission,
    hasRole,
    permissions,
    dataSource,

    // 动作
    login,
    register,
    logout,
    refreshUserInfo,
    updateUserInfo,
    changePassword,
    initializeAuth,
    forceReinitialize,
    clearCorruptedData,
    validateAuthState,
    refreshTokenIfNeeded,
    shouldRefreshToken,

    // 调试方法
    getDebugInfo
  }
})

// 类型导出
export type UserStore = ReturnType<typeof useUserStore>