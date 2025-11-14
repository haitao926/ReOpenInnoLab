import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 导入新的类型定义
import type {
  Course as CourseType,
  Chapter as ChapterType,
  Activity as ActivityType,
  ActivityContext,
  ActivityExecutionState,
  CourseSubject
} from '@/types/course'

// 导入ACL工具
import { aclUtils, aclSyncManager } from '@/utils/acl'

// 导入API
import { getTodayCourses, getCourseChapters, completeChapter as completeChapterApi } from '@/api/course'

// 导入数据持久化服务
import { useOfflineData } from '@/services/persistence/offline-data.service'

// ===================
// 课程Store
// ===================

/**
 * 课程数据管理Store
 * 使用统一的类型定义和ACL结构支持
 */
export const useCourseStore = defineStore('course', () => {
  // 离线数据服务
  const offlineData = useOfflineData()

  // 基础状态
  const todayCourses = ref<CourseType[]>([])
  const currentCourse = ref<CourseType | null>(null)
  const currentChapters = ref<ChapterType[]>([])
  const currentChapter = ref<ChapterType | null>(null)
  const currentActivity = ref<ActivityType | null>(null)
  const activityContext = ref<ActivityContext | null>(null)
  const activityStates = ref<Map<string, ActivityExecutionState>>(new Map())

  // 加载和错误状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 订阅取消函数
  const unsubscribeFunctions = ref<Map<string, () => void>>(new Map())

  // ===================
  // 计算属性
  // ===================

  const hasCurrentCourse = computed(() => !!currentCourse.value)
  const hasCurrentChapter = computed(() => !!currentChapter.value)
  const hasCurrentActivity = computed(() => !!currentActivity.value)

  const courseProgress = computed(() => {
    return currentCourse.value?.progress || 0
  })

  const completedChapters = computed(() => {
    return currentChapters.value.filter(ch => ch.status === 'completed').length
  })

  const totalChapters = computed(() => {
    return currentChapters.value.length
  })

  const overallProgress = computed(() => {
    if (currentChapters.value.length === 0) return 0
    return Math.round((completedChapters.value / currentChapters.value.length) * 100)
  })

  const availableChapters = computed(() => {
    return currentChapters.value.filter(ch =>
      ch.status === 'available' || ch.status === 'in_progress'
    )
  })

  const lockedChapters = computed(() => {
    return currentChapters.value.filter(ch => ch.status === 'locked')
  })

  const nextChapter = computed(() => {
    return availableChapters.value[0] || null
  })

  const currentChapterActivities = computed(() => {
    return currentChapter.value?.activities || []
  })

  const currentChapterProgress = computed(() => {
    return currentChapter.value?.progress || 0
  })

  const activityInProgress = computed(() => {
    return Array.from(activityStates.value.values()).some(
      state => state.status === 'running' || state.status === 'starting'
    )
  })

  // ===================
  // 基础操作
  // ===================

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const resetState = () => {
    currentCourse.value = null
    currentChapters.value = []
    currentChapter.value = null
    currentActivity.value = null
    activityContext.value = null
    activityStates.value.clear()
    clearError()

    // 取消所有订阅
    unsubscribeFunctions.value.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions.value.clear()
  }

  // ===================
  // 课程数据操作
  // ===================

  /**
   * 加载今日课程列表
   */
  const loadTodayCourses = async () => {
    setLoading(true)
    clearError()

    try {
      // 首先尝试从离线存储加载缓存数据
      const cachedCourses = await offlineData.getCourses()
      if (cachedCourses && cachedCourses.length > 0) {
        todayCourses.value = cachedCourses
        console.log('✅ 从离线存储加载课程列表')
      }

      // 尝试从API获取最新数据
      const apiCourses = await getTodayCourses()

      // 转换为新的类型格式
      const formattedCourses = apiCourses.map(course => convertApiCourseToCourse(course))
      todayCourses.value = formattedCourses

      // 缓存到离线存储
      await offlineData.saveCourses(formattedCourses)
      console.log('✅ 课程列表已更新并缓存')

    } catch (err) {
      console.warn('API加载失败，使用离线缓存:', err)

      // 如果API失败，尝试使用离线存储中的数据
      try {
        const cachedCourses = await offlineData.getCourses()
        if (cachedCourses && cachedCourses.length > 0) {
          todayCourses.value = cachedCourses
          console.log('✅ 使用离线缓存课程列表')
          return
        }
      } catch (cacheErr) {
        console.error('离线缓存读取失败:', cacheErr)
      }

      // 如果所有方法都失败，设置错误状态
      setError('无法加载课程列表，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 选择并加载课程
   */
  const selectCourse = async (courseId: string) => {
    const course = todayCourses.value.find(c => c.id === courseId)
    if (!course) {
      setError('课程不存在')
      return false
    }

    setLoading(true)
    clearError()

    try {
      // 尝试从离线存储加载当前课程
      const cachedCurrentCourse = await offlineData.getCurrentCourse()
      if (cachedCurrentCourse && cachedCurrentCourse.id === courseId) {
        currentCourse.value = cachedCurrentCourse
        currentChapters.value = cachedCurrentCourse.chapters || []
        console.log('✅ 从离线存储加载当前课程')
      }

      // 尝试使用ACL同步管理器加载完整课程数据
      try {
        const fullCourse = await aclSyncManager.syncCourseData(courseId)

        if (fullCourse) {
          currentCourse.value = fullCourse
          currentChapters.value = fullCourse.chapters || []

          // 保存到离线存储
          await offlineData.saveCurrentCourse(fullCourse)

          // 订阅课程数据更新
          const unsubscribe = aclSyncManager.subscribe(courseId, (updatedCourse) => {
            currentCourse.value = updatedCourse
            currentChapters.value = updatedCourse.chapters || []
            // 保存更新到离线存储
            offlineData.saveCurrentCourse(updatedCourse)
          })

          unsubscribeFunctions.value.set(courseId, unsubscribe)

          ElMessage.success(`已加载课程: ${fullCourse.title}`)
          return true
        }
      } catch (aclErr) {
        console.warn('ACL同步失败，使用基础课程数据:', aclErr)
      }

      // 如果ACL同步失败，使用课程列表中的数据并保存为当前课程
      currentCourse.value = course
      currentChapters.value = course.chapters || []
      await offlineData.saveCurrentCourse(course)

      ElMessage.success(`已选择课程: ${course.title}`)
      return true

    } catch (err) {
      console.error('选择课程失败:', err)
      setError('加载课程详情失败')

      // 使用课程列表中的数据作为备用
      currentCourse.value = course
      currentChapters.value = course.chapters || []
      await offlineData.saveCurrentCourse(course)

      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * 选择章节
   */
  const selectChapter = (chapterId: string) => {
    const chapter = currentChapters.value.find(ch => ch.id === chapterId)
    if (!chapter) {
      setError('章节不存在')
      return false
    }

    currentChapter.value = chapter
    currentActivity.value = null
    activityContext.value = null

    // 如果章节是锁定状态，检查是否可以解锁
    if (chapter.status === 'locked') {
      if (canUnlockChapter(chapter)) {
        chapter.status = 'available'
        ElMessage.info(`章节"${chapter.title}"已解锁`)
      }
    }

    return true
  }

  /**
   * 选择活动
   */
  const selectActivity = (activityId: string) => {
    if (!currentChapter.value) {
      setError('请先选择章节')
      return false
    }

    const activity = currentChapter.value.activities?.find(ac => ac.id === activityId)
    if (!activity) {
      setError('活动不存在')
      return false
    }

    currentActivity.value = activity

    // 创建活动上下文
    activityContext.value = {
      courseId: currentCourse.value?.id || '',
      chapterId: currentChapter.value.id,
      activityId: activity.id,
      activityType: activity.type,
      activity,
      courseTitle: currentCourse.value?.title,
      chapterTitle: currentChapter.value.title
    }

    return true
  }

  // ===================
  // 进度管理
  // ===================

  /**
   * 完成章节
   */
  const completeChapter = async (chapterId: string) => {
    const chapter = currentChapters.value.find(ch => ch.id === chapterId)
    if (!chapter || !currentCourse.value) {
      return false
    }

    try {
      setLoading(true)

      // 尝试API调用
      await completeChapterApi(currentCourse.value.id, chapterId)

      // 更新本地状态
      chapter.status = 'completed'
      chapter.progress = 100

      // 解锁下一个章节
      unlockNextChapter(chapter)

      // 更新课程进度
      await updateCourseProgress()

      ElMessage.success(`章节"${chapter.title}"已完成`)
      return true

    } catch (err) {
      console.error('完成章节失败:', err)
      setError('完成章节失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * 更新活动进度
   */
  const updateActivityProgress = async (activityId: string, progress: number) => {
    if (!currentCourse.value) return

    try {
      // 更新ACL同步管理器中的进度
      await aclSyncManager.updateProgress(
        currentCourse.value.id,
        currentChapter.value?.id || '',
        activityId,
        progress
      )

      // 更新本地活动状态
      const activityState = activityStates.value.get(activityId)
      if (activityState) {
        activityState.progress = progress

        if (progress >= 100) {
          activityState.status = 'completed'
          activityState.endTime = new Date()
        }
      }

    } catch (err) {
      console.error('更新活动进度失败:', err)
    }
  }

  /**
   * 更新活动执行状态
   */
  const updateActivityState = (activityId: string, state: ActivityExecutionState) => {
    activityStates.value.set(activityId, state)
  }

  /**
   * 获取活动状态
   */
  const getActivityState = (activityId: string): ActivityExecutionState | undefined => {
    return activityStates.value.get(activityId)
  }

  /**
   * 更新课程进度
   */
  const updateCourseProgress = async () => {
    if (!currentCourse.value || !currentChapters.value.length) return

    // 计算总进度
    const totalProgress = currentChapters.value.reduce((sum, chapter) => {
      return sum + (chapter.progress || 0)
    }, 0)

    const avgProgress = Math.round(totalProgress / currentChapters.value.length)
    currentCourse.value.progress = avgProgress

    // 保存进度到离线存储
    try {
      await offlineData.saveCourseProgress(currentCourse.value.id, avgProgress)
      // 标记进度数据需要同步
      await offlineData.markForSync('course', currentCourse.value.id, 'update')
      console.log(`✅ 课程进度已保存并标记同步: ${avgProgress}%`)
    } catch (err) {
      console.error('保存课程进度失败:', err)
    }

    // 同步到服务器
    try {
      // 这里可以调用API更新课程进度
      console.log(`课程进度更新: ${avgProgress}%`)
    } catch (err) {
      console.error('同步课程进度失败:', err)
    }
  }

  // ===================
  // 辅助方法
  // ===================

  /**
   * 检查是否可以解锁章节
   */
  const canUnlockChapter = (chapter: ChapterType): boolean => {
    // 如果是第一章，总是可以解锁
    const chapterIndex = currentChapters.value.findIndex(ch => ch.id === chapter.id)
    if (chapterIndex === 0) return true

    // 检查前一章是否已完成
    const prevChapter = currentChapters.value[chapterIndex - 1]
    return prevChapter?.status === 'completed'
  }

  /**
   * 解锁下一个章节
   */
  const unlockNextChapter = (completedChapter: ChapterType) => {
    const chapterIndex = currentChapters.value.findIndex(ch => ch.id === completedChapter.id)
    const nextChapter = currentChapters.value[chapterIndex + 1]

    if (nextChapter && nextChapter.status === 'locked') {
      nextChapter.status = 'available'
      ElMessage.info(`章节"${nextChapter.title}"已解锁`)
    }
  }

  /**
   * 转换API课程数据为新格式
   */
  const convertApiCourseToCourse = (apiCourse: any): CourseType => {
    return {
      id: apiCourse.id,
      title: apiCourse.title,
      description: apiCourse.description,
      className: apiCourse.className,
      subject: apiCourse.subject as CourseSubject,
      schedule: apiCourse.schedule,
      teacherMessage: apiCourse.teacherMessage,
      taskCount: apiCourse.taskCount,
      progress: apiCourse.progress,
      active: apiCourse.active,
      teacherId: apiCourse.teacherId,
      teacherName: apiCourse.teacherName,
      createdAt: apiCourse.createdAt,
      updatedAt: apiCourse.updatedAt
    }
  }

  /**
   * 初始化课程数据
   * 从离线存储恢复课程状态
   */
  const initializeCourseData = async () => {
    try {
      // 恢复当前选择的课程
      const cachedCurrentCourse = await offlineData.getCurrentCourse()
      if (cachedCurrentCourse) {
        currentCourse.value = cachedCurrentCourse
        currentChapters.value = cachedCurrentCourse.chapters || []
        console.log('✅ 恢复当前课程:', cachedCurrentCourse.title)
      }

      // 恢复课程列表
      const cachedCourses = await offlineData.getCourses()
      if (cachedCourses && cachedCourses.length > 0) {
        todayCourses.value = cachedCourses
        console.log('✅ 恢复课程列表:', cachedCourses.length, '门课程')
      }
    } catch (error) {
      console.error('初始化课程数据失败:', error)
    }
  }

  // ===================
  // 生命周期
  // ===================

  // 初始化课程数据
  initializeCourseData()

  // 清理订阅
  const cleanup = () => {
    unsubscribeFunctions.value.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions.value.clear()
  }

  // ===================
  // 导出
  // ===================

  return {
    // 状态
    todayCourses,
    currentCourse,
    currentChapters,
    currentChapter,
    currentActivity,
    activityContext,
    activityStates,
    loading,
    error,

    // 计算属性
    hasCurrentCourse,
    hasCurrentChapter,
    hasCurrentActivity,
    courseProgress,
    completedChapters,
    totalChapters,
    overallProgress,
    availableChapters,
    lockedChapters,
    nextChapter,
    currentChapterActivities,
    currentChapterProgress,
    activityInProgress,

    // 基础操作
    setLoading,
    setError,
    clearError,
    resetState,

    // 课程操作
    loadTodayCourses,
    selectCourse,
    selectChapter,
    selectActivity,

    // 进度管理
    completeChapter,
    updateActivityProgress,
    updateActivityState,
    getActivityState,
    updateCourseProgress,

    // 数据操作
    initializeCourseData,

    // 清理
    cleanup
  }
})