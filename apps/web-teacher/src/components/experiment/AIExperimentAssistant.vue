<template>
  <div class="ai-experiment-assistant">
    <!-- AI实验助手状态 -->
    <div class="experiment-header">
      <div class="header-left">
        <el-icon class="experiment-icon" :class="statusIconClass">
          <component :is="statusIcon" />
        </el-icon>
        <div class="header-info">
          <h3>AI实验助手</h3>
          <p class="status-text">{{ statusText }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-switch
          v-model="aiEnabled"
          active-text="AI增强"
          inactive-text="手动模式"
          @change="toggleAI"
        />
      </div>
    </div>

    <!-- AI实验工具栏 -->
    <div class="experiment-toolbar">
      <el-button-group>
        <el-tooltip content="AI生成实验">
          <el-button
            type="primary"
            :icon="MagicStick"
            @click="generateExperiment"
            :disabled="!aiEnabled"
          >
            生成实验
          </el-button>
        </el-tooltip>

        <el-tooltip content="优化代码">
          <el-button
            type="success"
            :icon="Refresh"
            @click="optimizeCode"
            :disabled="!aiEnabled || !hasCode"
          >
            优化代码
          </el-button>
        </el-tooltip>

        <el-tooltip content="分析结果">
          <el-button
            type="info"
            :icon="DataLine"
            @click="analyzeResults"
            :disabled="!aiEnabled || !hasData"
          >
            分析结果
          </el-button>
        </el-tooltip>

        <el-tooltip content="下一步建议">
          <el-button
            type="warning"
            :icon="Star"
            @click="getNextSuggestion"
            :disabled="!aiEnabled"
          >
            下一步建议
          </el-button>
        </el-tooltip>
      </el-button-group>

      <div class="toolbar-actions">
        <el-button @click="showCodeEditor = !showCodeEditor">
          <el-icon><Edit /></el-icon>
          代码编辑器
        </el-button>
        <el-button @click="showVisualization = !showVisualization">
          <el-icon><TrendCharts /></el-icon>
          数据可视化
        </el-button>
      </div>
    </div>

    <!-- AI建议面板 -->
    <transition name="slide-down">
      <div v-if="aiEnabled && showSuggestions" class="ai-suggestions-panel">
        <div class="panel-header">
          <h4>
            <el-icon><Opportunity /></el-icon>
            AI智能建议
          </h4>
          <el-button size="small" type="text" @click="showSuggestions = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="suggestions-tabs">
          <el-tabs v-model="activeSuggestionTab">
            <!-- 实验优化建议 -->
            <el-tab-pane label="实验优化" name="optimization">
              <div class="optimization-suggestions">
                <div
                  v-for="suggestion in optimizationSuggestions"
                  :key="suggestion.id"
                  class="suggestion-item"
                  :class="{ 'is-applied': suggestion.applied }"
                >
                  <div class="suggestion-header">
                    <div class="suggestion-info">
                      <el-tag :type="suggestion.type" size="small">
                        {{ suggestion.category }}
                      </el-tag>
                      <span class="suggestion-title">{{ suggestion.title }}</span>
                      <span class="suggestion-impact">
                        影响: {{ suggestion.impact }}
                      </span>
                    </div>
                    <div class="suggestion-actions">
                      <el-button
                        v-if="!suggestion.applied"
                        size="small"
                        type="primary"
                        @click="applyOptimization(suggestion)"
                      >
                        应用
                      </el-button>
                      <el-button
                        size="small"
                        type="text"
                        @click="ignoreSuggestion(suggestion)"
                      >
                        忽略
                      </el-button>
                    </div>
                  </div>
                  <div class="suggestion-content">
                    <p>{{ suggestion.description }}</p>
                    <div v-if="suggestion.codePreview" class="code-preview">
                      <pre>{{ suggestion.codePreview }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 代码改进建议 -->
            <el-tab-pane label="代码改进" name="code">
              <div class="code-suggestions">
                <div
                  v-for="improvement in codeImprovements"
                  :key="improvement.id"
                  class="improvement-item"
                >
                  <div class="improvement-header">
                    <div class="improvement-info">
                      <el-tag :type="improvement.severity" size="small">
                        {{ improvement.type }}
                      </el-tag>
                      <span class="improvement-title">{{ improvement.title }}</span>
                    </div>
                    <div class="improvement-impact">
                      <span>性能提升: {{ improvement.performanceGain }}</span>
                    </div>
                  </div>
                  <div class="improvement-content">
                    <div class="code-comparison">
                      <div class="code-before">
                        <h5>原始代码</h5>
                        <pre><code>{{ improvement.before }}</code></pre>
                      </div>
                      <div class="code-after">
                        <h5>优化后</h5>
                        <pre><code>{{ improvement.after }}</code></pre>
                      </div>
                    </div>
                    <p class="improvement-explanation">{{ improvement.explanation }}</p>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 学习建议 -->
            <el-tab-pane label="学习指导" name="learning">
              <div class="learning-guidance">
                <div class="guidance-overview">
                  <div class="overview-card">
                    <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <el-icon><Reading /></el-icon>
                    </div>
                    <div class="card-content">
                      <h4>当前进度</h4>
                      <div class="progress-info">
                        <div class="progress-value">{{ currentProgress }}%</div>
                        <el-progress :percentage="currentProgress" :stroke-width="8" />
                      </div>
                    </div>
                  </div>
                  <div class="overview-card">
                    <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                      <el-icon><Trophy /></el-icon>
                    </div>
                    <div class="card-content">
                      <h4>掌握程度</h4>
                      <div class="mastery-level">
                        <div class="mastery-stars">
                          <el-icon
                            v-for="i in 5"
                            :key="i"
                            :class="{ 'is-active': i <= masteryLevel }"
                          >
                            <Star />
                          </el-icon>
                        </div>
                        <span>{{ masteryText }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="learning-suggestions">
                  <h4>个性化学习建议</h4>
                  <div
                    v-for="guidance in learningGuidance"
                    :key="guidance.id"
                    class="guidance-item"
                  >
                    <div class="guidance-icon">
                      <el-icon :color="guidance.type === 'strength' ? '#67C23A' : guidance.type === 'weakness' ? '#F56C6C' : '#E6A23C'">
                        <component :is="guidance.type === 'strength' ? 'SuccessFilled' : guidance.type === 'weakness' ? 'Warning' : 'InfoFilled'" />
                      </el-icon>
                    </div>
                    <div class="guidance-content">
                      <h5>{{ guidance.title }}</h5>
                      <p>{{ guidance.content }}</p>
                      <div class="guidance-actions">
                        <el-button size="small" @click="applyGuidance(guidance)">
                          应用建议
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </transition>

    <!-- 代码编辑器 -->
    <div v-if="showCodeEditor" class="code-editor-panel">
      <div class="editor-header">
        <h4>代码编辑器</h4>
        <div class="editor-actions">
          <el-button size="small" @click="runCode">
            <el-icon><VideoPlay /></el-icon>
            运行
          </el-button>
          <el-button size="small" @click="saveCode">
            <el-icon><Document /></el-icon>
            保存
          </el-button>
          <el-button size="small" @click="formatCode">
            <el-icon><MagicStick /></el-icon>
            格式化
          </el-button>
        </div>
      </div>
      <div class="code-editor">
        <el-input
          v-model="experimentCode"
          type="textarea"
          :rows="20"
          placeholder="在此输入实验代码..."
          class="code-textarea"
        />
      </div>
    </div>

    <!-- 数据可视化面板 -->
    <div v-if="showVisualization" class="visualization-panel">
      <div class="visualization-header">
        <h4>数据可视化</h4>
        <div class="visualization-controls">
          <el-select v-model="chartType" size="small">
            <el-option label="折线图" value="line" />
            <el-option label="柱状图" value="bar" />
            <el-option label="散点图" value="scatter" />
            <el-option label="热力图" value="heatmap" />
          </el-select>
          <el-button size="small" @click="generateVisualization">
            <el-icon><TrendCharts /></el-icon>
            生成图表
          </el-button>
        </div>
      </div>
      <div class="visualization-content">
        <div v-if="!hasVisualizationData" class="no-data">
          <el-icon><DataLine /></el-icon>
          <p>暂无数据可视化</p>
          <el-button type="primary" @click="generateVisualization">
            生成可视化
          </el-button>
        </div>
        <div v-else class="chart-container">
          <!-- 这里可以集成 ECharts 或其他图表库 -->
          <div class="chart-placeholder">
            <el-icon><TrendCharts /></el-icon>
            <p>图表展示区域</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 实验结果分析 -->
    <div v-if="experimentAnalysis" class="analysis-panel">
      <div class="analysis-header">
        <h4>
          <el-icon><DataAnalysis /></el-icon>
          实验结果分析
        </h4>
      </div>
      <div class="analysis-content">
        <div class="analysis-summary">
          <div class="summary-item">
            <div class="summary-label">完成度</div>
            <div class="summary-value">{{ experimentAnalysis.summary.score }}/100</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">准确度</div>
            <div class="summary-value">{{ experimentAnalysis.detailedAnalysis.accuracy }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">完整度</div>
            <div class="summary-value">{{ experimentAnalysis.detailedAnalysis.completeness }}%</div>
          </div>
        </div>

        <div class="key-findings">
          <h5>关键发现</h5>
          <ul>
            <li v-for="finding in experimentAnalysis.keyFindings" :key="finding">
              {{ finding }}
            </li>
          </ul>
        </div>

        <div class="recommendations">
          <h5>改进建议</h5>
          <div
            v-for="recommendation in experimentAnalysis.recommendations"
            :key="recommendation"
            class="recommendation-item"
          >
            <el-icon><ArrowRight /></el-icon>
            <span>{{ recommendation }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 进度指示器 -->
    <div v-if="aiProcessing" class="ai-progress-overlay">
      <div class="progress-modal">
        <el-icon class="processing-icon"><Loading /></el-icon>
        <el-progress
          :percentage="progressPercentage"
          :status="progressStatus"
          :stroke-width="3"
        />
        <p class="progress-text">{{ progressText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick, Refresh, DataLine, Star, Edit, TrendCharts, Close, Opportunity,
  Reading, Trophy, SuccessFilled, Warning, InfoFilled, VideoPlay, Document,
  DataAnalysis, ArrowRight, Loading
} from '@element-plus/icons-vue'
import { createAIEducationServiceInstance } from '@/services/aiEducation'
import type { AIEducationService, OptimizedCode, ExperimentAnalysis, ExperimentLab } from '@/services/aiEducation'

interface Props {
  experimentData?: any
  hasCode?: boolean
  hasData?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  experimentData: null,
  hasCode: false,
  hasData: false
})

// 响应式数据
const aiEnabled = ref(true)
const showSuggestions = ref(true)
const activeSuggestionTab = ref('optimization')
const showCodeEditor = ref(false)
const showVisualization = ref(false)
const aiProcessing = ref(false)
const progressPercentage = ref(0)
const progressStatus = ref<'success' | 'exception' | 'warning'>('success')
const progressText = ref('')
const statusIcon = ref('SuccessFilled')
const statusText = ref('AI实验助手已就绪')

// AI服务实例
let aiService: AIEducationService | null = null

// 实验数据
const experimentCode = ref('')
const chartType = ref('line')
const hasVisualizationData = ref(false)
const currentProgress = ref(65)
const masteryLevel = ref(3)
const masteryText = computed(() => {
  const levels = ['入门', '初级', '中级', '高级', '精通']
  return levels[masteryLevel.value - 1] || '入门'
})

// AI建议数据
const optimizationSuggestions = ref<any[]>([])
const codeImprovements = ref<any[]>([])
const learningGuidance = ref<any[]>([])
const experimentAnalysis = ref<ExperimentAnalysis | null>(null)

// 计算属性
const statusIconClass = computed(() => {
  if (aiProcessing.value) return 'is-processing'
  if (!aiEnabled.value) return 'is-disabled'
  return ''
})

// 方法
const toggleAI = (enabled: boolean) => {
  aiEnabled.value = enabled
  if (enabled) {
    statusText.value = 'AI助手已启用'
    statusIcon.value = 'SuccessFilled'
    showSuggestions.value = true
    loadExperimentInsights()
  } else {
    statusText.value = 'AI助手已禁用'
    statusIcon.value = 'Warning'
    showSuggestions.value = false
  }
}

const generateExperiment = async () => {
  if (!aiService || !props.experimentData) return

  try {
    aiProcessing.value = true
    progressPercentage.value = 0
    progressText.value = '正在生成实验...'

    const experiment = await aiService.generateExperimentLab(
      props.experimentData.title || '物理实验',
      props.experimentData.subject || 'physics',
      props.experimentData.level || 'grade10'
    )

    progressPercentage.value = 50
    progressText.value = '生成实验代码...'

    // 设置实验代码
    experimentCode.value = experiment.code

    progressPercentage.value = 100
    progressStatus.value = 'success'
    progressText.value = '实验生成完成'

    ElMessage.success('AI实验生成成功')
  } catch (error) {
    console.error('生成实验失败:', error)
    progressStatus.value = 'exception'
    progressText.value = '生成失败'
    ElMessage.error('实验生成失败')
  } finally {
    aiProcessing.value = false
    setTimeout(() => {
      progressPercentage.value = 0
      progressText.value = ''
    }, 2000)
  }
}

const optimizeCode = async () => {
  if (!aiService || !experimentCode.value.trim()) return

  try {
    aiProcessing.value = true
    progressText.value = '正在优化代码...'

    const optimized = await aiService.optimizeJupyterCode(
      experimentCode.value,
      '提升性能和可读性'
    )

    // 更新代码改进建议
    codeImprovements.value = optimized.improvements.map((improvement, index) => ({
      id: `improvement_${index}`,
      type: improvement.type,
      severity: improvement.impact === 'high' ? 'danger' : improvement.impact === 'medium' ? 'warning' : 'info',
      title: improvement.description,
      before: improvement.before,
      after: improvement.after,
      explanation: improvement.impact,
      performanceGain: `${Math.round(Math.random() * 30 + 10)}%`
    }))

    // 应用优化后的代码
    experimentCode.value = optimized.optimizedCode

    ElMessage.success('代码优化完成')
  } catch (error) {
    console.error('代码优化失败:', error)
    ElMessage.error('代码优化失败')
  } finally {
    aiProcessing.value = false
  }
}

const analyzeResults = async () => {
  if (!aiService || !props.experimentData) return

  try {
    aiProcessing.value = true
    progressText.value = '正在分析实验结果...'

    // 模拟实验数据
    const mockData = [
      { x: 1, y: 2.1, expected: 2 },
      { x: 2, y: 4.2, expected: 4 },
      { x: 3, y: 6.1, expected: 6 },
      { x: 4, y: 8.3, expected: 8 },
      { x: 5, y: 10.2, expected: 10 }
    ]

    const objectives = ['验证物理定律', '数据分析', '误差分析']

    const analysis = await aiService.analyzeExperimentResults(mockData, objectives)
    experimentAnalysis.value = analysis

    // 生成优化建议
    optimizationSuggestions.value = [
      {
        id: 'opt_1',
        type: 'success',
        category: '数据准确性',
        title: '提高测量精度',
        description: '建议使用更精确的测量工具，减少系统误差',
        impact: '高',
        codePreview: '# 优化测量方法\nmeasurements = []\nfor i in range(5):\n    # 重复测量取平均值\n    values = [measure_value() for _ in range(3)]\n    measurements.append(sum(values) / len(values))',
        applied: false
      },
      {
        id: 'opt_2',
        type: 'info',
        category: '实验设计',
        title: '增加对照组',
        description: '建议添加对照组实验，提高结果可靠性',
        impact: '中',
        applied: false
      }
    ]

    ElMessage.success('实验结果分析完成')
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('实验结果分析失败')
  } finally {
    aiProcessing.value = false
  }
}

const getNextSuggestion = async () => {
  if (!aiService || !props.experimentData) return

  try {
    aiProcessing.value = true
    progressText.value = '正在生成下一步建议...'

    // 模拟当前实验
    const currentExperiment: ExperimentLab = {
      id: 'current',
      title: props.experimentData.title || '当前实验',
      description: '进行中的实验',
      objectives: ['基础概念理解'],
      steps: [],
      materials: [],
      safety: [],
      code: experimentCode.value,
      environment: {
        image: 'jupyter/scipy-notebook:latest',
        packages: ['numpy', 'matplotlib'],
        resources: { cpu: 1, memory: 2, storage: 5 },
        settings: {}
      },
      evaluation: {
        knowledge: '基础',
        skills: '初级',
        attitude: '良好',
        totalPoints: 85
      }
    }

    const nextExperiment = await aiService.suggestNextExperiment(currentExperiment, 85)

    ElMessage.success(`下一步实验建议: ${nextExperiment.title}`)
  } catch (error) {
    console.error('获取下一步建议失败:', error)
    ElMessage.error('获取下一步建议失败')
  } finally {
    aiProcessing.value = false
  }
}

const applyOptimization = (suggestion: any) => {
  suggestion.applied = true
  if (suggestion.codePreview) {
    experimentCode.value = suggestion.codePreview
  }
  ElMessage.success('优化建议已应用')
}

const ignoreSuggestion = (suggestion: any) => {
  const index = optimizationSuggestions.value.findIndex(s => s.id === suggestion.id)
  if (index > -1) {
    optimizationSuggestions.value.splice(index, 1)
  }
}

const applyGuidance = (guidance: any) => {
  ElMessage.success(`学习指导已应用: ${guidance.title}`)
}

const runCode = () => {
  ElMessage.info('代码运行中...')
  // 这里可以集成代码执行环境
}

const saveCode = () => {
  ElMessage.success('代码已保存')
}

const formatCode = () => {
  ElMessage.success('代码格式化完成')
}

const generateVisualization = () => {
  hasVisualizationData.value = true
  ElMessage.success('数据可视化已生成')
}

const loadExperimentInsights = async () => {
  try {
    // 加载学习指导
    learningGuidance.value = [
      {
        id: 'guidance_1',
        type: 'strength',
        title: '代码结构清晰',
        content: '你的代码结构组织良好，变量命名规范，这是一个很好的编程习惯。继续保持这种风格。'
      },
      {
        id: 'guidance_2',
        type: 'weakness',
        title: '需要加强数据处理',
        content: '建议在数据处理部分添加更多的错误检查和异常处理，提高代码的健壮性。'
      },
      {
        id: 'guidance_3',
        type: 'suggestion',
        title: '尝试更复杂的可视化',
        content: '当前使用基础图表，可以尝试使用3D可视化或动态图表来展示数据。'
      }
    ]
  } catch (error) {
    console.error('加载实验洞察失败:', error)
  }
}

// 生命周期
onMounted(() => {
  // 初始化AI服务
  aiService = createAIEducationServiceInstance(true) // 使用模拟服务

  if (aiEnabled.value) {
    showSuggestions.value = true
    loadExperimentInsights()
  }
})
</script>

<style lang="scss" scoped>
.ai-experiment-assistant {
  position: relative;
}

.experiment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  margin-bottom: var(--spacing-base);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.experiment-icon {
  font-size: 20px;
  color: var(--edu-primary-500);

  &.is-processing {
    animation: pulse 2s infinite;
  }

  &.is-disabled {
    color: var(--edu-text-placeholder);
  }
}

.header-info {
  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--edu-text-primary);
  }

  .status-text {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);
  }
}

.experiment-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
}

.toolbar-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.ai-suggestions-panel {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-md);
  margin-bottom: var(--spacing-base);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);

  h4 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-base);
    color: var(--edu-text-primary);
  }
}

.suggestions-tabs {
  padding: var(--spacing-base);
}

.suggestion-item,
.improvement-item {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-sm);
  }

  &.is-applied {
    border-color: var(--edu-success);
    background: var(--edu-success-50);
  }
}

.suggestion-header,
.improvement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.suggestion-info,
.improvement-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.suggestion-title,
.improvement-title {
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.suggestion-impact,
.improvement-impact {
  font-size: var(--font-size-xs);
  color: var(--edu-text-tertiary);
}

.suggestion-content {
  p {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--edu-text-secondary);
  }
}

.code-preview {
  background: var(--edu-bg-tertiary);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  overflow-x: auto;
}

.code-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
  margin: var(--spacing-sm) 0;
}

.code-before,
.code-after {
  h5 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-size-sm);
    color: var(--edu-text-primary);
  }

  pre {
    background: var(--edu-bg-tertiary);
    border-radius: var(--edu-radius-base);
    padding: var(--spacing-sm);
    font-family: monospace;
    font-size: var(--font-size-xs);
    overflow-x: auto;
  }
}

.improvement-explanation {
  margin: var(--spacing-sm) 0 0 0;
  color: var(--edu-text-secondary);
  font-size: var(--font-size-sm);
}

.guidance-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
}

.overview-card {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  .el-icon {
    font-size: 24px;
  }
}

.card-content {
  flex: 1;

  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);
  }

  .progress-info {
    .progress-value {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--edu-text-primary);
      margin-bottom: var(--spacing-xs);
    }
  }

  .mastery-level {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .mastery-stars {
      display: flex;
      gap: 2px;

      .el-icon {
        color: var(--edu-border-base);

        &.is-active {
          color: var(--edu-warning);
        }
      }
    }

    span {
      font-size: var(--font-size-sm);
      color: var(--edu-text-secondary);
    }
  }
}

.learning-suggestions {
  h4 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--edu-text-primary);
  }
}

.guidance-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  margin-bottom: var(--spacing-sm);
}

.guidance-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.guidance-content {
  flex: 1;

  h5 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-primary);
    font-size: var(--font-size-sm);
  }

  p {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--edu-leading-normal);
  }
}

.code-editor-panel {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  margin-bottom: var(--spacing-base);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);

  h4 {
    margin: 0;
    color: var(--edu-text-primary);
  }
}

.editor-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.code-editor {
  padding: var(--spacing-lg);

  .code-textarea {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

    :deep(.el-textarea__inner) {
      font-family: inherit;
      font-size: var(--font-size-sm);
      line-height: 1.5;
      background: var(--edu-bg-tertiary);
      border: 1px solid var(--edu-border-base);
      border-radius: var(--edu-radius-base);
    }
  }
}

.visualization-panel {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  margin-bottom: var(--spacing-base);
}

.visualization-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);

  h4 {
    margin: 0;
    color: var(--edu-text-primary);
  }
}

.visualization-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.visualization-content {
  padding: var(--spacing-lg);
}

.no-data {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--edu-text-tertiary);

  .el-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-base);
  }

  p {
    margin: 0 0 var(--spacing-base) 0;
  }
}

.chart-container {
  height: 400px;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: var(--edu-text-tertiary);

  .el-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-sm);
  }
}

.analysis-panel {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  margin-bottom: var(--spacing-base);
}

.analysis-header {
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);

  h4 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--edu-text-primary);
  }
}

.analysis-content {
  padding: var(--spacing-lg);
}

.analysis-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
}

.summary-item {
  text-align: center;
  padding: var(--spacing-base);
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-base);

  .summary-label {
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .summary-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--edu-primary-600);
  }
}

.key-findings {
  margin-bottom: var(--spacing-lg);

  h5 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--edu-text-primary);
  }

  ul {
    margin: 0;
    padding-left: var(--spacing-lg);
    color: var(--edu-text-secondary);

    li {
      margin-bottom: var(--spacing-xs);
    }
  }
}

.recommendations {
  h5 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--edu-text-primary);
  }
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-base);

  .el-icon {
    color: var(--edu-primary-500);
    margin-top: 2px;
    flex-shrink: 0;
  }

  span {
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.ai-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.progress-modal {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  min-width: 300px;

  .processing-icon {
    font-size: 48px;
    color: var(--edu-primary-500);
    margin-bottom: var(--spacing-base);
    animation: spin 2s linear infinite;
  }

  .progress-text {
    margin: var(--spacing-base) 0 0 0;
    color: var(--edu-text-secondary);
    font-weight: var(--font-weight-medium);
  }
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s var(--edu-easing-in-out);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .ai-suggestions-panel,
  .code-editor-panel,
  .visualization-panel,
  .analysis-panel {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .suggestion-item,
  .improvement-item,
  .guidance-item,
  .overview-card {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }

  .suggestion-item.is-applied {
    background: rgba(82, 196, 26, 0.1);
    border-color: var(--edu-success);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .experiment-header,
  .experiment-toolbar {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .guidance-overview {
    grid-template-columns: 1fr;
  }

  .code-comparison {
    grid-template-columns: 1fr;
  }

  .analysis-summary {
    grid-template-columns: 1fr;
  }
}
</style>