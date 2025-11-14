// 用户相关类型定义
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'student' | 'teacher' | 'admin'
  school: string
  grade?: string
  class?: string
  studentId?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  permissions: string[]
}

export interface UserProfile {
  user: User
  stats: {
    totalCourses: number
    completedCourses: number
    totalHours: number
    averageScore: number
  }
}