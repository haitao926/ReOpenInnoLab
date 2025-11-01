import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { User, LoginRequest, RegisterRequest } from '@/types/user'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()

  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const permissions = ref<string[]>([])

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || 'guest')
  const userName = computed(() => user.value?.name || '未登录用户')
  const userAvatar = computed(() => user.value?.avatar || '')
  const hasPermission = computed(() => (permission: string) =>
    permissions.value.includes(permission) || userRole.value === 'admin'
  )

  // 动作
  const login = async (credentials: LoginRequest) => {
    try {
      isLoading.value = true

      const response = await authApi.login(credentials)
      const { access_token, user: userData, permissions: userPermissions } = response.data

      // 保存认证信息
      token.value = access_token
      user.value = userData
      permissions.value = userPermissions

      // 保存到本地存储
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('user_info', JSON.stringify(userData))
      localStorage.setItem('user_permissions', JSON.stringify(userPermissions))

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

  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清理本地状态
      clearAuthData()

      // 重定向到登录页
      router.push({ name: 'Login' })
    }
  }

  const getUserInfo = async () => {
    try {
      isLoading.value = true

      const response = await authApi.getUserInfo()
      const { user: userData, permissions: userPermissions } = response.data

      user.value = userData
      permissions.value = userPermissions

      // 更新本地存储
      localStorage.setItem('user_info', JSON.stringify(userData))
      localStorage.setItem('user_permissions', JSON.stringify(userPermissions))

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
      const updatedUser = response.data

      user.value = { ...user.value!, ...updatedUser }
      localStorage.setItem('user_info', JSON.stringify(user.value))

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

  const refreshPermissions = async () => {
    try {
      const response = await authApi.getPermissions()
      permissions.value = response.data.permissions
      localStorage.setItem('user_permissions', JSON.stringify(permissions.value))
    } catch (error) {
      console.error('刷新权限失败:', error)
      throw error
    }
  }

  const clearAuthData = () => {
    user.value = null
    token.value = null
    permissions.value = []

    // 清理本地存储
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('user_permissions')
  }

  const initializeAuth = async () => {
    try {
      const savedToken = localStorage.getItem('auth_token')
      const savedUserInfo = localStorage.getItem('user_info')
      const savedPermissions = localStorage.getItem('user_permissions')

      if (savedToken && savedUserInfo) {
        token.value = savedToken

        try {
          user.value = JSON.parse(savedUserInfo)
          permissions.value = savedPermissions ? JSON.parse(savedPermissions) : []

          // 验证token有效性并获取最新用户信息
          await getUserInfo()
        } catch (error) {
          console.error('解析用户数据失败:', error)
          clearAuthData()
          throw error
        }
      }
    } catch (error) {
      console.error('初始化认证失败:', error)
      clearAuthData()
      throw error
    }
  }

  const initializeFromStorage = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUserInfo = localStorage.getItem('user_info')
    const savedPermissions = localStorage.getItem('user_permissions')

    if (savedToken && savedUserInfo) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUserInfo)
        permissions.value = savedPermissions ? JSON.parse(savedPermissions) : []
      } catch (error) {
        console.error('解析本地用户数据失败:', error)
        clearAuthData()
      }
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken()
      const { access_token } = response.data

      token.value = access_token
      localStorage.setItem('auth_token', access_token)

      return access_token
    } catch (error) {
      console.error('刷新Token失败:', error)
      clearAuthData()
      throw error
    }
  }

  return {
    // 状态
    user,
    token,
    isLoading,
    permissions,

    // 计算属性
    isAuthenticated,
    userRole,
    userName,
    userAvatar,
    hasPermission,

    // 动作
    login,
    register,
    logout,
    getUserInfo,
    updateUserInfo,
    changePassword,
    refreshPermissions,
    clearAuthData,
    initializeAuth,
    initializeFromStorage,
    refreshToken
  }
})