import { apiClient } from './client'
import type { LessonInfo, CourseSection } from '@/types/course'

export interface CreateLessonRequest {
  title: string
  description: string
  courseId: string
  classroomId: string
  sections: CourseSection[]
}

export interface JoinLessonRequest {
  lessonId: string
  userId: string
  role: 'teacher' | 'student'
}

export const classroomApi = {
  // 获取课程信息
  async getLesson(lessonId: string): Promise<LessonInfo> {
    const response = await apiClient.get(`/classroom-service/api/v1/lessons/${lessonId}`)
    return response.data
  },

  // 创建课程
  async createLesson(data: CreateLessonRequest): Promise<LessonInfo> {
    const response = await apiClient.post('/classroom-service/api/v1/lessons', data)
    return response.data
  },

  // 获取课程批注
  async getLessonAnnotations(lessonId: string): Promise<any[]> {
    const response = await apiClient.get(`/classroom-service/api/v1/lessons/${lessonId}/annotations`)
    return response.data
  },

  // 保存课程批注
  async saveLessonAnnotations(lessonId: string, annotations: any[]): Promise<void> {
    await apiClient.post(`/classroom-service/api/v1/lessons/${lessonId}/annotations`, { annotations })
  },

  // 记录环节事件
  async recordSectionEvent(lessonId: string, event: any): Promise<void> {
    await apiClient.post(`/classroom-service/api/v1/lessons/${lessonId}/events`, event)
  },

  // 获取班级信息
  async getClassroom(classroomId: string): Promise<any> {
    const response = await apiClient.get(`/classroom-service/api/v1/classrooms/${classroomId}`)
    return response.data
  },

  // 获取班级成员
  async getClassroomMembers(classroomId: string): Promise<any[]> {
    const response = await apiClient.get(`/classroom-service/api/v1/classrooms/${classroomId}/members`)
    return response.data
  },

  // 学生加入班级
  async joinClassroom(classroomId: string, studentId: string): Promise<void> {
    await apiClient.post('/classroom-service/api/v1/classrooms/join', {
      code: classroomId, // 假设使用classroom code
      studentId
    })
  },

  // 开始课程
  async startLesson(lessonId: string): Promise<void> {
    await apiClient.post(`/classroom-service/api/v1/lessons/${lessonId}/start`)
  },

  // 暂停课程
  async pauseLesson(lessonId: string): Promise<void> {
    await apiClient.post(`/classroom-service/api/v1/lessons/${lessonId}/pause`)
  },

  // 结束课程
  async endLesson(lessonId: string): Promise<void> {
    await apiClient.post(`/classroom-service/api/v1/lessons/${lessonId}/end`)
  }
}