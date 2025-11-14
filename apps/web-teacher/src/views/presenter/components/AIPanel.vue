<template>
  <div class="ai-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3 class="panel-title">
        <el-icon><MagicStick /></el-icon>
        AI 教学助手
      </h3>
      <div class="ai-status">
        <el-tag :type="aiStatus.type" size="small">
          {{ aiStatus.text }}
        </el-tag>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-button-group>
        <el-button
          size="small"
          @click="generateQuestion"
          :loading="isGenerating.question"
        >
          <el-icon><QuestionFilled /></el-icon>
          提问
        </el-button>
        <el-button
          size="small"
          @click="generateHint"
          :loading="isGenerating.hint"
        >
          <el-icon><Lightbulb /></el-icon>
          提示
        </el-button>
        <el-button
          size="small"
          @click="generateSummary"
          :loading="isGenerating.summary"
        >
          <el-icon><Document /></el-icon>
          总结
        </el-button>
        <el-button
          size="small"
          @click="analyzeEngagement"
          :loading="isGenerating.analysis"
        >
          <el-icon><TrendCharts /></el-icon>
          分析
        </el-button>
      </el-button-group>
    </div>

    <!-- AI 建议列表 -->
    <div class="suggestions-container">
      <div class="suggestions-header">
        <h4>教学建议</h4>
        <el-button size="small" @click="refreshSuggestions" :loading="isRefreshing">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>

      <div class="suggestions-list" ref="suggestionsList">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="suggestion.id"
          class="suggestion-item"
          :class="getSuggestionClass(suggestion)"
        >
          <div class="suggestion-header">
            <div class="suggestion-meta">
              <el-tag :type="suggestion.type" size="small">
                {{ getSuggestionTypeLabel(suggestion.type) }}
              </el-tag>
              <span class="suggestion-time">{{ formatTime(suggestion.timestamp) }}</span>
            </div>
            <div class="suggestion-actions">
              <el-button
                size="small"
                text
                @click="applySuggestion(suggestion)"
                :disabled="suggestion.applied"
              >
                <el-icon><Check /></el-icon>
                {{ suggestion.applied ? '已采纳' : '采纳' }}
              </el-button>
              <el-button
                size="small"
                text
                @click="dismissSuggestion(index)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="suggestion-content">
            <div class="suggestion-text">{{ suggestion.content }}</div>
            <div v-if="suggestion.reason" class="suggestion-reason">
              <span class="reason-label">原因:</span>
              {{ suggestion.reason }}
            </div>
            <div v-if="suggestion.action" class="suggestion-action">
              <el-button
                size="small"
                type="primary"
                @click="executeAction(suggestion)"
              >
                {{ suggestion.action }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="suggestions.length === 0" class="empty-suggestions">
        <el-empty description="暂无AI建议，系统正在分析课堂情况...">
          <el-button type="primary" @click="refreshSuggestions">
            立即分析
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 实时洞察 -->
    <div class="insights-section">
      <h4>实时洞察</h4>
      <div class="insights-grid">
        <div class="insight-card" v-for="insight in insights" :key="insight.id">
          <div class="insight-icon" :class="`insight-${insight.type}`">
            <el-icon><component :is="getInsightIcon(insight.type)" /></el-icon>
          </div>
          <div class="insight-content">
            <div class="insight-title">{{ insight.title }}</div>
            <div class="insight-description">{{ insight.description }}</div>
            <div class="insight-value" v-if="insight.value">{{ insight.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话历史 -->
    <div class="chat-section">
      <div class="chat-header">
        <h4>对话历史</h4>
        <el-button size="small" @click="clearChatHistory">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>

      <div class="chat-messages" ref="chatMessages">
        <div
          v-for="(message, index) in chatHistory"
          :key="index"
          class="chat-message"
          :class="message.role"
        >
          <div class="message-avatar">
            <el-avatar :size="32" v-if="message.role === 'ai'">
              <el-icon><MagicStick /></el-icon>
            </el-avatar>
            <el-avatar :size="32" v-else>
              <el-icon><User /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="chatInput"
          type="textarea"
          :rows="2"
          placeholder="向AI助手提问..."
          @keydown.ctrl.enter.exact="sendMessage"
          @keydown.meta.enter.exact="sendMessage"
          maxlength="200"
          show-word-limit
        />
        <el-button
          type="primary"
          @click="sendMessage"
          :disabled="!chatInput.trim()"
          :loading="isSending"
        >
          发送
        </el-button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-section">
      <h4>AI 设置</h4>
      <div class="settings-form">
        <el-form :model="aiSettings" label-width="100px" size="small">
          <el-form-item label="自动建议">
            <el-switch v-model="aiSettings.autoSuggestions" />
          </el-form-item>
          <el-form-item label="建议频率">
            <el-slider
              v-model="aiSettings.suggestionFrequency"
              :min="1"
              :max="10"
              :step="1"
              show-stops
              show-input
              :input-size="'small'"
            />
          </el-form-item>
          <el-form-item label="分析深度">
            <el-select v-model="aiSettings.analysisDepth" style="width: 100%">
              <el-option label="基础" value="basic" />
              <el-option label="详细" value="detailed" />
              <el-option label="深度" value="deep" />
            </el-select>
          </el-form-item>
          <el-form-item label="语言风格">
            <el-select v-model="aiSettings.languageStyle" style="width: 100%">
              <el-option label="正式" value="formal" />
              <el-option label="友好" value="friendly" />
              <el-option label="简洁" value="concise" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  QuestionFilled,
  Lightbulb,
  Document,
  TrendCharts,
  Check,
  Close,
  Refresh,
  Delete,
  User,
  Warning,
  CircleCheck,
  InfoFilled
} from '@element-plus/icons-vue'

interface AISuggestion {
  id: string
  type: 'question' | 'hint' | 'summary' | 'engagement' | 'pace' | 'content'
  content: string
  reason?: string
  action?: string
  applied: boolean
  timestamp: number
  priority: 'low' | 'medium' | 'high'
}

interface Insight {
  id: string
  type: 'engagement' | 'comprehension' | 'pace' | 'interaction'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  timestamp: number
}

interface Props {
  lessonId: string
  currentSection?: any
  studentData?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  suggestionApplied: [suggestion: AISuggestion]
  message: [content: string]
  action: [action: string, data: any]
}>()

// 响应式数据
const suggestionsList = ref<HTMLElement>()
const chatMessages = ref<HTMLElement>()

const suggestions = ref<AISuggestion[]>([])
const insights = ref<Insight[]>([])
const chatHistory = ref<ChatMessage[]>([])
const chatInput = ref('')

const isGenerating = ref({
  question: false,
  hint: false,
  summary: false,
  analysis: false
})

const isSending = ref(false)
const isRefreshing = ref(false)

const aiStatus = ref({
  type: 'info',
  text: '就绪'
})

const aiSettings = ref({
  autoSuggestions: true,
  suggestionFrequency: 5,
  analysisDepth: 'detailed',
  languageStyle: 'friendly'
})

let suggestionInterval: NodeJS.Timeout | null = null

// 计算属性
const getSuggestionClass = (suggestion: AISuggestion): string => {
  const classes = [`suggestion-${suggestion.type}`]

  if (suggestion.applied) classes.push('applied')
  if (suggestion.priority === 'high') classes.push('high-priority')
  if (suggestion.priority === 'medium') classes.push('medium-priority')

  return classes.join(' ')
}

const getSuggestionTypeLabel = (type: string): string => {
  const labels = {
    question: '提问',
    hint: '提示',
    summary: '总结',
    engagement: '互动',
    pace: '节奏',
    content: '内容'
  }
  return labels[type as keyof typeof labels] || type
}

const getInsightIcon = (type: string) => {
  const icons = {
    engagement: User,
    comprehension: CircleCheck,
    pace: TrendCharts,
    interaction: Warning
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

// 方法
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const generateQuestion = async () => {
  isGenerating.value.question = true
  aiStatus.value = { type: 'warning', text: '思考中...' }

  try {
    // 模拟AI生成问题
    await new Promise(resolve => setTimeout(resolve, 2000))

    const questions = [
      '谁能用自己的话解释一下刚才学习的核心概念？',
      '这个知识点在现实生活中有哪些应用场景？',
      '如果让你向朋友解释今天的内容，你会怎么说？',
      '这个概念和我们之前学过的内容有什么联系？',
      '你认为掌握这个知识点最重要的关键是什么？'
    ]

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

    const suggestion: AISuggestion = {
      id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'question',
      content: randomQuestion,
      reason: '基于当前学习内容生成的启发性问题',
      action: '向全班提问',
      applied: false,
      timestamp: Date.now(),
      priority: 'medium'
    }

    suggestions.value.unshift(suggestion)
    aiStatus.value = { type: 'success', text: '就绪' }

    ElMessage.success('AI问题已生成')

  } catch (error) {
    console.error('生成问题失败:', error)
    ElMessage.error('AI问题生成失败')
    aiStatus.value = { type: 'error', text: '错误' }
  } finally {
    isGenerating.value.question = false
  }
}

const generateHint = async () => {
  isGenerating.value.hint = true
  aiStatus.value = { type: 'warning', text: '分析中...' }

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const hints = [
      '可以结合一个简单的例子来帮助学生理解这个概念',
      '建议先让学生分组讨论2分钟，然后请代表发言',
      '可以准备一个简短的动画或图示来辅助说明',
      '注意观察学生的表情，如有困惑及时调整讲解方式',
      '可以联系学生的生活经验，让抽象概念更具体'
    ]

    const randomHint = hints[Math.floor(Math.random() * hints.length)]

    const suggestion: AISuggestion = {
      id: `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'hint',
      content: randomHint,
      reason: '基于当前教学进度和学生学习情况的建议',
      applied: false,
      timestamp: Date.now(),
      priority: 'high'
    }

    suggestions.value.unshift(suggestion)
    aiStatus.value = { type: 'success', text: '就绪' }

    ElMessage.success('AI提示已生成')

  } catch (error) {
    console.error('生成提示失败:', error)
    ElMessage.error('AI提示生成失败')
    aiStatus.value = { type: 'error', text: '错误' }
  } finally {
    isGenerating.value.hint = false
  }
}

const generateSummary = async () => {
  isGenerating.value.summary = true
  aiStatus.value = { type: 'warning', text: '总结中...' }

  try {
    await new Promise(resolve => setTimeout(resolve, 2500))

    const summary = `
根据当前教学情况，本节课的重点内容是：
1. 核心概念的理解和应用
2. 学生参与度较高，互动积极
3. 大部分学生能够跟上教学节奏
4. 建议在下节课前进行简短复习
    `

    const suggestion: AISuggestion = {
      id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'summary',
      content: summary.trim(),
      reason: '基于课堂实时数据生成的教学总结',
      action: '生成课堂报告',
      applied: false,
      timestamp: Date.now(),
      priority: 'medium'
    }

    suggestions.value.unshift(suggestion)
    aiStatus.value = { type: 'success', text: '就绪' }

    ElMessage.success('AI总结已生成')

  } catch (error) {
    console.error('生成总结失败:', error)
    ElMessage.error('AI总结生成失败')
    aiStatus.value = { type: 'error', text: '错误' }
  } finally {
    isGenerating.value.summary = false
  }
}

const analyzeEngagement = async () => {
  isGenerating.value.analysis = true
  aiStatus.value = { type: 'warning', text: '分析中...' }

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 生成洞察
    insights.value = [
      {
        id: 'engagement_1',
        type: 'engagement',
        title: '学生参与度',
        description: '当前学生参与度为85%，高于平均水平',
        value: '85%',
        trend: 'up'
      },
      {
        id: 'comprehension_1',
        type: 'comprehension',
        title: '理解程度',
        description: '约75%的学生理解了核心概念',
        value: '75%',
        trend: 'stable'
      },
      {
        id: 'pace_1',
        type: 'pace',
        title: '教学节奏',
        description: '节奏适中，建议保持当前速度',
        value: '正常',
        trend: 'stable'
      },
      {
        id: 'interaction_1',
        type: 'interaction',
        title: '互动频率',
        description: '每3分钟一次互动，频率良好',
        value: '良好',
        trend: 'up'
      }
    ]

    const suggestion: AISuggestion = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'engagement',
      content: '课堂整体表现良好，建议继续保持当前的互动频率和教学节奏。可以适当增加一些小组讨论活动来提高学生参与度。',
      reason: '基于学生行为数据和课堂互动分析',
      action: '查看详细报告',
      applied: false,
      timestamp: Date.now(),
      priority: 'medium'
    }

    suggestions.value.unshift(suggestion)
    aiStatus.value = { type: 'success', text: '就绪' }

    ElMessage.success('AI分析已完成')

  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('AI分析失败')
    aiStatus.value = { type: 'error', text: '错误' }
  } finally {
    isGenerating.value.analysis = false
  }
}

const refreshSuggestions = async () => {
  isRefreshing.value = true
  aiStatus.value = { type: 'warning', text: '刷新中...' }

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 生成新的建议
    await generateEngagement()

    ElMessage.success('AI建议已更新')

  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败')
  } finally {
    isRefreshing.value = false
  }
}

const applySuggestion = (suggestion: AISuggestion) => {
  suggestion.applied = true
  emit('suggestionApplied', suggestion)

  if (suggestion.action) {
    executeAction(suggestion)
  }

  ElMessage.success('建议已采纳')
}

const dismissSuggestion = (index: number) => {
  suggestions.value.splice(index, 1)
}

const executeAction = (suggestion: AISuggestion) => {
  emit('action', suggestion.action || 'unknown', suggestion)
  ElMessage.info(`执行操作: ${suggestion.action}`)
}

const sendMessage = async () => {
  if (!chatInput.value.trim()) return

  const userMessage: ChatMessage = {
    role: 'user',
    content: chatInput.value.trim(),
    timestamp: Date.now()
  }

  chatHistory.value.push(userMessage)
  const tempInput = chatInput.value
  chatInput.value = ''

  isSending.value = true

  try {
    // 模拟AI回复
    await new Promise(resolve => setTimeout(resolve, 2000))

    const aiResponse = await generateAIResponse(tempInput)

    const aiMessage: ChatMessage = {
      role: 'ai',
      content: aiResponse,
      timestamp: Date.now()
    }

    chatHistory.value.push(aiMessage)
    emit('message', aiResponse)

    // 滚动到底部
    nextTick(() => {
      if (chatMessages.value) {
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight
      }
    })

  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('消息发送失败')
  } finally {
    isSending.value = false
  }
}

const generateAIResponse = async (userMessage: string): Promise<string> => {
  // 简单的AI回复逻辑
  const responses = [
    '这是一个很好的问题。根据当前的教学内容，我建议...',
    '我理解您的想法。基于课堂情况，可以考虑...',
    '感谢您的反馈。这个建议很有价值，我们可以...',
    '这是一个重要的观察。为了改善教学效果，建议...',
    '我明白您的需求。根据学生们的学习状态，推荐...'
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

const clearChatHistory = () => {
  chatHistory.value = []
  ElMessage.success('对话历史已清空')
}

const startAutoSuggestions = () => {
  if (!aiSettings.value.autoSuggestions) return

  const interval = (11 - aiSettings.value.suggestionFrequency) * 60000 // 转换为分钟

  suggestionInterval = setInterval(() => {
    if (Math.random() > 0.5) {
      generateInsight()
    }
  }, interval)
}

const stopAutoSuggestions = () => {
  if (suggestionInterval) {
    clearInterval(suggestionInterval)
    suggestionInterval = null
  }
}

const generateInsight = async () => {
  const insightTypes = ['engagement', 'comprehension', 'pace', 'interaction']
  const type = insightTypes[Math.floor(Math.random() * insightTypes.length)]

  const insightsData = {
    engagement: [
      { title: '参与度提升', description: '学生参与度比上次提升了10%' },
      { title: '注意力集中', description: '大部分学生保持专注状态' }
    ],
    comprehension: [
      { title: '理解良好', description: '学生回答问题的正确率达到85%' },
      { title: '需要巩固', description: '部分学生对概念理解不够深入' }
    ],
    pace: [
      { title: '节奏适中', description: '教学节奏与学生学习速度匹配' },
      { title: '稍微加快', description: '可以适当加快教学节奏' }
    ],
    interaction: [
      { title: '互动积极', description: '学生主动提问和参与讨论' },
      { title: '互动良好', description: '师生互动频率合理' }
    ]
  }

  const data = insightsData[type as keyof typeof insightsData]
  const selectedData = data[Math.floor(Math.random() * data.length)]

  const insight: Insight = {
    id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type as Insight['type'],
    title: selectedData.title,
    description: selectedData.description,
    value: Math.floor(Math.random() * 30 + 70) + '%'
  }

  insights.value.unshift(insight)
  if (insights.value.length > 4) {
    insights.value = insights.value.slice(0, 4)
  }
}

// 生命周期
onMounted(() => {
  // 初始化一些基础洞察
  insights.value = [
    {
      id: 'initial_1',
      type: 'engagement',
      title: '课堂状态',
      description: '课堂已开始，学生正在进入学习状态',
      value: '准备中'
    }
  ]

  // 启动自动建议
  startAutoSuggestions()
})

onUnmounted(() => {
  stopAutoSuggestions()
})

// 监听设置变化
watch(() => aiSettings.value.autoSuggestions, (newValue) => {
  if (newValue) {
    startAutoSuggestions()
  } else {
    stopAutoSuggestions()
  }
})
</script>

<style lang="scss" scoped>
.ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.quick-actions {
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.suggestions-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.suggestions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.suggestion-item {
  margin: 0 12px 8px 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  }

  &.high-priority {
    border-left: 3px solid #f56c6c;
  }

  &.medium-priority {
    border-left: 3px solid #e6a23c;
  }

  &.applied {
    background: #f0f9ff;
    opacity: 0.7;
  }
}

.suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.suggestion-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestion-time {
  font-size: 12px;
  color: #909399;
}

.suggestion-actions {
  display: flex;
  gap: 4px;
}

.suggestion-content {
  .suggestion-text {
    font-size: 14px;
    color: #303133;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .suggestion-reason {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;

    .reason-label {
      font-weight: 500;
    }
  }

  .suggestion-action {
    margin-top: 8px;
  }
}

.empty-suggestions {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.insights-section {
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.insight-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;

  .insight-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.insight-engagement {
      background: #67c23a;
    }

    &.insight-comprehension {
      background: #409eff;
    }

    &.insight-pace {
      background: #e6a23c;
    }

    &.insight-interaction {
      background: #f56c6c;
    }
  }

  .insight-content {
    flex: 1;

    .insight-title {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }

    .insight-description {
      font-size: 12px;
      color: #606266;
      margin-bottom: 4px;
    }

    .insight-value {
      font-size: 12px;
      font-weight: 600;
      color: #409eff;
    }
  }
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  min-height: 200px;
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: #409eff;
      color: white;
    }
  }

  &.ai {
    .message-content {
      background: #fff;
      border: 1px solid #e4e7ed;
    }
  }
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;

  .message-text {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .message-time {
    font-size: 11px;
    opacity: 0.7;
  }
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e4e7ed;
}

.settings-section {
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #e4e7ed;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.settings-form {
  .el-form-item {
    margin-bottom: 12px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-actions {
    .el-button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .el-button {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .chat-message {
    .message-content {
      max-width: 85%;
    }
  }

  .suggestion-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>