import { ref } from 'vue'
import { ElNotification, ElMessage, type NotificationProps } from 'element-plus'

export interface NotificationOptions extends Partial<NotificationProps> {
  type?: 'success' | 'warning' | 'info' | 'error'
  title?: string
  message?: string
  duration?: number
  showClose?: boolean
}

export interface MessageOptions {
  type?: 'success' | 'warning' | 'info' | 'error'
  message?: string
  duration?: number
  showClose?: boolean
}

export function useNotification() {
  // 通知历史记录
  const notificationHistory = ref<Array<{
    id: string
    title: string
    message: string
    type: string
    timestamp: Date
    read: boolean
  }>>([])

  // 生成唯一ID
  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 显示通知
  const showNotification = (title: string, message?: string, type: 'success' | 'warning' | 'info' | 'error' = 'info', options?: NotificationOptions) => {
    const id = generateId()

    // 记录到历史
    notificationHistory.value.unshift({
      id,
      title: title || options?.title || '',
      message: message || options?.message || '',
      type: type || options?.type || 'info',
      timestamp: new Date(),
      read: false
    })

    // 限制历史记录数量
    if (notificationHistory.value.length > 50) {
      notificationHistory.value = notificationHistory.value.slice(0, 50)
    }

    // 显示Element Plus通知
    ElNotification({
      title,
      message,
      type,
      duration: options?.duration || 4500,
      showClose: options?.showClose !== false,
      ...options
    })

    return id
  }

  // 显示成功通知
  const showSuccess = (message: string, title?: string, options?: NotificationOptions) => {
    return showNotification(title || '成功', message, 'success', options)
  }

  // 显示警告通知
  const showWarning = (message: string, title?: string, options?: NotificationOptions) => {
    return showNotification(title || '警告', message, 'warning', options)
  }

  // 显示信息通知
  const showInfo = (message: string, title?: string, options?: NotificationOptions) => {
    return showNotification(title || '提示', message, 'info', options)
  }

  // 显示错误通知
  const showError = (message: string, title?: string, options?: NotificationOptions) => {
    return showNotification(title || '错误', message, 'error', { duration: 6000, ...options })
  }

  // 显示消息
  const showMessage = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info', options?: MessageOptions) => {
    ElMessage({
      message,
      type,
      duration: options?.duration || 3000,
      showClose: options?.showClose !== false
    })
  }

  // 显示成功消息
  const showSuccessMessage = (message: string, options?: MessageOptions) => {
    showMessage(message, 'success', options)
  }

  // 显示警告消息
  const showWarningMessage = (message: string, options?: MessageOptions) => {
    showMessage(message, 'warning', options)
  }

  // 显示信息消息
  const showInfoMessage = (message: string, options?: MessageOptions) => {
    showMessage(message, 'info', options)
  }

  // 显示错误消息
  const showErrorMessage = (message: string, options?: MessageOptions) => {
    showMessage(message, 'error', { duration: 5000, ...options })
  }

  // 标记通知为已读
  const markAsRead = (id: string) => {
    const notification = notificationHistory.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = () => {
    notificationHistory.value.forEach(notification => {
      notification.read = true
    })
  }

  // 删除通知
  const removeNotification = (id: string) => {
    const index = notificationHistory.value.findIndex(n => n.id === id)
    if (index > -1) {
      notificationHistory.value.splice(index, 1)
    }
  }

  // 清空所有通知
  const clearAllNotifications = () => {
    notificationHistory.value = []
  }

  // 获取未读通知数量
  const getUnreadCount = () => {
    return notificationHistory.value.filter(n => !n.read).length
  }

  // 获取最近的通知
  const getRecentNotifications = (count: number = 10) => {
    return notificationHistory.value.slice(0, count)
  }

  // 获取特定类型的通知
  const getNotificationsByType = (type: string) => {
    return notificationHistory.value.filter(n => n.type === type)
  }

  // 显示课堂相关通知
  const showLessonNotification = (event: string, data: any) => {
    switch (event) {
      case 'lesson:start':
        showInfo('课堂开始', `${data.title || '课程'}已开始，请准备好参与`, { duration: 5000 })
        break

      case 'lesson:next':
        showInfo('环节切换', `进入${data.sectionTitle || '新环节'}`, { duration: 3000 })
        break

      case 'lesson:pause':
        showWarning('课堂暂停', '老师暂时暂停了课堂', { duration: 4000 })
        break

      case 'lesson:resume':
        showSuccess('课堂继续', '课堂已继续进行', { duration: 3000 })
        break

      case 'lesson:end':
        showInfo('课堂结束', '课堂已结束，感谢参与！', { duration: 5000 })
        break

      case 'student:hand_raise':
        if (data.raised) {
          showInfo('举手成功', '老师已看到你的举手', { duration: 3000 })
        }
        break

      case 'student:question':
        showSuccess('问题已提交', '你的问题已发送给老师', { duration: 3000 })
        break

      case 'teacher:annotation':
        showInfo('新批注', '老师添加了新的批注', { duration: 2000 })
        break

      case 'teacher:tip':
        showInfo('教学提示', data.tip || '老师分享了一个提示', { duration: 4000 })
        break

      default:
        showInfo('课堂更新', event, { duration: 3000 })
    }
  }

  return {
    // 状态
    notificationHistory,

    // 通知方法
    showNotification,
    showSuccess,
    showWarning,
    showInfo,
    showError,

    // 消息方法
    showMessage,
    showSuccessMessage,
    showWarningMessage,
    showInfoMessage,
    showErrorMessage,

    // 课堂通知
    showLessonNotification,

    // 管理方法
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,

    // 查询方法
    getUnreadCount,
    getRecentNotifications,
    getNotificationsByType
  }
}