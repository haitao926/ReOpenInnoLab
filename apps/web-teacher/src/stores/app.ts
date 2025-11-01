import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const isLoading = ref(false)
  const isCollapsed = ref(false)
  const sidebarVisible = ref(true)
  const theme = ref<'light' | 'dark' | 'auto'>('light')
  const onlineStatus = ref(true)
  const aiAssistantVisible = ref(false)
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    duration?: number
    read?: boolean
  }>>([])

  // 计算属性
  const isDarkMode = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  const unreadNotificationsCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  // 动作
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebar_collapsed', String(isCollapsed.value))
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    isCollapsed.value = collapsed
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }

  const applyTheme = () => {
    const html = document.documentElement
    if (isDarkMode.value) {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
    }
  }

  const addNotification = (notification: {
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    duration?: number
  }) => {
    const id = Date.now().toString()
    const newNotification = {
      ...notification,
      id,
      read: false
    }

    notifications.value.unshift(newNotification)

    // 自动移除通知
    const duration = notification.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markNotificationAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const setSidebarVisible = (visible: boolean) => {
    sidebarVisible.value = visible
    localStorage.setItem('sidebar_visible', String(visible))
  }

  const setOnlineStatus = (status: boolean) => {
    onlineStatus.value = status
  }

  const toggleAIAssistant = () => {
    aiAssistantVisible.value = !aiAssistantVisible.value
  }

  const setAIAssistantVisible = (visible: boolean) => {
    aiAssistantVisible.value = visible
  }

  // 初始化应用
  const initializeApp = async () => {
    try {
      // 从本地存储恢复设置
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
      if (savedTheme) {
        theme.value = savedTheme
      }

      const savedSidebarState = localStorage.getItem('sidebar_collapsed')
      if (savedSidebarState) {
        isCollapsed.value = savedSidebarState === 'true'
      }

      const savedSidebarVisible = localStorage.getItem('sidebar_visible')
      if (savedSidebarVisible) {
        sidebarVisible.value = savedSidebarVisible === 'true'
      }

      // 检查在线状态
      onlineStatus.value = navigator.onLine

      // 应用主题
      applyTheme()

      // 监听系统主题变化
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', applyTheme)
      }

      // 监听网络状态变化
      window.addEventListener('online', () => setOnlineStatus(true))
      window.addEventListener('offline', () => setOnlineStatus(false))

    } catch (error) {
      console.error('初始化应用失败:', error)
      throw error
    }
  }

  // 初始化主题
  const initializeTheme = () => {
    applyTheme()
  }

  const initialize = () => {
    // 从本地存储恢复设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
    if (savedTheme) {
      theme.value = savedTheme
    }

    const savedSidebarState = localStorage.getItem('sidebar_collapsed')
    if (savedSidebarState) {
      isCollapsed.value = savedSidebarState === 'true'
    }

    // 应用主题
    applyTheme()

    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', applyTheme)
    }
  }

  return {
    // 状态
    isLoading,
    isCollapsed,
    sidebarVisible,
    theme,
    onlineStatus,
    aiAssistantVisible,
    notifications,

    // 计算属性
    isDarkMode,
    unreadNotificationsCount,

    // 动作
    setLoading,
    toggleSidebar,
    setSidebarCollapsed,
    setSidebarVisible,
    setTheme,
    applyTheme,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    setOnlineStatus,
    toggleAIAssistant,
    setAIAssistantVisible,
    initializeApp,
    initializeTheme,
    initialize
  }
})