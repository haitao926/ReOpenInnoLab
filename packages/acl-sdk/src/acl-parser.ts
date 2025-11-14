/**
 * ACL解析器
 * 负责.acl文件的解析、验证和转换
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as YAML from 'yaml'
import { AiCourseLayout, ParseOptions, ValidationResult } from './types'
import { ACLValidator } from './acl-validator'

/**
 * ACL解析器类
 */
export class ACLParser {
  private ajv: Ajv
  private validator: ACLValidator

  constructor() {
    // 初始化AJV验证器
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      allowUnionTypes: true
    })

    // 添加格式支持
    addFormats(this.ajv)

    // 初始化自定义验证器
    this.validator = new ACLValidator()
  }

  /**
   * 解析ACL文件内容
   * @param content 文件内容
   * @param options 解析选项
   * @returns 解析结果
   */
  async parse(content: string, options: ParseOptions = {}): Promise<{
    data: AiCourseLayout
    validation: ValidationResult
  }> {
    try {
      // 1. 预处理内容
      const processedContent = this.preprocessContent(content, options)

      // 2. 解析内容 (JSON 或 YAML)
      const jsonData = this.parseContent(processedContent, options)

      // 3. 验证结构
      const validation = await this.validate(jsonData)

      // 4. 后处理数据
      const processedData = this.postprocessData(jsonData, options)

      return {
        data: processedData,
        validation
      }
    } catch (error) {
      throw new Error(`ACL解析失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 解析ACL文件内容 (同步版本)
   * @param content 文件内容
   * @param options 解析选项
   * @returns 解析结果
   */
  parseSync(content: string, options: ParseOptions = {}): {
    data: AiCourseLayout
    validation: ValidationResult
  } {
    try {
      // 1. 预处理内容
      const processedContent = this.preprocessContent(content, options)

      // 2. 解析内容 (JSON 或 YAML)
      const jsonData = this.parseContent(processedContent, options)

      // 3. 验证结构
      const validation = this.validateSync(jsonData)

      // 4. 后处理数据
      const processedData = this.postprocessData(jsonData, options)

      return {
        data: processedData,
        validation
      }
    } catch (error) {
      throw new Error(`ACL解析失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 验证ACL数据
   * @param data ACL数据
   * @returns 验证结果
   */
  async validate(data: any): Promise<ValidationResult> {
    return this.validator.validate(data)
  }

  /**
   * 验证ACL数据 (同步版本)
   * @param data ACL数据
   * @returns 验证结果
   */
  validateSync(data: any): ValidationResult {
    return this.validator.validateSync(data)
  }

  /**
   * 解析内容 (支持JSON和YAML)
   * @param content 处理后的内容
   * @param options 解析选项
   * @returns 解析后的对象
   */
  private parseContent(content: string, _options: ParseOptions): any {
    const trimmed = content.trim()

    // 尝试JSON解析
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed)
      } catch (error) {
        throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 尝试YAML解析
    try {
      return YAML.parse(trimmed, {
        strict: false,
        mapAsMap: false,
        merge: false
      })
    } catch (error) {
      throw new Error(`YAML解析失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 预处理内容
   * @param content 原始内容
   * @param options 解析选项
   * @returns 处理后的内容
   */
  private preprocessContent(content: string, options: ParseOptions): string {
    let processedContent = content.trim()

    // 移除BOM
    if (processedContent.charCodeAt(0) === 0xFEFF) {
      processedContent = processedContent.slice(1)
    }

    // 处理注释
    if (!options.allowComments) {
      processedContent = this.removeComments(processedContent)
    }

    // 处理尾随逗号
    processedContent = this.fixTrailingCommas(processedContent)

    return processedContent
  }

  /**
   * 后处理数据
   * @param data 解析后的数据
   * @param options 解析选项
   * @returns 处理后的数据
   */
  private postprocessData(data: any, options: ParseOptions): AiCourseLayout {
    const processed = { ...data }

    // 设置默认值
    this.setDefaults(processed)

    // 规范化数据
    this.normalizeData(processed)

    // 验证引用
    if (options.validateReferences) {
      this.validateReferences(processed)
    }

    return processed as AiCourseLayout
  }

  /**
   * 移除JSON注释
   * @param content 内容
   * @returns 处理后的内容
   */
  private removeComments(content: string): string {
    // 移除单行注释
    content = content.replace(/\/\/.*$/gm, '')

    // 移除多行注释
    content = content.replace(/\/\*[\s\S]*?\*\//g, '')

    return content
  }

  /**
   * 修复尾随逗号
   * @param content 内容
   * @returns 处理后的内容
   */
  private fixTrailingCommas(content: string): string {
    // 修复对象中的尾随逗号
    content = content.replace(/,(\s*[}\]])/g, '$1')

    return content
  }

  /**
   * 设置默认值
   * @param data 数据对象
   */
  private setDefaults(data: any): void {
    // 设置meta默认值
    if (!data.meta) {
      data.meta = {}
    }

    if (!data.meta.tags) {
      data.meta.tags = []
    }

    if (!data.meta.contributors) {
      data.meta.contributors = []
    }

    if (!data.meta.license) {
      data.meta.license = 'educational-use'
    }

    // 设置courseInfo默认值
    if (!data.courseInfo) {
      data.courseInfo = {}
    }

    if (!data.courseInfo.prerequisites) {
      data.courseInfo.prerequisites = []
    }

    // 设置structure默认值
    if (!data.structure) {
      data.structure = []
    }

    // 设置resourceRefs默认值
    if (!data.resourceRefs) {
      data.resourceRefs = []
    }
  }

  /**
   * 规范化数据
   * @param data 数据对象
   */
  private normalizeData(data: any): void {
    // 规范化版本号格式
    if (data.meta?.version && typeof data.meta.version === 'string') {
      data.meta.version = data.meta.version.trim()
    }

    // 规范化时间格式
    if (data.meta?.lastModified && typeof data.meta.lastModified === 'string') {
      const timestamp = new Date(data.meta.lastModified).getTime()
      if (!isNaN(timestamp)) {
        data.meta.lastModified = new Date(timestamp).toISOString()
      }
    }

    // 规范化标签
    if (data.meta?.tags && Array.isArray(data.meta.tags)) {
      data.meta.tags = data.meta.tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim())
        .map((tag: string) => tag.trim())
        .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index)
    }

    // 规范化贡献者
    if (data.meta?.contributors && Array.isArray(data.meta.contributors)) {
      data.meta.contributors = data.meta.contributors
        .filter((contributor: any) => typeof contributor === 'string' && contributor.trim())
        .map((contributor: string) => contributor.trim())
        .filter((contributor: string, index: number, arr: string[]) => arr.indexOf(contributor) === index)
    }
  }

  /**
   * 验证资源引用
   * @param data 数据对象
   */
  private validateReferences(data: any): void {
    const referencedIds = new Set<string>()

    // 收集所有引用的资源ID
    this.collectResourceReferences(data, referencedIds)

    // 验证引用是否存在
    if (data.resourceRefs && Array.isArray(data.resourceRefs)) {
      data.resourceRefs.forEach((ref: any) => {
        if (ref && ref.id && !referencedIds.has(ref.id)) {
          console.warn(`未使用的资源引用: ${ref.id}`)
        }
      })
    }
  }

  /**
   * 收集资源引用
   * @param node 节点
   * referencedIds 引用ID集合
   */
  private collectResourceReferences(node: any, referencedIds: Set<string>): void {
    if (!node || typeof node !== 'object') {
      return
    }

    // 收集resourceRefs中的引用
    if (Array.isArray(node.resourceRefs)) {
      node.resourceRefs.forEach((refId: string) => {
        if (refId && typeof refId === 'string') {
          referencedIds.add(refId)
        }
      })
    }

    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.collectResourceReferences(child, referencedIds)
      })
    }

    // 处理content中的引用
    if (node.content && typeof node.content === 'object') {
      this.collectResourceReferences(node.content, referencedIds)
    }
  }

  /**
   * 创建解析器实例
   * @param schema JSON Schema
   * @returns 解析器实例
   */
  static createWithSchema(schema: object): ACLParser {
    const parser = new ACLParser()
    parser.ajv.addSchema(schema)
    return parser
  }

  /**
   * 批量解析多个ACL文件
   * @param contents 文件内容数组
   * @param options 解析选项
   * @returns 解析结果数组
   */
  async parseBatch(
    contents: Array<{ id: string; content: string }>,
    options: ParseOptions = {}
  ): Promise<Array<{ id: string; data: AiCourseLayout; validation: ValidationResult }>> {
    const results = await Promise.allSettled(
      contents.map(async ({ id, content }) => {
        const result = await this.parse(content, options)
        return { id, ...result }
      })
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        throw new Error(`批量解析失败 (索引 ${index}): ${result.reason}`)
      }
    })
  }

  /**
   * 验证ACL文件格式
   * @param content 文件内容
   * @returns 是否为有效格式
   */
  static isValidFormat(content: string): boolean {
    try {
      const trimmed = content.trim()

      // 检查JSON格式
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        JSON.parse(trimmed)
        return true
      }

      // 检查YAML格式
      if (/^[a-zA-Z_][a-zA-Z0-9_]*:\s*/m.test(trimmed)) {
        YAML.parse(trimmed, {
          strict: false,
          mapAsMap: false,
          merge: false
        })
        return true
      }

      return false
    } catch {
      return false
    }
  }

  /**
   * 获取文件基本信息
   * @param content 文件内容
   * @returns 文件信息
   */
  getFileInfo(content: string): {
    size: number
    lines: number
    hasComments: boolean
    format: string
  } {
    const lines = content.split('\n')
    const hasComments = /\/\/.*$|\/\*[\s\S]*?\*\//.test(content)

    return {
      size: Buffer.byteLength(content, 'utf8'),
      lines: lines.length,
      hasComments,
      format: this.detectFormat(content)
    }
  }

  /**
   * 检测文件格式
   * @param content 文件内容
   * @returns 文件格式
   */
  private detectFormat(content: string): string {
    const trimmed = content.trim()

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return 'json'
    }

    // 检查是否为YAML格式
    if (/^[a-zA-Z_][a-zA-Z0-9_]*:\s*/m.test(trimmed)) {
      return 'yaml'
    }

    return 'unknown'
  }
}