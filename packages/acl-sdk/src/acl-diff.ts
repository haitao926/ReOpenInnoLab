/**
 * ACL差异比较工具
 * 负责比较两个ACL文件之间的差异
 */

import {
  AiCourseLayout,
  ACDiff,
  DiffNode,
  DiffModification,
  DiffMove,
  DiffSummary,
  VersionInfo,
  VersionChange
} from './types'
import { createHash } from 'crypto'

/**
 * ACL差异比较器
 */
export class ACDiffer {
  /**
   * 比较两个ACL文件
   * @param oldAcl 旧版ACL数据
   * @param newAcl 新版ACL数据
   * @returns 差异结果
   */
  static diff(oldAcl: AiCourseLayout, newAcl: AiCourseLayout): ACDiff {
    const additions: DiffNode[] = []
    const deletions: DiffNode[] = []
    const modifications: DiffModification[] = []
    const moves: DiffMove[] = []

    // 比较元数据
    this.diffMetadata(oldAcl.meta, newAcl.meta, modifications)

    // 比较课程信息
    this.diffCourseInfo(oldAcl.courseInfo, newAcl.courseInfo, modifications)

    // 比较结构
    this.diffStructure(oldAcl.structure, newAcl.structure, additions, deletions, modifications, moves)

    // 比较资源引用
    this.diffResourceRefs(oldAcl.resourceRefs, newAcl.resourceRefs, additions, deletions, modifications)

    // 比较分析配置
    this.diffAnalyticsProfile(oldAcl.analyticsProfile, newAcl.analyticsProfile, modifications)

    // 生成摘要
    const summary = this.generateSummary(additions, deletions, modifications, moves)

    return {
      additions,
      deletions,
      modifications,
      moves,
      summary
    }
  }

  /**
   * 生成版本信息
   * @param oldAcl 旧版ACL数据
   * @param newAcl 新版ACL数据
   * @param author 作者
   * @param commitMessage 提交信息
   * @returns 版本信息
   */
  static generateVersionInfo(
    oldAcl: AiCourseLayout,
    newAcl: AiCourseLayout,
    author: string,
    commitMessage: string
  ): VersionInfo {
    const diff = this.diff(oldAcl, newAcl)
    const fingerprint = this.generateFingerprint(newAcl)

    return {
      id: this.generateVersionId(newAcl.meta.id, newAcl.meta.version),
      courseId: newAcl.meta.id,
      version: newAcl.meta.version,
      changes: this.convertDiffToChanges(diff),
      author,
      commitMessage,
      createdAt: new Date().toISOString(),
      fingerprint
    }
  }

  /**
   * 比较元数据
   * @param oldMeta 旧元数据
   * @param newMeta 新元数据
   * @param modifications 修改列表
   */
  private static diffMetadata(oldMeta: any, newMeta: any, modifications: DiffModification[]): void {
    const fields = ['version', 'tenant', 'tags', 'contributors', 'license', 'lastModified']

    for (const field of fields) {
      if (JSON.stringify(oldMeta[field]) !== JSON.stringify(newMeta[field])) {
        modifications.push({
          path: `meta.${field}`,
          type: 'metadata',
          oldValue: oldMeta[field],
          newValue: newMeta[field]
        })
      }
    }
  }

  /**
   * 比较课程信息
   * @param oldInfo 旧课程信息
   * @param newInfo 新课程信息
   * @param modifications 修改列表
   */
  private static diffCourseInfo(oldInfo: any, newInfo: any, modifications: DiffModification[]): void {
    const fields = ['title', 'description', 'subject', 'grade', 'estimatedDuration', 'prerequisites']

    for (const field of fields) {
      if (JSON.stringify(oldInfo[field]) !== JSON.stringify(newInfo[field])) {
        modifications.push({
          path: `courseInfo.${field}`,
          type: 'courseInfo',
          oldValue: oldInfo[field],
          newValue: newInfo[field]
        })
      }
    }

    // 比较学习目标
    this.diffLearningObjectives(oldInfo.learningObjectives, newInfo.learningObjectives, modifications)

    // 比较目标受众
    this.diffTargetAudience(oldInfo.targetAudience, newInfo.targetAudience, modifications)

    // 比较AI提示
    this.diffAIPrompts(oldInfo.aiPrompts, newInfo.aiPrompts, modifications)
  }

  /**
   * 比较学习目标
   * @param oldObjectives 旧学习目标
   * @param newObjectives 新学习目标
   * @param modifications 修改列表
   */
  private static diffLearningObjectives(oldObjectives: any[], newObjectives: any[], modifications: DiffModification[]): void {
    const oldMap = new Map(oldObjectives.map(obj => [obj.id, obj]))
    const newMap = new Map(newObjectives.map(obj => [obj.id, obj]))

    // 检查修改和删除
    for (const [id, oldObj] of oldMap) {
      const newObj = newMap.get(id)
      if (newObj) {
        // 检查修改
        if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
          modifications.push({
            path: `courseInfo.learningObjectives.${id}`,
            type: 'learningObjective',
            oldValue: oldObj,
            newValue: newObj
          })
        }
      }
    }
  }

  /**
   * 比较目标受众
   * @param oldAudience 旧目标受众
   * @param newAudience 新目标受众
   * @param modifications 修改列表
   */
  private static diffTargetAudience(oldAudience: any, newAudience: any, modifications: DiffModification[]): void {
    if (JSON.stringify(oldAudience) !== JSON.stringify(newAudience)) {
      modifications.push({
        path: 'courseInfo.targetAudience',
        type: 'targetAudience',
        oldValue: oldAudience,
        newValue: newAudience
      })
    }
  }

  /**
   * 比较AI提示
   * @param oldPrompts 旧AI提示
   * @param newPrompts 新AI提示
   * @param modifications 修改列表
   */
  private static diffAIPrompts(oldPrompts: any, newPrompts: any, modifications: DiffModification[]): void {
    if (JSON.stringify(oldPrompts) !== JSON.stringify(newPrompts)) {
      modifications.push({
        path: 'courseInfo.aiPrompts',
        type: 'aiPrompts',
        oldValue: oldPrompts,
        newValue: newPrompts
      })
    }
  }

  /**
   * 比较课程结构
   * @param oldStructure 旧结构
   * @param newStructure 新结构
   * @param additions 添加列表
   * @param deletions 删除列表
   * @param modifications 修改列表
   * @param moves 移动列表
   */
  private static diffStructure(
    oldStructure: any[],
    newStructure: any[],
    additions: DiffNode[],
    deletions: DiffNode[],
    modifications: DiffModification[],
    moves: DiffMove[]
  ): void {
    const oldNodes = this.flattenStructure(oldStructure)
    const newNodes = this.flattenStructure(newStructure)

    // 检查添加和修改
    for (const [path, newNode] of newNodes) {
      const oldNode = oldNodes.get(path)
      if (!oldNode) {
        // 新增节点
        additions.push({
          path,
          type: newNode.type,
          content: newNode
        })
      } else if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        // 修改节点
        modifications.push({
          path,
          type: 'structure',
          oldValue: oldNode,
          newValue: newNode
        })
      }
    }

    // 检查删除
    for (const [path, oldNode] of oldNodes) {
      if (!newNodes.has(path)) {
        // 删除节点
        deletions.push({
          path,
          type: oldNode.type,
          content: oldNode
        })
      }
    }

    // 检查移动（节点存在但路径不同）
    this.detectMoves(oldNodes, newNodes, moves)
  }

  /**
   * 比较资源引用
   * @param oldRefs 旧资源引用
   * @param newRefs 新资源引用
   * @param additions 添加列表
   * @param deletions 删除列表
   * @param modifications 修改列表
   */
  private static diffResourceRefs(
    oldRefs: any[],
    newRefs: any[],
    additions: DiffNode[],
    deletions: DiffNode[],
    modifications: DiffModification[]
  ): void {
    const oldMap = new Map(oldRefs.map(ref => [ref.id, ref]))
    const newMap = new Map(newRefs.map(ref => [ref.id, ref]))

    // 检查添加
    for (const [id, newRef] of newMap) {
      if (!oldMap.has(id)) {
        additions.push({
          path: `resourceRefs.${id}`,
          type: 'resource',
          content: newRef
        })
      }
    }

    // 检查删除和修改
    for (const [id, oldRef] of oldMap) {
      const newRef = newMap.get(id)
      if (!newRef) {
        // 删除资源
        deletions.push({
          path: `resourceRefs.${id}`,
          type: 'resource',
          content: oldRef
        })
      } else if (JSON.stringify(oldRef) !== JSON.stringify(newRef)) {
        // 修改资源
        modifications.push({
          path: `resourceRefs.${id}`,
          type: 'resource',
          oldValue: oldRef,
          newValue: newRef
        })
      }
    }
  }

  /**
   * 比较分析配置
   * @param oldProfile 旧分析配置
   * @param newProfile 新分析配置
   * @param modifications 修改列表
   */
  private static diffAnalyticsProfile(oldProfile: any, newProfile: any, modifications: DiffModification[]): void {
    if (!oldProfile && !newProfile) return

    if (!oldProfile && newProfile) {
      modifications.push({
        path: 'analyticsProfile',
        type: 'analyticsProfile',
        oldValue: null,
        newValue: newProfile
      })
    } else if (oldProfile && !newProfile) {
      modifications.push({
        path: 'analyticsProfile',
        type: 'analyticsProfile',
        oldValue: oldProfile,
        newValue: null
      })
    } else if (JSON.stringify(oldProfile) !== JSON.stringify(newProfile)) {
      modifications.push({
        path: 'analyticsProfile',
        type: 'analyticsProfile',
        oldValue: oldProfile,
        newValue: newProfile
      })
    }
  }

  /**
   * 扁平化结构
   * @param structure 结构数组
   * @param parentPath 父路径
   * @returns 扁平化的节点映射
   */
  private static flattenStructure(structure: any[], parentPath = ''): Map<string, any> {
    const nodes = new Map<string, any>()

    for (let i = 0; i < structure.length; i++) {
      const node = structure[i]
      const path = parentPath ? `${parentPath}[${i}]` : `structure[${i}]`

      nodes.set(path, node)

      if (node.type === 'chapter' && node.children) {
        const childNodes = this.flattenStructure(node.children, `${path}.children`)
        childNodes.forEach((childNode, childPath) => {
          nodes.set(childPath, childNode)
        })
      }
    }

    return nodes
  }

  /**
   * 检测移动
   * @param oldNodes 旧节点映射
   * @param newNodes 新节点映射
   * @param moves 移动列表
   */
  private static detectMoves(
    oldNodes: Map<string, any>,
    newNodes: Map<string, any>,
    moves: DiffMove[]
  ): void {
    const oldNodeIds = new Map<string, string>()
    const newNodeIds = new Map<string, string>()

    // 建立ID到路径的映射
    for (const [path, node] of oldNodes) {
      oldNodeIds.set(node.id, path)
    }

    for (const [path, node] of newNodes) {
      newNodeIds.set(node.id, path)
    }

    // 检测移动
    for (const [id, oldPath] of oldNodeIds) {
      const newPath = newNodeIds.get(id)
      if (newPath && newPath !== oldPath) {
        moves.push({
          oldPath,
          newPath,
          type: 'structure'
        })
      }
    }
  }

  /**
   * 生成差异摘要
   * @param additions 添加列表
   * @param deletions 删除列表
   * @param modifications 修改列表
   * @param moves 移动列表
   * @returns 差异摘要
   */
  private static generateSummary(
    additions: DiffNode[],
    deletions: DiffNode[],
    modifications: DiffModification[],
    moves: DiffMove[]
  ): DiffSummary {
    const totalChanges = additions.length + deletions.length + modifications.length + moves.length

    // 检查是否有结构性变化
    const structuralChanges = [
      ...additions.filter(a => a.type === 'chapter'),
      ...deletions.filter(d => d.type === 'chapter'),
      ...moves
    ].length > 0

    return {
      totalChanges,
      additions: additions.length,
      deletions: deletions.length,
      modifications: modifications.length,
      moves: moves.length,
      structuralChanges
    }
  }

  /**
   * 转换差异为变更列表
   * @param diff 差异结果
   * @returns 变更列表
   */
  private static convertDiffToChanges(diff: ACDiff): VersionChange[] {
    const changes: VersionChange[] = []

    // 添加
    for (const addition of diff.additions) {
      changes.push({
        type: 'add',
        path: addition.path,
        newValue: addition.content,
        description: `添加 ${this.getNodeTypeName(addition.type)}: ${addition.content.title || addition.content.id}`
      })
    }

    // 删除
    for (const deletion of diff.deletions) {
      changes.push({
        type: 'delete',
        path: deletion.path,
        oldValue: deletion.content,
        description: `删除 ${this.getNodeTypeName(deletion.type)}: ${deletion.content.title || deletion.content.id}`
      })
    }

    // 修改
    for (const modification of diff.modifications) {
      changes.push({
        type: 'modify',
        path: modification.path,
        oldValue: modification.oldValue,
        newValue: modification.newValue,
        description: `修改 ${modification.path}`
      })
    }

    // 移动
    for (const move of diff.moves) {
      changes.push({
        type: 'move',
        path: move.oldPath,
        newValue: move.newPath,
        description: `移动节点从 ${move.oldPath} 到 ${move.newPath}`
      })
    }

    return changes
  }

  /**
   * 生成版本ID
   * @param courseId 课程ID
   * @param version 版本号
   * @returns 版本ID
   */
  private static generateVersionId(courseId: string, version: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${courseId}-v${version}-${timestamp}-${random}`
  }

  /**
   * 生成指纹
   * @param acl ACL数据
   * @returns 指纹字符串
   */
  private static generateFingerprint(acl: AiCourseLayout): string {
    const content = JSON.stringify(acl, Object.keys(acl).sort())
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * 获取节点类型名称
   * @param type 节点类型
   * @returns 类型名称
   */
  private static getNodeTypeName(type: string): string {
    const types: Record<string, string> = {
      introduction: '导入',
      chapter: '章节',
      knowledge: '知识',
      activity: '活动',
      experiment: '实验',
      interaction: '交互',
      assignment: '作业',
      assessment: '评估',
      resource: '资源'
    }
    return types[type] || type
  }

  /**
   * 应用差异到ACL
   * @param acl 原始ACL
   * @param diff 差异
   * @returns 应用差异后的ACL
   */
  static applyDiff(acl: AiCourseLayout, diff: ACDiff): AiCourseLayout {
    const result = JSON.parse(JSON.stringify(acl)) // 深拷贝

    // 应用添加
    for (const addition of diff.additions) {
      this.applyAddition(result, addition)
    }

    // 应用删除
    for (const deletion of diff.deletions) {
      this.applyDeletion(result, deletion)
    }

    // 应用修改
    for (const modification of diff.modifications) {
      this.applyModification(result, modification)
    }

    // 应用移动
    for (const move of diff.moves) {
      this.applyMove(result, move)
    }

    return result
  }

  /**
   * 应用添加操作
   * @param acl ACL对象
   * @param addition 添加项
   */
  private static applyAddition(acl: any, addition: DiffNode): void {
    const pathParts = this.parsePath(addition.path)
    const target = this.getNestedObject(acl, pathParts.slice(0, -1))

    if (target && Array.isArray(target)) {
      const match = pathParts[pathParts.length - 1]?.match(/\d+/)
      const index = parseInt(match?.[0] || '0')
      target.splice(index, 0, addition.content)
    }
  }

  /**
   * 应用删除操作
   * @param acl ACL对象
   * @param deletion 删除项
   */
  private static applyDeletion(acl: any, deletion: DiffNode): void {
    const pathParts = this.parsePath(deletion.path)
    const target = this.getNestedObject(acl, pathParts.slice(0, -1))

    if (target && Array.isArray(target)) {
      const match = pathParts[pathParts.length - 1]?.match(/\d+/)
      const index = parseInt(match?.[0] || '0')
      target.splice(index, 1)
    }
  }

  /**
   * 应用修改操作
   * @param acl ACL对象
   * @param modification 修改项
   */
  private static applyModification(acl: any, modification: DiffModification): void {
    const pathParts = this.parsePath(modification.path)
    const target = this.getNestedObject(acl, pathParts.slice(0, -1))
    const key = pathParts[pathParts.length - 1]

    if (target && key) {
      target[key] = modification.newValue
    }
  }

  /**
   * 应用移动操作
   * @param acl ACL对象
   * @param move 移动项
   */
  private static applyMove(acl: any, move: DiffMove): void {
    // 删除原位置的节点
    const oldPathParts = this.parsePath(move.oldPath)
    const oldTarget = this.getNestedObject(acl, oldPathParts.slice(0, -1))

    if (oldTarget && Array.isArray(oldTarget)) {
      const oldMatch = oldPathParts[oldPathParts.length - 1]?.match(/\d+/)
      const oldIndex = parseInt(oldMatch?.[0] || '0')
      const [movedNode] = oldTarget.splice(oldIndex, 1)

      // 在新位置插入节点
      const newPathParts = this.parsePath(move.newPath)
      const newTarget = this.getNestedObject(acl, newPathParts.slice(0, -1))

      if (newTarget && Array.isArray(newTarget)) {
        const newMatch = newPathParts[newPathParts.length - 1]?.match(/\d+/)
        const newIndex = parseInt(newMatch?.[0] || '0')
        newTarget.splice(newIndex, 0, movedNode)
      }
    }
  }

  /**
   * 解析路径
   * @param path 路径字符串
   * @returns 路径部分数组
   */
  private static parsePath(path: string): string[] {
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(part => part !== '')
  }

  /**
   * 获取嵌套对象
   * @param obj 对象
   * @param pathParts 路径部分
   * @returns 目标对象
   */
  private static getNestedObject(obj: any, pathParts: string[]): any {
    let current = obj

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return null
      }
    }

    return current
  }
}