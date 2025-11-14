<template>
  <div class="ai-experiment-assistant">
    <!-- 助手头部 -->
    <div class="assistant-header">
      <div class="assistant-avatar">
        <div class="avatar-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <div class="status-indicator" :class="getStatusClass()"></div>
      </div>
      <div class="assistant-info">
        <h3>AI 实验助手</h3>
        <p>{{ getStatusText() }}</p>
      </div>
      <div class="assistant-actions">
        <EduButton
          variant="text"
          size="small"
          @click="toggleAssistant"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </EduButton>
      </div>
    </div>

    <!-- 助手内容 -->
    <div v-if="isExpanded" class="assistant-content">
      <!-- 当前分析状态 -->
      <div v-if="isAnalyzing" class="analysis-status">
        <div class="status-animation">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
        </div>
        <p>正在分析实验内容...</p>
      </div>

      <!-- AI 建议面板 -->
      <div v-if="suggestions.length > 0" class="suggestions-panel">
        <h4>AI 建议</h4>
        <div class="suggestions-list">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="suggestion-item"
            :class="getSuggestionClass(suggestion.type)"
          >
            <div class="suggestion-icon">
              <component :is="getSuggestionIcon(suggestion.type)" />
            </div>
            <div class="suggestion-content">
              <h5>{{ suggestion.title }}</h5>
              <p>{{ suggestion.description }}</p>
              <div v-if="suggestion.actions && suggestion.actions.length > 0" class="suggestion-actions">
                <EduButton
                  v-for="(action, actionIndex) in suggestion.actions"
                  :key="actionIndex"
                  :variant="action.primary ? 'primary' : 'secondary'"
                  size="small"
                  @click="executeAction(action)"
                >
                  {{ action.label }}
                </EduButton>
              </div>
            </div>
            <div class="suggestion-priority">
              <span :class="`priority priority--${suggestion.priority}`">
                {{ getPriorityLabel(suggestion.priority) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 实验摘要 -->
      <div v-if="experimentSummary" class="experiment-summary">
        <h4>实验摘要</h4>
        <div class="summary-content">
          <div class="summary-section">
            <h5>难度评估</h5>
            <div class="difficulty-indicator">
              <div class="difficulty-bar">
                <div
                  class="difficulty-fill"
                  :style="{ width: getDifficultyWidth(experimentSummary.difficulty) }"
                ></div>
              </div>
              <span class="difficulty-label">{{ experimentSummary.difficulty }}</span>
            </div>
          </div>

          <div class="summary-section">
            <h5>预计时长</h5>
            <div class="time-estimate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ experimentSummary.estimatedDuration }}</span>
            </div>
          </div>

          <div class="summary-section">
            <h5>前置知识</h5>
            <div class="prerequisites">
              <span
                v-for="prereq in experimentSummary.prerequisites"
                :key="prereq"
                class="prerequisite-tag"
              >
                {{ prereq }}
              </span>
            </div>
          </div>

          <div class="summary-section">
            <h5>学习目标</h5>
            <ul class="learning-objectives">
              <li v-for="objective in experimentSummary.learningObjectives" :key="objective">
                {{ objective }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 课堂提醒 -->
      <div v-if="classroomAlerts.length > 0" class="classroom-alerts">
        <h4>课堂提醒</h4>
        <div class="alerts-list">
          <div
            v-for="(alert, index) in classroomAlerts"
            :key="index"
            class="alert-item"
            :class="`alert-item--${alert.type}`"
          >
            <div class="alert-icon">
              <component :is="getAlertIcon(alert.type)" />
            </div>
            <div class="alert-content">
              <h5>{{ alert.title }}</h5>
              <p>{{ alert.message }}</p>
              <span class="alert-time">{{ formatRelativeTime(alert.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 手动触发分析 -->
      <div class="manual-analysis">
        <EduButton
          variant="outline"
          :loading="isAnalyzing"
          @click="triggerAnalysis"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="8" y1="9" x2="16" y2="9"/>
            <line x1="8" y1="15" x2="14" y2="15"/>
          </svg>
          重新分析
        </EduButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import EduButton from '@/components/ui/EduButton.vue'

// Types
interface Suggestion {
  type: 'improvement' | 'warning' | 'info' | 'success'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actions?: Array<{
    label: string
    action: string
    primary?: boolean
  }>
}

interface ExperimentSummary {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedDuration: string
  prerequisites: string[]
  learningObjectives: string[]
  cellCount: number
  codeComplexity: number
}

interface ClassroomAlert {
  type: 'info' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
}

// Props
interface Props {
  notebookContent?: any
  labMetadata?: Record<string, any>
  classroomContext?: {
    studentCount: number
    gradeLevel: string
    subject: string
    previousPerformance: Record<string, any>
  }
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'suggestion-accepted', suggestion: Suggestion, action: any): void
  (e: 'analysis-complete', summary: ExperimentSummary): void
  (e: 'alert-dismissed', alert: ClassroomAlert): void
}

const emit = defineEmits<Emits>()

// Refs
const isExpanded = ref(true)
const isAnalyzing = ref(false)
const suggestions = ref<Suggestion[]>([])
const experimentSummary = ref<ExperimentSummary>()
const classroomAlerts = ref<ClassroomAlert[]>([])

// Computed
const hasContent = computed(() => props.notebookContent || props.labMetadata)

// Methods
const getStatusClass = (): string => {
  if (isAnalyzing.value) return 'status-analyzing'
  if (suggestions.value.length > 0) return 'status-active'
  return 'status-idle'
}

const getStatusText = (): string => {
  if (isAnalyzing.value) return '正在分析...'
  if (suggestions.value.length > 0) return '分析完成'
  return '准备就绪'
}

const getSuggestionClass = (type: string): string => {
  const classes: Record<string, string> = {
    improvement: 'suggestion-item--improvement',
    warning: 'suggestion-item--warning',
    info: 'suggestion-item--info',
    success: 'suggestion-item--success'
  }
  return classes[type] || 'suggestion-item--info'
}

const getSuggestionIcon = (type: string) => {
  const icons: Record<string, any> = {
    improvement: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
      h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
    ]),
    warning: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
      h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
      h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
    ]),
    info: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
      h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })
    ]),
    success: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ])
  }
  return icons[type] || icons.info
}

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || priority
}

const getDifficultyWidth = (difficulty: string): string => {
  const widths: Record<string, string> = {
    beginner: '25%',
    intermediate: '50%',
    advanced: '75%',
    expert: '100%'
  }
  return widths[difficulty] || '25%'
}

const getAlertIcon = (type: string) => {
  return getSuggestionIcon(type)
}

const toggleAssistant = () => {
  isExpanded.value = !isExpanded.value
}

const triggerAnalysis = async () => {
  if (!hasContent.value) {
    suggestions.value = [{
      type: 'info',
      title: '无内容可分析',
      description: '请先上传 Notebook 文件或填写实验信息',
      priority: 'medium'
    }]
    return
  }

  isAnalyzing.value = true
  suggestions.value = []

  try {
    // 模拟 AI 分析过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    await analyzeNotebook()
    generateClassroomAlerts()

  } catch (error) {
    console.error('Analysis failed:', error)
    suggestions.value = [{
      type: 'warning',
      title: '分析失败',
      description: '无法完成 AI 分析，请稍后重试',
      priority: 'medium'
    }]
  } finally {
    isAnalyzing.value = false
  }
}

const analyzeNotebook = async () => {
  if (!props.notebookContent) return

  const cells = props.notebookContent.cells || []
  const codeCells = cells.filter((cell: any) => cell.cell_type === 'code')
  const markdownCells = cells.filter((cell: any) => cell.cell_type === 'markdown')

  // 分析难度
  const complexity = analyzeCodeComplexity(codeCells)
  const difficulty = assessDifficulty(cells, complexity)

  // 生成摘要
  experimentSummary.value = {
    difficulty,
    estimatedDuration: estimateDuration(cells, complexity),
    prerequisites: extractPrerequisites(codeCells),
    learningObjectives: extractLearningObjectives(markdownCells),
    cellCount: cells.length,
    codeComplexity: complexity
  }

  // 生成建议
  suggestions.value = generateSuggestions(cells, complexity, props.classroomContext)

  emit('analysis-complete', experimentSummary.value)
}

const analyzeCodeComplexity = (codeCells: any[]): number => {
  let complexity = 0

  codeCells.forEach((cell: any) => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

    // 检查复杂度指标
    if (source.includes('def ') && source.includes('class ')) complexity += 3
    else if (source.includes('def ')) complexity += 2
    else if (source.includes('import ') || source.includes('from ')) complexity += 1

    // 检查复杂库的使用
    const complexLibs = ['tensorflow', 'pytorch', 'sklearn', 'pandas', 'numpy']
    complexLibs.forEach(lib => {
      if (source.includes(lib)) complexity += 1
    })
  })

  return Math.min(complexity, 10)
}

const assessDifficulty = (cells: any[], complexity: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  const codeCellCount = cells.filter((c: any) => c.cell_type === 'code').length
  const totalCells = cells.length

  if (complexity <= 2 && codeCellCount <= 3) return 'beginner'
  if (complexity <= 5 && codeCellCount <= 6) return 'intermediate'
  if (complexity <= 8 && totalCells <= 15) return 'advanced'
  return 'expert'
}

const estimateDuration = (cells: any[], complexity: number): string => {
  const codeCells = cells.filter((c: any) => c.cell_type === 'code').length
  const baseMinutes = 10
  const codeTime = codeCells * 5
  const complexityTime = complexity * 3

  const totalMinutes = baseMinutes + codeTime + complexityTime

  if (totalMinutes < 30) return `${totalMinutes} 分钟`
  if (totalMinutes < 60) return `${Math.round(totalMinutes / 10) * 10} 分钟`
  return `${Math.round(totalMinutes / 60)} 小时`
}

const extractPrerequisites = (codeCells: any[]): string[] => {
  const prerequisites = new Set<string>()

  codeCells.forEach((cell: any) => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

    // 提取导入的库
    const importMatches = source.match(/import\s+(\w+)/g)
    const fromMatches = source.match(/from\s+(\w+)/g)

    if (importMatches) {
      importMatches.forEach((match: string) => {
        const lib = match.replace('import ', '').split('.')[0]
        prerequisites.add(lib)
      })
    }

    if (fromMatches) {
      fromMatches.forEach((match: string) => {
        const lib = match.replace('from ', '').split('.')[0]
        prerequisites.add(lib)
      })
    }
  })

  return Array.from(prerequisites).slice(0, 5)
}

const extractLearningObjectives = (markdownCells: any[]): string[] => {
  const objectives: string[] = []

  markdownCells.forEach((cell: any) => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

    // 查找学习目标相关的关键词
    const lines = source.split('\n')
    lines.forEach((line: string) => {
      if (line.includes('学习目标') || line.includes('目标') || line.includes('掌握')) {
        const cleaned = line.replace(/^#+\s*/, '').replace(/\*\*/g, '')
        if (cleaned.length > 10) {
          objectives.push(cleaned)
        }
      }
    })
  })

  return objectives.slice(0, 4)
}

const generateSuggestions = (
  cells: any[],
  complexity: number,
  classroomContext?: any
): Suggestion[] => {
  const suggestions: Suggestion[] = []

  // 基于复杂度的建议
  if (complexity > 7) {
    suggestions.push({
      type: 'warning',
      title: '复杂度较高',
      description: '这个实验的代码复杂度较高，可能需要额外的时间来完成',
      priority: 'high',
      actions: [
        { label: '简化代码', action: 'simplify-code' },
        { label: '添加更多注释', action: 'add-comments', primary: true }
      ]
    })
  }

  // 基于单元格数量的建议
  if (cells.length > 20) {
    suggestions.push({
      type: 'info',
      title: '内容较多',
      description: '实验包含较多单元格，建议分步完成',
      priority: 'medium',
      actions: [
        { label: '拆分章节', action: 'split-sections', primary: true }
      ]
    })
  }

  // 基于课堂情境的建议
  if (classroomContext) {
    if (classroomContext.gradeLevel === 'primary') {
      suggestions.push({
        type: 'improvement',
        title: '适配小学生',
        description: '建议简化代码示例，增加更多可视化内容',
        priority: 'medium',
        actions: [
          { label: '添加可视化', action: 'add-visualization', primary: true }
        ]
      })
    }
  }

  return suggestions
}

const generateClassroomAlerts = () => {
  const alerts: ClassroomAlert[] = []

  // 基于实验内容的提醒
  if (experimentSummary.value?.difficulty === 'advanced') {
    alerts.push({
      type: 'warning',
      title: '高级实验',
      message: '此实验难度较高，建议确保学生具备必要的预备知识',
      timestamp: new Date()
    })
  }

  // 基于课堂情境的提醒
  if (props.classroomContext?.studentCount > 30) {
    alerts.push({
      type: 'info',
      title: '大班教学',
      message: '班级人数较多，建议准备额外的助教支持',
      timestamp: new Date()
    })
  }

  classroomAlerts.value = alerts
}

const executeAction = (action: any) => {
  emit('suggestion-accepted', suggestions.value[0], action)

  // 这里可以执行具体的操作
  console.log('Executing action:', action.action)
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} 小时前`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} 天前`
}

// Lifecycle
onMounted(() => {
  if (hasContent.value) {
    triggerAnalysis()
  }
})

// Watch for content changes
watch([() => props.notebookContent, () => props.labMetadata], () => {
  if (hasContent.value && !isAnalyzing.value) {
    triggerAnalysis()
  }
}, { deep: true })
</script>

<style scoped>
.ai-experiment-assistant {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.assistant-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.assistant-avatar {
  position: relative;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon svg {
  width: 20px;
  height: 20px;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-idle {
  background: #9ca3af;
}

.status-analyzing {
  background: #f59e0b;
  animation: pulse 2s infinite;
}

.status-active {
  background: #10b981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.assistant-info {
  flex: 1;
}

.assistant-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.assistant-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.assistant-content {
  padding: 1rem;
}

.analysis-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  color: #6b7280;
}

.status-animation {
  display: flex;
  gap: 0.5rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.pulse-dot:nth-child(1) { animation-delay: -0.32s; }
.pulse-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.suggestions-panel {
  margin-bottom: 1.5rem;
}

.suggestions-panel h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.suggestion-item--improvement {
  background: #f0f9ff;
  border-left-color: #0ea5e9;
}

.suggestion-item--warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.suggestion-item--info {
  background: #f8fafc;
  border-left-color: #64748b;
}

.suggestion-item--success {
  background: #f0fdf4;
  border-left-color: #22c55e;
}

.suggestion-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.suggestion-content p {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.suggestion-priority {
  flex-shrink: 0;
}

.priority {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.priority--high {
  background: #fef2f2;
  color: #991b1b;
}

.priority--medium {
  background: #fef3c7;
  color: #92400e;
}

.priority--low {
  background: #f3f4f6;
  color: #374151;
}

.experiment-summary {
  margin-bottom: 1.5rem;
}

.experiment-summary h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.difficulty-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.difficulty-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.difficulty-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
  transition: width 0.3s ease;
}

.difficulty-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.time-estimate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.time-estimate svg {
  width: 16px;
  height: 16px;
}

.prerequisites {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.prerequisite-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.learning-objectives {
  margin: 0;
  padding-left: 1.25rem;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.learning-objectives li {
  margin-bottom: 0.25rem;
}

.classroom-alerts {
  margin-bottom: 1.5rem;
}

.classroom-alerts h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
}

.alert-item--info {
  background: #f0f9ff;
}

.alert-item--warning {
  background: #fffbeb;
}

.alert-item--error {
  background: #fef2f2;
}

.alert-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.alert-content {
  flex: 1;
}

.alert-content h5 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.alert-content p {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.alert-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.manual-analysis {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.manual-analysis button {
  width: 100%;
  justify-content: center;
}
</style>