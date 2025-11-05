# ACL SDK - AiCourseLayout SDK

[![npm version](https://badge.fury.io/js/%40reopeninnolab%2Facl-sdk.svg)](https://badge.fury.io/js/%40reopeninnolab%2Facl-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 教育知识工程化的核心工具包 - ACL (AiCourseLayout) 文件解析、验证、渲染和差异比较

## 📖 概述

ACL SDK 是一个专门为教育场景设计的 `.acl` 文件处理工具包。它提供了完整的课程内容结构化解决方案，支持智能课件的设计、验证、渲染和版本管理。

### 核心特性

- 🔍 **强大的解析能力** - 支持 JSON 和 YAML 格式的 `.acl` 文件
- ✅ **全面的验证机制** - 基于 JSON Schema 的结构验证和业务规则验证
- 🎨 **多格式渲染** - 支持 HTML、Markdown、JSON 等多种输出格式
- 📝 **智能差异比较** - 精确识别课程内容的变更和版本演进
- 🧠 **AI 增强** - 内置 AI 策略支持和智能内容适配
- 🎯 **教育专用** - 针对教育场景优化的数据结构和验证规则

## 🚀 快速开始

### 安装

```bash
npm install @reopeninnolab/acl-sdk
```

### 基本使用

```typescript
import { ACLParser, ACLValidator, ACLRenderer } from '@reopeninnolab/acl-sdk'

// 1. 解析 ACL 文件
const parser = new ACLParser()
const content = fs.readFileSync('course.acl', 'utf8')
const { data, validation } = await parser.parse(content)

if (validation.isValid) {
  console.log('课程解析成功:', data.courseInfo.title)

  // 2. 渲染为 HTML
  const renderer = new ACLRenderer()
  const htmlResult = await renderer.render(data, {
    format: 'html',
    includeMetadata: true
  })

  fs.writeFileSync('course.html', htmlResult.content)
} else {
  console.error('验证失败:', validation.errors)
}
```

## 📋 ACL 文件格式

ACL (AiCourseLayout) 是一种结构化的课程内容描述格式，专门用于描述智能课件的结构和内容。

### 基本结构

```json
{
  "meta": {
    "id": "course-001",
    "version": "1.0.0",
    "tags": ["物理", "力学"],
    "contributors": ["teacher@example.com"],
    "lastModified": "2024-01-15T10:30:00Z"
  },
  "courseInfo": {
    "title": "高中物理 - 力学基础",
    "subject": "physics",
    "grade": "10",
    "learningObjectives": [...],
    "targetAudience": {...},
    "estimatedDuration": 45,
    "aiPrompts": {...}
  },
  "structure": [...],
  "resourceRefs": [...]
}
```

### 支持 YAML 格式

```yaml
meta:
  id: chemistry-basics
  version: "1.2.0"
  tags:
    - 化学
    - 基础
  contributors:
    - chemistry.teacher@school.edu

courseInfo:
  title: 高中化学 - 物质的变化
  subject: chemistry
  grade: "10"
  # ...
```

## 🔧 API 文档

### ACLParser

负责解析和验证 `.acl` 文件。

```typescript
const parser = new ACLParser()

// 解析文件
const result = await parser.parse(content, options)

// 同步解析
const syncResult = parser.parseSync(content, options)

// 验证格式
const isValid = ACLParser.isValidFormat(content)

// 获取文件信息
const info = parser.getFileInfo(content)
```

#### 解析选项

```typescript
interface ParseOptions {
  strict?: boolean           // 严格模式
  allowUnknownFields?: boolean  // 允许未知字段
  validateReferences?: boolean   // 验证引用完整性
  maxFileSize?: number         // 最大文件大小（字节）
}
```

### ACLValidator

提供结构验证和业务规则验证。

```typescript
const validator = new ACLValidator()

// 异步验证
const result = await validator.validate(data)

// 同步验证
const syncResult = validator.validateSync(data)

// 添加自定义规则
validator.addRule(customRule)

// 获取所有规则
const rules = validator.getRules()
```

#### 验证结果

```typescript
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: ValidationSummary
}
```

### ACLRenderer

将 ACL 数据渲染为多种格式。

```typescript
const renderer = new ACLRenderer()

// 渲染为 HTML
const htmlResult = await renderer.render(aclData, {
  format: 'html',
  theme: 'light',
  includeMetadata: true
})

// 渲染为 Markdown
const mdResult = await renderer.render(aclData, {
  format: 'markdown'
})

// 渲染为 JSON
const jsonResult = await renderer.render(aclData, {
  format: 'json'
})
```

#### 渲染选项

```typescript
interface RenderOptions {
  format: 'html' | 'markdown' | 'pdf' | 'docx' | 'json'
  theme?: string
  includeMetadata?: boolean
  includeAnalytics?: boolean
  customStyles?: Record<string, any>
}
```

### ACDiffer

比较两个 ACL 文件的差异。

```typescript
import { ACDiffer } from '@reopeninnolab/acl-sdk'

// 比较差异
const diff = ACDiffer.diff(oldAcl, newAcl)

// 生成版本信息
const versionInfo = ACDiffer.generateVersionInfo(
  oldAcl,
  newAcl,
  'author@example.com',
  'Update course content'
)

// 应用差异
const updatedAcl = ACDiffer.applyDiff(baseAcl, diff)
```

#### 差异结果

```typescript
interface ACDiff {
  additions: DiffNode[]        // 新增内容
  deletions: DiffNode[]        // 删除内容
  modifications: DiffModification[]  // 修改内容
  moves: DiffMove[]           // 移动内容
  summary: DiffSummary        // 差异摘要
}
```

## 🎯 使用场景

### 1. 课程内容管理

```typescript
// 解析课程文件
const { data: course } = await parser.parse(courseContent)

// 验证课程结构
const validation = await validator.validate(course)
if (!validation.isValid) {
  console.error('课程结构有误:', validation.errors)
  return
}

// 渲染为网页
const html = await renderer.render(course, {
  format: 'html',
  theme: 'dark'
})
```

### 2. 版本控制和协作

```typescript
// 比较课程版本
const diff = ACDiffer.diff(oldVersion, newVersion)

if (diff.summary.structuralChanges) {
  console.log('检测到结构性变化，需要重新审核')
}

// 生成变更日志
const changelog = diff.changes.map(change => change.description).join('\n')
```

### 3. 批量处理

```typescript
// 批量解析多个课程
const courses = await parser.parseBatch([
  { id: 'course-1', content: content1 },
  { id: 'course-2', content: content2 },
  { id: 'course-3', content: content3 }
])

// 统计信息
const stats = courses.reduce((acc, course) => {
  if (course.validation.isValid) {
    acc.valid++
  } else {
    acc.invalid++
  }
  return acc
}, { valid: 0, invalid: 0 })
```

## 📚 示例

### 解析并渲染课程

```typescript
import fs from 'fs'
import { ACLParser, ACLRenderer } from '@reopeninnolab/acl-sdk'

async function processCourseFile(filePath: string) {
  const parser = new ACLParser()
  const renderer = new ACLRenderer()

  // 读取文件
  const content = fs.readFileSync(filePath, 'utf8')

  // 解析
  const { data, validation } = await parser.parse(content)

  if (!validation.isValid) {
    console.error('解析失败:', validation.errors)
    return
  }

  // 渲染多种格式
  const html = await renderer.render(data, { format: 'html' })
  const markdown = await renderer.render(data, { format: 'markdown' })

  // 保存结果
  fs.writeFileSync(`${filePath}.html`, html.content)
  fs.writeFileSync(`${filePath}.md`, markdown.content)

  console.log(`处理完成: ${data.courseInfo.title}`)
}
```

### 自定义验证规则

```typescript
import { ACLValidator, ValidationRule, ValidationResult } from '@reopeninnolab/acl-sdk'

class CustomRule implements ValidationRule {
  name = 'custom-duration-check'
  description = '检查课程总时长是否合理'

  async validate(data: any): Promise<ValidationResult> {
    const errors = []
    const warnings = []

    // 计算总时长
    const totalDuration = calculateTotalDuration(data.structure)

    if (totalDuration > 480) { // 8小时
      warnings.push({
        path: 'structure',
        message: '课程总时长过长，建议分拆',
        code: 'COURSE_TOO_LONG',
        severity: 'warning'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        schemaVersion: '1.0.0',
        validatedAt: new Date().toISOString()
      }
    }
  }
}

// 使用自定义规则
const validator = new ACLValidator()
validator.addRule(new CustomRule())
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试UI
npm run test:ui
```

## 📝 更新日志

### v1.0.0 (2024-01-15)

- ✨ 初始版本发布
- ✨ 支持 JSON 和 YAML 格式解析
- ✨ 完整的 JSON Schema 验证
- ✨ HTML 和 Markdown 渲染支持
- ✨ 差异比较和版本管理
- ✨ 教育专用的业务规则验证
- ✨ AI 策略集成支持

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/reopeninnolab/acl-sdk.git
cd acl-sdk

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 运行测试
npm test
```

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🔗 相关链接

- [ReOpenInnoLab 官网](https://reopeninnolab.org)
- [ACL 规范文档](https://reopeninnolab.org/docs/acl-spec)
- [示例课程库](https://reopeninnolab.org/examples/acl)
- [社区论坛](https://community.reopeninnolab.org)

## 💬 支持

如果您在使用过程中遇到问题或有建议，请：

1. 查看 [常见问题](FAQ.md)
2. 搜索现有的 [Issues](https://github.com/reopeninnolab/acl-sdk/issues)
3. 创建新的 Issue 描述问题
4. 加入我们的 [社区讨论](https://discord.gg/reopeninnolab)

---

<p align="center">
  Made with ❤️ by ReOpenInnoLab Team
</p>