/**
 * 日期格式化工具函数
 */

export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export const formatTime = (date: Date | string): string => {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const getRelativeTime = (date: Date | string): string => {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(date)
}

export const isToday = (date: Date | string): boolean => {
  const today = new Date()
  const target = new Date(date)
  return today.toDateString() === target.toDateString()
}

export const isYesterday = (date: Date | string): boolean => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(date)
  return yesterday.toDateString() === target.toDateString()
}

export const getDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes}分钟`
  } else if (remainingMinutes === 0) {
    return `${hours}小时`
  } else {
    return `${hours}小时${remainingMinutes}分钟`
  }
}

export const getWeekRange = (date: Date | string): { start: Date; end: Date } => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 周一为第一天

  const start = new Date(d.setDate(diff))
  const end = new Date(d.setDate(diff + 6))

  return { start, end }
}

export const getMonthRange = (date: Date | string): { start: Date; end: Date } => {
  const d = new Date(date)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)

  return { start, end }
}

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime())
}

export const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString)
  return isValidDate(date) ? date : null
}

export const formatShortDate = (date: Date | string): string => {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

export const formatFullDate = (date: Date | string): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekDay = weekDays[d.getDay()]
  return `${year}年${month}月${day}日 ${weekDay}`
}