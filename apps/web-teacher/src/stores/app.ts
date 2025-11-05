import { defineStore } from 'pinia'
import { ref, computed, inject } from 'vue'
import type { ThemeManager } from '@reopeninnolab/ui-kit/theme'
import { subjectService } from '@/api/subjects'
import type { Subject, SubjectFilterResponse } from '@/api/subjects'

export const useAppStore = defineStore('app', () => {
  // 注入主题管理器
  const themeManager = inject<ThemeManager>('themeManager')

  // 状态
  const isLoading = ref(false)
  const isCollapsed = ref(false)
  const sidebarVisible = ref(true)
  const theme = ref<'light' | 'dark' | 'auto' | 'high-contrast'>('light')
  const onlineStatus = ref(true)
  const aiAssistantVisible = ref(false)
  const selectedSubject = ref<string>('my-subjects')
  const availableSubjects = ref<Subject[]>([])
  const subjectFilterResponse = ref<SubjectFilterResponse | null>(null)
  const recommendedSubjects = ref<Subject[]>([])
  const subjectsLoading = ref(false)
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
    return theme.value === 'dark' || theme.value === 'high-contrast'
  })

  const isHighContrastMode = computed(() => {
    return theme.value === 'high-contrast'
  })

  const unreadNotificationsCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  // 学科相关计算属性
  const currentSubjectInfo = computed(() => {
    return availableSubjects.value.find(subject => subject.id === selectedSubject.value) || null
  })

  const filteredSubjects = computed(() => {
    if (!availableSubjects.value.length) return []
    return availableSubjects.value.filter(subject => subject.isActive)
  })

  const hasSubjectData = computed(() => {
    return availableSubjects.value.length > 0
  })

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

  const setTheme = (newTheme: 'light' | 'dark' | 'auto' | 'high-contrast') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }

  const applyTheme = () => {
    const html = document.documentElement

    // 设置data-theme属性
    if (isHighContrastMode.value) {
      html.classList.add('high-contrast')
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'high-contrast')
    } else if (isDarkMode.value) {
      html.classList.add('dark')
      html.classList.remove('high-contrast')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.classList.remove('dark', 'high-contrast')
      html.setAttribute('data-theme', 'light')
    }

    // 应用UI Kit主题
    if (themeManager) {
      themeManager.applyFullTheme()
    }

    // 应用高对比模式特殊样式
    if (isHighContrastMode.value && themeManager) {
      applyHighContrastTheme()
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

  const setSelectedSubject = (subject: string) => {
    selectedSubject.value = subject
    localStorage.setItem('selected_subject', subject)

    // 添加通知
    const subjectInfo = availableSubjects.value.find(s => s.id === subject)
    if (subjectInfo) {
      addNotification({
        type: 'info',
        title: '学科切换',
        message: `已切换到 ${subjectInfo.name}`,
        duration: 3000
      })
    }
  }

  // 学科数据管理动作
  const loadSubjects = async (teacherId?: string, forceRefresh = false) => {
    if (subjectsLoading.value) return

    try {
      subjectsLoading.value = true

      // 如果有缓存且不强制刷新，直接返回
      if (!forceRefresh && availableSubjects.value.length > 0) {
        return
      }

      const response = await subjectService.getTeacherSubjects(teacherId, !forceRefresh)

      if (response.success) {
        const subjectData = response.data
        availableSubjects.value = subjectData.subjects
        subjectFilterResponse.value = subjectData

        // 如果当前选择的学科不在可用列表中，重置为默认学科
        if (!subjectData.subjects.find(s => s.id === selectedSubject.value)) {
          const defaultSubject = subjectData.defaultSubject || 'my-subjects'
          setSelectedSubject(defaultSubject)
        }
      }
    } catch (error) {
      console.error('加载学科数据失败:', error)
      addNotification({
        type: 'error',
        title: '加载失败',
        message: '学科数据加载失败，请刷新页面重试',
        duration: 5000
      })
    } finally {
      subjectsLoading.value = false
    }
  }

  const loadRecommendedSubjects = async (teacherId?: string) => {
    try {
      const subjects = await subjectService.getRecommendedSubjects(teacherId)
      recommendedSubjects.value = subjects
    } catch (error) {
      console.error('加载推荐学科失败:', error)
    }
  }

  const preloadSubjectData = async (teacherId?: string) => {
    try {
      await Promise.all([
        loadSubjects(teacherId),
        loadRecommendedSubjects(teacherId)
      ])
    } catch (error) {
      console.error('预加载学科数据失败:', error)
    }
  }

  const refreshSubjects = (teacherId?: string) => {
    return loadSubjects(teacherId, true)
  }

  const clearSubjectCache = (teacherId?: string) => {
    subjectService.clearSubjectCache(teacherId)
    availableSubjects.value = []
    subjectFilterResponse.value = null
    recommendedSubjects.value = []
  }

  const getSubjectById = (subjectId: string): Subject | null => {
    return availableSubjects.value.find(s => s.id === subjectId) || null
  }

  const getSubjectIcon = (subjectId: string): string => {
    const subject = getSubjectById(subjectId)
    return subject?.icon || 'Collection'
  }

  // 验证学科选择的有效性
  const validateSubjectSelection = () => {
    if (!availableSubjects.value.length) return false

    const isValid = availableSubjects.value.some(s => s.id === selectedSubject.value)
    if (!isValid) {
      // 重置为第一个可用学科
      const firstAvailable = availableSubjects.value.find(s => s.isActive) || availableSubjects.value[0]
      if (firstAvailable) {
        setSelectedSubject(firstAvailable.id)
      }
    }

    return isValid
  }

  // 获取当前主题信息
  const getCurrentThemeColors = () => {
    if (!themeManager) return {}
    return themeManager.generateCSSVariables()
  }

  // 获取主题颜色
  const getThemeColor = (path: string) => {
    if (!themeManager) return ''
    return themeManager.getColor(path)
  }

  // 获取学科颜色
  const getSubjectColor = (subject: string, variant: 'light' | 'default' | 'dark' = 'default') => {
    if (!themeManager) {
      const subjectInfo = getSubjectById(subject)
      return subjectInfo?.color || '#6366f1'
    }

    const themeVariant: 'light' | 'color' | 'dark' = variant === 'default' ? 'color' : variant
    const color = themeManager.getSubjectColor(subject, themeVariant)

    if (color) return color

    const subjectInfo = getSubjectById(subject)
    return subjectInfo?.color || '#6366f1'
  }

  // 应用高对比模式主题
  const applyHighContrastTheme = () => {
    const html = document.documentElement
    const root = html.style

    // 高对比模式颜色定义
    const highContrastColors = {
      // 主色调 - 高对比版本
      '--edu-color-primary-500': '#0066CC',
      '--edu-color-primary-600': '#0052A3',
      '--edu-color-primary-400': '#1A75FF',

      // 语义色 - 高对比版本
      '--edu-color-success-default': '#006600',
      '--edu-color-success-light': '#E6FFE6',
      '--edu-color-success-dark': '#004400',

      '--edu-color-warning-default': '#CC6600',
      '--edu-color-warning-light': '#FFF9E6',
      '--edu-color-warning-dark': '#994D00',

      '--edu-color-error-default': '#CC0000',
      '--edu-color-error-light': '#FFE6E6',
      '--edu-color-error-dark': '#990000',

      '--edu-color-info-default': '#0066CC',
      '--edu-color-info-light': '#E6F3FF',
      '--edu-color-info-dark': '#004C99',

      // 背景色 - 高对比
      '--edu-color-white': '#FFFFFF',
      '--edu-color-black': '#000000',
      '--edu-color-gray-50': '#FFFFFF',
      '--edu-color-gray-100': '#F0F0F0',
      '--edu-color-gray-200': '#D0D0D0',
      '--edu-color-gray-300': '#B0B0B0',
      '--edu-color-gray-400': '#808080',
      '--edu-color-gray-500': '#606060',
      '--edu-color-gray-600': '#404040',
      '--edu-color-gray-700': '#202020',
      '--edu-color-gray-800': '#101010',
      '--edu-color-gray-900': '#000000',

      // 边框 - 加粗边框
      '--edu-border-color': '#000000',
      '--edu-border-color-light': '#808080',

      // 字体加粗
      '--edu-font-weight-normal': '500',
      '--edu-font-weight-medium': '600',
      '--edu-font-weight-semibold': '700',
      '--edu-font-weight-bold': '800',

      // 阴影 - 增强对比
      '--edu-shadow-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.8)',
      '--edu-shadow-base': '0 4px 8px 0 rgba(0, 0, 0, 0.8)',
      '--edu-shadow-md': '0 8px 16px 0 rgba(0, 0, 0, 0.8)',
      '--edu-shadow-lg': '0 16px 32px 0 rgba(0, 0, 0, 0.8)',
      '--edu-shadow-xl': '0 24px 48px 0 rgba(0, 0, 0, 0.8)'
    }

    // 应用高对比模式变量
    Object.entries(highContrastColors).forEach(([key, value]) => {
      root.setProperty(key, value)
    })

    // Element Plus 高对比变量
    const elementPlusHighContrast = {
      '--el-color-primary': '#0066CC',
      '--el-color-primary-light-3': '#1A75FF',
      '--el-color-primary-dark-2': '#0052A3',
      '--el-color-success': '#006600',
      '--el-color-warning': '#CC6600',
      '--el-color-error': '#CC0000',
      '--el-color-info': '#0066CC',
      '--el-text-color-primary': '#000000',
      '--el-text-color-regular': '#000000',
      '--el-text-color-secondary': '#000000',
      '--el-text-color-placeholder': '#666666',
      '--el-text-color-disabled': '#999999',
      '--el-border-color': '#000000',
      '--el-border-color-light': '#808080',
      '--el-border-color-lighter': '#808080',
      '--el-border-color-extra-light': '#B0B0B0',
      '--el-border-color-dark': '#000000',
      '--el-border-color-darker': '#000000',
      '--el-fill-color': '#FFFFFF',
      '--el-fill-color-light': '#F8F8F8',
      '--el-fill-color-lighter': '#F0F0F0',
      '--el-fill-color-extra-light': '#E8E8E8',
      '--el-fill-color-dark': '#000000',
      '--el-fill-color-darker': '#000000',
      '--el-fill-color-blank': 'transparent'
    }

    Object.entries(elementPlusHighContrast).forEach(([key, value]) => {
      root.setProperty(key, value)
    })
  }

  // 初始化应用
  const initializeApp = async () => {
    try {
      // 从本地存储恢复设置
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | 'high-contrast'
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

      const savedSelectedSubject = localStorage.getItem('selected_subject')
      if (savedSelectedSubject) {
        selectedSubject.value = savedSelectedSubject
      }

      // 检查在线状态
      onlineStatus.value = navigator.onLine

      // 应用主题
      applyTheme()

      // 预加载学科数据
      await preloadSubjectData()

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
    selectedSubject,
    availableSubjects,
    subjectFilterResponse,
    recommendedSubjects,
    subjectsLoading,
    notifications,

    // 计算属性
    isDarkMode,
    isHighContrastMode,
    unreadNotificationsCount,
    currentSubjectInfo,
    filteredSubjects,
    hasSubjectData,

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
    setSelectedSubject,

    // 学科数据管理
    loadSubjects,
    loadRecommendedSubjects,
    preloadSubjectData,
    refreshSubjects,
    clearSubjectCache,
    getSubjectById,
    getSubjectColor,
    getSubjectIcon,
    validateSubjectSelection,

    // 主题管理
    getCurrentThemeColors,
    getThemeColor,
    applyHighContrastTheme,

    // 初始化
    initializeApp,
    initializeTheme,
    initialize
  }
})
