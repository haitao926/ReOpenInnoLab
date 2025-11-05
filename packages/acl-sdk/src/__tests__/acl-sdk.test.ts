/**
 * ACL SDK 测试套件
 * 测试解析、验证、渲染和差异比较功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ACLParser } from '../acl-parser'
import { ACLValidator } from '../acl-validator'
import { ACLRenderer } from '../acl-renderer'
import { ACDiffer } from '../acl-diff'
import { AiCourseLayout } from '../types'

describe('ACL SDK', () => {
  let parser: ACLParser
  let validator: ACLValidator
  let renderer: ACLRenderer

  beforeEach(() => {
    parser = new ACLParser()
    validator = new ACLValidator()
    renderer = new ACLRenderer()
  })

  describe('ACLParser', () => {
    it('should parse valid JSON ACL file', async () => {
      const jsonContent = readFileSync(
        join(__dirname, '../../examples/physics-mechanics-intro.acl'),
        'utf8'
      )

      const result = await parser.parse(jsonContent)

      expect(result.data).toBeDefined()
      expect(result.data.meta.id).toBe('physics-mechanics-intro')
      expect(result.data.courseInfo.title).toContain('高中物理')
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.errors).toHaveLength(0)
    })

    it('should parse valid YAML ACL file', async () => {
      const yamlContent = readFileSync(
        join(__dirname, '../../examples/chemistry-basics-intro.yaml'),
        'utf8'
      )

      const result = await parser.parse(yamlContent)

      expect(result.data).toBeDefined()
      expect(result.data.meta.id).toBe('chemistry-basics-intro')
      expect(result.data.courseInfo.title).toContain('高中化学')
      expect(result.validation.isValid).toBe(true)
    })

    it('should detect invalid ACL format', () => {
      const invalidContent = 'this is not valid json or yaml'

      expect(ACLParser.isValidFormat(invalidContent)).toBe(false)
    })

    it('should detect valid JSON format', () => {
      const validJson = '{"meta": {"id": "test"}}'

      expect(ACLParser.isValidFormat(validJson)).toBe(true)
    })

    it('should handle parsing errors gracefully', async () => {
      const invalidJson = '{"meta": {"id": "test"' // 缺少闭合括号

      await expect(parser.parse(invalidJson)).rejects.toThrow('ACL解析失败')
    })

    it('should provide file information', () => {
      const content = JSON.stringify({
        meta: { id: 'test', version: '1.0.0' }
      }, null, 2)

      const info = parser.getFileInfo(content)

      expect(info.size).toBeGreaterThan(0)
      expect(info.lines).toBeGreaterThan(0)
      expect(info.format).toBe('json')
    })

    it('should parse synchronously', () => {
      const content = JSON.stringify({
        meta: { id: 'test', version: '1.0.0' },
        courseInfo: { title: 'Test Course', subject: 'math', grade: '10', learningObjectives: [], targetAudience: { grade: '10', learningStyles: [] }, estimatedDuration: 30, aiPrompts: { generation: 'test', assessment: 'test' } },
        structure: [],
        resourceRefs: []
      })

      const result = parser.parseSync(content)

      expect(result.data).toBeDefined()
      expect(result.validation.isValid).toBe(true)
    })
  })

  describe('ACLValidator', () => {
    it('should validate valid ACL data', async () => {
      const validData = {
        meta: {
          id: 'test-course',
          version: '1.0.0',
          tags: ['test'],
          contributors: ['test@example.com'],
          lastModified: new Date().toISOString()
        },
        courseInfo: {
          title: 'Test Course',
          subject: 'math',
          grade: '10',
          learningObjectives: [
            {
              id: 'lo-001',
              description: 'Test objective',
              cognitiveLevel: 'understand',
              assessmentCriteria: ['test criterion']
            }
          ],
          targetAudience: {
            grade: '10',
            learningStyles: ['visual']
          },
          estimatedDuration: 45,
          aiPrompts: {
            generation: 'Generate test content',
            assessment: 'Assess test content'
          }
        },
        structure: [
          {
            id: 'node-001',
            title: 'Test Node',
            type: 'knowledge',
            duration: 15,
            learningGoals: ['test goal'],
            resourceRefs: [],
            content: {
              format: 'text',
              content: 'Test content'
            }
          }
        ],
        resourceRefs: []
      }

      const result = await validator.validate(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', async () => {
      const invalidData = {
        meta: {
          id: 'test-course'
          // 缺少 version, tags, contributors, lastModified
        }
        // 缺少其他必需字段
      }

      const result = await validator.validate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.code.includes('MISSING_REQUIRED_FIELD'))).toBe(true)
    })

    it('should validate synchronously', () => {
      const validData = {
        meta: {
          id: 'test-course',
          version: '1.0.0',
          tags: ['test'],
          contributors: ['test@example.com'],
          lastModified: new Date().toISOString()
        },
        courseInfo: {
          title: 'Test Course',
          subject: 'math',
          grade: '10',
          learningObjectives: [],
          targetAudience: { grade: '10', learningStyles: [] },
          estimatedDuration: 30,
          aiPrompts: { generation: 'test', assessment: 'test' }
        },
        structure: [],
        resourceRefs: []
      }

      const result = validator.validateSync(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should provide validation summary', async () => {
      const data = {
        meta: {
          id: 'test-course',
          version: '1.0.0',
          tags: ['test'],
          contributors: ['test@example.com'],
          lastModified: new Date().toISOString()
        },
        courseInfo: {
          title: 'Test Course',
          subject: 'math',
          grade: '10',
          learningObjectives: [],
          targetAudience: { grade: '10', learningStyles: [] },
          estimatedDuration: 500, // 过长，应产生警告
          aiPrompts: { generation: 'test', assessment: 'test' }
        },
        structure: [],
        resourceRefs: []
      }

      const result = await validator.validate(data)

      expect(result.summary).toBeDefined()
      expect(result.summary.totalErrors).toBe(0)
      expect(result.summary.totalWarnings).toBeGreaterThanOrEqual(0)
      expect(result.summary.schemaVersion).toBe('1.0.0')
      expect(result.summary.validatedAt).toBeDefined()
    })
  })

  describe('ACLRenderer', () => {
    const mockAcl: AiCourseLayout = {
      meta: {
        id: 'test-course',
        version: '1.0.0',
        tags: ['test'],
        contributors: ['test@example.com'],
        lastModified: '2024-01-15T10:30:00Z'
      },
      courseInfo: {
        title: 'Test Course',
        description: 'A test course for rendering',
        subject: 'math',
        grade: '10',
        learningObjectives: [
          {
            id: 'lo-001',
            description: 'Test objective',
            cognitiveLevel: 'understand',
            assessmentCriteria: ['test criterion']
          }
        ],
        targetAudience: {
          grade: '10',
          learningStyles: ['visual']
        },
        estimatedDuration: 45,
        aiPrompts: {
          generation: 'Generate test content',
          assessment: 'Assess test content'
        }
      },
      structure: [
        {
          id: 'node-001',
          title: 'Introduction',
          type: 'introduction',
          duration: 10,
          learningGoals: ['Introduce the course'],
          resourceRefs: [],
          content: {
            hookType: 'question',
            hookContent: 'What is mathematics?',
            objectives: ['Understand the importance'],
            prerequisites: []
          }
        }
      ],
      resourceRefs: [
        {
          id: 'resource-001',
          type: 'video',
          title: 'Introduction Video',
          url: 'https://example.com/video.mp4'
        }
      ]
    }

    it('should render to HTML', async () => {
      const options = {
        format: 'html' as const,
        includeMetadata: true,
        includeAnalytics: false
      }

      const result = await renderer.render(mockAcl, options)

      expect(result.content).toContain('<!DOCTYPE html>')
      expect(result.content).toContain(mockAcl.courseInfo.title)
      expect(result.content).toContain('Test Course')
      expect(result.metadata).toBeDefined()
    })

    it('should render to Markdown', async () => {
      const options = {
        format: 'markdown' as const,
        includeMetadata: true
      }

      const result = await renderer.render(mockAcl, options)

      expect(result.content).toContain('# Test Course')
      expect(result.content).toContain('## 课程信息')
      expect(result.content).toContain('学科: 数学')
      expect(result.metadata).toBeDefined()
    })

    it('should render to JSON', async () => {
      const options = {
        format: 'json' as const,
        includeMetadata: false
      }

      const result = await renderer.render(mockAcl, options)

      expect(result.content).toContain('"meta"')
      expect(result.content).toContain('"courseInfo"')
      expect(result.content).toContain('"renderedAt"')
      expect(result.metadata).toBeDefined()
    })

    it('should handle unsupported format', async () => {
      const options = {
        format: 'pdf' as const
      }

      await expect(renderer.render(mockAcl, options)).rejects.toThrow('不支持的渲染格式')
    })
  })

  describe('ACDiffer', () => {
    const baseAcl: AiCourseLayout = {
      meta: {
        id: 'test-course',
        version: '1.0.0',
        tags: ['test'],
        contributors: ['test@example.com'],
        lastModified: '2024-01-15T10:30:00Z'
      },
      courseInfo: {
        title: 'Test Course',
        subject: 'math',
        grade: '10',
        learningObjectives: [
          {
            id: 'lo-001',
            description: 'Test objective',
            cognitiveLevel: 'understand',
            assessmentCriteria: ['test criterion']
          }
        ],
        targetAudience: { grade: '10', learningStyles: ['visual'] },
        estimatedDuration: 45,
        aiPrompts: { generation: 'test', assessment: 'test' }
      },
      structure: [
        {
          id: 'node-001',
          title: 'Test Node',
          type: 'knowledge',
          duration: 15,
          learningGoals: ['test goal'],
          resourceRefs: [],
          content: {
            format: 'text',
            content: 'Test content'
          }
        }
      ],
      resourceRefs: []
    }

    it('should detect no differences in identical ACLs', () => {
      const diff = ACDiffer.diff(baseAcl, baseAcl)

      expect(diff.additions).toHaveLength(0)
      expect(diff.deletions).toHaveLength(0)
      expect(diff.modifications).toHaveLength(0)
      expect(diff.moves).toHaveLength(0)
      expect(diff.summary.totalChanges).toBe(0)
    })

    it('should detect modifications', () => {
      const modifiedAcl = JSON.parse(JSON.stringify(baseAcl))
      modifiedAcl.courseInfo.title = 'Modified Course Title'

      const diff = ACDiffer.diff(baseAcl, modifiedAcl)

      expect(diff.modifications.length).toBeGreaterThan(0)
      expect(diff.modifications.some(m =>
        m.path === 'courseInfo.title' &&
        m.oldValue === 'Test Course' &&
        m.newValue === 'Modified Course Title'
      )).toBe(true)
    })

    it('should detect additions', () => {
      const modifiedAcl = JSON.parse(JSON.stringify(baseAcl))
      modifiedAcl.structure.push({
        id: 'node-002',
        title: 'New Node',
        type: 'activity',
        duration: 10,
        learningGoals: ['new goal'],
        resourceRefs: [],
        content: {
          activityType: 'individual',
          instructions: 'New instructions',
          duration: 8,
          collaborationLevel: 'low'
        }
      })

      const diff = ACDiffer.diff(baseAcl, modifiedAcl)

      expect(diff.additions.length).toBeGreaterThan(0)
      expect(diff.additions.some(a => a.content.title === 'New Node')).toBe(true)
    })

    it('should detect deletions', () => {
      const modifiedAcl = JSON.parse(JSON.stringify(baseAcl))
      modifiedAcl.structure = []

      const diff = ACDiffer.diff(baseAcl, modifiedAcl)

      expect(diff.deletions.length).toBeGreaterThan(0)
      expect(diff.deletions.some(d => d.content.title === 'Test Node')).toBe(true)
    })

    it('should generate version info', () => {
      const modifiedAcl = JSON.parse(JSON.stringify(baseAcl))
      modifiedAcl.meta.version = '1.1.0'
      modifiedAcl.courseInfo.title = 'Updated Course'

      const versionInfo = ACDiffer.generateVersionInfo(
        baseAcl,
        modifiedAcl,
        'test.author@example.com',
        'Update course title and version'
      )

      expect(versionInfo.courseId).toBe('test-course')
      expect(versionInfo.version).toBe('1.1.0')
      expect(versionInfo.author).toBe('test.author@example.com')
      expect(versionInfo.commitMessage).toBe('Update course title and version')
      expect(versionInfo.changes.length).toBeGreaterThan(0)
      expect(versionInfo.fingerprint).toBeDefined()
    })

    it('should apply diff to ACL', () => {
      const modifiedAcl = JSON.parse(JSON.stringify(baseAcl))
      modifiedAcl.courseInfo.title = 'Modified Title'
      modifiedAcl.structure.push({
        id: 'node-002',
        title: 'New Node',
        type: 'activity',
        duration: 10,
        learningGoals: ['new goal'],
        resourceRefs: [],
        content: {
          activityType: 'individual',
          instructions: 'New instructions',
          duration: 8,
          collaborationLevel: 'low'
        }
      })

      const diff = ACDiffer.diff(baseAcl, modifiedAcl)
      const result = ACDiffer.applyDiff(baseAcl, diff)

      expect(result.courseInfo.title).toBe('Modified Title')
      expect(result.structure).toHaveLength(2)
      expect(result.structure.some(n => n.title === 'New Node')).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should parse, validate, and render a complete workflow', async () => {
      const jsonContent = readFileSync(
        join(__dirname, '../../examples/physics-mechanics-intro.acl'),
        'utf8'
      )

      // Parse
      const parseResult = await parser.parse(jsonContent)
      expect(parseResult.validation.isValid).toBe(true)

      // Additional validation
      const validationResult = await validator.validate(parseResult.data)
      expect(validationResult.isValid).toBe(true)

      // Render to HTML
      const htmlResult = await renderer.render(parseResult.data, {
        format: 'html',
        includeMetadata: true
      })
      expect(htmlResult.content).toContain('<!DOCTYPE html>')

      // Render to Markdown
      const mdResult = await renderer.render(parseResult.data, {
        format: 'markdown',
        includeMetadata: true
      })
      expect(mdResult.content).toContain('# ')

      // Version info generation
      const versionInfo = ACDiffer.generateVersionInfo(
        parseResult.data,
        parseResult.data,
        'test@example.com',
        'Initial version'
      )
      expect(versionInfo.id).toBeDefined()
    })

    it('should handle YAML format with full workflow', async () => {
      const yamlContent = readFileSync(
        join(__dirname, '../../examples/chemistry-basics-intro.yaml'),
        'utf8'
      )

      // Parse YAML
      const parseResult = await parser.parse(yamlContent)
      expect(parseResult.validation.isValid).toBe(true)

      // Validate parsed data
      const validationResult = await validator.validate(parseResult.data)
      expect(validationResult.isValid).toBe(true)

      // Test rendering with different formats
      const htmlResult = await renderer.render(parseResult.data, {
        format: 'html'
      })
      expect(htmlResult.content).toContain('化学基础导入课程')

      const mdResult = await renderer.render(parseResult.data, {
        format: 'markdown'
      })
      expect(mdResult.content).toContain('高中化学 - 物质的变化与性质')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{"meta": {"id": "test" invalid}'

      await expect(parser.parse(malformedJson)).rejects.toThrow()
    })

    it('should handle invalid YAML gracefully', async () => {
      const invalidYaml = `
meta:
  id: test
  version: 1.0.0
  invalid_indent: bad
    nested: value
      too_nested: value
      `

      await expect(parser.parse(invalidYaml)).rejects.toThrow()
    })

    it('should validate against schema constraints', async () => {
      const invalidData = {
        meta: {
          id: 'test',
          version: 'not-a-version', // 无效版本格式
          tags: [],
          contributors: [],
          lastModified: new Date().toISOString()
        },
        courseInfo: {
          title: '', // 空标题，应该失败
          subject: 'invalid-subject', // 无效学科
          grade: 'invalid-grade', // 无效年级
          learningObjectives: [], // 空数组，应该有警告
          targetAudience: { grade: '10', learningStyles: [] },
          estimatedDuration: -10, // 负数时长
          aiPrompts: { generation: '', assessment: '' } // 空提示
        },
        structure: [],
        resourceRefs: []
      }

      const result = await validator.validate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})