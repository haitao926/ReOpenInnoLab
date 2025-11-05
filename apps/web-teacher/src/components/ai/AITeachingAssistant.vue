<template>
  <div class="ai-teaching-assistant" :class="{ 'ai-teaching-assistant--collapsed': isCollapsed }">
    <!-- 助教头部 -->
    <header class="assistant-header">
      <div class="assistant-info">
        <div class="assistant-avatar">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="assistant-details">
          <h3 class="assistant-name">AI 助教</h3>
          <div class="assistant-status">
            <span class="status-dot" :class="{ 'status-dot--online': isOnline }"></span>
            <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button
          type="text"
          size="small"
          @click="toggleCollapse"
          :aria-label="isCollapsed ? '展开助教面板' : '折叠助教面板'"
        >
          <el-icon>
            <component :is="isCollapsed ? Expand : Fold" />
          </el-icon>
        </el-button>
      </div>
    </header>

    <!-- 聊天内容区域 -->
    <div v-show="!isCollapsed" class="assistant-content">
      <!-- 快捷操作 -->
      <div class="quick-actions" role="toolbar" aria-label="快捷操作">
        <h4 class="quick-actions-title">快捷提问</h4>
        <div class="quick-actions-grid">
          <button
            v-for="action in quickActions"
            :key="action.id"
            class="quick-action-btn"
            @click="handleQuickAction(action)"
            :aria-label="`快速提问：${action.label}`"
          >
            <el-icon><component :is="action.icon" /></el-icon>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer" role="log" aria-label="聊天消息">
        <div
          v-for="(message, index) in messages"
          :key="message.id"
          class="message-item"
          :class="`message-item--${message.type}`"
          role="article"
          :aria-label="`${message.type === 'user' ? '您' : 'AI助教'}: ${message.content.substring(0, 50)}...`"
        >
          <div class="message-avatar">
            <el-icon v-if="message.type === 'user'"><User /></el-icon>
            <el-icon v-else><Robot /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{{ message.type === 'user' ? '您' : 'AI助教' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div v-if="message.attachments" class="message-attachments">
              <div
                v-for="attachment in message.attachments"
                :key="attachment.id"
                class="attachment-item"
                @click="openAttachment(attachment)"
              >
                <el-icon><component :is="getAttachmentIcon(attachment.type)" /></el-icon>
                <span>{{ attachment.name }}</span>
              </div>
            </div>
            <div v-if="message.type === 'assistant'" class="message-actions">
              <el-button
                type="text"
                size="small"
                @click="copyMessage(message.content)"
                aria-label="复制消息"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="regenerateResponse(index)"
                :loading="isRegenerating"
                aria-label="重新生成回复"
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
              <el-dropdown @command="(action) => handleMessageAction(action, message)">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="like">
                      <el-icon><Like /></el-icon>
                      有帮助
                    </el-dropdown-item>
                    <el-dropdown-item command="dislike">
                      <el-icon><Dislike /></el-icon>
                      没帮助
                    </el-dropdown-item>
                    <el-dropdown-item command="report">
                      <el-icon><Warning /></el-icon>
                      举报问题
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- 输入状态指示器 -->
        <div v-if="isTyping" class="typing-indicator">
          <div class="typing-avatar">
            <el-icon><Robot /></el-icon>
          </div>
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-toolbar">
          <el-button
            type="text"
            size="small"
            @click="attachFile"
            :disabled="isTyping"
            aria-label="添加附件"
          >
            <el-icon><Paperclip /></el-icon>
          </el-button>
          <el-button
            type="text"
            size="small"
            @click="voiceInput"
            :disabled="isTyping"
            aria-label="语音输入"
          >
            <el-icon><Microphone /></el-icon>
          </el-button>
          <el-button
            type="text"
            size="small"
            @click="openSettings"
            aria-label="设置"
          >
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
        <div class="input-container">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入您的问题..."
            @keydown="handleInputKeydown"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            :disabled="isTyping"
            aria-label="消息输入框"
          />
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="isTyping"
            :disabled="!inputMessage.trim()"
            aria-label="发送消息"
          >
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
        <div class="input-suggestions" v-if="suggestions.length > 0 && showSuggestions">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            @click="applySuggestion(suggestion)"
          >
            {{ suggestion.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="AI 助教设置"
      width="500px"
    >
      <div class="settings-content">
        <el-form :model="settings" label-width="120px">
          <el-form-item label="回复风格">
            <el-select v-model="settings.responseStyle">
              <el-option label="专业正式" value="professional" />
              <el-option label="友好亲切" value="friendly" />
              <el-option label="简洁明了" value="concise" />
              <el-option label="详细解释" value="detailed" />
            </el-select>
          </el-form-item>
          <el-form-item label="学科专长">
            <el-select v-model="settings.expertise" multiple>
              <el-option
                v-for="subject in availableSubjects"
                :key="subject.value"
                :label="subject.label"
                :value="subject.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="快捷回复">
            <el-switch v-model="settings.enableQuickReplies" />
          </el-form-item>
          <el-form-item label="语音输入">
            <el-switch v-model="settings.enableVoiceInput" />
          </el-form-item>
          <el-form-item label="消息记忆">
            <el-slider
              v-model="settings.messageMemory"
              :min="10"
              :max="100"
              :step="10"
              show-stops
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Expand,
  Fold,
  User,
  Robot,
  DocumentCopy,
  Refresh,
  MoreFilled,
  Like,
  Dislike,
  Warning,
  Paperclip,
  Microphone,
  Setting,
  Promotion,
  Edit,
  TrendCharts,
  QuestionFilled,
  Search,
  Bell
} from '@element-plus/icons-vue'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Array<{
    id: string
    name: string
    type: string
    url: string
  }>
}

interface QuickAction {
  id: string
  label: string
  icon: string
  prompt: string
}

interface Suggestion {
  id: string
  text: string
  type: string
}

interface AssistantSettings {
  responseStyle: string
  expertise: string[]
  enableQuickReplies: boolean
  enableVoiceInput: boolean
  messageMemory: number
}

const props = defineProps<{
  initialContext?: any
  initialMessages?: ChatMessage[]
}>()

const emit = defineEmits<{
  'message-sent': [message: ChatMessage]
  'message-received': [message: ChatMessage]
  'action-triggered': [action: string, data: any]
}>()

// 响应式数据
const isCollapsed = ref(false)
const isOnline = ref(true)
const isTyping = ref(false)
const isRegenerating = ref(false)
const showSuggestions = ref(false)
const showSettings = ref(false)

const messages = ref<ChatMessage[]>(props.initialMessages || [])
const inputMessage = ref('')
const suggestions = ref<Suggestion[]>([])

const messagesContainer = ref<HTMLElement>()

const settings = ref<AssistantSettings>({
  responseStyle: 'professional',
  expertise: [],
  enableQuickReplies: true,
  enableVoiceInput: false,
  messageMemory: 50
})

// 快捷操作
const quickActions = ref<QuickAction[]>([
  {
    id: 'explain-concept',
    label: '解释概念',
    icon: 'Edit',
    prompt: '请详细解释这个概念：'
  },
  {
    id: 'generate-exercise',
    label: '生成练习',
    icon: 'TrendCharts',
    prompt: '请为这个主题生成一些练习题：'
  },
  {
    id: 'analyze-student',
    label: '分析学生',
    icon: 'User',
    prompt: '请分析学生的学习情况：'
  },
  {
    id: 'suggest-activity',
    label: '建议活动',
    icon: 'QuestionFilled',
    prompt: '请为这堂课建议一些互动活动：'
  },
  {
    id: 'search-resource',
    label: '搜索资源',
    icon: 'Search',
    prompt: '请帮我搜索相关的教学资源：'
  },
  {
    id: 'schedule-reminder',
    label: '设置提醒',
    icon: 'Bell',
    prompt: '请帮我设置教学提醒：'
  }
])

const availableSubjects = ref([
  { label: '数学', value: 'math' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物', value: 'biology' },
  { label: '语文', value: 'language' },
  { label: '英语', value: 'english' }
])

// 计算属性
const hasMessages = computed(() => messages.value.length > 0)

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleQuickAction = (action: QuickAction) => {
  inputMessage.value = action.prompt
  showSuggestions.value = true
  generateSuggestions(action.prompt)
}

const generateSuggestions = async (prompt: string) => {
  try {
    // 模拟 AI 建议
    const mockSuggestions: Suggestion[] = [
      { id: '1', text: prompt + '二次函数的基本概念', type: 'concept' },
      { id: '2', text: prompt + '函数的图像与性质', type: 'concept' },
      { id: '3', text: prompt + '函数的实际应用', type: 'application' }
    ]

    suggestions.value = mockSuggestions
  } catch (error) {
    console.error('生成建议失败:', error)
  }
}

const applySuggestion = (suggestion: Suggestion) => {
  inputMessage.value = suggestion.text
  showSuggestions.value = false
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    type: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  emit('message-sent', userMessage)

  const messageContent = inputMessage.value
  inputMessage.value = ''
  showSuggestions.value = false

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 模拟 AI 回复
  isTyping.value = true
  setTimeout(async () => {
    try {
      const aiResponse = await generateAIResponse(messageContent)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }

      messages.value.push(assistantMessage)
      emit('message-received', assistantMessage)

      await nextTick()
      scrollToBottom()
    } catch (error) {
      ElMessage.error('发送消息失败，请重试')
    } finally {
      isTyping.value = false
    }
  }, 1500)
}

const generateAIResponse = async (message: string): Promise<string> => {
  // 模拟 AI 响应生成
  const responses = [
    '这是一个很好的问题。根据我的分析，我建议您可以从以下几个方面来考虑：\n\n1. 首先，我们需要理解这个概念的核心要点\n2. 其次，考虑如何将其应用到实际教学中\n3. 最后，评估学生的学习效果\n\n如果您需要更详细的解释，请告诉我具体哪个部分需要进一步说明。',
    '基于您的教学情况，我为您推荐以下方法：\n\n**教学方法**：\n- 采用互动式教学，提高学生参与度\n- 使用多媒体辅助教学，增强理解\n- 设计实践练习，巩固知识点\n\n**注意事项**：\n- 关注学生的反馈\n- 根据实际情况调整教学节奏\n- 定期评估学习效果\n\n这些方法应该能够帮助您更好地完成教学任务。',
    '我理解您的需求。让我为您提供一些建议：\n\n**教学策略**：\n• 建立清晰的学习目标\n• 设计循序渐进的课程内容\n• 提供充足的练习机会\n\n**评估方式**：\n• 形成性评估：课堂小测、作业\n• 总结性评估：单元测试、项目作业\n• 多维度评估：知识掌握、应用能力、创新思维\n\n希望这些建议对您有帮助！'
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleInputFocus = () => {
  if (inputMessage.value.trim()) {
    showSuggestions.value = true
  }
}

const handleInputBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessage = (content: string): string => {
  // 简单的消息格式化，将换行符转换为 <br>
  return content.replace(/\n/g, '<br>')
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('消息已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const regenerateResponse = async (messageIndex: number) => {
  if (isRegenerating.value) return

  const userMessage = messages.value
    .slice(0, messageIndex)
    .reverse()
    .find(msg => msg.type === 'user')

  if (!userMessage) return

  isRegenerating.value = true

  try {
    const newResponse = await generateAIResponse(userMessage.content)
    messages.value[messageIndex].content = newResponse
    messages.value[messageIndex].timestamp = new Date()

    ElMessage.success('回复已重新生成')
  } catch (error) {
    ElMessage.error('重新生成失败')
  } finally {
    isRegenerating.value = false
  }
}

const handleMessageAction = (action: string, message: ChatMessage) => {
  switch (action) {
    case 'like':
      ElMessage.success('感谢您的反馈！')
      break
    case 'dislike':
      ElMessage.info('我们会改进回复质量')
      break
    case 'report':
      ElMessage.info('问题已记录，我们会尽快处理')
      break
  }
}

const attachFile = () => {
  ElMessage.info('文件上传功能开发中...')
}

const voiceInput = () => {
  ElMessage.info('语音输入功能开发中...')
}

const openSettings = () => {
  showSettings.value = true
}

const saveSettings = () => {
  // 保存设置到本地存储
  localStorage.setItem('ai-assistant-settings', JSON.stringify(settings.value))
  ElMessage.success('设置已保存')
  showSettings.value = false
}

const getAttachmentIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'pdf': 'Document',
    'image': 'Picture',
    'video': 'VideoPlay',
    'audio': 'Headphones'
  }
  return iconMap[type] || 'Document'
}

const openAttachment = (attachment: any) => {
  window.open(attachment.url, '_blank')
}

// 生命周期
onMounted(() => {
  // 加载设置
  const savedSettings = localStorage.getItem('ai-assistant-settings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
  }

  // 添加欢迎消息
  if (messages.value.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: '0',
      type: 'assistant',
      content: '您好！我是您的AI助教。我可以帮助您：\n\n📚 解释教学概念\n📝 生成练习题目\n👥 分析学生情况\n💡 建议教学活动\n🔍 搜索教学资源\n⏰ 设置教学提醒\n\n请随时向我提问！',
      timestamp: new Date()
    }
    messages.value.push(welcomeMessage)
  }

  // 模拟在线状态
  setTimeout(() => {
    isOnline.value = true
  }, 1000)
})

// 监听消息变化，自动滚动
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })
</script>

<style scoped lang="scss">
.ai-teaching-assistant {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &--collapsed {
    .assistant-content {
      display: none;
    }
  }
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--density-padding-base);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
}

.assistant-info {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
}

.assistant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--edu-primary-100);
  color: var(--edu-primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.assistant-details {
  flex: 1;
}

.assistant-name {
  margin: 0 0 var(--density-spacing-xs) 0;
  font-size: var(--density-font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.assistant-status {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-xs);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--edu-color-error-500);

  &--online {
    background: var(--edu-success-500);
  }
}

.status-text {
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-secondary);
}

.assistant-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.quick-actions {
  padding: var(--density-padding-base);
  border-bottom: 1px solid var(--edu-border-light);
}

.quick-actions-title {
  margin: 0 0 var(--density-spacing-sm) 0;
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-secondary);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--density-spacing-sm);
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--density-spacing-xs);
  padding: var(--density-padding-sm);
  background: transparent;
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-base);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  color: var(--edu-text-secondary);
  font-size: var(--density-font-size-xs);

  &:hover {
    background: var(--edu-primary-50);
    border-color: var(--edu-primary-300);
    color: var(--edu-primary-600);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  .el-icon {
    font-size: 16px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--density-padding-base);
  min-height: 300px;
}

.message-item {
  display: flex;
  gap: var(--density-spacing-sm);
  margin-bottom: var(--density-spacing-base);

  &--user {
    flex-direction: row-reverse;

    .message-content {
      background: var(--edu-primary-500);
      color: white;
      border-radius: var(--density-radius-lg) var(--density-radius-base) var(--density-radius-base) var(--density-radius-lg);
    }

    .message-avatar {
      background: var(--edu-primary-100);
      color: var(--edu-primary-600);
    }
  }

  &--assistant {
    .message-content {
      background: var(--edu-bg-secondary);
      border: 1px solid var(--edu-border-light);
      border-radius: var(--density-radius-base) var(--density-radius-lg) var(--density-radius-lg) var(--density-radius-base);
    }

    .message-avatar {
      background: var(--edu-success-100);
      color: var(--edu-success-600);
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  padding: var(--density-padding-sm);
  position: relative;
  max-width: 80%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--density-spacing-xs);
}

.message-sender {
  font-size: var(--density-font-size-xs);
  font-weight: var(--font-weight-medium);
  opacity: 0.8;
}

.message-time {
  font-size: var(--density-font-size-xs);
  opacity: 0.6;
}

.message-text {
  font-size: var(--density-font-size-sm);
  line-height: var(--density-line-height-relaxed);
  word-wrap: break-word;
}

.message-attachments {
  margin-top: var(--density-spacing-sm);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-xs);
  padding: var(--density-spacing-xs) var(--density-spacing-sm);
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--density-radius-sm);
  cursor: pointer;
  font-size: var(--density-font-size-xs);
  margin-bottom: var(--density-spacing-xs);

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.message-actions {
  display: flex;
  gap: var(--density-spacing-xs);
  margin-top: var(--density-spacing-sm);
  opacity: 0;
  transition: opacity var(--edu-duration-fast) var(--edu-easing-in-out);

  .message-content:hover & {
    opacity: 1;
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  padding: var(--density-padding-sm);
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--edu-success-100);
  color: var(--edu-success-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: var(--density-padding-sm);
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-lg);

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--edu-text-tertiary);
    animation: typing-dot 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes typing-dot {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input-area {
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);
}

.input-toolbar {
  display: flex;
  gap: var(--density-spacing-xs);
  padding: var(--density-padding-sm) var(--density-padding-base);
  border-bottom: 1px solid var(--edu-border-light);
}

.input-container {
  display: flex;
  gap: var(--density-spacing-sm);
  padding: var(--density-padding-base);
  align-items: flex-end;
}

.input-suggestions {
  border-top: 1px solid var(--edu-border-light);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: var(--density-padding-sm) var(--density-padding-base);
  cursor: pointer;
  font-size: var(--density-font-size-sm);
  color: var(--edu-text-secondary);
  border-bottom: 1px solid var(--edu-border-light);

  &:hover {
    background: var(--edu-bg-tertiary);
    color: var(--edu-text-primary);
  }

  &:last-child {
    border-bottom: none;
  }
}

.settings-content {
  padding: var(--density-spacing-base) 0;
}

// 响应式适配
@media (max-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .message-content {
    max-width: 90%;
  }

  .input-container {
    flex-direction: column;
    align-items: stretch;
  }

  .input-toolbar {
    justify-content: center;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .assistant-header,
  .chat-input-area {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .message-item--assistant .message-content {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .typing-dots {
    background: var(--bg-elevated);
  }

  .attachment-item {
    background: rgba(255, 255, 255, 0.1);
  }

  .attachment-item:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .typing-dots span {
    animation: none;
  }

  .quick-action-btn,
  .message-actions {
    transition: none;
  }
}
</style>