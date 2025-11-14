<template>
  <div
    v-if="isVisible"
    class="ai-assistant-float"
    :class="{ 'is-docked': isDocked }"
  >
    <!-- 浮动按钮 -->
    <el-button
      type="primary"
      circle
      class="ai-float-btn"
      :class="{ active: isExpanded, 'has-notifications': hasNotifications }"
      @click="toggleExpanded"
    >
      <el-icon size="20">
        <MagicStick />
      </el-icon>
      <div v-if="hasNotifications" class="notification-dot"></div>
    </el-button>

    <!-- AI助手面板 -->
    <transition name="slide-up">
      <div
        v-if="isExpanded"
        class="ai-assistant-panel"
        :class="{ 'is-docked': isDocked }"
      >
        <div class="panel-header">
          <div class="panel-title">
            <el-icon><MagicStick /></el-icon>
            <span>AI教学助手</span>
            <el-tag v-if="isOnline" size="small" type="success">在线</el-tag>
            <el-tag v-else size="small" type="danger">离线</el-tag>
          </div>
          <div class="panel-actions">
            <el-tooltip :content="isDocked ? '取消固定' : '固定在右侧'">
              <el-button
                type="text"
                :icon="isDocked ? Fold : Expand"
                @click="toggleDocked"
              />
            </el-tooltip>
            <el-tooltip content="清空对话">
              <el-button type="text" :icon="Delete" @click="clearChat" />
            </el-tooltip>
            <el-tooltip content="设置">
              <el-button type="text" :icon="Setting" @click="openSettings" />
            </el-tooltip>
            <el-button type="text" :icon="Close" @click="toggleExpanded" />
          </div>
        </div>

        <!-- 快捷操作区域 -->
        <div class="quick-actions">
          <div class="quick-actions-title">快速提问</div>
          <div class="quick-actions-grid">
            <el-button
              v-for="action in quickActions"
              :key="action.id"
              size="small"
              :type="action.type"
              @click="sendQuickAction(action)"
            >
              <el-icon>
                <component :is="action.icon" />
              </el-icon>
              {{ action.label }}
            </el-button>
          </div>
        </div>

        <div class="panel-content">
          <!-- 消息列表 -->
          <el-scrollbar ref="scrollbarRef" class="message-list">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-item"
              :class="{ 'user-message': message.type === 'user' }"
            >
              <div class="message-avatar">
                <el-avatar
                  :size="32"
                  :src="message.type === 'user' ? userAvatar : aiAvatar"
                >
                  {{ message.type === 'user' ? '我' : 'AI' }}
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-text">
                  {{ message.content }}
                  <div v-if="message.suggestions" class="message-suggestions">
                    <el-button
                      v-for="suggestion in message.suggestions"
                      :key="suggestion"
                      size="small"
                      type="text"
                      @click="sendSuggestion(suggestion)"
                    >
                      {{ suggestion }}
                    </el-button>
                  </div>
                </div>
                <div class="message-meta">
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  <div class="message-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="copyMessage(message.content)"
                    >
                      复制
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="regenerateResponse(message.id)"
                    >
                      重新生成
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="message-item">
              <div class="message-avatar">
                <el-avatar :size="32" :src="aiAvatar">AI</el-avatar>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="loading-text">{{ loadingText }}</div>
              </div>
            </div>

            <!-- AI状态提示 -->
            <div v-if="!isOnline" class="ai-status-message">
              <el-alert
                title="AI助手当前离线"
                type="warning"
                description="正在尝试重新连接..."
                :closable="false"
                show-icon
              />
            </div>
          </el-scrollbar>

          <!-- 输入区域 -->
          <div class="input-area">
            <div class="input-toolbar">
              <el-tooltip content="添加附件">
                <el-button type="text" :icon="Paperclip" @click="attachFile" />
              </el-tooltip>
              <el-tooltip content="语音输入">
                <el-button
                  type="text"
                  :icon="Microphone"
                  :class="{ 'is-recording': isRecording }"
                  @click="toggleVoiceInput"
                />
              </el-tooltip>
              <el-tooltip content="表情">
                <el-button type="text" :icon="ChatDotRound" @click="insertEmoji" />
              </el-tooltip>
            </div>
            <div class="input-wrapper">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="2"
                placeholder="输入您的问题... (Shift+Enter换行，Enter发送)"
                :disabled="isLoading || !isOnline"
                @keydown.enter.prevent="handleEnter"
                @input="handleInput"
              />
              <div class="input-actions">
                <el-button
                  v-if="inputMessage.trim()"
                  type="primary"
                  :loading="isLoading"
                  :disabled="!inputMessage.trim() || !isOnline"
                  @click="sendMessage"
                >
                  发送
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 设置对话框 -->
    <el-dialog v-model="settingsVisible" title="AI助手设置" width="500px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="对话场景">
          <el-select v-model="settings.context" placeholder="选择对话场景">
            <el-option label="通用教学" value="general" />
            <el-option label="物理教学" value="physics" />
            <el-option label="化学教学" value="chemistry" />
            <el-option label="数学教学" value="math" />
            <el-option label="生物教学" value="biology" />
            <el-option label="作业批改" value="grading" />
            <el-option label="课程设计" value="planning" />
          </el-select>
        </el-form-item>
        <el-form-item label="回复风格">
          <el-select v-model="settings.style" placeholder="选择回复风格">
            <el-option label="专业严谨" value="professional" />
            <el-option label="轻松活泼" value="casual" />
            <el-option label="详细解释" value="detailed" />
            <el-option label="简洁明了" value="concise" />
          </el-select>
        </el-form-item>
        <el-form-item label="语音输入">
          <el-switch v-model="settings.voiceInput" />
        </el-form-item>
        <el-form-item label="消息通知">
          <el-switch v-model="settings.notifications" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { ElScrollbar, ElMessage } from 'element-plus'
import {
  MagicStick, Close, Delete, Setting, Paperclip, Microphone,
  ChatDotRound, Document, Edit, TrendCharts, QuestionFilled,
  Timer, Collection, DataLine, Expand, Fold
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { AIService, type AIProvider } from '@/services/ai'
import dayjs from 'dayjs'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: number
  suggestions?: string[]
}

interface QuickAction {
  id: string
  label: string
  icon: any
  type: string
  prompt: string
  context?: string
}

interface AISettings {
  context: string
  style: string
  voiceInput: boolean
  notifications: boolean
}

const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const isVisible = ref(true)
const isExpanded = ref(false)
const isDocked = ref(false)
const isOnline = ref(false)
const hasNotifications = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const isRecording = ref(false)
const loadingText = ref('正在思考...')
const settingsVisible = ref(false)
const conversationId = ref('default')

// 设置
const settings = ref<AISettings>({
  context: 'general',
  style: 'professional',
  voiceInput: false,
  notifications: true
})

// 消息历史
const messages = ref<Message[]>([
  {
    id: '1',
    type: 'assistant',
    content: '您好！我是您的AI教学助手。我可以帮助您解答教学问题、设计课程内容、批改作业等。请问有什么可以帮助您的吗？',
    timestamp: Date.now(),
    suggestions: ['如何提高学生的学习兴趣？', '怎样设计一个好的物理实验？', '如何批改数学作业更高效？']
  }
])

// 快捷操作
const quickActions = ref<QuickAction[]>([
  {
    id: '1',
    label: '教学建议',
    icon: 'Edit',
    type: 'primary',
    prompt: '请给我一些关于提高教学质量的具体建议',
    context: 'teaching'
  },
  {
    id: '2',
    label: '作业批改',
    icon: 'Document',
    type: 'success',
    prompt: '请帮我分析这份作业，提供批改建议',
    context: 'grading'
  },
  {
    id: '3',
    label: '数据分析',
    icon: 'DataLine',
    type: 'info',
    prompt: '请分析学生的学习数据，提供教学改进建议',
    context: 'analysis'
  },
  {
    id: '4',
    label: '答疑解惑',
    icon: 'QuestionFilled',
    type: 'warning',
    prompt: '',
    context: 'qa'
  },
  {
    id: '5',
    label: '课程设计',
    icon: 'Timer',
    type: 'default',
    prompt: '请帮我设计一堂课的教学流程',
    context: 'planning'
  },
  {
    id: '6',
    label: '学习资源',
    icon: 'Collection',
    type: 'default',
    prompt: '请推荐一些相关的教学资源',
    context: 'resources'
  }
])

// AI服务实例
let aiService: AIService | null = null

// Refs
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()

// 计算属性
const userAvatar = computed(() => userStore.userAvatar || '/default-avatar.png')
const aiAvatar = computed(() => '/ai-avatar.png')

// 生命周期
onMounted(() => {
  initializeAI()
  loadSettings()
  startHealthCheck()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    handleResize()
  }
})

onUnmounted(() => {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

// 初始化AI服务
const initializeAI = () => {
  try {
    const providers: Record<string, AIProvider> = {
      openai: {
        name: 'OpenAI',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo'
      },
      local: {
        name: 'Local AI',
        apiKey: 'local-key',
        baseUrl: import.meta.env.DEV ? '/ai/v1' : (import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:8080/v1'),
        model: 'llama-2-7b-chat'
      }
    }

    aiService = new AIService({
      providers,
      defaultProvider: 'local', // 优先使用本地AI
      requestTimeout: 30000,
      maxRetries: 3
    })

    checkAIHealth()
  } catch (error) {
    console.error('AI服务初始化失败:', error)
    isOnline.value = false
  }
}

// 健康检查定时器
let healthCheckTimer: NodeJS.Timeout | null = null

const startHealthCheck = () => {
  healthCheckTimer = setInterval(() => {
    checkAIHealth()
  }, 30000) // 每30秒检查一次
}

const checkAIHealth = async () => {
  if (aiService) {
    isOnline.value = await aiService.checkHealth()
  }
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('ai-assistant-settings')
  if (saved) {
    settings.value = { ...settings.value, ...JSON.parse(saved) }
  }
}

// 保存设置
const saveSettings = () => {
  localStorage.setItem('ai-assistant-settings', JSON.stringify(settings.value))
  settingsVisible.value = false
  ElMessage.success('设置已保存')
}

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    hasNotifications.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const toggleDocked = () => {
  isDocked.value = !isDocked.value
  if (isDocked.value) {
    isExpanded.value = true
    hasNotifications.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const handleResize = () => {
  if (typeof window === 'undefined') return
  if (window.innerWidth < 1024 && isDocked.value) {
    isDocked.value = false
  }
}

const scrollToBottom = () => {
  if (scrollbarRef.value) {
    const scrollWrapper = scrollbarRef.value.wrapRef
    if (scrollWrapper) {
      scrollWrapper.scrollTop = scrollWrapper.scrollHeight
    }
  }
}

const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('HH:mm')
}

const handleEnter = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    sendMessage()
  }
}

const handleInput = () => {
  // 可以在这里添加输入提示功能
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || !isOnline.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: inputMessage.value.trim(),
    timestamp: Date.now()
  }

  messages.value.push(userMessage)
  const messageContent = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true
  updateLoadingText()

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })

  try {
    if (!aiService) {
      throw new Error('AI服务未初始化')
    }

    // 构建上下文提示
    const systemPrompt = getSystemPrompt()

    const response = await aiService.sendMessage(
      messageContent,
      conversationId.value,
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500
      }
    )

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      suggestions: generateSuggestions(response.content)
    }

    messages.value.push(aiMessage)

    // 如果开启了通知，显示提示
    if (settings.value.notifications && !isExpanded.value) {
      hasNotifications.value = true
    }

  } catch (error) {
    console.error('发送消息失败:', error)

    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '抱歉，我现在无法回复您。请检查网络连接或稍后再试。',
      timestamp: Date.now()
    }

    messages.value.push(errorMessage)

    appStore.addNotification({
      type: 'error',
      title: 'AI助手',
      message: '发送消息失败，请稍后重试'
    })
  } finally {
    isLoading.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const getSystemPrompt = () => {
  const basePrompt = '你是一个专业的AI教学助手，专门帮助教师解决教学相关的问题。'

  const contextPrompts = {
    general: '请用专业、友好的语调回答通用的教学问题。',
    physics: '你是物理教学专家，请专注于物理教学方法、实验设计、概念解释等方面。',
    chemistry: '你是化学教学专家，请专注于化学实验教学、安全管理、概念讲解等方面。',
    math: '你是数学教学专家，请专注于数学概念解释、解题方法、教学策略等方面。',
    biology: '你是生物教学专家，请专注于生物实验、概念教学、生命科学教育等方面。',
    grading: '你是作业批改专家，请提供客观、建设性的批改建议和反馈。',
    planning: '你是课程设计专家，请帮助教师设计有效的教学计划和活动。'
  }

  const stylePrompts = {
    professional: '请使用专业、严谨的语言风格。',
    casual: '请使用轻松、友好的语言风格。',
    detailed: '请提供详细、深入的解释和例子。',
    concise: '请简洁明了地回答问题。'
  }

  return `${basePrompt} ${contextPrompts[settings.value.context as keyof typeof contextPrompts] || contextPrompts.general} ${stylePrompts[settings.value.style as keyof typeof stylePrompts] || stylePrompts.professional}`
}

const updateLoadingText = () => {
  const loadingTexts = [
    '正在思考...',
    '正在分析...',
    '正在整理答案...',
    '马上就好...'
  ]

  let index = 0
  const interval = setInterval(() => {
    if (!isLoading.value) {
      clearInterval(interval)
      return
    }
    loadingText.value = loadingTexts[index % loadingTexts.length]
    index++
  }, 800)
}

const generateSuggestions = (content: string): string[] => {
  // 基于AI回复内容生成相关问题建议
  const suggestions = []

  if (content.includes('实验') || content.includes('实验')) {
    suggestions.push('如何设计实验报告？', '实验安全注意事项有哪些？')
  }

  if (content.includes('作业') || content.includes('批改')) {
    suggestions.push('如何提高批改效率？', '怎样给出建设性反馈？')
  }

  if (content.includes('学生') || content.includes('教学')) {
    suggestions.push('如何调动学生积极性？', '课堂管理技巧有哪些？')
  }

  return suggestions.slice(0, 3) // 最多显示3个建议
}

const sendQuickAction = (action: QuickAction) => {
  if (action.prompt) {
    inputMessage.value = action.prompt
    sendMessage()
  } else {
    // 对于答疑解惑，让用户输入具体问题
    inputMessage.value = '我想了解关于'
  }
}

const sendSuggestion = (suggestion: string) => {
  inputMessage.value = suggestion
  sendMessage()
}

const clearChat = () => {
  messages.value = [
    {
      id: Date.now().toString(),
      type: 'assistant',
      content: '对话已清空。有什么可以帮助您的吗？',
      timestamp: Date.now()
    }
  ]

  if (aiService) {
    aiService.clearConversationHistory(conversationId.value)
  }
}

const openSettings = () => {
  settingsVisible.value = true
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const regenerateResponse = async (messageId: string) => {
  const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
  if (messageIndex === -1) return

  const userMessage = messages.value[messageIndex - 1]
  if (!userMessage || userMessage.type !== 'user') return

  // 移除原来的AI回复
  messages.value = messages.value.slice(0, messageIndex)

  // 重新发送
  isLoading.value = true
  try {
    if (!aiService) throw new Error('AI服务未初始化')

    const systemPrompt = getSystemPrompt()
    const response = await aiService.sendMessage(
      userMessage.content,
      conversationId.value,
      {
        systemPrompt,
        temperature: 0.8, // 稍微提高温度以获得不同的回复
        maxTokens: 1500
      }
    )

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      suggestions: generateSuggestions(response.content)
    }

    messages.value.splice(messageIndex, 0, newMessage)

  } catch (error) {
    console.error('重新生成回复失败:', error)
    ElMessage.error('重新生成失败，请稍后重试')
  } finally {
    isLoading.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 语音输入相关
const toggleVoiceInput = () => {
  if (!settings.value.voiceInput) {
    settings.value.voiceInput = true
    saveSettings()
  }

  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

const startRecording = () => {
  isRecording.value = true
  // 这里应该实现真实的语音识别逻辑
  ElMessage.info('语音输入功能开发中...')
  setTimeout(() => {
    isRecording.value = false
  }, 2000)
}

const stopRecording = () => {
  isRecording.value = false
}

const attachFile = () => {
  ElMessage.info('文件上传功能开发中...')
}

const insertEmoji = () => {
  ElMessage.info('表情功能开发中...')
}

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })
</script>

<style scoped>
.ai-assistant-float {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: var(--edu-z-toast);
}

.ai-assistant-float.is-docked {
  right: 0;
}

.ai-float-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--edu-gradient-primary);
  border: none;
  color: white;
  font-size: 24px;
  box-shadow: var(--edu-shadow-lg);
  transition: all 0.3s var(--edu-ease-bounce);
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--edu-shadow-xl);
  }

  &.active {
    transform: rotate(45deg);
  }

  &.has-notifications .notification-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: var(--edu-error);
    border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 34, 45, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0);
  }
}

.ai-assistant-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 420px;
  height: 600px;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-xl);
  border: 1px solid var(--edu-border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: var(--edu-glass-blur);
}

.ai-assistant-panel.is-docked {
  position: fixed;
  top: calc(var(--edu-header-height) + 16px);
  bottom: 24px;
  right: 0;
  height: auto;
  width: clamp(360px, 28vw, 460px);
  border-radius: var(--edu-radius-lg) 0 0 var(--edu-radius-lg);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  z-index: calc(var(--edu-z-toast) + 2);
  transform-origin: center right;
}

.ai-assistant-panel.is-docked.slide-up-enter-active,
.ai-assistant-panel.is-docked.slide-up-leave-active {
  transform-origin: center right;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);
  background: var(--edu-glass-bg);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 快捷操作区域 */
.quick-actions {
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);
}

.quick-actions-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.message-item {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);

  &.user-message {
    flex-direction: row-reverse;
  }
}

.message-content {
  flex: 1;
  max-width: 75%;
}

.message-text {
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-bg-tertiary);
  border-radius: var(--edu-radius-lg);
  color: var(--edu-text-primary);
  line-height: var(--edu-leading-normal);
  word-wrap: break-word;
  position: relative;

  .user-message & {
    background: var(--edu-gradient-primary);
    color: white;
  }
}

.message-suggestions {
  margin-top: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  .el-button {
    justify-content: flex-start;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    height: auto;
    min-height: 28px;
    border-radius: var(--edu-radius-base);
    border: 1px solid var(--edu-border-base);

    &:hover {
      background: var(--edu-primary-50);
      border-color: var(--edu-primary-200);
      color: var(--edu-primary-600);
    }
  }
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--spacing-xs);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--edu-text-placeholder);
}

.message-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.2s var(--edu-ease-in-out);

  .message-item:hover & {
    opacity: 1;
  }

  .el-button {
    padding: 2px var(--spacing-xs);
    font-size: var(--font-size-xs);
    height: auto;
    min-height: 20px;
  }
}

.typing-indicator {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-bg-tertiary);
  border-radius: var(--edu-radius-lg);
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--edu-primary-500);
  animation: typing 1.4s infinite ease-in-out;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
}

.loading-text {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  font-style: italic;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.ai-status-message {
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-base);
}

.input-area {
  padding: var(--spacing-base);
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-glass-bg);
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--edu-border-light);

  .el-button {
    padding: var(--spacing-xs);
    border-radius: var(--edu-radius-base);
    transition: all 0.2s var(--edu-ease-in-out);

    &:hover {
      background: var(--edu-bg-tertiary);
    }

    &.is-recording {
      color: var(--edu-error);
      background: rgba(245, 34, 45, 0.1);
      animation: recording-pulse 1.5s infinite;
    }
  }
}

@keyframes recording-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(245, 34, 45, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0);
  }
}

.input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
}

.input-actions {
  flex-shrink: 0;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: var(--edu-gradient-primary);
  color: white;
  padding: var(--spacing-lg);
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: var(--font-weight-semibold);
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  &:hover {
    color: var(--edu-text-placeholder);
  }
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s var(--edu-ease-out);
  transform-origin: bottom right;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .ai-assistant-panel {
    width: 380px;
    height: 550px;
  }
}

@media (max-width: 768px) {
  .ai-assistant-float {
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
  }

  .ai-assistant-panel {
    width: calc(100vw - calc(var(--spacing-lg) * 2));
    right: calc(var(--spacing-lg) * -1);
    left: var(--spacing-lg);
    height: 70vh;
    max-height: 600px;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .message-content {
    max-width: 85%;
  }

  .input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .input-actions {
    width: 100%;
    margin-top: var(--spacing-sm);

    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .ai-assistant-panel {
    width: calc(100vw - calc(var(--spacing-base) * 2));
    left: var(--spacing-base);
    right: var(--spacing-base);
    bottom: 80px;
    height: 75vh;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    padding: var(--spacing-sm) var(--spacing-base);
  }

  .quick-actions {
    padding: var(--spacing-sm) var(--spacing-base);
  }

  .message-list {
    padding: var(--spacing-base);
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .ai-assistant-panel {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .panel-header {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--edu-border-dark);
  }

  .quick-actions {
    background: rgba(255, 255, 255, 0.03);
    border-color: var(--edu-border-dark);
  }

  .input-area {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--edu-border-dark);
  }

  .input-toolbar {
    border-color: var(--edu-border-dark);
  }

  .message-text {
    background: rgba(255, 255, 255, 0.08);
    color: var(--edu-text-primary);

    .user-message & {
      background: var(--edu-primary-600);
    }
  }

  .typing-indicator {
    background: rgba(255, 255, 255, 0.08);
  }

  .input-toolbar .el-button {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .message-suggestions .el-button {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--edu-border-dark);
    color: var(--edu-text-primary);

    &:hover {
      background: var(--edu-primary-900);
      border-color: var(--edu-primary-700);
      color: var(--edu-primary-200);
    }
  }
}

/* 无障碍优化 */
.ai-float-btn:focus-visible {
  outline: 2px solid var(--edu-primary-500);
  outline-offset: 2px;
}

.message-text:focus-visible {
  outline: 2px solid var(--edu-primary-500);
  outline-offset: 2px;
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .ai-float-btn,
  .typing-indicator span,
  .slide-up-enter-active,
  .slide-up-leave-active {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .ai-float-btn:hover {
    transform: none;
  }

  .notification-dot {
    animation: none;
  }
}
</style>
