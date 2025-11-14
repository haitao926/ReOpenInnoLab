<template>
  <div class="context-aware-ai-assistant">
    <!-- AI助手切换按钮 -->
    <div class="ai-toggle-button" @click="toggleAssistant" :class="{ active: isOpen }">
      <el-icon><ChatDotRound /></el-icon>
      <span v-if="showLabel">AI助手</span>
      <el-badge
        v-if="unreadHints.length > 0"
        :value="unreadHints.length"
        class="notification-badge"
      />
    </div>

    <!-- AI助手面板 -->
    <transition name="slide-up">
      <div v-if="isOpen" class="ai-assistant-panel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="header-left">
            <el-icon><ChatDotRound /></el-icon>
            <h3>智能学习助手</h3>
            <el-tag
              :type="connectionStatusType"
              size="small"
              class="status-tag"
            >
              {{ connectionStatusText }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button
              size="small"
              @click="toggleSettings"
              :icon="Setting"
            />
            <el-button
              size="small"
              @click="closeAssistant"
              :icon="Close"
            />
          </div>
        </div>

        <!-- 上下文信息 -->
        <div v-if="showContextInfo" class="context-info">
          <div class="context-item">
            <span class="label">当前活动:</span>
            <span class="value">{{ currentActivityTitle }}</span>
          </div>
          <div class="context-item">
            <span class="label">学习进度:</span>
            <el-progress
              :percentage="progressPercentage"
              :show-text="false"
              :stroke-width="4"
              class="mini-progress"
            />
            <span class="value">{{ progressPercentage }}%</span>
          </div>
          <div class="context-item">
            <span class="label">建议难度:</span>
            <el-tag
              :type="difficultyTagType"
              size="small"
            >
              {{ suggestedDifficulty }}
            </el-tag>
          </div>
        </div>

        <!-- 智能提示区域 -->
        <div v-if="contextualHints.length > 0" class="hints-section">
          <div class="section-header">
            <h4>智能提示</h4>
            <el-button
              size="small"
              text
              @click="dismissAllHints"
            >
              全部忽略
            </el-button>
          </div>
          <div class="hints-list">
            <div
              v-for="hint in contextualHints"
              :key="hint.id"
              class="hint-item"
              :class="[`hint-${hint.type}`, `hint-${hint.priority}`]"
            >
              <div class="hint-header">
                <el-icon><InfoFilled /></el-icon>
                <span class="hint-title">{{ hint.title }}</span>
                <el-tag
                  :type="getPriorityTagType(hint.priority)"
                  size="small"
                >
                  {{ getPriorityText(hint.priority) }}
                </el-tag>
              </div>
              <div class="hint-content">{{ hint.content }}</div>
              <div class="hint-actions">
                <el-button
                  size="small"
                  type="primary"
                  @click="acceptHint(hint)"
                >
                  采纳建议
                </el-button>
                <el-button
                  size="small"
                  @click="askFollowUp(hint)"
                >
                  了解更多
                </el-button>
                <el-button
                  size="small"
                  text
                  @click="dismissHint(hint)"
                >
                  忽略
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话区域 -->
        <div class="conversation-section">
          <div class="messages-container" ref="messagesContainer">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-item"
              :class="message.type"
            >
              <div class="message-avatar">
                <el-icon v-if="message.type === 'assistant'"><ChatDotRound /></el-icon>
                <el-icon v-else><User /></el-icon>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessageContent(message.content)"></div>
                <div class="message-resources" v-if="message.resources && message.resources.length > 0">
                  <div
                    v-for="resource in message.resources"
                    :key="resource.id"
                    class="resource-item"
                    @click="openResource(resource)"
                  >
                    <el-icon><Document /></el-icon>
                    <span>{{ resource.title }}</span>
                  </div>
                </div>
                <div class="message-actions" v-if="message.actions && message.actions.length > 0">
                  <el-button
                    v-for="action in message.actions"
                    :key="action.id"
                    size="small"
                    :type="action.priority === 'high' ? 'primary' : 'default'"
                    @click="executeAction(action)"
                  >
                    {{ action.label }}
                  </el-button>
                </div>
                <div class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="input-section">
            <div class="quick-actions">
              <el-button
                size="small"
                @click="sendQuickMessage('给我一个提示')"
                :icon="Sunny"
              >
                求助
              </el-button>
              <el-button
                size="small"
                @click="sendQuickMessage('解释一下这个概念')"
                :icon="QuestionFilled"
              >
                解释
              </el-button>
              <el-button
                size="small"
                @click="sendQuickMessage('给我一个例子')"
                :icon="Memo"
              >
                举例
              </el-button>
            </div>
            <div class="message-input">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="2"
                placeholder="输入你的问题..."
                @keydown.enter.ctrl="sendMessage"
                :disabled="isProcessing"
              />
              <el-button
                type="primary"
                @click="sendMessage"
                :loading="isProcessing"
                :disabled="!inputMessage.trim()"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>

        <!-- 设置面板 -->
        <div v-if="showSettings" class="settings-panel">
          <div class="settings-header">
            <h4>AI助手设置</h4>
          </div>
          <div class="settings-content">
            <el-form :model="settings" label-width="120px" size="small">
              <el-form-item label="显示提示">
                <el-switch v-model="settings.showHints" />
              </el-form-item>
              <el-form-item label="显示上下文">
                <el-switch v-model="settings.showContextInfo" />
              </el-form-item>
              <el-form-item label="自动建议">
                <el-switch v-model="settings.autoSuggestions" />
              </el-form-item>
              <el-form-item label="响应风格">
                <el-select v-model="settings.responseStyle">
                  <el-option label="简洁" value="concise" />
                  <el-option label="详细" value="detailed" />
                  <el-option label="自适应" value="adaptive" />
                </el-select>
              </el-form-item>
              <el-form-item label="交互模式">
                <el-select v-model="settings.interactionMode">
                  <el-option label="指导式" value="tutorial" />
                  <el-option label="协作式" value="collaborative" />
                  <el-option label="苏格拉底式" value="socratic" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </transition>

    <!-- 浮动提示 -->
    <div
      v-if="floatingHint && !isOpen"
      class="floating-hint"
      @click="openAssistantWithHint"
    >
      <el-icon><InfoFilled /></el-icon>
      <span>{{ floatingHint.title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  ChatDotRound,
  User,
  Close,
  Setting,
  InfoFilled,
  Document,
  Sunny,
  QuestionFilled,
  Memo
} from '@element-plus/icons-vue'

import { contextAwareAIService } from '@/services/ai/context-aware-ai'
import { defaultContextBuilders } from '@/services/ai/context-builders'
import type {
  AIContext,
  AIConversation,
  AIMessage,
  EnhancedAIHint,
  AIInput,
  AIOutput
} from '@/types/ai'
import type { ActivityContext } from '@/types/course'

// Props
interface Props {
  activityContext?: ActivityContext
  showLabel?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  autoOpen?: boolean
  floatingHints?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  position: 'bottom-right',
  autoOpen: false,
  floatingHints: true
})

// 响应式数据
const isOpen = ref(false)
const showSettings = ref(false)
const showContextInfo = ref(true)
const isProcessing = ref(false)
const inputMessage = ref('')
const messages = ref<AIMessage[]>([])
const contextualHints = ref<EnhancedAIHint[]>([])
const floatingHint = ref<EnhancedAIHint | null>(null)

// AI上下文
const currentContext = ref<AIContext | null>(null)
const currentConversation = ref<AIConversation | null>(null)

// 设置
const settings = ref({
  showHints: true,
  showContextInfo: true,
  autoSuggestions: true,
  responseStyle: 'adaptive',
  interactionMode: 'collaborative'
})

// UI引用
const messagesContainer = ref<HTMLElement>()

// 计算属性
const connectionStatusType = computed(() => {
  if (!currentContext.value) return 'info'
  return 'success'
})

const connectionStatusText = computed(() => {
  if (!currentContext.value) return '未连接'
  return '已连接'
})

const currentActivityTitle = computed(() => {
  return props.activityContext?.activity?.title || '未知活动'
})

const progressPercentage = computed(() => {
  return currentContext.value?.courseContext?.progress || 0
})

const suggestedDifficulty = computed(() => {
  return currentContext.value?.learningContext?.preferredDifficulty || 'medium'
})

const difficultyTagType = computed(() => {
  const difficulty = suggestedDifficulty.value
  switch (difficulty) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'danger'
    default: return 'info'
  }
})

const unreadHints = computed(() => {
  return contextualHints.value.filter(hint => !hint.effectiveness.views)
})

// 生命周期
onMounted(async () => {
  await initializeAI()
  startPeriodicUpdates()
})

onUnmounted(() => {
  cleanup()
})

watch(() => props.activityContext, async (newContext) => {
  if (newContext) {
    await updateContext(newContext)
  }
}, { immediate: true })

// 方法
const initializeAI = async () => {
  try {
    // 注册上下文构建器
    defaultContextBuilders.forEach(builder => {
      contextAwareAIService.registerContextBuilder(builder)
    })

    if (props.activityContext) {
      await updateContext(props.activityContext)
    }

    ElMessage.success('AI助手已就绪')
  } catch (error) {
    console.error('Failed to initialize AI:', error)
    ElMessage.error('AI助手初始化失败')
  }
}

const updateContext = async (activityContext: ActivityContext) => {
  try {
    currentContext.value = await contextAwareAIService.initializeContext(activityContext)
    await updateContextualHints()

    if (props.autoOpen && contextualHints.value.length > 0) {
      openAssistant()
    }
  } catch (error) {
    console.error('Failed to update context:', error)
  }
}

const updateContextualHints = async () => {
  if (!currentContext.value || !settings.value.showHints) return

  try {
    const hints = await contextAwareAIService.generateContextualHints(
      getContextId(currentContext.value),
      'opportunity'
    )

    contextualHints.value = hints

    // 设置浮动提示
    if (props.floatingHints && hints.length > 0 && !isOpen.value) {
      floatingHint.value = hints[0]
    }
  } catch (error) {
    console.error('Failed to update hints:', error)
  }
}

const toggleAssistant = () => {
  if (isOpen.value) {
    closeAssistant()
  } else {
    openAssistant()
  }
}

const openAssistant = async () => {
  isOpen.value = true
  floatingHint.value = null

  if (!currentConversation.value && currentContext.value) {
    try {
      currentConversation.value = await contextAwareAIService.getOrCreateConversation(
        getContextId(currentContext.value),
        'discussion'
      )
      messages.value = currentConversation.value.messages
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  await nextTick()
  scrollToBottom()
}

const closeAssistant = () => {
  isOpen.value = false
  showSettings.value = false
}

const openAssistantWithHint = () => {
  openAssistant()
  if (floatingHint.value) {
    askFollowUp(floatingHint.value)
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isProcessing.value) return

  const messageContent = inputMessage.value.trim()
  inputMessage.value = ''

  await processUserMessage(messageContent)
}

const sendQuickMessage = async (message: string) => {
  await processUserMessage(message)
}

const processUserMessage = async (content: string) => {
  if (!currentContext.value) return

  isProcessing.value = true

  try {
    // 添加用户消息
    const userMessage: AIMessage = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        tokens: content.length
      }
    }

    messages.value.push(userMessage)

    // 构建AI输入
    const aiInput: AIInput = {
      type: 'text',
      content,
      intent: 'question',
      confidence: 0.8
    }

    // 处理AI交互
    const output = await contextAwareAIService.processInteraction(
      aiInput,
      getContextId(currentContext.value)
    )

    // 添加AI响应
    const assistantMessage: AIMessage = {
      id: generateMessageId(),
      type: 'assistant',
      content: output.content,
      timestamp: new Date(),
      metadata: {
        tokens: output.metadata.tokens,
        processingTime: output.metadata.processingTime,
        confidence: output.metadata.confidence,
        model: output.metadata.model
      }
    }

    messages.value.push(assistantMessage)

    // 更新对话
    if (currentConversation.value) {
      currentConversation.value.messages.push(userMessage, assistantMessage)
    }

    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('Failed to process message:', error)
    ElMessage.error('消息处理失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

const acceptHint = async (hint: EnhancedAIHint) => {
  try {
    // 执行提示建议的动作
    if (hint.interaction.responses.length > 0) {
      const response = hint.interaction.responses[0]
      if (response.action) {
        await executeAction(response.action)
      }
    }

    // 更新提示效果
    hint.effectiveness.acceptances++
    hint.effectiveness.lastUpdated = new Date()

    // 从列表中移除
    const index = contextualHints.value.findIndex(h => h.id === hint.id)
    if (index > -1) {
      contextualHints.value.splice(index, 1)
    }

    ElMessage.success('已采纳建议')
  } catch (error) {
    console.error('Failed to accept hint:', error)
    ElMessage.error('执行建议失败')
  }
}

const askFollowUp = async (hint: EnhancedAIHint) => {
  const followUpMessage = `关于"${hint.title}"，我想了解更多...`
  await processUserMessage(followUpMessage)
}

const dismissHint = (hint: EnhancedAIHint) => {
  hint.effectiveness.rejections++
  hint.effectiveness.lastUpdated = new Date()

  const index = contextualHints.value.findIndex(h => h.id === hint.id)
  if (index > -1) {
    contextualHints.value.splice(index, 1)
  }
}

const dismissAllHints = () => {
  contextualHints.value.forEach(hint => {
    hint.effectiveness.rejections++
    hint.effectiveness.lastUpdated = new Date()
  })
  contextualHints.value = []
}

const executeAction = async (action: any) => {
  try {
    switch (action.type) {
      case 'navigation':
        // 导航到指定位置
        if (action.target.startsWith('#')) {
          const element = document.querySelector(action.target)
          element?.scrollIntoView({ behavior: 'smooth' })
        }
        break
      case 'open':
        // 打开资源
        window.open(action.target, '_blank')
        break
      case 'highlight':
        // 高亮元素
        const element = document.querySelector(action.target)
        if (element) {
          element.classList.add('ai-highlighted')
          setTimeout(() => {
            element.classList.remove('ai-highlighted')
          }, 3000)
        }
        break
      default:
        console.warn('Unknown action type:', action.type)
    }
  } catch (error) {
    console.error('Failed to execute action:', error)
  }
}

const openResource = (resource: any) => {
  if (resource.url) {
    window.open(resource.url, '_blank')
  }
}

const formatMessageContent = (content: string): string => {
  // 简单的Markdown格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const formatMessageTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPriorityTagType = (priority: string): string => {
  switch (priority) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'high': return '重要'
    case 'medium': return '一般'
    case 'low': return '提示'
    default: return '信息'
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getContextId = (context: AIContext): string => {
  if (context.activityContext) {
    return `${context.activityContext.courseId}_${context.activityContext.chapterId}_${context.activityContext.activityId}`
  }
  return context.sessionId
}

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const startPeriodicUpdates = () => {
  // 定期更新上下文和提示
  const interval = setInterval(async () => {
    if (currentContext.value && settings.value.autoSuggestions) {
      await updateContextualHints()
    }
  }, 30000) // 30秒更新一次

  // 清理定时器
  onUnmounted(() => {
    clearInterval(interval)
  })
}

const cleanup = () => {
  if (currentContext.value) {
    contextAwareAIService.cleanupContext(getContextId(currentContext.value))
  }
}
</script>

<style scoped lang="scss">
.context-aware-ai-assistant {
  position: fixed;
  z-index: 1000;

  &.bottom-right {
    bottom: 20px;
    right: 20px;
  }

  &.bottom-left {
    bottom: 20px;
    left: 20px;
  }

  &.top-right {
    top: 80px;
    right: 20px;
  }

  &.top-left {
    top: 80px;
    left: 20px;
  }
}

.ai-toggle-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  &.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
  }
}

.ai-assistant-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  .context-info {
    padding: 12px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .context-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: 12px;
        color: #6c757d;
        min-width: 60px;
      }

      .value {
        font-size: 12px;
        color: #495057;
      }

      .mini-progress {
        flex: 1;
        max-width: 60px;
      }
    }
  }

  .hints-section {
    border-bottom: 1px solid #e9ecef;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #fff3cd;
      border-bottom: 1px solid #ffeaa7;

      h4 {
        margin: 0;
        font-size: 14px;
        color: #856404;
      }
    }

    .hints-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 0 20px 12px;

      .hint-item {
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 8px;
        border-left: 4px solid;

        &.hint-reactive {
          background: #e7f5ff;
          border-left-color: #339af0;
        }

        &.hint-proactive {
          background: #fff3cd;
          border-left-color: #ffc107;
        }

        &.hint-corrective {
          background: #f8d7da;
          border-left-color: #f03e3e;
        }

        .hint-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .hint-title {
            font-weight: 600;
            font-size: 14px;
          }
        }

        .hint-content {
          font-size: 13px;
          color: #495057;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .hint-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .conversation-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;

      .message-item {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        &.user {
          flex-direction: row-reverse;

          .message-content {
            background: #007bff;
            color: white;
          }
        }

        &.assistant {
          .message-content {
            background: #f8f9fa;
            color: #333;
          }
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e9ecef;
          color: #6c757d;
          font-size: 14px;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 280px;
          padding: 12px 16px;
          border-radius: 16px;
          word-wrap: break-word;

          .message-text {
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 8px;
          }

          .message-resources {
            margin-bottom: 8px;

            .resource-item {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 6px 8px;
              background: rgba(0, 0, 0, 0.05);
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              margin-bottom: 4px;

              &:hover {
                background: rgba(0, 0, 0, 0.1);
              }
            }
          }

          .message-actions {
            margin-bottom: 8px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .message-time {
            font-size: 11px;
            opacity: 0.7;
          }
        }
      }
    }

    .input-section {
      border-top: 1px solid #e9ecef;
      padding: 16px 20px;

      .quick-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .message-input {
        display: flex;
        gap: 12px;
        align-items: flex-end;

        .el-textarea {
          flex: 1;
        }
      }
    }
  }

  .settings-panel {
    border-top: 1px solid #e9ecef;
    padding: 16px 20px;
    background: #f8f9fa;

    .settings-header {
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
    }
  }
}

.floating-hint {
  position: absolute;
  bottom: 80px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 20px;
  font-size: 12px;
  color: #856404;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: bounce 2s infinite;

  &:hover {
    background: #ffeaa7;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
  60% {
    transform: translateY(-2px);
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 高亮效果
:global(.ai-highlighted) {
  animation: ai-highlight 3s ease-in-out;
}

@keyframes ai-highlight {
  0%, 100% {
    box-shadow: 0 0 0 rgba(255, 193, 7, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 193, 7, 0.8);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ai-assistant-panel {
    width: 350px;
    max-height: 500px;
  }

  .ai-toggle-button span {
    display: none;
  }

  .floating-hint {
    display: none;
  }
}

@media (max-width: 480px) {
  .ai-assistant-panel {
    width: 300px;
    right: -10px;
  }

  .context-aware-ai-assistant.bottom-right {
    right: 10px;
    bottom: 10px;
  }
}
</style>