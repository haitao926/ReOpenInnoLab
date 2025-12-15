import { onMounted, onUnmounted, watch } from 'vue'
import { useLessonStore } from '@/stores/lesson'
import { websocketService } from '@/services/websocket'
import { ElMessage } from 'element-plus'

export function useRealtimeSync(lessonId: string, userId: string) {
  const lessonStore = useLessonStore()

  // 处理WebSocket事件
  const handleWebSocketEvent = (type: string, data: any) => {
    switch (type) {
      case 'connected':
        lessonStore.setConnectionState('connected')
        lessonStore.setOfflineMode(false)
        console.log('实时同步已连接')
        break

      case 'disconnected':
        lessonStore.setConnectionState('disconnected', { reason: '连接断开' })
        lessonStore.setOfflineMode(true)
        console.log('实时同步已断开')
        break

      case 'reconnect_failed':
        lessonStore.setConnectionState('error', { reason: '重连失败' })
        ElMessage.error('网络连接失败，已切换到离线模式')
        break

      // 课程状态变更事件
      case 'lesson_started':
      case 'lesson_paused':
      case 'lesson_resumed':
      case 'lesson_ended':
      case 'section_start':
      case 'section_end':
      case 'section_change':
        // 将事件转发给store处理
        lessonStore.handleTeacherEvent({ type, data })
        break

      // 其他实时事件
      case 'teacher_message':
        ElMessage.info(`老师: ${data.content}`)
        break

      default:
        // 记录未处理的事件
        console.debug('未处理的WebSocket事件:', type, data)
    }
  }

  // 建立连接
  const connect = async () => {
    try {
      lessonStore.setConnectionState('connecting')

      // 注册事件监听
      websocketService.on('connected', (data) => handleWebSocketEvent('connected', data))
      websocketService.on('disconnected', (data) => handleWebSocketEvent('disconnected', data))
      websocketService.on('reconnect_failed', (data) => handleWebSocketEvent('reconnect_failed', data))
      
      // 监听各类业务消息
      const eventTypes = [
        'lesson_started', 'lesson_paused', 'lesson_resumed', 'lesson_ended',
        'section_start', 'section_end', 'section_change',
        'teacher_message'
      ]
      
      eventTypes.forEach(type => {
        websocketService.on(type, (data) => handleWebSocketEvent(type, data))
      })

      // 连接到课程频道
      await websocketService.connectToChannel({
        channelId: lessonId,
        type: 'lesson',
        userId,
        role: 'student'
      })

    } catch (error) {
      console.error('WebSocket连接失败:', error)
      lessonStore.setConnectionState('error', { reason: '初始化连接失败' })
      lessonStore.setOfflineMode(true)
    }
  }

  // 断开连接
  const disconnect = () => {
    websocketService.leaveChannel()
    
    // 移除所有监听器 (简单清理，实际生产中可能需要更精细的清理)
    // 这里依赖WebSocketService实例重建或简单的断开逻辑
  }

  // 生命周期管理
  onMounted(() => {
    if (lessonId && userId) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  // 监听ID变化（防止组件复用时ID变更）
  watch(() => lessonId, (newId, oldId) => {
    if (newId !== oldId) {
      disconnect()
      if (newId) {
        connect()
      }
    }
  })

  return {
    isConnected: websocketService.isConnected,
    reconnect: connect
  }
}
