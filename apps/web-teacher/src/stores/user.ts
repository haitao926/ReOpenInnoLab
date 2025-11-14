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

  // 数据源标记
  const dataSource = computed(() => import.meta.env.VITE_ENABLE_MOCK_API === 'true' ? 'Mock' : 'Live')

  // 计算属性
  const isAuthenticated = computed(() => {
    const result = !!token.value && !!user.value
    if (import.meta.env.DEV) {
      console.log(`[用户Store] isAuthenticated 计算结果: ${result}, token: ${!!token.value}, user: ${!!user.value}`)
    }
    return result
  })
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

      // 确保email和username字段都有值，防止undefined
      const email = credentials.username || credentials.email
      const password = credentials.password

      // 严格验证，防止undefined或空值调用
      if (!email || !password || email === 'undefined' || password === 'undefined') {
        throw new Error('用户名和密码不能为空')
      }

      console.log('Attempting login with email:', email)
      console.log('Original credentials being passed to authApi.login:', {
        username: credentials.username,
        email: credentials.email,
        password: password ? '[HIDDEN]' : 'EMPTY',
        role: credentials.role,
        remember: credentials.remember
      })

      const response = await authApi.login({
        username: email,  // Use username field to match mock API expectations
        email: email,     // Also include email for compatibility
        password: password,
        role: credentials.role,
        remember: credentials.remember
      })

      // authApi.login 已经处理了localStorage存储，这里只需要更新store状态
      const { accessToken, user: userData, permissions: userPermissions } = response

      // 更新store状态
      token.value = accessToken
      user.value = userData
      permissions.value = userPermissions || []

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
      const { data: userData, permissions: userPermissions } = response

      user.value = userData
      permissions.value = userPermissions || userData?.permissions || []

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

      // 重新获取用户信息以确保数据一致性
      await getUserInfo()

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
      // 重新获取用户信息来刷新权限
      await getUserInfo()
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
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('user_permissions')
  }

  const clearCorruptedData = () => {
    // 清理所有可能的损坏认证数据
    localStorage.removeItem('auth_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('user_permissions')
    localStorage.removeItem('token_expires_at')
    localStorage.removeItem('tenant_info')

    // 重置状态
    user.value = null
    token.value = null
    permissions.value = []

    console.log('已清理所有损坏的认证数据')
  }

  const initializeAuth = async () => {
    try {
      // 检查两种可能的token键，确保向后兼容
      const savedToken = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
      const savedUserInfo = localStorage.getItem('user_info')
      const savedPermissions = localStorage.getItem('user_permissions')

      if (savedToken && savedUserInfo && savedUserInfo !== 'undefined' && savedUserInfo !== 'null') {
        token.value = savedToken

        try {
          user.value = JSON.parse(savedUserInfo)
          permissions.value = savedPermissions && savedPermissions !== 'undefined' ? JSON.parse(savedPermissions) : []

          // 统一token存储键为auth_token
          if (localStorage.getItem('access_token')) {
            localStorage.setItem('auth_token', savedToken)
            localStorage.removeItem('access_token')
          }

          // 仅在有有效用户数据时验证token有效性
          if (user.value && user.value.email) {
            await getUserInfo()
          }
        } catch (error) {
          console.error('解析用户数据失败:', error)
          clearAuthData()
          // 不抛出错误，允许应用继续运行
        }
      }
    } catch (error) {
      console.error('初始化认证失败:', error)
      clearAuthData()
      // 不抛出错误，允许应用继续运行
    }
  }

  const initializeFromStorage = () => {
    // 检查两种可能的token键，确保向后兼容
    const savedToken = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
    const savedUserInfo = localStorage.getItem('user_info')
    const savedPermissions = localStorage.getItem('user_permissions')

    if (savedToken && savedUserInfo && savedUserInfo !== 'undefined' && savedUserInfo !== 'null') {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUserInfo)
        permissions.value = savedPermissions && savedPermissions !== 'undefined' ? JSON.parse(savedPermissions) : []

        // 验证用户数据完整性
        if (user.value && !user.value.email) {
          console.warn('用户数据不完整，清空认证信息')
          clearAuthData()
          return
        }

        // 统一token存储键为auth_token
        if (localStorage.getItem('access_token')) {
          localStorage.setItem('auth_token', savedToken)
          localStorage.removeItem('access_token')
        }
      } catch (error) {
        console.error('解析本地用户数据失败:', error)
        clearAuthData()
      }
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authApi._refreshToken()
      const { accessToken } = response

      token.value = accessToken
      localStorage.setItem('auth_token', accessToken)
      // 确保向后兼容性
      localStorage.setItem('access_token', accessToken)

      return accessToken
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
    dataSource,

    // 动作
    login,
    register,
    logout,
    getUserInfo,
    updateUserInfo,
    changePassword,
    refreshPermissions,
    clearAuthData,
    clearCorruptedData,
    initializeAuth,
    initializeFromStorage,
    refreshToken
  }
})
