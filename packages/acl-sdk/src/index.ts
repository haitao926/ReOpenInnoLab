/**
 * AiCourseLayout (.acl) SDK
 * 教育知识工程化的核心工具包
 */

export * from './acl-parser'
export * from './acl-validator'
export * from './acl-renderer'
export * from './acl-diff'
export * from './types'

// TODO: Implement these modules
// export * from './acl-version-manager'
// export * from './acl-utils'

// 便捷入口
export { ACLParser } from './acl-parser'
export { ACLValidator } from './acl-validator'
export { ACLRenderer } from './acl-renderer'

// TODO: Implement this module
// export { ACLVersionManager } from './acl-version-manager'

// 主要接口导出
export type {
  AiCourseLayout,
  CourseMeta,
  CourseInfo,
  CourseStructure,
  CourseNode,
  ResourceReference,
  ValidationResult,
  RenderOptions
} from './types'

// TODO: Implement this type
// export type {
//   VersionInfo
// } from './types'