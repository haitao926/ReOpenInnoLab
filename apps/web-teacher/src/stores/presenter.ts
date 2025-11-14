import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { LessonInfo, CourseSection } from '@/types/course'
import { classroomApi } from '@/api/classroom'
import { lessonApi } from '@/api/lesson'
import { socketService } from '@/services/socket'
import { useUserStore } from './user'

export interface PresenterState {
  lessonId: string
  currentSection: number
  status: 'idle' | 'starting' | 'running' | 'paused' | 'ended'
  startTime?: Date
  sectionTimings: Record<number, { start: Date; end?: Date }>
  studentStates: StudentState[]
  annotations: Annotation[]
}

export interface StudentState {
  studentId: string
  name: string
  status: 'online' | 'offline' | 'active'
  currentSection: number
  progress: number
  lastActivity: Date
  interactions: StudentInteraction[]
}

export interface StudentInteraction {
  type: 'view' | 'click' | 'input' | 'submit' | 'experiment' | 'experience'
  timestamp: Date
  data?: any
  duration?: number
}

export interface Annotation {
  id: string
  type: 'text' | 'drawing' | 'highlight' | 'laser'
  content: any
  position: { x: number; y: number }
  timestamp: Date
  authorId: string
}

export interface LessonReport {
  lessonId: string
  classId: string
  instructorId: string
  summary: {
    totalDuration: number
    sectionDurations: Record<string, number>
    studentCount: number
    participationRate: number
    completionRate: number
  }
  sectionAnalytics: SectionAnalytics[]
  studentAnalytics: StudentAnalytics[]
  aiInsights: AIInsight[]
  recommendations: string[]
}

export interface SectionAnalytics {
  sectionIndex: number
  sectionTitle: string
  duration: number
  studentEngagement: number
  completionRate: number
  commonIssues: string[]
  interactions: any[]
}

export interface StudentAnalytics {
  studentId: string
  name: string
  totalTime: number
  sectionsCompleted: number
  interactionCount: number
  performance: any
  engagement: 'high' | 'medium' | 'low'
}

export interface AIInsight {
  type: 'engagement' | 'comprehension' | 'pacing' | 'intervention'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
  timestamp: Date
}

export const usePresenterStore = defineStore('presenter', () => {
  const userStore = useUserStore()

  // 状态
  const currentLesson = ref<LessonInfo | null>(null)
  const presenterState = ref<PresenterState>({
    lessonId: '',
    currentSection: 0,
    status: 'idle',
    sectionTimings: {},
    studentStates: [],
    annotations: []
  })
  const isConnected = ref(false)

  // 计算属性
  const currentSection = computed(() => {
    if (!currentLesson.value?.sections) return null
    return currentLesson.value.sections[presenterState.value.currentSection] || null
  })

  const totalSections = computed(() => {
    return currentLesson.value?.sections?.length || 0
  })

  const activeStudentCount = computed(() => {
    return presenterState.value.studentStates.filter(
      student => student.status === 'online' || student.status === 'active'
    ).length
  })

  const currentDuration = computed(() => {
    if (!presenterState.value.startTime) return 0
    return Math.floor((Date.now() - presenterState.value.startTime.getTime()) / 1000)
  })

  // 课程信息相关
  const getLessonInfo = async (lessonId: string): Promise<LessonInfo> => {
    try {
      // 优先从真实API获取数据
      const lesson = await lessonApi.getLesson(lessonId)

      // 转换为LessonInfo格式
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        instructor: useUserStore().user.name,
        chapters: lesson.sections.map(section => ({
          id: section.id,
          title: section.title,
          type: section.type,
          duration: section.duration,
          content: section.content,
          order: section.order,
          completed: section.isCompleted
        })),
        status: lesson.status,
        startTime: lesson.actualStartAt,
        endTime: lesson.actualEndAt,
        participants: lesson.participantCount
      }
    } catch (error) {
      console.error('获取课程信息失败:', error.message)
      throw new Error(`无法加载课程信息: ${error.message}`)
    }
  }

  // 连接管理
  const connectToLesson = async (lessonId: string) => {
    try {
      presenterState.value.lessonId = lessonId
      presenterState.value.status = 'starting'
      presenterState.value.startTime = new Date()

      // 建立Socket.IO连接
      await socketService.connect()

      // 加入课程房间
      const classroomId = `classroom_${lessonId}` // 应该从课程数据获取
      if (!socketService.joinLesson(lessonId, userStore.id, 'teacher', classroomId)) {
        throw new Error('Failed to join lesson room')
      }

      // 注册事件监听器
      socketService.on('user_joined', handleStudentJoin)
      socketService.on('user_left', handleStudentLeave)
      socketService.on('student_interaction_received', handleStudentInteraction)

      isConnected.value = true
      presenterState.value.status = 'running'

      // 通知所有学生课程开始
      broadcastLessonState('started')

      ElMessage.success('已连接到课堂')
    } catch (error) {
      console.error('连接课堂失败:', error)
      presenterState.value.status = 'idle'
      throw error
    }
  }

  const disconnectFromLesson = () => {
    if (socketService.isConnected) {
      socketService.leaveLesson(presenterState.value.lessonId, userStore.id)
      socketService.disconnect()
    }
    isConnected.value = false
    presenterState.value.status = 'ended'
  }

  // 环节控制
  const setCurrentSection = (sectionIndex: number) => {
    const previousSection = presenterState.value.currentSection

    // 结束上一个环节计时
    if (previousSection >= 0) {
      const timing = presenterState.value.sectionTimings[previousSection]
      if (timing && !timing.end) {
        timing.end = new Date()
      }
    }

    // 开始新环节计时
    presenterState.value.currentSection = sectionIndex
    presenterState.value.sectionTimings[sectionIndex] = {
      start: new Date(),
      end: undefined
    }

    // 广播给学生端
    broadcastSectionChange(sectionIndex)
  }

  const broadcastSectionChange = (sectionIndex: number) => {
    if (!socketService.isConnected) return

    socketService.changeSection(
      presenterState.value.lessonId,
      sectionIndex,
      currentSection.value
    )
  }

  const broadcastLessonState = (state: string) => {
    if (!socketService.isConnected) return

    socketService.changeLessonState(
      presenterState.value.lessonId,
      state as 'started' | 'paused' | 'resumed' | 'ended',
      presenterState.value.currentSection
    )
  }

  // 暂停和恢复
  const pauseLesson = () => {
    presenterState.value.status = 'paused'
    broadcastLessonState('paused')
  }

  const resumeLesson = () => {
    presenterState.value.status = 'running'
    broadcastLessonState('resumed')
  }

  const endLesson = async (lessonId: string) => {
    try {
      presenterState.value.status = 'ended'

      // 结束当前环节计时
      const currentSectionIndex = presenterState.value.currentSection
      const timing = presenterState.value.sectionTimings[currentSectionIndex]
      if (timing && !timing.end) {
        timing.end = new Date()
      }

      // 通知所有学生课程结束
      broadcastLessonState('ended')

      // 生成课堂报告
      await generateLessonReport(lessonId)

      disconnectFromLesson()
      ElMessage.success('课程已结束')
    } catch (error) {
      console.error('结束课程失败:', error)
      throw error
    }
  }

  // 批注管理
  const saveAnnotation = async (annotation: Omit<Annotation, 'id' | 'timestamp' | 'authorId'>) => {
    try {
      const newAnnotation: Annotation = {
        ...annotation,
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        authorId: userStore.id || 'current_teacher' // 从用户状态获取
      }

      presenterState.value.annotations.push(newAnnotation)

      // 保存到后端API
      if (currentSession.value) {
        await classroomApi.saveLessonAnnotations(currentSession.value.id, presenterState.value.annotations)
      }

      // 广播批注给学生端（如果需要）
      if (socketService.isConnected) {
        socketService.addAnnotation(presenterState.value.lessonId, newAnnotation)
      }

      ElMessage.success('批注已保存')
    } catch (error) {
      console.error('保存批注失败:', error)
      ElMessage.error('保存批注失败')
    }
  }

  // Socket.IO事件处理
  const handleStudentJoin = (data: any) => {
    // Socket.IO格式：data = { userId, role, roomSize }
    const existingStudent = presenterState.value.studentStates.find(
      s => s.studentId === data.userId
    )

    if (!existingStudent && data.role === 'student') {
      presenterState.value.studentStates.push({
        studentId: data.userId,
        name: `学生${data.userId}`,
        status: 'online',
        currentSection: 0,
        progress: 0,
        lastActivity: new Date(),
        interactions: []
      })
    } else if (existingStudent) {
      existingStudent.status = 'online'
      existingStudent.lastActivity = new Date()
    }
  }

  const handleStudentLeave = (data: any) => {
    // Socket.IO格式：data = { userId, role, classroomId }
    const student = presenterState.value.studentStates.find(
      s => s.studentId === data.userId
    )

    if (student) {
      student.status = 'offline'
      student.lastActivity = new Date()
    }
  }

  const handleStudentInteraction = (data: any) => {
    // Socket.IO格式：data = { studentId, type, data, timestamp }
    const student = presenterState.value.studentStates.find(
      s => s.studentId === data.studentId
    )

    if (student) {
      student.status = 'active'
      student.lastActivity = new Date()

      const interaction: StudentInteraction = {
        type: data.interactionType || data.type,
        timestamp: new Date(data.timestamp),
        data: data.interactionData || data.data,
        duration: undefined
      }

      student.interactions.push(interaction)

      // 如果是环节进度更新，更新进度
      if (data.type === 'section_progress') {
        student.progress = data.progress
        student.currentSection = data.sectionIndex
      }
    }
  }

  const handleExperimentStatus = (data: any) => {
    // 处理实验状态更新
    console.log('实验状态更新:', data)
  }

  const handleAssignmentComplete = (data: any) => {
    // 处理作业完成
    console.log('作业完成:', data)
  }

  // 报告生成
  const generateLessonReport = async (lessonId: string): Promise<LessonReport> => {
    try {
      const now = new Date()
      const startTime = presenterState.value.startTime!
      const totalDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000)

      // 计算各环节时长
      const sectionDurations: Record<string, number> = {}
      Object.entries(presenterState.value.sectionTimings).forEach(([index, timing]) => {
        if (timing.end) {
          sectionDurations[index] = Math.floor((timing.end.getTime() - timing.start.getTime()) / 1000)
        }
      })

      // 计算参与度
      const activeStudents = presenterState.value.studentStates.filter(
        s => s.status === 'active' || s.interactions.length > 0
      ).length

      const participationRate = presenterState.value.studentStates.length > 0
        ? (activeStudents / presenterState.value.studentStates.length) * 100
        : 0

      // 生成学生分析
      const studentAnalytics: StudentAnalytics[] = presenterState.value.studentStates.map(student => ({
        studentId: student.studentId,
        name: student.name,
        totalTime: student.interactions.reduce((total, interaction) => {
          return total + (interaction.duration || 0)
        }, 0),
        sectionsCompleted: student.currentSection,
        interactionCount: student.interactions.length,
        performance: null, // 可以根据作业完成情况计算
        engagement: student.interactions.length > 10 ? 'high' :
                   student.interactions.length > 5 ? 'medium' : 'low'
      }))

      // 生成AI洞察
      const aiInsights: AIInsight[] = [
        {
          type: 'engagement',
          title: '学生参与度',
          description: `课堂整体参与度为${participationRate.toFixed(1)}%`,
          severity: participationRate > 70 ? 'low' : participationRate > 40 ? 'medium' : 'high',
          recommendation: participationRate < 60 ? '建议增加互动环节提高学生参与度' : '参与度良好',
          timestamp: now
        }
      ]

      // 生成建议
      const recommendations: string[] = [
        '建议在下一堂课中增加更多互动环节',
        '可以考虑调整课程节奏以适应学生的学习进度'
      ]

      const report: LessonReport = {
        lessonId,
        classId: 'class-1', // 实际应该从上下文获取
        instructorId: 'teacher-1', // 实际应该从用户状态获取
        summary: {
          totalDuration,
          sectionDurations,
          studentCount: presenterState.value.studentStates.length,
          participationRate,
          completionRate: ((currentSection.value || 0) + 1) / totalSections.value * 100
        },
        sectionAnalytics: [], // 可以进一步细化
        studentAnalytics,
        aiInsights,
        recommendations
      }

      return report
    } catch (error) {
      console.error('生成报告失败:', error)
      throw error
    }
  }

  // 广播功能
  const broadcastMessage = (type: string, data: any) => {
    if (!socketService.isConnected) return

    socketService.send(type, {
      ...data,
      timestamp: new Date(),
      lessonId: presenterState.value.lessonId
    })
  }

  return {
    // 状态
    currentLesson,
    presenterState,
    isConnected,
    currentSection,
    totalSections,
    activeStudentCount,
    currentDuration,

    // 方法
    getLessonInfo,
    connectToLesson,
    disconnectFromLesson,
    setCurrentSection,
    pauseLesson,
    resumeLesson,
    endLesson,
    saveAnnotation,
    generateLessonReport,
    broadcastMessage,
    broadcastSectionChange,
    broadcastLessonState
  }
})