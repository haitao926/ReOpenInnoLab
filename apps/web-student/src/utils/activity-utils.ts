import type {
  Activity,
  ActivityType,
  ActivityContext,
  ActivityExecutionState,
  ActivityProgressCalculator,
  ResourceResolver,
  ResourceRef
} from '@/types/course'

// ===================
// 活动工具函数
// ===================

/**
 * 创建活动上下文
 */
export function createActivityContext(
  courseId: string,
  chapterId: string,
  activity: Activity,
  courseTitle?: string,
  chapterTitle?: string
): ActivityContext {
  return {
    courseId,
    chapterId,
    activityId: activity.id,
    activityType: activity.type,
    activity,
    courseTitle,
    chapterTitle
  }
}

/**
 * 检查活动是否可以开始
 */
export function canStartActivity(activity: Activity, prerequisites: string[] = []): boolean {
  // 检查活动状态
  if (activity.status !== 'available') {
    return false
  }

  // 检查前置条件
  if (prerequisites.length > 0) {
    // TODO: 实现前置条件检查逻辑
    // 这里需要检查前置活动是否已完成
  }

  // 检查资源可用性
  if (activity.resourceRefs.length > 0) {
    // TODO: 检查资源是否可用
    // 可以异步检查，这里返回true表示乐观估计
  }

  return true
}

/**
 * 获取活动图标
 */
export function getActivityIcon(type: ActivityType): string {
  const iconMap = {
    knowledge: 'Reading',
    experiment: 'Monitor',
    experience: 'MagicStick',
    assignment: 'EditPen'
  }
  return iconMap[type] || 'Document'
}

/**
 * 获取活动类型名称
 */
export function getActivityTypeName(type: ActivityType): string {
  const nameMap = {
    knowledge: '知识学习',
    experiment: '实验活动',
    experience: '体验活动',
    assignment: '作业任务'
  }
  return nameMap[type] || '活动'
}

/**
 * 获取活动状态颜色
 */
export function getActivityStatusColor(status: Activity['status']): string {
  const colorMap = {
    locked: 'info',
    available: 'warning',
    in_progress: 'primary',
    completed: 'success',
    overdue: 'danger'
  }
  return colorMap[status] || 'default'
}

/**
 * 获取活动状态文本
 */
export function getActivityStatusText(status: Activity['status']): string {
  const textMap = {
    locked: '未解锁',
    available: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return textMap[status] || '未知'
}

/**
 * 格式化活动时间
 */
export function formatActivityDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}小时`
  }

  return `${hours}小时${remainingMinutes}分钟`
}

// ===================
// 活动进度计算器
// ===================

export const activityProgressCalculator: ActivityProgressCalculator = {
  /**
   * 计算活动进度
   */
  calculateProgress(activity: Activity, state: ActivityExecutionState): number {
    // 如果有执行状态，使用执行状态的进度
    if (state && state.progress !== undefined) {
      return state.progress
    }

    // 根据活动状态返回进度
    switch (activity.status) {
      case 'completed':
        return 100
      case 'in_progress':
        return 50 // 默认进行中50%，实际应根据活动类型计算
      case 'available':
        return 0
      case 'locked':
        return 0
      case 'overdue':
        return activity.progress || 0
      default:
        return 0
    }
  },

  /**
   * 检查活动是否完成
   */
  isCompleted(activity: Activity, state: ActivityExecutionState): boolean {
    if (state && state.status === 'completed') {
      return true
    }

    return activity.status === 'completed'
  },

  /**
   * 检查是否可以开始活动
   */
  canStart(activity: Activity, prerequisites: string[] = []): boolean {
    return canStartActivity(activity, prerequisites)
  }
}

// ===================
// 资源解析器
// ===================

export const resourceResolver: ResourceResolver = {
  /**
   * 解析资源引用
   */
  async resolveResource(ref: ResourceRef): Promise<any> {
    try {
      // 根据资源类型和域名构建资源URL
      const resourceUrl = buildResourceUrl(ref)

      // 发送请求获取资源
      const response = await fetch(resourceUrl)

      if (!response.ok) {
        throw new Error(`Failed to load resource: ${ref.id}`)
      }

      // 根据资源类型处理响应
      const resourceData = await processResourceResponse(ref, response)

      return {
        id: ref.id,
        type: ref.type,
        content: resourceData,
        metadata: ref.metadata,
        url: resourceUrl
      }
    } catch (error) {
      console.error(`Error resolving resource ${ref.id}:`, error)
      throw error
    }
  },

  /**
   * 检查资源是否可用
   */
  async isResourceAvailable(ref: ResourceRef): Promise<boolean> {
    try {
      const resourceUrl = buildResourceUrl(ref)
      const response = await fetch(resourceUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  },

  /**
   * 预加载资源
   */
  async preloadResources(refs: ResourceRef[]): Promise<void> {
    const loadPromises = refs.map(ref => this.resolveResource(ref))
    await Promise.allSettled(loadPromises)
  }
}

/**
 * 构建资源URL
 */
function buildResourceUrl(ref: ResourceRef): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const domain = ref.domain || 'media'

  // 构建标准化的资源URL格式
  return `${baseUrl}/resources/${domain}/${ref.id}${ref.version ? `?version=${ref.version}` : ''}`
}

/**
 * 处理资源响应
 */
async function processResourceResponse(ref: ResourceRef, response: Response): Promise<any> {
  const contentType = response.headers.get('content-type')

  // 根据资源类型处理响应
  switch (ref.type) {
    case 'video':
    case 'audio':
      return {
        url: response.url,
        type: contentType
      }

    case 'image':
      const imageBlob = await response.blob()
      return URL.createObjectURL(imageBlob)

    case 'html':
    case 'document':
      return await response.text()

    case 'json':
    case 'interactive':
      return await response.json()

    default:
      return await response.blob()
  }
}

// ===================
// 活动验证器
// ===================

/**
 * 验证活动配置
 */
export function validateActivity(activity: Activity): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 基本字段验证
  if (!activity.id) errors.push('活动ID不能为空')
  if (!activity.title) errors.push('活动标题不能为空')
  if (!activity.description) warnings.push('建议添加活动描述')
  if (!activity.objectives || activity.objectives.length === 0) {
    warnings.push('建议添加学习目标')
  }

  // 类型特定验证
  switch (activity.type) {
    case 'knowledge':
      validateKnowledgeActivity(activity, errors, warnings)
      break
    case 'experiment':
      validateExperimentActivity(activity, errors, warnings)
      break
    case 'experience':
      validateExperienceActivity(activity, errors, warnings)
      break
    case 'assignment':
      validateAssignmentActivity(activity, errors, warnings)
      break
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

function validateKnowledgeActivity(activity: Activity, errors: string[], warnings: string[]) {
  const config = activity.knowledgeConfig
  if (!config) {
    errors.push('知识学习活动必须配置内容')
    return
  }

  if (!config.contentUrl && !config.contentUrl) {
    errors.push('知识学习活动必须配置内容URL')
  }

  if (config.videoConfig && !config.videoConfig.url) {
    errors.push('视频配置必须提供视频URL')
  }

  if (config.pptConfig && !config.pptConfig.slideUrl) {
    errors.push('PPT配置必须提供幻灯片URL')
  }
}

function validateExperimentActivity(activity: Activity, errors: string[], warnings: string[]) {
  const config = activity.experimentConfig
  if (!config) {
    errors.push('实验活动必须配置实验参数')
    return
  }

  if (config.experimentType === 'jupyter' && !config.jupyterConfig) {
    errors.push('Jupyter实验必须配置Jupyter参数')
  }

  if (config.experimentType === 'ai' && !config.aiConfig) {
    errors.push('AI实验必须配置AI参数')
  }

  if (config.experimentType === 'simulation' && !config.simulationConfig) {
    errors.push('仿真实验必须配置仿真参数')
  }
}

function validateExperienceActivity(activity: Activity, errors: string[], warnings: string[]) {
  const config = activity.experienceConfig
  if (!config) {
    errors.push('体验活动必须配置体验参数')
    return
  }

  if (!config.contentUrl) {
    errors.push('体验活动必须配置内容URL')
  }

  if (config.security && !config.security.sandbox) {
    warnings.push('建议为体验活动启用沙箱安全模式')
  }
}

function validateAssignmentActivity(activity: Activity, errors: string[], warnings: string[]) {
  const config = activity.assignmentConfig
  if (!config) {
    errors.push('作业活动必须配置作业参数')
    return
  }

  if (config.assignmentType === 'quiz' && (!config.questions || config.questions.length === 0)) {
    errors.push('测验作业必须配置题目')
  }

  if (!config.submissionConfig) {
    errors.push('作业活动必须配置提交参数')
  }

  if (!config.gradingConfig) {
    warnings.push('建议配置评分规则')
  }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ===================
// 活动状态转换
// ===================

/**
 * 活动状态转换映射
 */
export const ACTIVITY_STATE_TRANSITIONS: Record<Activity['status'], Activity['status'][]> = {
  locked: ['available'],
  available: ['in_progress', 'overdue'],
  in_progress: ['completed', 'overdue'],
  completed: [], // 完成状态不能转换
  overdue: ['in_progress', 'completed']
}

/**
 * 检查状态转换是否合法
 */
export function isValidStateTransition(from: Activity['status'], to: Activity['status']): boolean {
  return ACTIVITY_STATE_TRANSITIONS[from]?.includes(to) || false
}

/**
 * 执行状态转换
 */
export function transitionActivityState(
  activity: Activity,
  newStatus: Activity['status']
): Activity {
  if (!isValidStateTransition(activity.status, newStatus)) {
    throw new Error(`Invalid state transition from ${activity.status} to ${newStatus}`)
  }

  const updatedActivity = { ...activity, status: newStatus }

  // 如果转换为完成状态，设置完成时间
  if (newStatus === 'completed') {
    updatedActivity.completedAt = new Date().toISOString()
    updatedActivity.progress = 100
  }

  return updatedActivity
}