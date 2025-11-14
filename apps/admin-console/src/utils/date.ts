import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, formatStr = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr, { locale: zhCN })
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr, { locale: zhCN })
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return formatDate(dateObj)
  }
}

/**
 * 计算日期差
 */
export function getDateDiff(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 检查日期是否过期
 */
export function isExpired(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

/**
 * 获取月份的第一天
 */
export function getFirstDayOfMonth(date?: Date): Date {
  const targetDate = date || new Date()
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
}

/**
 * 获取月份的最后一天
 */
export function getLastDayOfMonth(date?: Date): Date {
  const targetDate = date || new Date()
  return new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
}

/**
 * 获取今天开始的时间
 */
export function getStartOfDay(date?: Date): Date {
  const targetDate = date || new Date()
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0)
}

/**
 * 获取今天结束的时间
 */
export function getEndOfDay(date?: Date): Date {
  const targetDate = date || new Date()
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)
}