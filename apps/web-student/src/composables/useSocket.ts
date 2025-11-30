import { computed, onUnmounted } from 'vue'
import type { ConnectionStatus, WebSocketMessage } from '@/types/websocket'
import { lessonSocket } from '@/services/websocket/lessonSocket'
import type { LessonRole } from '@/services/websocket/lessonSocket'

/**
 * 全局 Socket.IO 组合式函数
 * 统一复用 lessonSocket 服务，避免在组件内重复维护连接状态
 */
export function useSocket() {
  const disposers: Array<() => void> = []

  const connect = async (namespace: string = '/lesson') => {
    await lessonSocket.connect({ namespace })
  }

  const disconnect = () => {
    lessonSocket.disconnect()
  }

  const joinLesson = (lessonId: string, userId: string, role: LessonRole, classroomId: string, metadata?: Record<string, any>) => {
    const payload: Parameters<typeof lessonSocket.joinLesson>[0] = {
      lessonId,
      userId,
      role,
      classroomId
    }

    if (metadata) {
      payload.metadata = metadata
    }

    return lessonSocket.joinLesson(payload)
  }

  const leaveLesson = () => {
    lessonSocket.leaveLesson()
    return true
  }

  const changeSection = (lessonId: string, sectionIndex: number, section: any) => {
    return lessonSocket.changeSection(lessonId, sectionIndex, section)
  }

  const changeLessonState = (lessonId: string, state: 'started' | 'paused' | 'resumed' | 'ended', currentSection?: number) => {
    return lessonSocket.changeLessonState(lessonId, state, currentSection)
  }

  const submitStudentInteraction = (lessonId: string, studentId: string, type: string, data: any) => {
    return lessonSocket.submitStudentInteraction(lessonId, studentId, type, data)
  }

  const addAnnotation = (lessonId: string, annotation: any) => {
    return lessonSocket.addAnnotation(lessonId, annotation)
  }

  const onMessage = (handler: (message: WebSocketMessage) => void) => {
    const off = lessonSocket.onMessage(handler)
    disposers.push(off)
    return () => {
      off()
      const index = disposers.indexOf(off)
      if (index >= 0) {
        disposers.splice(index, 1)
      }
    }
  }

  const onStatusChange = (handler: (status: ConnectionStatus) => void) => {
    const off = lessonSocket.onStatusChange(handler)
    disposers.push(off)
    return () => {
      off()
      const index = disposers.indexOf(off)
      if (index >= 0) {
        disposers.splice(index, 1)
      }
    }
  }

  const getConnectionState = () => ({
    isConnected: lessonSocket.connectionStatus.value === 'connected',
    isConnecting: ['connecting', 'reconnecting'].includes(lessonSocket.connectionStatus.value),
    connectionStatus: lessonSocket.connectionStatus.value,
    reconnectAttempts: lessonSocket.attempts.value,
    lastError: lessonSocket.error.value
  })

  const cleanup = () => {
    while (disposers.length) {
      const dispose = disposers.pop()
      if (dispose) dispose()
    }
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    isConnected: computed(() => lessonSocket.connectionStatus.value === 'connected'),
    isConnecting: computed(() => ['connecting', 'reconnecting'].includes(lessonSocket.connectionStatus.value)),
    connectionStatus: computed(() => lessonSocket.connectionStatus.value as ConnectionStatus),
    reconnectAttempts: computed(() => lessonSocket.attempts.value),
    lastError: computed(() => lessonSocket.error.value),

    // 方法
    connect,
    disconnect,
    joinLesson,
    leaveLesson,
    changeSection,
    changeLessonState,
    submitStudentInteraction,
    addAnnotation,
    onMessage,
    onStatusChange,
    getConnectionState,
    cleanup,
    getSocket: () => lessonSocket.rawSocket
  }
}
