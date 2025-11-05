/**
 * ACL验证器
 * 负责.acl文件的结构验证和业务规则验证
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { aclSchema } from './schemas/index'
import {
  AiCourseLayout,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSummary
} from './types'

/**
 * ACL验证器类
 */
export class ACLValidator {
  private ajv: Ajv
  private schemaValidator: Ajv.ValidateFunction
  private rules: ValidationRule[]

  constructor() {
    // 初始化AJV验证器
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      removeAdditional: false,
      useDefaults: false,
      coerceTypes: false
    })

    // 添加格式支持
    addFormats(this.ajv)

    // 编译schema
    this.schemaValidator = this.ajv.compile(aclSchema)

    // 初始化业务规则
    this.rules = this.initializeRules()
  }

  /**
   * 验证ACL数据
   * @param data ACL数据
   * @returns 验证结果
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 1. 执行JSON Schema验证
    const schemaValid = this.schemaValidator(data)
    if (!schemaValid && this.schemaValidator.errors) {
      for (const error of this.schemaValidator.errors) {
        errors.push({
          path: error.instancePath || error.schemaPath || 'root',
          message: error.message || 'Schema validation failed',
          code: `SCHEMA_${error.keyword?.toUpperCase() || 'VALIDATION_ERROR'}`,
          severity: 'error'
        })
      }
    }

    // 2. 执行业务规则验证
    for (const rule of this.rules) {
      const result = await rule.validate(data)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }

    // 生成验证摘要
    const summary = this.generateSummary(errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary
    }
  }

  /**
   * 同步验证ACL数据
   * @param data ACL数据
   * @returns 验证结果
   */
  validateSync(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 1. 执行JSON Schema验证
    const schemaValid = this.schemaValidator(data)
    if (!schemaValid && this.schemaValidator.errors) {
      for (const error of this.schemaValidator.errors) {
        errors.push({
          path: error.instancePath || error.schemaPath || 'root',
          message: error.message || 'Schema validation failed',
          code: `SCHEMA_${error.keyword?.toUpperCase() || 'VALIDATION_ERROR'}`,
          severity: 'error'
        })
      }
    }

    // 2. 执行同步业务规则验证
    for (const rule of this.rules) {
      if (rule.validateSync) {
        const result = rule.validateSync(data)
        errors.push(...result.errors)
        warnings.push(...result.warnings)
      }
    }

    // 生成验证摘要
    const summary = this.generateSummary(errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary
    }
  }

  /**
   * 初始化验证规则
   * @returns 验证规则列表
   */
  private initializeRules(): ValidationRule[] {
    return [
      // 结构验证规则
      new StructureValidationRule(),

      // 业务规则验证
      new BusinessRuleValidationRule(),

      // 内容质量验证
      new ContentQualityValidationRule(),

      // 引用完整性验证
      new ReferenceIntegrityValidationRule(),

      // 性能和优化验证
      new PerformanceValidationRule()
    ]
  }

  /**
   * 生成验证摘要
   * @param errors 错误列表
   * @param warnings 警告列表
   * @returns 验证摘要
   */
  private generateSummary(errors: ValidationError[], warnings: ValidationWarning[]): ValidationSummary {
    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      schemaVersion: '1.0.0',
      validatedAt: new Date().toISOString()
    }
  }

  /**
   * 添加自定义验证规则
   * @param rule 验证规则
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule)
  }

  /**
   * 移除验证规则
   * @param ruleName 规则名称
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName)
  }

  /**
   * 获取所有验证规则
   * @returns 验证规则列表
   */
  getRules(): ValidationRule[] {
    return [...this.rules]
  }
}

/**
 * 验证规则接口
 */
interface ValidationRule {
  name: string
  description: string
  validate(data: any): Promise<ValidationResult>
  validateSync?(data: any): ValidationResult
}

/**
 * 结构验证规则
 */
class StructureValidationRule implements ValidationRule {
  name = 'structure-validation'
  description = '验证ACL文件的基本结构'

  async validate(data: any): Promise<ValidationResult> {
    return this.validateSync(data)
  }

  validateSync(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 验证根对象
    if (!data || typeof data !== 'object') {
      errors.push({
        path: 'root',
        message: '根对象必须是对象类型',
        code: 'INVALID_ROOT_TYPE',
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }

    // 验证必需字段
    const requiredFields = ['meta', 'courseInfo', 'structure']
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push({
          path: field,
          message: `缺少必需字段: ${field}`,
          code: 'MISSING_REQUIRED_FIELD',
          severity: 'error'
        })
      }
    }

    // 验证meta字段
    if (data.meta) {
      this.validateMeta(data.meta, errors, warnings)
    }

    // 验证courseInfo字段
    if (data.courseInfo) {
      this.validateCourseInfo(data.courseInfo, errors, warnings)
    }

    // 验证structure字段
    if (data.structure) {
      this.validateStructure(data.structure, errors, warnings)
    }

    // 验证resourceRefs字段
    if (data.resourceRefs) {
      this.validateResourceRefs(data.resourceRefs, errors, warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private validateMeta(meta: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // 验证ID
    if (!meta.id || typeof meta.id !== 'string') {
      errors.push({
        path: 'meta.id',
        message: '课程ID是必需的且必须是字符串类型',
        code: 'INVALID_META_ID',
        severity: 'error'
      })
    }

    // 验证版本
    if (!meta.version || typeof meta.version !== 'string') {
      errors.push({
        path: 'meta.version',
        message: '版本号是必需的且必须是字符串类型',
        code: 'INVALID_META_VERSION',
        severity: 'error'
      })
    }

    // 验证版本格式
    if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
      errors.push({
        path: 'meta.version',
        message: '版本号格式不正确，应为语义化版本 (如 1.0.0)',
        code: 'INVALID_VERSION_FORMAT',
        severity: 'error'
      })
    }

    // 验证标签
    if (meta.tags && !Array.isArray(meta.tags)) {
      errors.push({
        path: 'meta.tags',
        message: '标签必须是数组类型',
        code: 'INVALID_META_TAGS',
        severity: 'error'
      })
    }

    // 验证贡献者
    if (meta.contributors && !Array.isArray(meta.contributors)) {
      errors.push({
        path: 'meta.contributors',
        message: '贡献者列表必须是数组类型',
        code: 'INVALID_META_CONTRIBUTORS',
        severity: 'error'
      })
    }
  }

  private validateCourseInfo(courseInfo: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // 验证标题
    if (!courseInfo.title || typeof courseInfo.title !== 'string') {
      errors.push({
        path: 'courseInfo.title',
        message: '课程标题是必需的且必须是字符串类型',
        code: 'INVALID_COURSE_TITLE',
        severity: 'error'
      })
    }

    // 验证学科
    if (!courseInfo.subject || typeof courseInfo.subject !== 'string') {
      errors.push({
        path: 'courseInfo.subject',
        message: '学科是必需的且必须是字符串类型',
        code: 'INVALID_COURSE_SUBJECT',
        severity: 'error'
      })
    }

    // 验证年级
    if (!courseInfo.grade || typeof courseInfo.grade !== 'string') {
      errors.push({
        path: 'courseInfo.grade',
        message: '年级是必需的且必须是字符串类型',
        code: 'INVALID_COURSE_GRADE',
        severity: 'error'
      })
    }

    // 验证学习目标
    if (!courseInfo.learningObjectives || !Array.isArray(courseInfo.learningObjectives)) {
      errors.push({
        path: 'courseInfo.learningObjectives',
        message: '学习目标是必需的且必须是数组类型',
        code: 'INVALID_LEARNING_OBJECTIVES',
        severity: 'error'
      })
    } else if (courseInfo.learningObjectives.length === 0) {
      warnings.push({
        path: 'courseInfo.learningObjectives',
        message: '学习目标列表为空',
        code: 'EMPTY_LEARNING_OBJECTIVES',
        severity: 'warning'
      })
    }

    // 验证时长
    if (courseInfo.estimatedDuration && (typeof courseInfo.estimatedDuration !== 'number' || courseInfo.estimatedDuration <= 0)) {
      errors.push({
        path: 'courseInfo.estimatedDuration',
        message: '预计时长必须是大于0的数字',
        code: 'INVALID_DURATION',
        severity: 'error'
      })
    }

    // 检查时长合理性
    if (courseInfo.estimatedDuration > 300) {
      warnings.push({
        path: 'courseInfo.estimatedDuration',
        message: '课程时长超过5小时，建议拆分为多个小节',
        code: 'LONG_DURATION_WARNING',
        severity: 'warning'
      })
    }
  }

  private validateStructure(structure: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!Array.isArray(structure)) {
      errors.push({
        path: 'structure',
        message: '课程结构必须是数组类型',
        code: 'INVALID_STRUCTURE_TYPE',
        severity: 'error'
      })
      return
    }

    if (structure.length === 0) {
      warnings.push({
        path: 'structure',
        message: '课程结构为空',
        code: 'EMPTY_STRUCTURE',
        severity: 'warning'
      })
    }

    // 验证每个节点
    structure.forEach((node, index) => {
      this.validateNode(node, `structure[${index}]`, errors, warnings)
    })
  }

  private validateNode(node: any, path: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!node || typeof node !== 'object') {
      errors.push({
        path: `${path}`,
        message: '课程节点必须是对象类型',
        code: 'INVALID_NODE_TYPE',
        severity: 'error'
      })
      return
    }

    // 验证必需字段
    const requiredNodeFields = ['id', 'title', 'type', 'duration', 'learningGoals', 'resourceRefs']
    for (const field of requiredNodeFields) {
      if (!(field in node)) {
        errors.push({
          path: `${path}.${field}`,
          message: `节点缺少必需字段: ${field}`,
          code: 'MISSING_NODE_FIELD',
          severity: 'error'
        })
      }
    }

    // 验证ID唯一性
    if (node.id && typeof node.id === 'string') {
      if (!/^[a-zA-Z0-9-_.]+$/.test(node.id)) {
        errors.push({
          path: `${path}.id`,
          message: '节点ID只能包含字母、数字、连字符、下划线和点',
          code: 'INVALID_NODE_ID',
          severity: 'error'
        })
      }
    }

    // 验证类型
    const validTypes = ['introduction', 'chapter', 'knowledge', 'activity', 'experiment', 'interaction', 'assignment', 'assessment']
    if (node.type && !validTypes.includes(node.type)) {
      errors.push({
        path: `${path}.type`,
        message: `无效的节点类型: ${node.type}`,
        code: 'INVALID_NODE_TYPE',
        severity: 'error'
      })
    }

    // 验证时长
    if (node.duration && (typeof node.duration !== 'number' || node.duration <= 0 || node.duration > 120)) {
      errors.push({
        path: `${path}.duration`,
        message: '节点时长必须是1-120分钟之间的数字',
        code: 'INVALID_NODE_DURATION',
        severity: 'error'
      })
    }

    // 验证子节点
    if (node.type === 'chapter' && node.children) {
      if (!Array.isArray(node.children)) {
        errors.push({
          path: `${path}.children`,
          message: '章节的子节点必须是数组类型',
          code: 'INVALID_CHAPTER_CHILDREN',
          severity: 'error'
        })
      } else if (node.children.length === 0) {
        warnings.push({
          path: `${path}.children`,
          message: '章节没有子节点',
          code: 'EMPTY_CHAPTER',
          severity: 'warning'
        })
      }
    }
  }

  private validateResourceRefs(resourceRefs: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!Array.isArray(resourceRefs)) {
      errors.push({
        path: 'resourceRefs',
        message: '资源引用必须是数组类型',
        code: 'INVALID_RESOURCE_REFS',
        severity: 'error'
      })
      return
    }

    // 验证每个资源引用
    resourceRefs.forEach((ref, index) => {
      if (!ref || typeof ref !== 'object') {
        errors.push({
          path: `resourceRefs[${index}]`,
          message: '资源引用必须是对象类型',
          code: 'INVALID_RESOURCE_REF_TYPE',
          severity: 'error'
        })
      } else {
        // 验证资源引用的必需字段
        if (!ref.id || typeof ref.id !== 'string') {
          errors.push({
            path: `resourceRefs[${index}].id`,
            message: '资源引用ID是必需的且必须是字符串类型',
            code: 'INVALID_RESOURCE_REF_ID',
            severity: 'error'
          })
        }

        if (!ref.type || typeof ref.type !== 'string') {
          errors.push({
            path: `resourceRefs[${index}].type`,
            message: '资源引用类型是必需的且必须是字符串类型',
            code: 'INVALID_RESOURCE_REF_TYPE',
            severity: 'error'
          })
        }

        if (!ref.url || typeof ref.url !== 'string') {
          errors.push({
            path: `resourceRefs[${index}].url`,
            message: '资源引用URL是必需的且必须是字符串类型',
            code: 'INVALID_RESOURCE_REF_URL',
            severity: 'error'
          })
        }
      }
    })
  }
}

/**
 * 业务规则验证规则
 */
class BusinessRuleValidationRule implements ValidationRule {
  name = 'business-rule-validation'
  description = '验证业务规则和约束'

  async validate(data: any): Promise<ValidationResult> {
    return this.validateSync(data)
  }

  validateSync(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 验证课程与年级的匹配
    if (data.courseInfo?.subject && data.courseInfo?.grade) {
      this.validateGradeSubjectMatch(data.courseInfo.subject, data.courseInfo.grade, errors, warnings)
    }

    // 验证总时长合理性
    this.validateTotalDuration(data.structure, errors, warnings)

    // 验证学习目标覆盖度
    this.validateLearningObjectiveCoverage(data.structure, data.courseInfo?.learningObjectives, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private validateGradeSubjectMatch(
    subject: string,
    grade: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // 这里可以添加年级与学科的匹配规则
    // 例如：某些学科只适合特定年级
    const gradeSubjectMap: Record<string, string[]> = {
      'math': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初中一', '初中二', '初中三', '高中一', '高中二', '高中三'],
      'physics': ['初中二', '初中三', '高中一', '高中二', '高中三'],
      'chemistry': ['初中三', '高中一', '高中二', '高中三'],
      // ... 其他学科
    }

    if (gradeSubjectMap[subject] && !gradeSubjectMap[subject].includes(grade)) {
      warnings.push({
        path: 'courseInfo.grade',
        message: `${subject}学科通常不适合${grade}年级`,
        code: 'GRADE_SUBJECT_MISMATCH',
        severity: 'warning'
      })
    }
  }

  private validateTotalDuration(
    structure: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!Array.isArray(structure)) return

    let totalDuration = 0

    const calculateDuration = (nodes: any[]): number => {
      return nodes.reduce((total, node) => {
        let nodeDuration = node.duration || 0

        if (node.type === 'chapter' && Array.isArray(node.children)) {
          nodeDuration += calculateDuration(node.children)
        }

        return total + nodeDuration
      }, 0)
    }

    totalDuration = calculateDuration(structure)

    // 检查总时长是否合理
    if (totalDuration > 480) { // 8小时
      warnings.push({
        path: 'structure',
        message: `课程总时长${totalDuration}分钟过长，建议拆分为多个课程`,
        code: 'EXCESSIVE_DURATION',
        severity: 'warning'
      })
    }

    if (totalDuration < 10) {
      warnings.push({
        path: 'structure',
        message: `课程总时长${totalDuration}分钟过短，可能无法涵盖充分的教学内容`,
        code: 'INSUFFICIENT_DURATION',
        severity: 'warning'
      })
    }
  }

  private validateLearningObjectiveCoverage(
    structure: any[],
    learningObjectives: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!Array.isArray(learningObjectives) || learningObjectives.length === 0) return

    const mentionedObjectives = new Set<string>()

    // 收集所有提到的学习目标
    const collectObjectives = (nodes: any[]): void => {
      nodes.forEach(node => {
        if (node.learningGoals && Array.isArray(node.learningGoals)) {
          node.learningGoals.forEach((goal: string) => {
            mentionedObjectives.add(goal)
          })
        }

        if (node.type === 'chapter' && Array.isArray(node.children)) {
          collectObjectives(node.children)
        }
      })
    }

    if (Array.isArray(structure)) {
      collectObjectives(structure)
    }

    // 检查是否所有学习目标都被覆盖
    learningObjectives.forEach((obj: any) => {
      if (obj.id && !mentionedObjectives.has(obj.id)) {
        warnings.push({
          path: 'structure',
          message: `学习目标"${obj.id}"在课程结构中未被覆盖`,
          code: 'UNCOVERED_LEARNING_OBJECTIVE',
          severity: 'warning'
        })
      }
    })
  }
}

/**
 * 内容质量验证规则
 */
class ContentQualityValidationRule implements ValidationRule {
  name = 'content-quality-validation'
  description = '验证内容质量和最佳实践'

  async validate(data: any): Promise<ValidationResult> {
    return this.validateSync(data)
  }

  validateSync(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 验证标题质量
    this.validateTitleQuality(data.courseInfo?.title, errors, warnings)

    // 验证描述质量
    this.validateDescriptionQuality(data.courseInfo?.description, errors, warnings)

    // 验证结构平衡性
    this.validateStructureBalance(data.structure, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private validateTitleQuality(
    title: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!title || typeof title !== 'string') return

    if (title.length < 5) {
      errors.push({
        path: 'courseInfo.title',
        message: '课程标题过短，至少需要5个字符',
        code: 'SHORT_TITLE',
        severity: 'error'
      })
    }

    if (title.length > 100) {
      warnings.push({
        path: 'courseInfo.title',
        message: '课程标题过长，建议保持在100字符以内',
        code: 'LONG_TITLE',
        severity: 'warning'
      })
    }

    // 检查标题是否包含有意义的关键词
    if (!/[a-zA-Z\u4e00-\u9fa5]/.test(title)) {
      warnings.push({
        path: 'courseInfo.title',
        message: '课程标题应包含有意义的关键词',
        code: 'MEANINGLESS_TITLE',
        severity: 'warning'
      })
    }
  }

  private validateDescriptionQuality(
    description: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!description || typeof description !== 'string') {
      warnings.push({
        path: 'courseInfo.description',
        message: '建议添加课程描述',
        code: 'MISSING_DESCRIPTION',
        severity: 'warning'
      })
      return
    }

    if (description.length < 20) {
      warnings.push({
        path: 'courseInfo.description',
        message: '课程描述过短，建议至少20个字符',
        code: 'SHORT_DESCRIPTION',
        severity: 'warning'
      })
    }

    if (description.length > 500) {
      warnings.push({
        path: 'courseInfo.description',
        message: '课程描述过长，建议保持在500字符以内',
        code: 'LONG_DESCRIPTION',
        severity: 'warning'
      })
    }
  }

  private validateStructureBalance(
    structure: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!Array.isArray(structure) || structure.length === 0) return

    const nodeTypes = structure.reduce((counts: Record<string, number>, node) => {
      const type = node.type || 'unknown'
      counts[type] = (counts[type] || 0) + 1
      return counts
    }, {})

    // 检查是否有导入环节
    if (!nodeTypes['introduction']) {
      warnings.push({
        path: 'structure',
        message: '建议添加课程导入环节',
        code: 'MISSING_INTRODUCTION',
        severity: 'warning'
      })
    }

    // 检查是否有评估环节
    if (!nodeTypes['assessment']) {
      warnings.push({
        path: 'structure',
        message: '建议添加学习评估环节',
        code: 'MISSING_ASSESSMENT',
        severity: 'warning'
      })
    }

    // 检查活动类型的多样性
    const activityTypes = ['knowledge', 'activity', 'experiment', 'interaction', 'assignment']
    const presentActivities = activityTypes.filter(type => nodeTypes[type] > 0)

    if (presentActivities.length < 2) {
      warnings.push({
        path: 'structure',
        message: '课程活动类型较为单一，建议增加更多样化的活动',
        code: 'LIMITED_ACTIVITY_TYPES',
        severity: 'warning'
      })
    }
  }
}

/**
 * 引用完整性验证规则
 */
class ReferenceIntegrityValidationRule implements ValidationRule {
  name = 'reference-integrity-validation'
  description = '验证资源引用的完整性'

  async validate(data: any): Promise<ValidationResult> {
    return this.validateSync(data)
  }

  validateSync(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const referencedIds = new Set<string>()
    const declaredIds = new Set<string>()

    // 收集所有声明的资源ID
    if (data.resourceRefs && Array.isArray(data.resourceRefs)) {
      data.resourceRefs.forEach((ref: any) => {
        if (ref.id && typeof ref.id === 'string') {
          declaredIds.add(ref.id)
        }
      })
    }

    // 收集所有引用的资源ID
    this.collectReferences(data, referencedIds)

    // 检查未声明的引用
    referencedIds.forEach(refId => {
      if (!declaredIds.has(refId)) {
        errors.push({
          path: 'resourceRefs',
          message: `引用了未声明的资源: ${refId}`,
          code: 'UNDECLARED_RESOURCE',
          severity: 'error'
        })
      }
    })

    // 检查未使用的资源
    declaredIds.forEach(declaredId => {
      if (!referencedIds.has(declaredId)) {
        warnings.push({
          path: 'resourceRefs',
          message: `声明的资源未被使用: ${declaredId}`,
          code: 'UNUSED_RESOURCE',
          severity: 'warning'
        })
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private collectReferences(node: any, referencedIds: Set<string>): void {
    if (!node || typeof node !== 'object') return

    // 收集resourceRefs中的引用
    if (node.resourceRefs && Array.isArray(node.resourceRefs)) {
      node.resourceRefs.forEach((refId: string) => {
        if (refId && typeof refId === 'string') {
          referencedIds.add(refId)
        }
      })
    }

    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.collectReferences(child, referencedIds)
      })
    }

    // 处理content中的引用
    if (node.content && typeof node.content === 'object') {
      this.collectReferences(node.content, referencedIds)
    }
  }
}

/**
 * 性能和优化验证规则
 */
class PerformanceValidationRule implements ValidationRule {
  name = 'performance-validation'
  description = '验证性能和优化相关的问题'

  async validate(data: any): Promise<ValidationResult> {
    return this.validateSync(data)
  }

  validateSync(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 检查文件大小
    const jsonString = JSON.stringify(data)
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8')
    const sizeInMB = sizeInBytes / (1024 * 1024)

    if (sizeInMB > 10) {
      warnings.push({
        path: 'root',
        message: `文件大小${sizeInMB.toFixed(2)}MB较大，可能影响加载性能`,
        code: 'LARGE_FILE_SIZE',
        severity: 'warning'
      })
    }

    // 检查结构深度
    const maxDepth = this.calculateMaxDepth(data)
    if (maxDepth > 10) {
      warnings.push({
        path: 'root',
        message: `结构嵌套深度${maxDepth}较深，可能影响处理性能`,
        code: 'DEEP_NESTING',
        severity: 'warning'
      })
    }

    // 检查数组长度
    if (data.structure && Array.isArray(data.structure) && data.structure.length > 100) {
      warnings.push({
        path: 'structure',
        message: `课程结构包含${data.structure.length}个节点，建议考虑分拆`,
        code: 'LARGE_STRUCTURE',
        severity: 'warning'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private calculateMaxDepth(obj: any, currentDepth = 0): number {
    if (!obj || typeof obj !== 'object') {
      return currentDepth
    }

    let maxDepth = currentDepth

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        if (typeof value === 'object' && value !== null) {
          const depth = this.calculateMaxDepth(value, currentDepth + 1)
          maxDepth = Math.max(maxDepth, depth)
        }
      }
    }

    return maxDepth
  }
}