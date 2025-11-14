// ACL工具模块导出
export { AclParser } from './acl-parser'
export { AclSyncManager, aclSyncManager } from './acl-sync'

// 便捷方法
export const aclUtils = {
  /**
   * 解析ACL文档
   */
  parseDocument: (aclDoc: any) => {
    return AclParser.parseAclDocument(aclDoc)
  },

  /**
   * 验证ACL文档
   */
  validateDocument: (aclDoc: any) => {
    return AclParser.validateAclDocument(aclDoc)
  },

  /**
   * 创建默认ACL文档
   */
  createDefaultDocument: (title: string, description: string) => {
    return AclParser.createDefaultAclDocument(title, description)
  },

  /**
   * 同步课程数据
   */
  syncCourse: (courseId: string) => {
    return aclSyncManager.syncCourseData(courseId)
  },

  /**
   * 订阅课程更新
   */
  subscribe: (courseId: string, callback: Function) => {
    return aclSyncManager.subscribe(courseId, callback)
  },

  /**
   * 更新进度
   */
  updateProgress: (courseId: string, chapterId: string, activityId: string, progress: number) => {
    return aclSyncManager.updateProgress(courseId, chapterId, activityId, progress)
  },

  /**
   * 获取缓存数据
   */
  getCachedCourse: (courseId: string) => {
    return aclSyncManager.getCachedCourse(courseId)
  }
}