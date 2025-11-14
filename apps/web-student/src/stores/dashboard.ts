import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import { useCourseStore } from './course'
import { useOfflineData } from '@/services/persistence/offline-data.service'

/**
 * Dashboard数据管理Store
 * 专门用于管理Dashboard页面所需的数据和状态
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const userStore = useUserStore()
  const courseStore = useCourseStore()
  const offlineData = useOfflineData()

  // 基础状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Dashboard特定数据
  const studyStats = ref({
    totalStudyTime: 0,
    todayStudyTime: 0,
    weekStudyTime: 0,
    streakDays: 0,
    completedActivities: 0,
    totalActivities: 0
  })

  const recentActivities = ref<Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: Date
    courseTitle: string
  }>>([])

  const upcomingDeadlines = ref<Array<{
    id: string
    title: string
    type: 'assignment' | 'quiz' | 'project'
    courseTitle: string
    deadline: Date
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'completed' | 'overdue'
  }>>([])

  const learningProgress = ref<Array<{
    courseId: string
    courseTitle: string
    progress: number
    completedChapters: number
    totalChapters: number
    lastAccessed: Date
  }>>([])

  const achievements = ref<Array<{
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: Date
    category: 'learning' | 'participation' | 'achievement'
  }>>([])

  // ===================
  // 计算属性
  // ===================

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  const todayCourses = computed(() => courseStore.todayCourses)
  const completedCount = computed(() => courseStore.completedChapters)
  const overallProgress = computed(() => courseStore.overallProgress)

  const studyTimeFormatted = computed(() => {
    const { todayStudyTime } = studyStats.value
    const hours = Math.floor(todayStudyTime / 3600)
    const minutes = Math.floor((todayStudyTime % 3600) / 60)

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
    } else if (minutes > 0) {
      return `${minutes}分钟`
    } else {
      return '0分钟'
    }
  })

  const weekProgress = computed(() => {
    const weekTarget = 20 * 60 * 60 // 20小时目标（秒）
    const actualTime = studyStats.value.weekStudyTime
    return Math.round((actualTime / weekTarget) * 100)
  })

  const upcomingDeadlinesCount = computed(() => {
    return upcomingDeadlines.value.filter(d => d.status === 'pending').length
  })

  const hasNewAchievements = computed(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return achievements.value.some(a => a.unlockedAt > oneDayAgo)
  })

  const learningInsights = computed(() => {
    const insights = []

    // 学习时间洞察
    if (studyStats.value.todayStudyTime > 0) {
      insights.push({
        type: 'positive',
        title: '今日学习活跃',
        message: `您今天已学习${studyTimeFormatted.value}`
      })
    }

    // 进度洞察
    if (overallProgress.value > 50) {
      insights.push({
        type: 'positive',
        title: '学习进度良好',
        message: `整体进度已达到${overallProgress.value}%`
      })
    }

    // 连续学习洞察
    if (studyStats.value.streakDays >= 3) {
      insights.push({
        type: 'achievement',
        title: '连续学习',
        message: `已连续学习${studyStats.value.streakDays}天`
      })
    }

    // 即将到期提醒
    const urgentDeadlines = upcomingDeadlines.value.filter(d => {
      const hoursUntilDeadline = (d.deadline.getTime() - Date.now()) / (1000 * 60 * 60)
      return d.status === 'pending' && hoursUntilDeadline < 24
    })

    if (urgentDeadlines.length > 0) {
      insights.push({
        type: 'warning',
        title: '即将到期',
        message: `有${urgentDeadlines.length}个任务即将在24小时内到期`
      })
    }

    return insights
  })

  // ===================
  // 方法
  // ===================

  /**
   * 加载Dashboard数据
   */
  const loadDashboardData = async () => {
    setLoading(true)
    clearError()

    try {
      // 并行加载所有数据
      await Promise.all([
        loadStudyStats(),
        loadRecentActivities(),
        loadUpcomingDeadlines(),
        loadLearningProgress(),
        loadAchievements(),
        courseStore.loadTodayCourses()
      ])

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('加载Dashboard数据失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载学习统计数据
   */
  const loadStudyStats = async () => {
    try {
      // 首先尝试从离线存储获取统计数据
      const cachedStats = await offlineData.getStudyStats()
      if (cachedStats) {
        studyStats.value = cachedStats
        console.log('✅ 从离线存储加载学习统计')
      } else {
        // 如果没有缓存数据，初始化默认统计
        studyStats.value = {
          totalStudyTime: 0,
          todayStudyTime: 0,
          weekStudyTime: 0,
          streakDays: 0,
          completedActivities: 0,
          totalActivities: 0
        }
        console.log('✅ 初始化学习统计数据')
      }

      // TODO: 后续可以从API获取最新数据进行同步更新

    } catch (err) {
      console.error('Failed to load study stats:', err)
      // 设置默认统计数据
      studyStats.value = {
        totalStudyTime: 0,
        todayStudyTime: 0,
        weekStudyTime: 0,
        streakDays: 0,
        completedActivities: 0,
        totalActivities: 0
      }
    }
  }

  /**
   * 加载最近活动
   */
  const loadRecentActivities = async () => {
    try {
      // TODO: 从活动执行状态获取最近活动
      // 暂时使用模拟数据
      recentActivities.value = [
        {
          id: '1',
          type: 'knowledge',
          title: '完成"Python基础语法"学习',
          description: '完成了第2章的基础语法学习',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          courseTitle: 'Python编程入门'
        },
        {
          id: '2',
          type: 'experiment',
          title: '完成Jupyter实验',
          description: '成功运行了第一个Jupyter Notebook',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          courseTitle: '数据科学基础'
        },
        {
          id: '3',
          type: 'assignment',
          title: '提交作业',
          description: '提交了函数练习作业',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          courseTitle: 'Python编程入门'
        }
      ]
    } catch (err) {
      console.error('Failed to load recent activities:', err)
      throw err
    }
  }

  /**
   * 加载即将到期的任务
   */
  const loadUpcomingDeadlines = async () => {
    try {
      // TODO: 从作业系统获取即将到期的任务
      // 暂时使用模拟数据
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

      upcomingDeadlines.value = [
        {
          id: '1',
          title: 'Python函数练习',
          type: 'assignment',
          courseTitle: 'Python编程入门',
          deadline: tomorrow,
          priority: 'high',
          status: 'pending'
        },
        {
          id: '2',
          title: '数据结构测验',
          type: 'quiz',
          courseTitle: '数据科学基础',
          deadline: inThreeDays,
          priority: 'medium',
          status: 'pending'
        },
        {
          id: '3',
          title: '机器学习项目',
          type: 'project',
          courseTitle: '人工智能导论',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          priority: 'low',
          status: 'pending'
        }
      ]
    } catch (err) {
      console.error('Failed to load upcoming deadlines:', err)
      throw err
    }
  }

  /**
   * 加载学习进度
   */
  const loadLearningProgress = async () => {
    try {
      // TODO: 从课程进度数据计算
      // 暂时使用模拟数据
      learningProgress.value = [
        {
          courseId: '1',
          courseTitle: 'Python编程入门',
          progress: 75,
          completedChapters: 6,
          totalChapters: 8,
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          courseId: '2',
          courseTitle: '数据科学基础',
          progress: 45,
          completedChapters: 4,
          totalChapters: 9,
          lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          courseId: '3',
          courseTitle: '人工智能导论',
          progress: 20,
          completedChapters: 1,
          totalChapters: 5,
          lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ]
    } catch (err) {
      console.error('Failed to load learning progress:', err)
      throw err
    }
  }

  /**
   * 加载成就数据
   */
  const loadAchievements = async () => {
    try {
      // TODO: 从成就系统获取数据
      // 暂时使用模拟数据
      achievements.value = [
        {
          id: '1',
          title: '初学者',
          description: '完成第一个学习活动',
          icon: '🎯',
          unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          category: 'learning'
        },
        {
          id: '2',
          title: '连续学习一周',
          description: '连续7天都有学习活动',
          icon: '🔥',
          unlockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          category: 'achievement'
        },
        {
          id: '3',
          title: '积极学习者',
          description: '完成10个学习活动',
          icon: '⭐',
          unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          category: 'participation'
        }
      ]
    } catch (err) {
      console.error('Failed to load achievements:', err)
      throw err
    }
  }

  /**
   * 刷新数据
   */
  const refreshData = async () => {
    await loadDashboardData()
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 设置错误
   */
  const setError = (message: string) => {
    error.value = message
  }

  /**
   * 设置加载状态
   */
  const setLoading = (status: boolean) => {
    loading.value = status
  }

  /**
   * 更新学习统计
   */
  const updateStudyStats = async (stats: Partial<typeof studyStats.value>) => {
    studyStats.value = { ...studyStats.value, ...stats }

    // 保存到离线存储
    try {
      await offlineData.saveStudyStats(studyStats.value)
      // 标记统计数据需要同步
      await offlineData.markForSync('stats', 'study', 'update')
      console.log('✅ 学习统计已保存并标记同步')
    } catch (error) {
      console.error('保存学习统计失败:', error)
    }
  }

  /**
   * 添加最近活动
   */
  const addRecentActivity = (activity: typeof recentActivities.value[0]) => {
    recentActivities.value.unshift(activity)
    // 限制最近活动数量
    if (recentActivities.value.length > 10) {
      recentActivities.value = recentActivities.value.slice(0, 10)
    }
  }

  /**
   * 解锁成就
   */
  const unlockAchievement = (achievement: Omit<typeof achievements.value[0], 'unlockedAt'>) => {
    const existingIndex = achievements.value.findIndex(a => a.id === achievement.id)
    if (existingIndex === -1) {
      achievements.value.push({
        ...achievement,
        unlockedAt: new Date()
      })
    }
  }

  /**
   * 记录学习时间
   */
  const recordStudyTime = async (minutes: number) => {
    const seconds = minutes * 60
    await updateStudyStats({
      todayStudyTime: studyStats.value.todayStudyTime + seconds,
      weekStudyTime: studyStats.value.weekStudyTime + seconds,
      totalStudyTime: studyStats.value.totalStudyTime + seconds
    })
  }

  /**
   * 完成活动时更新统计
   */
  const completeActivity = async (courseId: string, activityType: string) => {
    await updateStudyStats({
      completedActivities: studyStats.value.completedActivities + 1,
      totalActivities: Math.max(studyStats.value.totalActivities, studyStats.value.completedActivities + 1)
    })

    // 添加到最近活动
    const course = courseStore.todayCourses.find(c => c.id === courseId)
    addRecentActivity({
      id: Date.now().toString(),
      type: activityType,
      title: `完成${activityType === 'knowledge' ? '知识点学习' : activityType === 'experiment' ? '实验' : '作业'}`,
      description: `完成了${course?.title || '课程'}的${activityType === 'knowledge' ? '知识点学习' : activityType === 'experiment' ? '实验' : '作业'}`,
      timestamp: new Date(),
      courseTitle: course?.title || '未知课程'
    })
  }

  /**
   * 初始化Dashboard数据
   * 从离线存储恢复数据
   */
  const initializeDashboardData = async () => {
    try {
      await loadStudyStats()
      console.log('✅ Dashboard数据初始化完成')
    } catch (error) {
      console.error('Dashboard数据初始化失败:', error)
    }
  }

  // ===================
  // 返回值
  // ===================

  return {
    // 状态
    loading: isLoading,
    error: hasError,

    // 数据
    studyStats,
    recentActivities,
    upcomingDeadlines,
    learningProgress,
    achievements,

    // 计算属性
    todayCourses,
    completedCount,
    overallProgress,
    studyTimeFormatted,
    weekProgress,
    upcomingDeadlinesCount,
    hasNewAchievements,
    learningInsights,

    // 方法
    loadDashboardData,
    refreshData,
    loadStudyStats,
    loadRecentActivities,
    loadUpcomingDeadlines,
    loadLearningProgress,
    loadAchievements,
    updateStudyStats,
    addRecentActivity,
    unlockAchievement,

    // 数据持久化方法
    recordStudyTime,
    completeActivity,
    initializeDashboardData
  }
})