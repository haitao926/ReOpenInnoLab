<template>
  <div class="ai-comment-panel">
    <!-- 面板头部 -->
    <header class="panel-header">
      <div class="header-info">
        <div class="student-info">
          <el-avatar :size="40" :src="assignment.student.avatar">
            {{ assignment.student.name.charAt(0) }}
          </el-avatar>
          <div class="student-details">
            <h3 class="student-name">{{ assignment.student.name }}</h3>
            <p class="assignment-title">{{ assignment.title }}</p>
          </div>
        </div>
        <div class="score-display">
          <div class="score-circle" :class="getScoreClass(aiComment.score)">
            {{ aiComment.score }}
          </div>
          <span class="score-label">AI评分</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="regenerateComment" :loading="isRegenerating">
          <el-icon><Refresh /></el-icon>
          重新分析
        </el-button>
        <el-button @click="exportComment">
          <el-icon><Download /></el-icon>
          导出评论
        </el-button>
      </div>
    </header>

    <!-- AI 评论内容 -->
    <main class="panel-content">
      <!-- 总体评价 -->
      <section class="comment-section">
        <h4 class="section-title">
          <el-icon><ChatDotRound /></el-icon>
          总体评价
        </h4>
        <div class="overall-comment">
          <div class="comment-text">{{ aiComment.overallComment }}</div>
          <div class="comment-metrics">
            <div class="metric-item">
              <span class="metric-label">完成度</span>
              <el-progress
                :percentage="aiComment.completionRate"
                :stroke-width="8"
                :color="getProgressColor(aiComment.completionRate)"
              />
            </div>
            <div class="metric-item">
              <span class="metric-label">准确度</span>
              <el-progress
                :percentage="aiComment.accuracyRate"
                :stroke-width="8"
                :color="getProgressColor(aiComment.accuracyRate)"
              />
            </div>
            <div class="metric-item">
              <span class="metric-label">创新度</span>
              <el-progress
                :percentage="aiComment.creativityRate"
                :stroke-width="8"
                :color="getProgressColor(aiComment.creativityRate)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 优点分析 -->
      <section class="comment-section">
        <h4 class="section-title">
          <el-icon><Select /></el-icon>
          亮点分析
        </h4>
        <div class="strengths-list">
          <div
            v-for="strength in aiComment.strengths"
            :key="strength.id"
            class="strength-item"
          >
            <div class="strength-icon">
              <el-icon><component :is="strength.icon" /></el-icon>
            </div>
            <div class="strength-content">
              <h5 class="strength-title">{{ strength.title }}</h5>
              <p class="strength-description">{{ strength.description }}</p>
              <div v-if="strength.evidence" class="strength-evidence">
                <span class="evidence-label">证据：</span>
                <span class="evidence-text">{{ strength.evidence }}</span>
              </div>
            </div>
            <div class="strength-confidence">
              <span class="confidence-label">置信度</span>
              <span class="confidence-value">{{ strength.confidence }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 改进建议 -->
      <section class="comment-section">
        <h4 class="section-title">
          <el-icon><Tools /></el-icon>
          改进建议
        </h4>
        <div class="suggestions-list">
          <div
            v-for="suggestion in aiComment.suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            :class="`suggestion-item--${suggestion.priority}`"
          >
            <div class="suggestion-header">
              <div class="suggestion-priority">
                <el-tag :type="getPriorityType(suggestion.priority)" size="small">
                  {{ getPriorityText(suggestion.priority) }}
                </el-tag>
              </div>
              <h5 class="suggestion-title">{{ suggestion.title }}</h5>
            </div>
            <p class="suggestion-description">{{ suggestion.description }}</p>
            <div v-if="suggestion.actionSteps" class="action-steps">
              <h6 class="steps-title">具体步骤：</h6>
              <ol class="steps-list">
                <li v-for="step in suggestion.actionSteps" :key="step">{{ step }}</li>
              </ol>
            </div>
            <div v-if="suggestion.resources" class="suggestion-resources">
              <h6 class="resources-title">推荐资源：</h6>
              <div class="resources-list">
                <div
                  v-for="resource in suggestion.resources"
                  :key="resource.id"
                  class="resource-item"
                  @click="openResource(resource)"
                >
                  <el-icon><component :is="getResourceIcon(resource.type)" /></el-icon>
                  <span>{{ resource.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 评分细则 -->
      <section class="comment-section">
        <h4 class="section-title">
          <el-icon><Grid /></el-icon>
          评分细则
        </h4>
        <div class="scoring-details">
          <div class="scoring-table">
            <div class="scoring-header">
              <span class="criteria-column">评分项目</span>
              <span class="score-column">得分</span>
              <span class="weight-column">权重</span>
              <span class="comment-column">评价</span>
            </div>
            <div
              v-for="criteria in aiComment.scoringCriteria"
              :key="criteria.id"
              class="scoring-row"
            >
              <span class="criteria-column">{{ criteria.name }}</span>
              <span class="score-column">{{ criteria.score }}/{{ criteria.maxScore }}</span>
              <span class="weight-column">{{ criteria.weight }}%</span>
              <span class="comment-column">{{ criteria.comment }}</span>
            </div>
            <div class="scoring-footer">
              <span class="criteria-column">总分</span>
              <span class="score-column total-score">{{ calculateTotalScore() }}/{{ calculateMaxScore() }}</span>
              <span class="weight-column">100%</span>
              <span class="comment-column">AI 综合评估</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 学习路径推荐 -->
      <section class="comment-section">
        <h4 class="section-title">
          <el-icon><Guide /></el-icon>
          个性化学习路径
        </h4>
        <div class="learning-path">
          <div class="path-timeline">
            <div
              v-for="(step, index) in aiComment.learningPath"
              :key="step.id"
              class="path-step"
            >
              <div class="step-marker">
                <div class="step-number">{{ index + 1 }}</div>
                <div v-if="index < aiComment.learningPath.length - 1" class="step-connector"></div>
              </div>
              <div class="step-content">
                <h5 class="step-title">{{ step.title }}</h5>
                <p class="step-description">{{ step.description }}</p>
                <div v-if="step.duration" class="step-duration">
                  <el-icon><Clock /></el-icon>
                  <span>{{ step.duration }}</span>
                </div>
                <div v-if="step.resources" class="step-resources">
                  <el-tag
                    v-for="resource in step.resources"
                    :key="resource"
                    size="small"
                    type="info"
                  >
                    {{ resource }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部操作栏 -->
    <footer class="panel-footer">
      <div class="footer-actions">
        <el-button @click="applyComment" type="primary">
          <el-icon><Check /></el-icon>
          应用此评论
        </el-button>
        <el-button @click="editComment">
          <el-icon><Edit /></el-icon>
          编辑评论
        </el-button>
        <el-button @click="saveAsTemplate">
          <el-icon><DocumentAdd /></el-icon>
          保存为模板
        </el-button>
        <el-button @click="requestReview">
          <el-icon><UserFilled /></el-icon>
          请求人工审核
        </el-button>
      </div>
      <div class="panel-info">
        <span class="generated-time">
          生成时间：{{ formatTime(aiComment.generatedAt) }}
        </span>
        <span class="ai-version">AI版本：{{ aiComment.aiVersion }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  ChatDotRound,
  Select,
  Tools,
  Grid,
  Guide,
  Clock,
  Check,
  Edit,
  DocumentAdd,
  UserFilled
} from '@element-plus/icons-vue'

interface Student {
  id: string
  name: string
  avatar?: string
}

interface Assignment {
  id: string
  title: string
  student: Student
  content: string
  submittedAt: Date
}

interface AIComment {
  id: string
  score: number
  overallComment: string
  completionRate: number
  accuracyRate: number
  creativityRate: number
  strengths: Array<{
    id: string
    title: string
    description: string
    icon: string
    evidence?: string
    confidence: number
  }>
  suggestions: Array<{
    id: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    actionSteps?: string[]
    resources?: Array<{
      id: string
      title: string
      type: string
      url: string
    }>
  }>
  scoringCriteria: Array<{
    id: string
    name: string
    score: number
    maxScore: number
    weight: number
    comment: string
  }>
  learningPath: Array<{
    id: string
    title: string
    description: string
    duration?: string
    resources?: string[]
  }>
  generatedAt: Date
  aiVersion: string
}

const props = defineProps<{
  assignment: Assignment
}>()

const emit = defineEmits<{
  'comment-applied': [comment: AIComment]
  'comment-edited': [comment: AIComment]
  'comment-saved': [comment: AIComment]
}>()

// 响应式数据
const isRegenerating = ref(false)

// 模拟AI评论数据
const aiComment = ref<AIComment>({
  id: 'comment-1',
  score: 85,
  overallComment: '整体表现良好，对课程内容理解较为深入，但在实践应用方面还有提升空间。建议加强理论联系实际的能力培养。',
  completionRate: 90,
  accuracyRate: 82,
  creativityRate: 78,
  strengths: [
    {
      id: 'strength-1',
      title: '理论掌握扎实',
      description: '对基本概念和原理的理解准确，能够正确运用相关公式和定理。',
      icon: 'TrendCharts',
      evidence: '在第三题中准确应用了二次函数的性质',
      confidence: 95
    },
    {
      id: 'strength-2',
      title: '逻辑思维清晰',
      description: '解题思路清晰，步骤完整，逻辑推理过程合理。',
      icon: 'Operation',
      evidence: '复杂应用题的解题过程条理清晰',
      confidence: 88
    },
    {
      id: 'strength-3',
      title: '学习态度认真',
      description: '作业书写工整，答题规范，展现了良好的学习习惯。',
      icon: 'Star',
      confidence: 92
    }
  ],
  suggestions: [
    {
      id: 'suggestion-1',
      title: '加强实际应用能力',
      description: '建议多关注数学知识在实际生活中的应用，培养解决实际问题的能力。',
      priority: 'high',
      actionSteps: [
        '收集生活中的数学应用案例',
        '每周练习一道实际应用题目',
        '参与数学建模活动'
      ],
      resources: [
        {
          id: 'resource-1',
          title: '生活中的数学应用案例集',
          type: 'document',
          url: '#'
        },
        {
          id: 'resource-2',
          title: '数学建模入门教程',
          type: 'video',
          url: '#'
        }
      ]
    },
    {
      id: 'suggestion-2',
      title: '提升解题速度',
      description: '在保证准确性的前提下，通过练习提高解题效率。',
      priority: 'medium',
      actionSteps: [
        '定期进行限时练习',
        '总结常用解题技巧',
        '建立错题集并定期复习'
      ]
    }
  ],
  scoringCriteria: [
    {
      id: 'criteria-1',
      name: '概念理解',
      score: 18,
      maxScore: 20,
      weight: 25,
      comment: '对基本概念理解准确'
    },
    {
      id: 'criteria-2',
      name: '解题过程',
      score: 22,
      maxScore: 25,
      weight: 30,
      comment: '解题步骤完整，逻辑清晰'
    },
    {
      id: 'criteria-3',
      name: '答案准确性',
      score: 20,
      maxScore: 25,
      weight: 25,
      comment: '大部分答案正确，少数计算错误'
    },
    {
      id: 'criteria-4',
      name: '书写规范',
      score: 15,
      maxScore: 15,
      weight: 20,
      comment: '书写工整，答题规范'
    },
    {
      id: 'criteria-5',
      name: '创新思维',
      score: 10,
      maxScore: 15,
      weight: 15,
      comment: '在解题方法上有一定的创新性'
    }
  ],
  learningPath: [
    {
      id: 'step-1',
      title: '巩固基础知识',
      description: '重点复习函数的基本性质和图像特征',
      duration: '1-2周',
      resources: ['函数性质总结', '典型例题集']
    },
    {
      id: 'step-2',
      title: '提升应用能力',
      description: '通过实际问题练习，提高数学建模能力',
      duration: '2-3周',
      resources: ['应用题精选', '建模案例']
    },
    {
      id: 'step-3',
      title: '拓展思维训练',
      description: '学习一题多解，培养创新思维',
      duration: '持续进行',
      resources: ['思维训练题', '解题技巧集']
    }
  ],
  generatedAt: new Date(),
  aiVersion: 'v2.1.0'
})

// 计算属性
const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-circle--excellent'
  if (score >= 80) return 'score-circle--good'
  if (score >= 70) return 'score-circle--average'
  return 'score-circle--poor'
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getPriorityType = (priority: string) => {
  const types: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || priority
}

const getResourceIcon = (type: string) => {
  const icons: Record<string, string> = {
    document: 'Document',
    video: 'VideoPlay',
    audio: 'Headphones',
    link: 'Link'
  }
  return icons[type] || 'Document'
}

const calculateTotalScore = () => {
  return aiComment.value.scoringCriteria.reduce((total, criteria) => total + criteria.score, 0)
}

const calculateMaxScore = () => {
  return aiComment.value.scoringCriteria.reduce((total, criteria) => total + criteria.maxScore, 0)
}

// 方法
const regenerateComment = async () => {
  try {
    isRegenerating.value = true

    // 模拟重新生成
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 更新生成时间
    aiComment.value.generatedAt = new Date()
    aiComment.value.score = Math.floor(Math.random() * 20) + 75 // 75-95分随机

    ElMessage.success('AI评论已重新生成')
  } catch (error) {
    ElMessage.error('重新生成失败，请重试')
  } finally {
    isRegenerating.value = false
  }
}

const exportComment = () => {
  const commentText = `
学生：${props.assignment.student.name}
作业：${props.assignment.title}
AI评分：${aiComment.value.score}分

总体评价：
${aiComment.value.overallComment}

评分细则：
${aiComment.value.scoringCriteria.map(criteria =>
  `${criteria.name}：${criteria.score}/${criteria.maxScore}分 (${criteria.weight}%) - ${criteria.comment}`
).join('\n')}

改进建议：
${aiComment.value.suggestions.map(suggestion =>
  `• ${suggestion.title}（${getPriorityText(suggestion.priority)}）：${suggestion.description}`
).join('\n')}

生成时间：${formatTime(aiComment.value.generatedAt)}
AI版本：${aiComment.value.aiVersion}
  `.trim()

  // 创建下载
  const blob = new Blob([commentText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AI评论_${props.assignment.student.name}_${props.assignment.title}.txt`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('评论已导出')
}

const applyComment = () => {
  emit('comment-applied', aiComment.value)
  ElMessage.success('评论已应用')
}

const editComment = () => {
  emit('comment-edited', aiComment.value)
  ElMessage.info('编辑功能开发中...')
}

const saveAsTemplate = () => {
  // 保存到本地存储
  const templates = JSON.parse(localStorage.getItem('ai-comment-templates') || '[]')
  templates.push({
    id: Date.now().toString(),
    name: `${props.assignment.student.name}的${props.assignment.title}评论`,
    comment: aiComment.value,
    createdAt: new Date().toISOString()
  })
  localStorage.setItem('ai-comment-templates', JSON.stringify(templates))

  ElMessage.success('评论已保存为模板')
}

const requestReview = () => {
  ElMessage.info('已发送人工审核请求')
}

const openResource = (resource: any) => {
  window.open(resource.url, '_blank')
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.ai-comment-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--density-padding-lg);
  background: linear-gradient(135deg, var(--edu-primary-50) 0%, var(--edu-secondary-50) 100%);
  border-bottom: 1px solid var(--edu-border-light);
  gap: var(--density-spacing-lg);
}

.header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--density-spacing-lg);
}

.student-info {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  flex: 1;
}

.student-details {
  flex: 1;
}

.student-name {
  margin: 0 0 var(--density-spacing-xs) 0;
  font-size: var(--density-font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.assignment-title {
  margin: 0;
  font-size: var(--density-font-size-sm);
  color: var(--edu-text-secondary);
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.score-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--density-font-size-xl);
  font-weight: var(--font-weight-bold);
  color: white;
  margin-bottom: var(--density-spacing-xs);

  &--excellent { background: var(--edu-success-500); }
  &--good { background: var(--edu-primary-500); }
  &--average { background: var(--edu-warning-500); }
  &--poor { background: var(--edu-color-error-500); }
}

.score-label {
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--density-spacing-sm);
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--density-padding-lg);
}

.comment-section {
  margin-bottom: var(--density-spacing-xl);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  margin: 0 0 var(--density-spacing-base) 0;
  font-size: var(--density-font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);

  .el-icon {
    color: var(--edu-primary-500);
  }
}

.overall-comment {
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-base);
  padding: var(--density-padding-base);
  margin-bottom: var(--density-spacing-base);
}

.comment-text {
  font-size: var(--density-font-size-base);
  line-height: var(--density-line-height-relaxed);
  color: var(--edu-text-primary);
  margin-bottom: var(--density-spacing-base);
}

.comment-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--density-spacing-base);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-sm);
}

.metric-label {
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-secondary);
}

.strengths-list,
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-base);
}

.strength-item,
.suggestion-item {
  display: flex;
  gap: var(--density-spacing-sm);
  padding: var(--density-padding-base);
  border-radius: var(--density-radius-base);
  border: 1px solid var(--edu-border-light);

  .suggestion-item--high & {
    border-color: var(--edu-color-error-200);
    background: rgba(245, 108, 108, 0.05);
  }

  .suggestion-item--medium & {
    border-color: var(--edu-warning-200);
    background: rgba(230, 162, 60, 0.05);
  }

  .suggestion-item--low & {
    border-color: var(--edu-info-200);
    background: rgba(144, 147, 153, 0.05);
  }
}

.strength-icon,
.suggestion-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--density-radius-base);
  background: var(--edu-success-50);
  color: var(--edu-success-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.strength-content,
.suggestion-content {
  flex: 1;
}

.strength-title,
.suggestion-title {
  margin: 0 0 var(--density-spacing-xs) 0;
  font-size: var(--density-font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.strength-description,
.suggestion-description {
  margin: 0 0 var(--density-spacing-sm) 0;
  font-size: var(--density-font-size-sm);
  color: var(--edu-text-secondary);
  line-height: var(--density-line-height-relaxed);
}

.strength-evidence {
  display: flex;
  gap: var(--density-spacing-xs);
  margin-bottom: var(--density-spacing-sm);
}

.evidence-label {
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-tertiary);
}

.evidence-text {
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-secondary);
  font-style: italic;
}

.strength-confidence {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.confidence-label {
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-tertiary);
  margin-bottom: var(--density-spacing-xs);
}

.confidence-value {
  font-size: var(--density-font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-success-600);
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  margin-bottom: var(--density-spacing-sm);
}

.action-steps,
.suggestion-resources {
  margin-top: var(--density-spacing-base);
}

.steps-title,
.resources-title {
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: var(--density-spacing-sm);
}

.steps-list {
  margin: 0;
  padding-left: var(--density-spacing-lg);
  color: var(--edu-text-secondary);
  font-size: var(--density-font-size-sm);

  li {
    margin-bottom: var(--density-spacing-xs);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.resources-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--density-spacing-sm);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-xs);
  padding: var(--density-spacing-xs) var(--density-spacing-sm);
  background: var(--edu-bg-tertiary);
  border-radius: var(--density-radius-sm);
  cursor: pointer;
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-secondary);

  &:hover {
    background: var(--edu-bg-secondary);
    color: var(--edu-text-primary);
  }
}

.scoring-table {
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-base);
  overflow: hidden;
}

.scoring-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 3fr;
  background: var(--edu-bg-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
  padding: var(--density-padding-sm);
  border-bottom: 1px solid var(--edu-border-light);
}

.scoring-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 3fr;
  padding: var(--density-padding-sm);
  border-bottom: 1px solid var(--edu-border-light);

  &:last-child {
    border-bottom: none;
  }
}

.scoring-footer {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 3fr;
  background: var(--edu-primary-50);
  font-weight: var(--font-weight-semibold);
  padding: var(--density-padding-sm);
}

.criteria-column,
.score-column,
.weight-column,
.comment-column {
  display: flex;
  align-items: center;
  font-size: var(--density-font-size-sm);
}

.total-score {
  color: var(--edu-primary-600);
  font-weight: var(--font-weight-bold);
}

.learning-path {
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-base);
  padding: var(--density-padding-base);
}

.path-timeline {
  position: relative;
}

.path-step {
  display: flex;
  gap: var(--density-spacing-base);
  margin-bottom: var(--density-spacing-lg);

  &:last-child {
    margin-bottom: 0;

    .step-connector {
      display: none;
    }
  }
}

.step-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--edu-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--density-font-size-sm);
  margin-bottom: var(--density-spacing-sm);
}

.step-connector {
  width: 2px;
  height: 40px;
  background: var(--edu-border-light);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  margin: 0 0 var(--density-spacing-xs) 0;
  font-size: var(--density-font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.step-description {
  margin: 0 0 var(--density-spacing-sm) 0;
  font-size: var(--density-font-size-sm);
  color: var(--edu-text-secondary);
  line-height: var(--density-line-height-relaxed);
}

.step-duration {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-xs);
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-tertiary);
  margin-bottom: var(--density-spacing-sm);
}

.step-resources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--density-spacing-xs);
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--density-padding-lg);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
  gap: var(--density-spacing-lg);
}

.footer-actions {
  display: flex;
  gap: var(--density-spacing-sm);
  flex-wrap: wrap;
}

.panel-info {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xs);
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-tertiary);
  text-align: right;
}

// 响应式适配
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--density-spacing-base);
  }

  .header-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .comment-metrics {
    grid-template-columns: 1fr;
  }

  .strength-item,
  .suggestion-item {
    flex-direction: column;
  }

  .scoring-header,
  .scoring-row,
  .scoring-footer {
    grid-template-columns: 1fr;
    gap: var(--density-spacing-xs);
  }

  .panel-footer {
    flex-direction: column;
    align-items: stretch;
    gap: var(--density-spacing-base);
  }

  .footer-actions {
    justify-content: center;
  }

  .panel-info {
    text-align: center;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .panel-header {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(82, 196, 26, 0.1) 100%);
  }

  .overall-comment,
  .learning-path,
  .scoring-table {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .resource-item,
  .step-number {
    transition: none;
  }
}
</style>