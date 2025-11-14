/**
 * ACL渲染器
 * 负责将ACL数据渲染为各种格式 (HTML, Markdown, PDF等)
 */

import MarkdownIt from 'markdown-it'
import {
  AiCourseLayout,
  RenderOptions,
  CourseNode,
  LearningObjective,
  ResourceReference
} from './types'

/**
 * ACL渲染器类
 */
export class ACLRenderer {
  private md: MarkdownIt

  constructor() {
    // 初始化Markdown渲染器
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true
    })
  }

  /**
   * 渲染ACL数据
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns 渲染结果
   */
  async render(acl: AiCourseLayout, options: RenderOptions): Promise<{
    content: string
    metadata?: any
  }> {
    switch (options.format) {
      case 'html':
        return this.renderToHTML(acl, options)
      case 'markdown':
        return this.renderToMarkdown(acl, options)
      case 'json':
        return this.renderToJSON(acl, options)
      default:
        throw new Error(`不支持的渲染格式: ${options.format}`)
    }
  }

  /**
   * 渲染为HTML
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns HTML内容
   */
  private async renderToHTML(acl: AiCourseLayout, options: RenderOptions): Promise<{
    content: string
    metadata?: any
  }> {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${acl.courseInfo.title} - 课程详情</title>
    <style>
        ${this.generateCSS(options.theme)}
    </style>
</head>
<body>
    <div class="acl-container">
        ${this.renderHeader(acl, options)}
        ${this.renderOverview(acl, options)}
        ${this.renderStructure(acl, options)}
        ${options.includeMetadata ? this.renderMetadata(acl, options) : ''}
        ${options.includeAnalytics ? this.renderAnalytics(acl, options) : ''}
    </div>
</body>
</html>`

    return {
      content: html,
      metadata: {
        title: acl.courseInfo.title,
        subject: acl.courseInfo.subject,
        grade: acl.courseInfo.grade,
        duration: acl.courseInfo.estimatedDuration,
        nodes: this.countNodes(acl.structure)
      }
    }
  }

  /**
   * 渲染为Markdown
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns Markdown内容
   */
  private async renderToMarkdown(acl: AiCourseLayout, options: RenderOptions): Promise<{
    content: string
    metadata?: any
  }> {
    const markdown = `# ${acl.courseInfo.title}

${acl.courseInfo.description ? `> ${acl.courseInfo.description}\n\n` : ''}

## 课程信息

| 属性 | 值 |
|------|-----|
| 学科 | ${this.getSubjectName(acl.courseInfo.subject)} |
| 年级 | ${acl.courseInfo.grade} |
| 预计时长 | ${acl.courseInfo.estimatedDuration} 分钟 |
| 版本 | ${acl.meta.version} |
| 创建者 | ${acl.meta.contributors.join(', ')} |

## 学习目标

${acl.courseInfo.learningObjectives.map((obj, index) =>
  `${index + 1}. ${obj.description}`
).join('\n')}

## 课程结构

${this.renderStructureMarkdown(acl.structure, 2)}

${this.renderResourcesMarkdown(acl.resourceRefs)}

${options.includeMetadata ? this.renderMetadataMarkdown(acl) : ''}

---

*由 AiCourseLayout (ACL) 生成 | 版本: ${acl.meta.version}*`

    return {
      content: markdown,
      metadata: {
        title: acl.courseInfo.title,
        wordCount: markdown.length,
        sections: this.countSections(markdown)
      }
    }
  }

  /**
   * 渲染为JSON
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns JSON内容
   */
  private async renderToJSON(acl: AiCourseLayout, options: RenderOptions): Promise<{
    content: string
    metadata?: any
  }> {
    const data = {
      ...acl,
      renderedAt: new Date().toISOString(),
      format: options.format
    }

    // 根据选项过滤数据
    if (!options.includeMetadata) {
      delete data.analyticsProfile
    }

    if (!options.includeAnalytics) {
      delete data.analyticsProfile
    }

    return {
      content: JSON.stringify(data, null, 2),
      metadata: {
        size: JSON.stringify(data).length,
        keys: Object.keys(data)
      }
    }
  }

  /**
   * 渲染页面头部
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns HTML字符串
   */
  private renderHeader(acl: AiCourseLayout, _options: RenderOptions): string {
    return `
<header class="course-header">
    <div class="header-content">
        <h1 class="course-title">${acl.courseInfo.title}</h1>
        ${acl.courseInfo.description ? `<p class="course-description">${acl.courseInfo.description}</p>` : ''}
        <div class="course-meta">
            <span class="meta-item">
                <strong>学科:</strong> ${this.getSubjectName(acl.courseInfo.subject)}
            </span>
            <span class="meta-item">
                <strong>年级:</strong> ${acl.courseInfo.grade}
            </span>
            <span class="meta-item">
                <strong>时长:</strong> ${acl.courseInfo.estimatedDuration} 分钟
            </span>
            <span class="meta-item">
                <strong>版本:</strong> ${acl.meta.version}
            </span>
        </div>
        ${acl.meta.tags.length > 0 ? `
        <div class="course-tags">
            ${acl.meta.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
    </div>
</header>`
  }

  /**
   * 渲染课程概览
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns HTML字符串
   */
  private renderOverview(acl: AiCourseLayout, _options: RenderOptions): string {
    return `
<section class="course-overview">
    <h2>课程概览</h2>
    ${this.renderLearningObjectives(acl.courseInfo.learningObjectives)}
    ${this.renderTargetAudience(acl.courseInfo.targetAudience)}
    ${acl.courseInfo.prerequisites && acl.courseInfo.prerequisites.length > 0 ?
      this.renderPrerequisites(acl.courseInfo.prerequisites) : ''}
</section>`
  }

  /**
   * 渲染课程结构
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns HTML字符串
   */
  private renderStructure(acl: AiCourseLayout, _options: RenderOptions): string {
    return `
<section class="course-structure">
    <h2>课程结构</h2>
    <div class="structure-content">
        ${this.renderNodes(acl.structure, 1)}
    </div>
</section>`
  }

  /**
   * 递归渲染节点
   * @param nodes 节点数组
   * @param level 层级
   * @returns HTML字符串
   */
  private renderNodes(nodes: CourseNode[], level: number): string {
    return nodes.map(node => this.renderNode(node, level)).join('\n')
  }

  /**
   * 渲染单个节点
   * @param node 节点
   * @param level 层级
   * @returns HTML字符串
   */
  private renderNode(node: CourseNode, level: number): string {
    const nodeClass = `node node-${node.type} node-level-${level}`
    const iconClass = this.getNodeIcon(node.type)

    return `
<div class="${nodeClass}" id="node-${node.id}">
    <div class="node-header">
        <span class="node-icon">${iconClass}</span>
        <h3 class="node-title">${node.title}</h3>
        <span class="node-duration">${node.duration} 分钟</span>
    </div>

    ${node.learningGoals.length > 0 ? `
    <div class="node-goals">
        <h4>学习目标</h4>
        <ul>
            ${node.learningGoals.map(goal => `<li>${goal}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${this.renderNodeContent(node)}

    ${node.type === 'chapter' && node.children ? `
    <div class="node-children">
        ${this.renderNodes(node.children, level + 1)}
    </div>
    ` : ''}

    ${node.assessment ? this.renderAssessment(node.assessment) : ''}
</div>`
  }

  /**
   * 渲染节点内容
   * @param node 节点
   * @returns HTML字符串
   */
  private renderNodeContent(node: CourseNode): string {
    if ('content' in node && !node.content) return ''

    switch (node.type) {
      case 'knowledge':
        return this.renderKnowledgeContent((node as any).content)
      case 'experience':
        return this.renderExperienceContent((node as any).content)
      case 'experiment':
        return this.renderExperimentContent((node as any).content)
      case 'assignment':
        return this.renderAssignmentContent((node as any).content)
      case 'introduction':
        return this.renderIntroductionContent((node as any).content)
      case 'chapter':
        return this.renderChapterContent(node)
      default:
        return ''
    }
  }

  /**
   * 渲染知识内容
   * @param content 知识内容
   * @returns HTML字符串
   */
  private renderKnowledgeContent(content: any): string {
    let contentHtml = ''

    if (typeof content.content === 'string') {
      contentHtml = this.md.render(content.content)
    } else if (content.content && content.content.url) {
      contentHtml = `
      <div class="media-content">
        ${content.content.type === 'video' ?
          `<video controls><source src="${content.content.url}" type="${content.content.format}"></video>` :
          content.content.type === 'audio' ?
          `<audio controls><source src="${content.content.url}" type="${content.content.format}"></audio>` :
          content.content.type === 'image' ?
          `<img src="${content.content.url}" alt="${content.content.title || ''}" />` :
          `<a href="${content.content.url}" target="_blank">${content.content.title || '查看资源'}</a>`
        }
      </div>`
    }

    return `
<div class="node-content knowledge-content">
    <div class="content-body">
        ${contentHtml}
    </div>
    ${content.examples && content.examples.length > 0 ? `
    <div class="content-examples">
        <h5>示例</h5>
        ${content.examples.map((example: any) => `
        <div class="example example-${example.difficulty}">
            <h6>${example.title}</h6>
            <div class="example-content">${this.md.render(example.content)}</div>
            ${example.explanation ? `<p class="example-explanation">${example.explanation}</p>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}
    ${content.checkpoints && content.checkpoints.length > 0 ? `
    <div class="content-checkpoints">
        <h5>检查点</h5>
        ${content.checkpoints.map((checkpoint: any) => `
        <div class="checkpoint">
            <p><strong>${checkpoint.question}</strong></p>
            ${checkpoint.options ? `
            <div class="checkpoint-options">
                ${checkpoint.options.map((option: string, index: number) => `
                <label class="checkpoint-option">
                    <input type="radio" name="${checkpoint.id}" value="${index}">
                    ${option}
                </label>
                `).join('')}
            </div>
            ` : ''}
            ${checkpoint.explanation ? `<p class="checkpoint-explanation">${checkpoint.explanation}</p>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}
</div>`
  }

  /**
   * 渲染体验内容
   * @param content 体验内容
   * @returns HTML字符串
   */
  private renderExperienceContent(content: any): string {
    return `
<div class="node-content activity-content">
    <div class="activity-instructions">
        <h5>活动说明</h5>
        <div>${this.md.render(content.instructions)}</div>
    </div>
    <div class="activity-details">
        <div class="activity-type">
            <strong>活动类型:</strong> ${this.getActivityTypeName(content.activityType)}
        </div>
        <div class="activity-duration">
            <strong>活动时长:</strong> ${content.duration} 分钟
        </div>
        <div class="collaboration-level">
            <strong>协作程度:</strong> ${this.getCollaborationLevelName(content.collaborationLevel)}
        </div>
        ${content.materials && content.materials.length > 0 ? `
        <div class="activity-materials">
            <strong>所需材料:</strong>
            <ul>
                ${content.materials.map((material: string) => `<li>${material}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
</div>`
  }

  /**
   * 渲染实验内容
   * @param content 实验内容
   * @returns HTML字符串
   */
  private renderExperimentContent(content: any): string {
    return `
<div class="node-content experiment-content">
    <div class="experiment-info">
        <div class="experiment-type">
            <strong>实验类型:</strong> ${this.getExperimentTypeName(content.experimentType)}
        </div>
        <div class="safety-level">
            <strong>安全等级:</strong>
            <span class="safety-${content.safetyLevel}">${this.getSafetyLevelName(content.safetyLevel)}</span>
        </div>
    </div>
    ${content.notebook ? `
    <div class="experiment-notebook">
        <h5>实验笔记</h5>
        <pre><code>${content.notebook}</code></pre>
    </div>
    ` : ''}
    ${content.environment ? `
    <div class="experiment-environment">
        <h5>实验环境</h5>
        <div class="environment-details">
            <div><strong>类型:</strong> ${content.environment.type}</div>
            ${content.environment.image ? `<div><strong>镜像:</strong> ${content.environment.image}</div>` : ''}
            ${content.environment.resources ? this.renderResourceAllocation(content.environment.resources) : ''}
        </div>
    </div>
    ` : ''}
    ${content.aiAssistant ? `
    <div class="ai-assistant">
        <h5>AI实验助手</h5>
        <div class="assistant-details">
            <div><strong>交互风格:</strong> ${content.aiAssistant.interactionStyle}</div>
            <div><strong>适应水平:</strong> ${content.aiAssistant.adaptationLevel}</div>
            <div><strong>能力:</strong> ${content.aiAssistant.capabilities.join(', ')}</div>
        </div>
    </div>
    ` : ''}
</div>`
  }

  
  /**
   * 渲染作业内容
   * @param content 作业内容
   * @returns HTML字符串
   */
  private renderAssignmentContent(content: any): string {
    return `
<div class="node-content assignment-content">
    <div class="assignment-type">
        <strong>作业类型:</strong> ${this.getAssignmentTypeName(content.assignmentType)}
    </div>
    <div class="submission-format">
        <strong>提交格式:</strong> ${content.submissionFormat.join(', ')}
    </div>
    ${content.questions && content.questions.length > 0 ? `
    <div class="assignment-questions">
        <h5>作业题目</h5>
        ${content.questions.map((question: any, index: number) => `
        <div class="question">
            <h6>题目 ${index + 1}</h6>
            <div class="question-content">${this.md.render(question.question)}</div>
            ${question.options ? `
            <div class="question-options">
                ${question.options.map((option: string, optIndex: number) => `
                <label class="question-option">
                    <input type="radio" name="q${question.id}" value="${optIndex}">
                    ${option}
                </label>
                `).join('')}
            </div>
            ` : ''}
            <div class="question-points">分值: ${question.points}</div>
        </div>
        `).join('')}
    </div>
    ` : ''}
    ${content.rubric ? this.renderRubric(content.rubric) : ''}
</div>`
  }

  
  /**
   * 渲染导入内容
   * @param content 导入内容
   * @returns HTML字符串
   */
  private renderIntroductionContent(content: any): string {
    return `
<div class="node-content introduction-content">
    <div class="hook-content">
        <h5>课程导入</h5>
        ${this.renderHookContent(content)}
    </div>
    <div class="objectives">
        <h5>学习目标</h5>
        <ul>
            ${content.objectives.map((objective: string) => `<li>${objective}</li>`).join('')}
        </ul>
    </div>
    ${content.prerequisites && content.prerequisites.length > 0 ? `
    <div class="prerequisites">
        <h5>前置知识</h5>
        <ul>
            ${content.prerequisites.map((prereq: string) => `<li>${prereq}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
</div>`
  }

  /**
   * 渲染钩子内容
   * @param content 钩子内容
   * @returns HTML字符串
   */
  private renderHookContent(content: any): string {
    switch (content.hookType) {
      case 'question':
        return `<div class="hook-question"><p><strong>思考题:</strong> ${content.hookContent}</p></div>`
      case 'story':
        return `<div class="hook-story"><blockquote>${content.hookContent}</blockquote></div>`
      case 'video':
        return `<div class="hook-video"><video controls><source src="${content.hookContent}" type="video/mp4"></video></div>`
      case 'image':
        return `<div class="hook-image"><img src="${content.hookContent}" alt="课程导入图片" /></div>`
      default:
        return `<div class="hook-content">${content.hookContent}</div>`
    }
  }

  /**
   * 渲染学习目标
   * @param objectives 学习目标列表
   * @returns HTML字符串
   */
  private renderLearningObjectives(objectives: LearningObjective[]): string {
    return `
<div class="learning-objectives">
    <h3>学习目标</h3>
    <div class="objectives-list">
        ${objectives.map((obj, index) => `
        <div class="objective">
            <div class="objective-header">
                <span class="objective-number">${index + 1}</span>
                <h4 class="objective-description">${obj.description}</h4>
                <span class="cognitive-level level-${obj.cognitiveLevel}">${this.getCognitiveLevelName(obj.cognitiveLevel)}</span>
            </div>
            ${obj.assessmentCriteria.length > 0 ? `
            <div class="assessment-criteria">
                <h5>评估标准</h5>
                <ul>
                    ${obj.assessmentCriteria.map(criteria => `<li>${criteria}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        `).join('')}
    </div>
</div>`
  }

  /**
   * 渲染目标受众
   * @param audience 目标受众
   * @returns HTML字符串
   */
  private renderTargetAudience(audience: any): string {
    return `
<div class="target-audience">
    <h3>目标受众</h3>
    <div class="audience-details">
        <div class="audience-grade"><strong>年级:</strong> ${audience.grade}</div>
        ${audience.classSize ? `<div class="audience-class-size"><strong>班级规模:</strong> ${audience.classSize}</div>` : ''}
        ${audience.priorKnowledge ? `<div class="prior-knowledge"><strong>先备知识:</strong> ${audience.priorKnowledge}</div>` : ''}
        <div class="learning-styles">
            <strong>学习风格:</strong>
            ${audience.learningStyles.map((style: string) =>
              `<span class="learning-style">${this.getLearningStyleName(style)}</span>`
            ).join(' ')}
        </div>
    </div>
</div>`
  }

  /**
   * 渲染前置要求
   * @param prerequisites 前置要求列表
   * @returns HTML字符串
   */
  private renderPrerequisites(prerequisites: string[]): string {
    return `
<div class="prerequisites">
    <h3>前置要求</h3>
    <ul>
        ${prerequisites.map(prereq => `<li>${prereq}</li>`).join('')}
    </ul>
</div>`
  }

  /**
   * 渲染评估配置
   * @param assessment 评估配置
   * @returns HTML字符串
   */
  private renderAssessment(assessment: any): string {
    return `
<div class="node-assessment">
    <h4>学习评估</h4>
    <div class="assessment-info">
        <div class="assessment-type">
            <strong>类型:</strong> ${this.getAssessmentTypeName(assessment.type)}
        </div>
        <div class="assessment-indicators">
            <strong>评估指标:</strong>
            <ul>
                ${assessment.indicators.map((indicator: string) => `<li>${indicator}</li>`).join('')}
            </ul>
        </div>
        ${assessment.aiAnalysis ? `
        <div class="ai-analysis">
            <strong>AI分析:</strong> ${assessment.aiAnalysis}
        </div>
        ` : ''}
    </div>
</div>`
  }

  /**
   * 渲染评分标准
   * @param rubric 评分标准
   * @returns HTML字符串
   */
  private renderRubric(rubric: any): string {
    return `
<div class="rubric">
    <h5>评分标准</h5>
    <table class="rubric-table">
        <thead>
            <tr>
                <th>评估标准</th>
                ${rubric.levels.map((level: any) => `<th>${level.name} (${level.points}分)</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${rubric.criteria.map((criterion: any) => `
            <tr>
                <td class="criterion-name">
                    <div>${criterion.description}</div>
                    <small class="criterion-weight">权重: ${(criterion.weight * 100).toFixed(0)}%</small>
                </td>
                ${criterion.levels.map((level: any) => `
                <td class="criterion-level">${level.description}</td>
                `).join('')}
            </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="rubric-summary">
        <strong>总分:</strong> ${rubric.maxScore} 分
    </div>
</div>`
  }

  /**
   * 渲染资源分配
   * @param resources 资源分配
   * @returns HTML字符串
   */
  private renderResourceAllocation(resources: any): string {
    return `
<div class="resource-allocation">
    <div><strong>CPU:</strong> ${resources.cpu}</div>
    <div><strong>内存:</strong> ${resources.memory}</div>
    ${resources.storage ? `<div><strong>存储:</strong> ${resources.storage}</div>` : ''}
    ${resources.gpu !== undefined ? `<div><strong>GPU:</strong> ${resources.gpu ? '是' : '否'}</div>` : ''}
</div>`
  }

  /**
   * 渲染元数据
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns HTML字符串
   */
  private renderMetadata(acl: AiCourseLayout, _options: RenderOptions): string {
    return `
<section class="metadata">
    <h2>元数据</h2>
    <div class="metadata-content">
        <div class="meta-item">
            <strong>课程ID:</strong> ${acl.meta.id}
        </div>
        <div class="meta-item">
            <strong>版本:</strong> ${acl.meta.version}
        </div>
        <div class="meta-item">
            <strong>最后修改:</strong> ${new Date(acl.meta.lastModified).toLocaleString()}
        </div>
        ${acl.meta.createdAt ? `
        <div class="meta-item">
            <strong>创建时间:</strong> ${new Date(acl.meta.createdAt).toLocaleString()}
        </div>
        ` : ''}
        ${acl.meta.license ? `
        <div class="meta-item">
            <strong>许可证:</strong> ${acl.meta.license}
        </div>
        ` : ''}
        <div class="meta-item">
            <strong>贡献者:</strong> ${acl.meta.contributors.join(', ')}
        </div>
        <div class="meta-item">
            <strong>标签:</strong> ${acl.meta.tags.join(', ') || '无'}
        </div>
    </div>
</section>`
  }

  /**
   * 渲染分析配置
   * @param acl ACL数据
   * @param options 渲染选项
   * @returns HTML字符串
   */
  private renderAnalytics(acl: AiCourseLayout, _options: RenderOptions): string {
    if (!acl.analyticsProfile) return ''

    return `
<section class="analytics-profile">
    <h2>分析配置</h2>
    <div class="analytics-content">
        <div class="learning-metrics">
            <h3>学习指标</h3>
            <ul>
                ${acl.analyticsProfile.learningMetrics.map((metric: string) => `<li>${metric}</li>`).join('')}
            </ul>
        </div>
        <div class="ai-insights">
            <h3>AI洞察</h3>
            <div class="insight-item">
                <strong>学习路径优化:</strong> ${acl.analyticsProfile.aiInsights.learningPathOptimization ? '启用' : '禁用'}
            </div>
            <div class="insight-item">
                <strong>难度调整:</strong> ${acl.analyticsProfile.aiInsights.difficultyAdjustment ? '启用' : '禁用'}
            </div>
            <div class="insight-item">
                <strong>推荐引擎:</strong> ${acl.analyticsProfile.aiInsights.recommendationEngine ? '启用' : '禁用'}
            </div>
        </div>
    </div>
</section>`
  }

  /**
   * 渲染结构为Markdown
   * @param nodes 节点数组
   * @param level 缩进级别
   * @returns Markdown字符串
   */
  private renderStructureMarkdown(nodes: CourseNode[], level: number): string {
    return nodes.map(node => {
      const indent = '  '.repeat(level)
      const icon = this.getNodeIconMarkdown(node.type)
      return `
${indent}${icon} **${node.title}** (${node.duration}分钟)
${indent}  *类型: ${this.getNodeTypeName(node.type)}*
${node.learningGoals.length > 0 ?
  `${indent}  *学习目标: ${node.learningGoals.join(', ')}*\n` : ''
}
${node.type === 'chapter' && 'children' in node && (node as any).children ?
  this.renderStructureMarkdown((node as any).children, level + 1) : ''
}`
    }).join('')
  }

  /**
   * 渲染资源为Markdown
   * @param resources 资源列表
   * @returns Markdown字符串
   */
  private renderResourcesMarkdown(resources: ResourceReference[]): string {
    if (resources.length === 0) return ''

    return `
## 资源列表

${resources.map(resource => `
### ${resource.title}
- **类型:** ${this.getResourceTypeName(resource.type)}
- **链接:** [查看资源](${resource.url})
${resource.description ? `- **描述:** ${resource.description}` : ''}
`).join('')}
`
  }

  /**
   * 渲染元数据为Markdown
   * @param acl ACL数据
   * @returns Markdown字符串
   */
  private renderMetadataMarkdown(acl: AiCourseLayout): string {
    return `
## 元数据

- **课程ID:** ${acl.meta.id}
- **版本:** ${acl.meta.version}
- **最后修改:** ${new Date(acl.meta.lastModified).toLocaleString()}
${acl.meta.createdAt ? `- **创建时间:** ${new Date(acl.meta.createdAt).toLocaleString()}` : ''}
${acl.meta.license ? `- **许可证:** ${acl.meta.license}` : ''}
- **贡献者:** ${acl.meta.contributors.join(', ')}
- **标签:** ${acl.meta.tags.join(', ') || '无'}
`
  }

  /**
   * 生成CSS样式
   * @param theme 主题名称
   * @returns CSS字符串
   */
  private generateCSS(theme?: string): string {
    const baseTheme = `
/* ACL Renderer CSS */
.acl-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.course-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px;
    border-radius: 12px;
    margin-bottom: 30px;
}

.course-title {
    font-size: 2.5em;
    margin: 0 0 10px 0;
    font-weight: 700;
}

.course-description {
    font-size: 1.2em;
    margin: 0 0 20px 0;
    opacity: 0.9;
}

.course-meta {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.meta-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9em;
}

.course-tags {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.tag {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.8em;
}

section {
    background: white;
    border-radius: 8px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 10px;
    margin-top: 0;
}

.node {
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    margin-bottom: 20px;
    overflow: hidden;
}

.node-header {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e8ed;
}

.node-icon {
    font-size: 1.2em;
    margin-right: 10px;
}

.node-title {
    flex: 1;
    margin: 0;
    color: #2c3e50;
}

.node-duration {
    background: #e9ecef;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #6c757d;
}

.node-content {
    padding: 20px;
}

.node-knowledge .content-body {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin-bottom: 20px;
}

.example, .checkpoint {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 15px;
    border-left: 4px solid #28a745;
}

.example-hard {
    border-left-color: #dc3545;
}

.example-medium {
    border-left-color: #ffc107;
}

.objective {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin-bottom: 15px;
    border-left: 4px solid #007bff;
}

.objective-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
}

.objective-number {
    background: #007bff;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.cognitive-level {
    background: #6f42c1;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.8em;
}

.rubric-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.rubric-table th,
.rubric-table td {
    border: 1px solid #dee2e6;
    padding: 12px;
    text-align: left;
}

.rubric-table th {
    background: #f8f9fa;
    font-weight: 600;
}

.criterion-name {
    font-weight: 600;
}

.criterion-weight {
    color: #6c757d;
    font-weight: normal;
}

.safety-safe {
    color: #28a745;
    font-weight: bold;
}

.safety-moderate {
    color: #ffc107;
    font-weight: bold;
}

.safety-high {
    color: #dc3545;
    font-weight: bold;
}

@media (max-width: 768px) {
    .acl-container {
        padding: 10px;
    }

    .course-header {
        padding: 20px;
    }

    .course-title {
        font-size: 1.8em;
    }

    .course-meta {
        flex-direction: column;
        gap: 10px;
    }

    .node-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    section {
        padding: 20px;
    }
}
`

    if (theme === 'dark') {
      return baseTheme + `
/* Dark Theme */
[data-theme="dark"] .acl-container {
    background: #1a1a1a;
    color: #e1e8ed;
}

[data-theme="dark"] section {
    background: #2c2c2c;
    color: #e1e8ed;
}

[data-theme="dark"] .node-header {
    background: #3a3a3a;
}

[data-theme="dark"] .node-title {
    color: #e1e8ed;
}

[data-theme="dark"] h2 {
    color: #e1e8ed;
}

[data-theme="dark"] .node-knowledge .content-body,
[data-theme="dark"] .example,
[data-theme="dark"] .checkpoint,
[data-theme="dark"] .objective {
    background: #3a3a3a;
}
`
    }

    return baseTheme
  }

  // 辅助方法：获取各种名称映射
  private getSubjectName(subject: string): string {
    const subjects: Record<string, string> = {
      math: '数学',
      physics: '物理',
      chemistry: '化学',
      biology: '生物',
      language: '语文',
      history: '历史',
      geography: '地理',
      english: '英语',
      art: '美术',
      music: '音乐',
      pe: '体育',
      it: '信息技术'
    }
    return subjects[subject] || subject
  }

  private getNodeTypeName(type: string): string {
    const types: Record<string, string> = {
      introduction: '导入',
      chapter: '章节',
      knowledge: '知识',
      activity: '活动',
      experiment: '实验',
      interaction: '交互',
      assignment: '作业',
      assessment: '评估'
    }
    return types[type] || type
  }

  private getNodeIcon(type: string): string {
    const icons: Record<string, string> = {
      introduction: '🎯',
      chapter: '📚',
      knowledge: '📖',
      activity: '🎪',
      experiment: '🔬',
      interaction: '🎮',
      assignment: '📝',
      assessment: '📊'
    }
    return icons[type] || '📄'
  }

  private getNodeIconMarkdown(type: string): string {
    const icons: Record<string, string> = {
      introduction: '🎯',
      chapter: '📚',
      knowledge: '📖',
      activity: '🎪',
      experiment: '🔬',
      interaction: '🎮',
      assignment: '📝',
      assessment: '📊'
    }
    return icons[type] || '📄'
  }

  private getCognitiveLevelName(level: string): string {
    const levels: Record<string, string> = {
      remember: '记忆',
      understand: '理解',
      apply: '应用',
      analyze: '分析',
      evaluate: '评价',
      create: '创造'
    }
    return levels[level] || level
  }

  private getActivityTypeName(type: string): string {
    const types: Record<string, string> = {
      individual: '个人',
      group: '小组',
      class: '班级'
    }
    return types[type] || type
  }

  private getCollaborationLevelName(level: string): string {
    const levels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高'
    }
    return levels[level] || level
  }

  private getExperimentTypeName(type: string): string {
    const types: Record<string, string> = {
      jupyter: 'Jupyter',
      virtual: '虚拟',
      physical: '物理',
      simulation: '模拟'
    }
    return types[type] || type
  }

  private getSafetyLevelName(level: string): string {
    const levels: Record<string, string> = {
      safe: '安全',
      moderate: '中等',
      high: '高'
    }
    return levels[level] || level
  }

  
  private getAssignmentTypeName(type: string): string {
    const types: Record<string, string> = {
      quiz: '测验',
      essay: '作文',
      project: '项目',
      presentation: '演示'
    }
    return types[type] || type
  }

  private getAssessmentTypeName(type: string): string {
    const types: Record<string, string> = {
      quiz: '测验',
      test: '考试',
      portfolio: '作品集',
      performance: '表现'
    }
    return types[type] || type
  }

  private getLearningStyleName(style: string): string {
    const styles: Record<string, string> = {
      visual: '视觉型',
      auditory: '听觉型',
      kinesthetic: '动觉型',
      reading: '阅读型'
    }
    return styles[style] || style
  }

  private getResourceTypeName(type: string): string {
    const types: Record<string, string> = {
      video: '视频',
      image: '图片',
      document: '文档',
      audio: '音频',
      simulation: '模拟',
      notebook: '笔记',
      tool: '工具',
      external: '外部'
    }
    return types[type] || type
  }

  // 辅助方法：统计信息
  private countNodes(nodes: CourseNode[]): number {
    return nodes.reduce((count, node) => {
      let nodeCount = 1
      if (node.type === 'chapter' && node.children) {
        nodeCount += this.countNodes(node.children)
      }
      return count + nodeCount
    }, 0)
  }

  private countSections(markdown: string): number {
    return (markdown.match(/^#+\s/gm) || []).length
  }

  /**
   * 渲染章节内容
   * @param node 章节节点
   * @returns HTML字符串
   */
  private renderChapterContent(node: any): string {
    return `
      <div class="chapter-content">
        <h3>${node.title}</h3>
        ${node.children ? this.renderNodes(node.children, 1) : ''}
      </div>
    `
  }
}