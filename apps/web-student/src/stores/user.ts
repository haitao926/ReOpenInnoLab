import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/auth'
import { useOfflineData } from '@/services/persistence/offline-data.service'
import type { LoginRequest, LoginResponse, User as ApiUser } from '@/api/auth'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'student' | 'teacher' | 'admin'
  school: string
  grade?: string
  class?: string
  studentId?: string
}

export const useUserStore = defineStore('user', () => {
  // 离线数据服务
  const offlineData = useOfflineData()

  // State
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const loading = ref(false)
  const isOffline = ref(false)

  // Getters
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  const isStudent = computed(() => {
    return user.value?.role === 'student'
  })

  const displayName = computed(() => {
    return user.value?.name || '未知用户'
  })

  const userRole = computed(() => {
    return user.value?.role || 'guest'
  })

  const schoolInfo = computed(() => {
    return {
      school: user.value?.school || '',
      grade: user.value?.grade || '',
      class: user.value?.class || ''
    }
  })

  // Actions
  const setUser = async (userData: User) => {
    user.value = userData
    // 使用离线数据服务保存用户信息
    try {
      await offlineData.saveUser(userData)
      // 标记用户数据需要同步
      await offlineData.markForSync('user', userData.id, 'update')
    } catch (error) {
      console.error('保存用户信息失败:', error)
      // 降级到localStorage
      localStorage.setItem('user_info', JSON.stringify(userData))
    }
  }

  const setToken = async (newToken: string) => {
    token.value = newToken
    // 使用离线数据服务保存token
    try {
      const currentTokens = await offlineData.getAuthToken()
      if (currentTokens) {
        // 如果已有token，更新
        await offlineData.saveAuthToken(newToken, currentTokens.refreshToken)
      } else {
        // 新token
        await offlineData.saveAuthToken(newToken, '')
      }
    } catch (error) {
      console.error('保存token失败:', error)
      // 降级到localStorage
      localStorage.setItem('auth_token', newToken)
    }
  }

  const setPermissions = (newPermissions: string[]) => {
    permissions.value = newPermissions
    localStorage.setItem('user_permissions', JSON.stringify(newPermissions))
  }

  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user_info', JSON.stringify(user.value))
    }
  }

  const login = async (loginData: LoginRequest) => {
    loading.value = true
    console.log('🔐 开始登录流程...')
    console.log('📧 登录邮箱:', loginData.email)

    try {
      // 尝试使用真实API调用
      console.log('🌐 尝试真实API登录...')
      const response = await loginApi(loginData)

      console.log('✅ API登录成功')

      // 转换API用户数据到本地用户格式
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar,
        role: response.user.role as 'student' | 'teacher' | 'admin',
        school: response.user.studentInfo?.class || '',
        grade: response.user.studentInfo?.grade || '',
        class: response.user.studentInfo?.class || '',
        studentId: response.user.studentInfo?.studentId
      }

      // 设置状态和持久化
      await setUser(userData)
      await setToken(response.token)

      // 持久化刷新token
      await offlineData.saveAuthToken(response.token, response.refreshToken)

      console.log('✅ 用户数据和认证信息已持久化')

      return {
        user: userData,
        token: response.token,
        permissions: []
      }
    } catch (error) {
      console.error('❌ 登录失败:', error)
      throw new Error('登录失败，请检查网络连接或联系管理员')
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      // 调用登出API
      await logoutApi()
    } catch (error) {
      console.error('登出API调用失败:', error)
    } finally {
      // 清除状态
      user.value = null
      token.value = ''
      permissions.value = []

      // 使用离线数据服务清除持久化数据
      try {
        await offlineData.clearUser()
        await offlineData.clearAuthToken()
        console.log('✅ 用户数据已从离线存储清除')
      } catch (error) {
        console.error('清除离线数据失败:', error)
        // 降级清理
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('user_permissions')
      }

      console.log('用户已退出登录')
    }
  }

  const getUserInfo = async () => {
    if (!token.value) {
      throw new Error('未找到认证令牌')
    }

    loading.value = true
    try {
      // 模拟获取用户信息API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模拟响应数据
      const mockUser: User = {
        id: 'student_001',
        name: '张小明',
        email: 'student@example.com',
        avatar: '',
        role: 'student',
        school: '示例中学',
        grade: '高一',
        class: '1班',
        studentId: '2024001'
      }

      setUser(mockUser)
      localStorage.setItem('user_info', JSON.stringify(mockUser))

      return mockUser
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const refreshToken = async () => {
    if (!token.value) {
      throw new Error('未找到认证令牌')
    }

    try {
      // 模拟刷新令牌API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const newToken = 'mock_student_token_' + Date.now()
      setToken(newToken)

      return newToken
    } catch (error) {
      console.error('刷新令牌失败:', error)
      // 刷新失败，清除用户信息
      logout()
      throw error
    }
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(perm => permissions.value.includes(perm))
  }

  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(perm => permissions.value.includes(perm))
  }

  // 初始化时从离线存储恢复状态
  const initFromStorage = async () => {
    console.log('🔄 初始化用户状态...')

    try {
      // 尝试从离线存储恢复token
      const storedTokens = await offlineData.getAuthToken()
      if (storedTokens) {
        token.value = storedTokens.token
        console.log('✅ 从离线存储恢复token')
      }

      // 尝试从离线存储恢复用户信息
      const storedUser = await offlineData.getUser()
      if (storedUser) {
        user.value = storedUser
        console.log('✅ 从离线存储恢复用户信息')
      }

      // 如果离线存储中有数据但状态为空，尝试从localStorage恢复
      if (storedTokens && !user.value) {
        const fallbackUserInfo = localStorage.getItem('user_info')
        if (fallbackUserInfo) {
          try {
            const userData = JSON.parse(fallbackUserInfo)
            user.value = userData
            console.log('✅ 从localStorage恢复用户信息')
            // 同时保存到离线存储
            await offlineData.saveUser(userData)
          } catch (error) {
            console.error('解析用户信息失败:', error)
          }
        }
      }

      if (token.value && user.value) {
        console.log('✅ 用户状态恢复成功')
        console.log(`👤 用户: ${user.value.name}`)
        console.log(`🎭 角色: ${user.value.role}`)
      } else {
        console.log('ℹ️ 用户未登录，状态正常')
      }

    } catch (error) {
      console.error('初始化用户状态失败:', error)
      // 降级到localStorage
      const storedToken = localStorage.getItem('auth_token')
      const storedUserInfo = localStorage.getItem('user_info')

      if (storedToken) {
        token.value = storedToken
      }

      if (storedUserInfo) {
        try {
          const userData = JSON.parse(storedUserInfo)
          user.value = userData
        } catch (parseError) {
          console.error('解析用户信息失败:', parseError)
        }
      }
    }
  }

  // 非阻塞初始化
  initFromStorage().catch(console.error)

  return {
    // State
    token,
    user,
    permissions,
    loading,
    isOffline,

    // Getters
    isAuthenticated,
    isStudent,
    displayName,
    userRole,
    schoolInfo,

    // Actions
    setUser,
    setToken,
    setPermissions,
    updateUser,
    login,
    logout,
    getUserInfo,
    refreshToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
})