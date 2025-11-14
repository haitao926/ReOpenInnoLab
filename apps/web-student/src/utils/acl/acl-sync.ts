import type { Course, Chapter, Activity } from '@/types/course'
import { AclParser } from './acl-parser'
import { syncService } from '@/services/sync'

// ===================
// ACL同步管理器
// ===================

/**
 * ACL同步管理器
 * 负责处理课程数据的同步和更新
 */
export class AclSyncManager {
  private static instance: AclSyncManager
  private syncCache = new Map<string, any>()
  private syncCallbacks = new Map<string, Set<Function>>()

  static getInstance(): AclSyncManager {
    if (!AclSyncManager.instance) {
      AclSyncManager.instance = new AclSyncManager()
    }
    return AclSyncManager.instance
  }

  /**
   * 同步课程数据
   */
  async syncCourseData(courseId: string): Promise<Course | null> {
    try {
      // 检查缓存
      if (this.syncCache.has(courseId)) {
        const cached = this.syncCache.get(courseId)
        if (this.isCacheValid(cached)) {
          return cached.data
        }
      }

      // 检查离线数据
      if (!syncService.isOnline()) {
        const offlineData = await syncService.getOfflineData(`course:${courseId}`)
        if (offlineData) {
          console.log('Using offline data for course:', courseId)
          return offlineData
        }
      }

      // 使用同步服务获取数据
      const courseData = await this.fetchCourseDataWithSync(courseId)

      if (!courseData) {
        throw new Error(`课程 ${courseId} 不存在`)
      }

      // 解析ACL数据
      let parsedCourse: Course
      if (courseData.aclData) {
        const mapping = AclParser.parseAclDocument(courseData.aclData)
        parsedCourse = this.convertMappingToCourse(courseId, mapping, courseData)
      } else {
        // 如果没有ACL数据，创建默认结构
        parsedCourse = this.createDefaultCourse(courseId, courseData)
      }

      // 更新缓存
      this.syncCache.set(courseId, {
        data: parsedCourse,
        timestamp: Date.now(),
        version: courseData.aclVersion || '1.0.0'
      })

      // 存储到离线缓存
      await syncService.storeOfflineData(`course:${courseId}`, parsedCourse)

      // 通知订阅者
      this.notifySync(courseId, parsedCourse)

      return parsedCourse

    } catch (error) {
      console.error(`Failed to sync course ${courseId}:`, error)
      throw error
    }
  }

  /**
   * 订阅课程数据更新
   */
  subscribe(courseId: string, callback: (course: Course) => void): () => void {
    if (!this.syncCallbacks.has(courseId)) {
      this.syncCallbacks.set(courseId, new Set())
    }

    this.syncCallbacks.get(courseId)!.add(callback)

    // 返回取消订阅函数
    return () => {
      const callbacks = this.syncCallbacks.get(courseId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.syncCallbacks.delete(courseId)
        }
      }
    }
  }

  /**
   * 强制刷新课程数据
   */
  async forceRefresh(courseId: string): Promise<Course | null> {
    // 清除缓存
    this.syncCache.delete(courseId)

    // 重新同步
    return this.syncCourseData(courseId)
  }

  /**
   * 更新课程进度
   */
  async updateProgress(courseId: string, chapterId: string, activityId: string, progress: number): Promise<void> {
    try {
      const progressData = {
        chapterId,
        activityId,
        progress,
        timestamp: new Date().toISOString()
      }

      // 使用同步服务更新进度
      const entityId = `${courseId}:${chapterId}:${activityId}`
      await syncService.syncProgress(entityId, progress, progressData)

      // 更新本地缓存
      const cached = this.syncCache.get(courseId)
      if (cached?.data) {
        const course = cached.data
        const chapter = course.chapters?.find(ch => ch.id === chapterId)
        const activity = chapter?.activities?.find(ac => ac.id === activityId)

        if (activity) {
          activity.progress = progress

          // 根据进度更新状态
          if (progress >= 100) {
            activity.status = 'completed'
            activity.completedAt = new Date().toISOString()
          } else if (progress > 0) {
            activity.status = 'in_progress'
          }

          // 重新计算章节和课程进度
          this.recalculateProgress(course)

          // 通知订阅者
          this.notifySync(courseId, course)
        }
      }

    } catch (error) {
      console.error('Failed to update progress:', error)
      throw error
    }
  }

  /**
   * 获取课程数据
   */
  getCachedCourse(courseId: string): Course | null {
    const cached = this.syncCache.get(courseId)
    if (cached && this.isCacheValid(cached)) {
      return cached.data
    }
    return null
  }

  // 私有方法

  private async fetchCourseDataWithSync(courseId: string): Promise<any> {
    try {
      // 使用同步服务获取数据
      return await syncService.forceSync('course', courseId)
    } catch (error) {
      console.warn('Sync service failed, falling back to mock data:', error)

      // 回退到模拟数据
      return this.fetchCourseData(courseId)
    }
  }

  private async fetchCourseData(courseId: string): Promise<any> {
    // 模拟API调用
    // 实际应该调用真实的API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟课程数据
        const mockData = {
          id: courseId,
          title: `课程 ${courseId}`,
          description: '这是一个示例课程',
          className: '示例班级',
          subject: 'ai' as const,
          schedule: '周一至周五',
          teacherMessage: '欢迎学习本课程',
          taskCount: 10,
          progress: 0,
          active: true,
          teacherId: 'teacher_001',
          teacherName: '张老师',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          aclData: this.generateMockAclData(courseId),
          aclVersion: '1.0.0'
        }

        resolve(mockData)
      }, 500)
    })
  }

  private generateMockAclData(courseId: string): any {
    return AclParser.createDefaultAclDocument(
      `示例课程 ${courseId}`,
      '这是一个使用ACL格式的示例课程'
    )
  }

  private convertMappingToCourse(courseId: string, mapping: any, rawData: any): Course {
    return {
      id: courseId,
      title: rawData.title || mapping.courseInfo.title,
      description: rawData.description || mapping.courseInfo.description,
      className: rawData.className || '默认班级',
      subject: rawData.subject || 'general',
      schedule: rawData.schedule || '灵活安排',
      teacherMessage: rawData.teacherMessage || '',
      taskCount: mapping.structure.reduce((count: number, chapter: Chapter) =>
        count + (chapter.activities?.length || 0), 0),
      progress: 0,
      active: rawData.active !== false,
      teacherId: rawData.teacherId || 'system',
      teacherName: rawData.teacherName || '系统',
      createdAt: rawData.createdAt || new Date().toISOString(),
      updatedAt: rawData.updatedAt || new Date().toISOString(),
      chapters: mapping.structure,
      aclData: rawData.aclData,
      aclVersion: rawData.aclVersion
    }
  }

  private createDefaultCourse(courseId: string, rawData: any): Course {
    return {
      id: courseId,
      title: rawData.title || '默认课程',
      description: rawData.description || '这是一个默认课程',
      className: rawData.className || '默认班级',
      subject: rawData.subject || 'general',
      schedule: rawData.schedule || '灵活安排',
      teacherMessage: rawData.teacherMessage || '',
      taskCount: 0,
      progress: 0,
      active: rawData.active !== false,
      teacherId: rawData.teacherId || 'system',
      teacherName: rawData.teacherName || '系统',
      createdAt: rawData.createdAt || new Date().toISOString(),
      updatedAt: rawData.updatedAt || new Date().toISOString(),
      chapters: []
    }
  }

  private isCacheValid(cached: any): boolean {
    // 缓存有效期5分钟
    const maxAge = 5 * 60 * 1000
    return (Date.now() - cached.timestamp) < maxAge
  }

  private notifySync(courseId: string, course: Course): void {
    const callbacks = this.syncCallbacks.get(courseId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(course)
        } catch (error) {
          console.error('Error in sync callback:', error)
        }
      })
    }
  }

  private recalculateProgress(course: Course): void {
    if (!course.chapters || course.chapters.length === 0) {
      course.progress = 0
      return
    }

    let totalProgress = 0
    let chapterCount = 0

    course.chapters.forEach(chapter => {
      if (!chapter.activities || chapter.activities.length === 0) {
        chapter.progress = 0
        return
      }

      let activityProgress = 0
      chapter.activities.forEach(activity => {
        activityProgress += activity.progress
      })

      chapter.progress = Math.round(activityProgress / chapter.activities.length)
      totalProgress += chapter.progress
      chapterCount++
    })

    course.progress = chapterCount > 0 ? Math.round(totalProgress / chapterCount) : 0
  }

  private async sendProgressUpdate(courseId: string, progressData: any): Promise<void> {
    // 模拟API调用
    // 实际应该发送到真实的服务器
    console.log('Sending progress update:', progressData)

    return new Promise(resolve => {
      setTimeout(resolve, 100)
    })
  }
}

// 导出单例实例
export const aclSyncManager = AclSyncManager.getInstance()