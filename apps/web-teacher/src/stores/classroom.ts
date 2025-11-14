import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LessonInfo } from '@/types/course'

export interface ClassroomState {
  currentLesson: LessonInfo | null
  classroomStatus: 'idle' | 'preparing' | 'active' | 'paused' | 'ended'
  connectedStudents: StudentInfo[]
  sessionHistory: SessionEvent[]
  settings: ClassroomSettings
}

export interface StudentInfo {
  id: string
  name: string
  studentId: string
  avatar?: string
  status: 'online' | 'offline' | 'away' | 'active'
  joinedAt: Date
  lastActivity: Date
  progress: {
    currentSection: number
    completionRate: number
    timeSpent: number
    interactions: number
  }
  deviceInfo?: {
    userAgent: string
    platform: string
    screenResolution: string
  }
}

export interface SessionEvent {
  id: string
  type: 'student_join' | 'student_leave' | 'question_asked' | 'answer_submitted' | 'section_completed' | 'interaction_detected'
  timestamp: Date
  studentId?: string
  data: any
  metadata?: Record<string, any>
}

export interface ClassroomSettings {
  allowQuestions: boolean
  enableChat: boolean
  recordSession: boolean
  aiAssistance: boolean
  maxParticipants: number
  autoSave: boolean
  publicLink: string
  requireLogin: boolean
}

export const useClassroomStore = defineStore('classroom', () => {
  // State
  const currentLesson = ref<LessonInfo | null>(null)
  const classroomStatus = ref<ClassroomState['classroomStatus']>('idle')
  const connectedStudents = ref<StudentInfo[]>([])
  const sessionHistory = ref<SessionEvent[]>([])
  const settings = ref<ClassroomSettings>({
    allowQuestions: true,
    enableChat: true,
    recordSession: false,
    aiAssistance: false,
    maxParticipants: 100,
    autoSave: true,
    publicLink: '',
    requireLogin: true
  })

  // Computed
  const isActive = computed(() => classroomStatus.value === 'active')
  const studentCount = computed(() => connectedStudents.value.length)
  const activeStudents = computed(() =>
    connectedStudents.value.filter(student => student.status === 'active')
  )
  const averageProgress = computed(() => {
    if (connectedStudents.value.length === 0) return 0
    const totalProgress = connectedStudents.value.reduce((sum, student) =>
      sum + student.progress.completionRate, 0
    )
    return Math.round(totalProgress / connectedStudents.value.length)
  })

  // Actions
  const initializeClassroom = (lesson: LessonInfo) => {
    currentLesson.value = lesson
    classroomStatus.value = 'preparing'
    settings.value = {
      ...settings.value,
      ...lesson.settings
    }

    // 清空之前的数据
    connectedStudents.value = []
    sessionHistory.value = []

    // 添加初始事件
    addSessionEvent({
      type: 'classroom_initialized',
      data: { lessonId: lesson.id, title: lesson.title }
    })
  }

  const startClassroom = () => {
    if (!currentLesson.value) {
      throw new Error('No active lesson')
    }

    classroomStatus.value = 'active'
    currentLesson.value.status = 'active'
    currentLesson.value.startTime = new Date()

    addSessionEvent({
      type: 'classroom_started',
      data: { lessonId: currentLesson.value.id }
    })
  }

  const pauseClassroom = () => {
    classroomStatus.value = 'paused'
    if (currentLesson.value) {
      currentLesson.value.status = 'paused'
    }

    addSessionEvent({
      type: 'classroom_paused',
      data: { lessonId: currentLesson.value?.id }
    })
  }

  const resumeClassroom = () => {
    classroomStatus.value = 'active'
    if (currentLesson.value) {
      currentLesson.value.status = 'active'
    }

    addSessionEvent({
      type: 'classroom_resumed',
      data: { lessonId: currentLesson.value?.id }
    })
  }

  const endClassroom = () => {
    classroomStatus.value = 'ended'
    if (currentLesson.value) {
      currentLesson.value.status = 'completed'
      currentLesson.value.endTime = new Date()
    }

    addSessionEvent({
      type: 'classroom_ended',
      data: {
        lessonId: currentLesson.value?.id,
        duration: currentLesson.value?.endTime ?
          Math.round((currentLesson.value.endTime.getTime() - currentLesson.value.startTime.getTime()) / 60000) : 0,
        studentCount: connectedStudents.value.length
      }
    })
  }

  const addStudent = (student: Omit<StudentInfo, 'joinedAt' | 'lastActivity'>) => {
    const newStudent: StudentInfo = {
      ...student,
      joinedAt: new Date(),
      lastActivity: new Date()
    }

    connectedStudents.value.push(newStudent)

    addSessionEvent({
      type: 'student_join',
      studentId: student.id,
      data: { studentName: student.name, studentId: student.studentId }
    })
  }

  const removeStudent = (studentId: string) => {
    const index = connectedStudents.value.findIndex(s => s.id === studentId)
    if (index !== -1) {
      const student = connectedStudents.value[index]
      connectedStudents.value.splice(index, 1)

      addSessionEvent({
        type: 'student_leave',
        studentId,
        data: { studentName: student.name, duration: Date.now() - student.joinedAt.getTime() }
      })
    }
  }

  const updateStudentStatus = (studentId: string, updates: Partial<StudentInfo>) => {
    const student = connectedStudents.value.find(s => s.id === studentId)
    if (student) {
      Object.assign(student, updates)
      student.lastActivity = new Date()
    }
  }

  const updateStudentProgress = (studentId: string, progress: Partial<StudentInfo['progress']>) => {
    const student = connectedStudents.value.find(s => s.id === studentId)
    if (student) {
      Object.assign(student.progress, progress)
      student.lastActivity = new Date()

      addSessionEvent({
        type: 'section_completed',
        studentId,
        data: {
          currentSection: student.progress.currentSection,
          completionRate: student.progress.completionRate
        }
      })
    }
  }

  const addSessionEvent = (event: Omit<SessionEvent, 'id' | 'timestamp'>) => {
    const newEvent: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    }

    sessionHistory.value.push(newEvent)

    // 限制历史记录数量
    if (sessionHistory.value.length > 1000) {
      sessionHistory.value = sessionHistory.value.slice(-500)
    }
  }

  const updateSettings = (newSettings: Partial<ClassroomSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const resetClassroom = () => {
    currentLesson.value = null
    classroomStatus.value = 'idle'
    connectedStudents.value = []
    sessionHistory.value = []

    // 重置设置为默认值
    settings.value = {
      allowQuestions: true,
      enableChat: true,
      recordSession: false,
      aiAssistance: false,
      maxParticipants: 100,
      autoSave: true,
      publicLink: '',
      requireLogin: true
    }
  }

  const generateClassroomReport = () => {
    if (!currentLesson.value) return null

    return {
      lesson: currentLesson.value,
      summary: {
        totalStudents: connectedStudents.value.length,
        activeStudents: activeStudents.value.length,
        averageProgress: averageProgress.value,
        duration: currentLesson.value.endTime ?
          Math.round((currentLesson.value.endTime.getTime() - currentLesson.value.startTime.getTime()) / 60000) : 0,
        sessionEvents: sessionHistory.value.length
      },
      students: connectedStudents.value.map(student => ({
        ...student,
        sessionDuration: Date.now() - student.joinedAt.getTime()
      })),
      events: sessionHistory.value,
      settings: settings.value,
      generatedAt: new Date()
    }
  }

  return {
    // State
    currentLesson,
    classroomStatus,
    connectedStudents,
    sessionHistory,
    settings,

    // Computed
    isActive,
    studentCount,
    activeStudents,
    averageProgress,

    // Actions
    initializeClassroom,
    startClassroom,
    pauseClassroom,
    resumeClassroom,
    endClassroom,
    addStudent,
    removeStudent,
    updateStudentStatus,
    updateStudentProgress,
    addSessionEvent,
    updateSettings,
    resetClassroom,
    generateClassroomReport
  }
})