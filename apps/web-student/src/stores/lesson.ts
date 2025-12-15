import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Lesson, LessonSection, StudentProgress } from '@/types/lesson'
import type { ConnectionStatus } from '@shared-utils/websocket/types'
import { lessonApi } from '@/api/lesson'

type LessonConnectionState = ConnectionStatus | 'idle'

export const useLessonStore = defineStore('lesson', () => {
  // 状态
  const currentLesson = ref<Lesson | null>(null)
  const isLessonActive = ref(false)
  const studentProgress = ref<StudentProgress>({
    lessonId: '',
    sectionProgress: {},
    totalTime: 0,
    interactionCount: 0,
    lastActivity: null,
    startTime: null,
    endTime: null
  })
  const sectionStartTime = ref<Record<number, Date>>({})
  const interactions = ref<Array<{
    type: string
    data: any
    timestamp: Date
    sectionIndex: number
  }>>([])
  const offlineCache = ref<Map<string, any>>(new Map())
  const syncQueue = ref<Array<{
    type: string
    data: any
    timestamp: Date
    retryCount?: number
  }>>([])
  const lessonContext = ref<{ lessonId: string; classroomId: string } | null>(null)
  const connectionState = ref<LessonConnectionState>('idle')
  const connectionMeta = ref<{ changedAt: Date; reason?: string | null } | null>(null)

  // 计算属性
  const currentSection = computed(() => {
    if (!currentLesson.value) return null
    // 根据教师当前环节确定学生当前环节
    return currentLesson.value.sections.find(section => section.isActive)
  })

  const currentSectionIndex = computed(() => {
    if (!currentLesson.value || !currentSection.value) return -1
    return currentLesson.value.sections.indexOf(currentSection.value)
  })

  const lessonProgress = computed(() => {
    if (!currentLesson.value) return 0
    const completedSections = currentLesson.value.sections.filter(section =>
      studentProgress.value.sectionProgress[section.id]?.completed
    ).length
    return Math.round((completedSections / currentLesson.value.sections.length) * 100)
  })

  const isOffline = ref(false)

  // 方法
  const loadLesson = async (lessonId: string) => {
    try {
      // 检查离线缓存
      const cachedLesson = offlineCache.value.get(`lesson_${lessonId}`)
      if (isOffline.value && cachedLesson) {
        currentLesson.value = cachedLesson
        return cachedLesson
      }

      const lesson = await lessonApi.getLesson(lessonId)
      currentLesson.value = lesson
      lessonContext.value = {
        lessonId: lesson.id,
        classroomId: lesson.classroomId
      }

      // 缓存到离线存储
      offlineCache.value.set(`lesson_${lessonId}`, lesson)

      // 初始化学生进度
      studentProgress.value = {
        lessonId,
        sectionProgress: {},
        totalTime: 0,
        interactionCount: 0,
        lastActivity: new Date(),
        startTime: null,
        endTime: null
      }

      return lesson
    } catch (error) {
      console.error('加载课程失败:', error)
      throw error
    }
  }

  const initLesson = async (lessonId: string) => {
    const lesson = await loadLesson(lessonId)
    await loadProgressFromServer(lessonId)
    return lesson
  }

  const startLesson = () => {
    if (!currentLesson.value) return

    isLessonActive.value = true
    studentProgress.value.startTime = new Date()
    studentProgress.value.lastActivity = new Date()

    // 开始记录当前环节时间
    if (currentSectionIndex.value >= 0) {
      sectionStartTime.value[currentSectionIndex.value] = new Date()
    }

    // 添加到同步队列
    addToSyncQueue('lesson:start', {
      lessonId: currentLesson.value.id,
      startTime: studentProgress.value.startTime
    })
  }

  const updateSectionProgress = (sectionId: string, progress: number, data?: any) => {
    if (!studentProgress.value.sectionProgress[sectionId]) {
      studentProgress.value.sectionProgress[sectionId] = {
        completed: false,
        progress: 0,
        timeSpent: 0,
        interactions: []
      }
    }

    const sectionProgress = studentProgress.value.sectionProgress[sectionId]
    sectionProgress.progress = progress
    sectionProgress.completed = progress >= 100

    if (data) {
      sectionProgress.interactions.push({
        type: data.type,
        data: data.content,
        timestamp: new Date()
      })
    }

    studentProgress.value.lastActivity = new Date()
    studentProgress.value.interactionCount++

    // 添加到同步队列
    addToSyncQueue('section:progress', {
      lessonId: currentLesson.value?.id,
      sectionId,
      progress,
      data
    })
  }

  const recordInteraction = (type: string, content: any, sectionIndex: number) => {
    const interaction = {
      type,
      data: content,
      timestamp: new Date(),
      sectionIndex
    }

    interactions.value.push(interaction)

    if (currentSection.value) {
      updateSectionProgress(currentSection.value.id,
        studentProgress.value.sectionProgress[currentSection.value.id]?.progress || 0,
        { type, content }
      )
    }

    // 添加到同步队列
    addToSyncQueue('student:interaction', interaction)
  }

  const raiseHand = (raised: boolean) => {
    addToSyncQueue('student:hand_raise', {
      lessonId: currentLesson.value?.id,
      raised,
      timestamp: new Date()
    })
  }

  const askQuestion = (question: string) => {
    const questionData = {
      lessonId: currentLesson.value?.id,
      question,
      timestamp: new Date(),
      sectionIndex: currentSectionIndex.value
    }

    addToSyncQueue('student:question', questionData)
  }

  const pauseLesson = () => {
    isLessonActive.value = false

    // 暂停当前环节计时
    if (currentSectionIndex.value >= 0 && sectionStartTime.value[currentSectionIndex.value]) {
      const timeSpent = Date.now() - sectionStartTime.value[currentSectionIndex.value].getTime()
      if (currentSection.value) {
        studentProgress.value.sectionProgress[currentSection.value.id].timeSpent += timeSpent
      }
    }

    addToSyncQueue('lesson:pause', {
      lessonId: currentLesson.value?.id,
      timestamp: new Date()
    })
  }

  const resumeLesson = () => {
    isLessonActive.value = true
    studentProgress.value.lastActivity = new Date()

    // 恢复当前环节计时
    if (currentSectionIndex.value >= 0) {
      sectionStartTime.value[currentSectionIndex.value] = new Date()
    }

    addToSyncQueue('lesson:resume', {
      lessonId: currentLesson.value?.id,
      timestamp: new Date()
    })
  }

  const endLesson = () => {
    isLessonActive.value = false
    studentProgress.value.endTime = new Date()

    // 计算总时长
    if (studentProgress.value.startTime) {
      studentProgress.value.totalTime = Date.now() - studentProgress.value.startTime.getTime()
    }

    // 结束当前环节计时
    if (currentSectionIndex.value >= 0 && sectionStartTime.value[currentSectionIndex.value]) {
      const timeSpent = Date.now() - sectionStartTime.value[currentSectionIndex.value].getTime()
      if (currentSection.value) {
        studentProgress.value.sectionProgress[currentSection.value.id].timeSpent += timeSpent
      }
    }

    addToSyncQueue('lesson:end', {
      lessonId: currentLesson.value?.id,
      endTime: studentProgress.value.endTime,
      totalProgress: lessonProgress.value,
      studentProgress: studentProgress.value
    })
  }

  const updateSection = (sectionIndex: number, section: LessonSection) => {
    if (!currentLesson.value) return

    // 更新当前环节信息
    currentLesson.value.sections[sectionIndex] = { ...section }

    // 如果切换到新环节，停止当前环节计时
    if (currentSectionIndex.value !== sectionIndex && currentSectionIndex.value >= 0) {
      if (sectionStartTime.value[currentSectionIndex.value]) {
        const timeSpent = Date.now() - sectionStartTime.value[currentSectionIndex.value].getTime()
        const currentSection = currentLesson.value.sections[currentSectionIndex.value]
        if (currentSection && studentProgress.value.sectionProgress[currentSection.id]) {
          studentProgress.value.sectionProgress[currentSection.id].timeSpent += timeSpent
        }
      }
    }

    // 开始新环节计时
    sectionStartTime.value[sectionIndex] = new Date()

    // 如果环节状态为活跃，更新课程状态
    if (section.isActive) {
      isLessonActive.value = true
      if (!studentProgress.value.startTime) {
        studentProgress.value.startTime = new Date()
      }
    }

    // 更新离线缓存
    offlineCache.value.set(`lesson_${currentLesson.value.id}`, currentLesson.value)
  }

  const handleTeacherEvent = (event: any) => {
    switch (event.type) {
      case 'section:start':
        if (event.data.sectionIndex !== undefined) {
          const section = currentLesson.value?.sections[event.data.sectionIndex]
          if (section) {
            updateSection(event.data.sectionIndex, { ...section, isActive: true })
          }
        }
        break

      case 'section:end':
        if (event.data.sectionIndex !== undefined) {
          const section = currentLesson.value?.sections[event.data.sectionIndex]
          if (section) {
            updateSection(event.data.sectionIndex, { ...section, isActive: false, completed: true })

            // 标记该环节进度为100%
            updateSectionProgress(section.id, 100)
          }
        }
        break

      case 'lesson:pause':
        pauseLesson()
        break

      case 'lesson:resume':
        resumeLesson()
        break

      case 'lesson:end':
        endLesson()
        break
    }
  }

  const advanceWithTeacher = (options: {
    sectionIndex: number
    action: 'start' | 'end'
    section?: Partial<LessonSection>
  }) => {
    if (!currentLesson.value) return
    const baseSection = currentLesson.value.sections[options.sectionIndex]
    if (!baseSection) return

    const nextSection = {
      ...baseSection,
      ...options.section
    }

    if (options.action === 'start') {
      nextSection.isActive = true
      resumeLesson()
    } else if (options.action === 'end') {
      nextSection.isActive = false
      nextSection.isCompleted = true
    }

    updateSection(options.sectionIndex, nextSection)
  }

  const submitActivityPayload = (type: string, data: any, sectionIndex?: number) => {
    recordInteraction(type, data, sectionIndex ?? currentSectionIndex.value)
  }

  const addToSyncQueue = (type: string, data: any) => {
    syncQueue.value.push({
      type,
      data,
      timestamp: new Date(),
      retryCount: 0
    })

    // 如果在线，尝试立即同步
    if (!isOffline.value) {
      processSyncQueue()
    }
  }

  const setConnectionState = (state: LessonConnectionState, meta?: { reason?: string | null }) => {
    connectionState.value = state
    connectionMeta.value = {
      changedAt: new Date(),
      reason: meta?.reason ?? null
    }
  }

  const processSyncQueue = async () => {
    if (syncQueue.value.length === 0) return

    const queueCopy = [...syncQueue.value]
    syncQueue.value = []

    for (const item of queueCopy) {
      try {
        await lessonApi.syncStudentActivity(item.type, item.data)
      } catch (error) {
        console.error('同步失败:', error)

        // 重试逻辑
        item.retryCount = (item.retryCount || 0) + 1
        if (item.retryCount < 3) {
          syncQueue.value.push(item)
        }
      }
    }
  }

  const saveProgressToServer = async () => {
    if (!currentLesson.value) return

    try {
      await lessonApi.saveStudentProgress(studentProgress.value)

      // 清空同步队列
      syncQueue.value = []
    } catch (error) {
      console.error('保存进度失败:', error)
      throw error
    }
  }

  const loadProgressFromServer = async (lessonId: string) => {
    try {
      const progress = await lessonApi.getStudentProgress(lessonId)
      studentProgress.value = { ...studentProgress.value, ...progress }
      return progress
    } catch (error) {
      console.error('加载进度失败:', error)
      return null
    }
  }

  const clearCurrentLesson = () => {
    currentLesson.value = null
    isLessonActive.value = false
    studentProgress.value = {
      lessonId: '',
      sectionProgress: {},
      totalTime: 0,
      interactionCount: 0,
      lastActivity: null,
      startTime: null,
      endTime: null
    }
    sectionStartTime.value = {}
    interactions.value = []
    syncQueue.value = []
  }

  const setOfflineMode = (offline: boolean) => {
    isOffline.value = offline

    if (!offline) {
      // 恢复在线时处理同步队列
      processSyncQueue()
    }
  }

  const generateProgressReport = () => {
    if (!currentLesson.value) return null

    const report = {
      lessonId: currentLesson.value.id,
      lessonTitle: currentLesson.value.title,
      studentId: '', // 需要从用户store获取
      startTime: studentProgress.value.startTime,
      endTime: studentProgress.value.endTime,
      totalTime: studentProgress.value.totalTime,
      sectionProgress: studentProgress.value.sectionProgress,
      interactionCount: studentProgress.value.interactionCount,
      overallProgress: lessonProgress.value,
      interactions: interactions.value,
      summary: {
        sectionsCompleted: Object.values(studentProgress.value.sectionProgress)
          .filter(p => p.completed).length,
        totalSections: currentLesson.value.sections.length,
        averageSectionTime: 0, // 计算平均环节用时
        mostActiveSection: '', // 最活跃的环节
        interactionTypes: {} // 互动类型统计
      }
    }

    // 计算统计数据
    const sectionTimes = Object.values(studentProgress.value.sectionProgress)
      .map(p => p.timeSpent).filter(t => t > 0)

    if (sectionTimes.length > 0) {
      report.summary.averageSectionTime = sectionTimes.reduce((a, b) => a + b, 0) / sectionTimes.length
    }

    // 统计互动类型
    interactions.value.forEach(interaction => {
      report.summary.interactionTypes[interaction.type] =
        (report.summary.interactionTypes[interaction.type] || 0) + 1
    })

    return report
  }

  return {
    // 状态
    currentLesson,
    isLessonActive,
    studentProgress,
    sectionStartTime,
    interactions,
    offlineCache,
    syncQueue,
    isOffline,
    lessonContext,
    connectionState,
    connectionMeta,

    // 计算属性
    currentSection,
    currentSectionIndex,
    lessonProgress,

    // 方法
    initLesson,
    loadLesson,
    startLesson,
    updateSectionProgress,
    recordInteraction,
    raiseHand,
    askQuestion,
    pauseLesson,
    resumeLesson,
    endLesson,
    updateSection,
    handleTeacherEvent,
    advanceWithTeacher,
    processSyncQueue,
    saveProgressToServer,
    loadProgressFromServer,
    clearCurrentLesson,
    setOfflineMode,
    generateProgressReport,
    addToSyncQueue,
    setConnectionState,
    submitActivityPayload
  }
})
