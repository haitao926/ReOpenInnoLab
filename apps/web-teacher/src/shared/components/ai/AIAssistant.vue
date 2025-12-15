<template>
  <div class="ai-assistant" :class="[`ai-assistant--${mode}`, { 'is-active': isActive }]">
    <!-- 浮动模式 -->
    <div v-if="mode === 'float'" class="ai-float-container">
      <transition name="bounce">
        <div v-show="isActive" class="ai-float-panel">
          <div class="ai-panel-header">
            <div class="ai-title">
              <el-icon><Magic /></el-icon>
              <span>{{ getTitle() }}</span>
            </div>
            <el-button
              type="text"
              size="small"
              @click="handleClose"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <div class="ai-panel-content">
            <!-- 建议列表 -->
            <div v-if="suggestions.length > 0" class="ai-suggestions">
              <div
                v-for="(suggestion, index) in suggestions"
                :key="index"
                class="suggestion-item"
                @click="applySuggestion(suggestion)"
              >
                <div class="suggestion-type">
                  {{ suggestion.type }}
                </div>
                <div class="suggestion-content">
                  {{ suggestion.content }}
                </div>
                <el-button type="text" size="small">
                  应用
                </el-button>
              </div>
            </div>

            <!-- 聊天界面 -->
            <div ref="chatContainer" class="ai-chat-container">
              <div
                v-for="(message, index) in messages"
                :key="index"
                class="chat-message"
                :class="{ 'is-user': message.role === 'user' }"
              >
                <div class="message-avatar">
                  <el-avatar v-if="message.role === 'ai'" :size="32">
                    <el-icon><Magic /></el-icon>
                  </el-avatar>
                  <el-avatar v-else :size="32">
                    {{ userInfo.name?.[0] }}
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-text" v-html="formatMessage(message.content)"></div>
                  <div class="message-time">
                    {{ formatTime(message.timestamp) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入框 -->
            <div class="ai-input-area">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="3"
                :placeholder="getPlaceholder()"
                @keydown.ctrl.enter="sendMessage"
              />
              <div class="input-actions">
                <el-button
                  size="small"
                  :loading="loading"
                  @click="sendMessage"
                >
                  发送 (Ctrl+Enter)
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 浮动按钮 -->
      <div class="ai-float-button" @click="toggleActive">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-icon class="ai-icon">
            <Magic />
          </el-icon>
        </el-badge>
      </div>
    </div>

    <!-- 面板模式 -->
    <div v-else-if="mode === 'panel'" class="ai-panel-container">
      <div class="ai-panel">
        <div class="ai-panel-header">
          <h3>{{ getTitle() }}</h3>
          <div class="header-actions">
            <el-button
              type="text"
              size="small"
              @click="clearMessages"
            >
              清空
            </el-button>
          </div>
        </div>

        <div class="ai-panel-body">
          <!-- 快捷操作 -->
          <div class="ai-quick-actions">
            <el-button-group>
              <el-button
                v-for="action in quickActions"
                :key="action.key"
                :type="action.type"
                size="small"
                @click="handleQuickAction(action)"
              >
                {{ action.label }}
              </el-button>
            </el-button-group>
          </div>

          <!-- 内容区域 -->
          <component
            :is="currentComponent"
            v-if="currentComponent"
            :context="context"
            :data="contextData"
            @action="handleComponentAction"
          />

          <!-- 默认聊天界面 -->
          <div v-else class="ai-chat-area">
            <div class="chat-container" ref="chatContainerRef">
              <div
                v-for="(message, index) in messages"
                :key="index"
                class="chat-message"
                :class="{ 'is-user': message.role === 'user' }"
              >
                <!-- 消息内容同上 -->
              </div>
            </div>

            <div class="input-area">
              <el-input
                v-model="inputMessage"
                placeholder="输入您的问题..."
                @keydown.ctrl.enter="sendMessage"
              >
                <template #append>
                  <el-button
                    :loading="loading"
                    @click="sendMessage"
                  >
                    发送
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内联模式 -->
    <div v-else-if="mode === 'inline'" class="ai-inline-container">
      <component
        :is="inlineComponent"
        v-if="inlineComponent"
        v-bind="$attrs"
        :context="context"
        @action="handleInlineAction"
      />

      <!-- 默认内联助手 -->
      <div v-else class="ai-inline-assistant">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            AI 助手建议
          </template>
          <div v-if="currentSuggestion">
            {{ currentSuggestion.content }}
            <el-button
              type="text"
              size="small"
              @click="applySuggestion(currentSuggestion)"
            >
              采纳
            </el-button>
          </div>
          <div v-else>
            正在分析内容...
          </div>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Magic, Close } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { AIContext, AIMessage, AISuggestion, AIAction } from '@/shared/types/ai'

// Props
const props = withDefaults(defineProps<{
  mode?: 'float' | 'panel' | 'inline'
  context?: AIContext
  autoTrigger?: boolean
  suggestions?: AISuggestion[]
}>(), {
  mode: 'float',
  autoTrigger: true
})

// Emits
const emit = defineEmits<{
  action: [action: AIAction]
  suggestionApplied: [suggestion: AISuggestion]
}>()

// 用户信息
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

// 状态
const isActive = ref(false)
const loading = ref(false)
const inputMessage = ref('')
const messages = ref<AIMessage[]>([])
const currentSuggestion = ref<AISuggestion | null>(null)
const unreadCount = ref(0)

// 引用
const chatContainer = ref<HTMLElement>()
const chatContainerRef = ref<HTMLElement>()

// 计算属性
const context = computed(() => props.context || 'general')
const contextData = computed(() => {
  // 根据上下文返回相关数据
  return {}
})

// 获取标题
const getTitle = () => {
  const titles = {
    course: '课程设计助手',
    lab: '实验指导助手',
    experiment: '实验分析助手',
    assignment: '作业批改助手',
    general: 'AI 教学助手'
  }
  return titles[props.context || 'general']
}

// 获取占位符
const getPlaceholder = () => {
  const placeholders = {
    course: '请输入课程设计相关的问题...',
    lab: '请输入实验相关的问题...',
    experiment: '请输入实验分析需求...',
    assignment: '请输入作业批改要求...',
    general: '请输入您的问题...'
  }
  return placeholders[props.context || 'general']
}

// 获取快捷操作
const quickActions = computed(() => {
  const actions = {
    course: [
      { key: 'generate-objectives', label: '生成学习目标', type: 'primary' },
      { key: 'suggest-activities', label: '推荐活动', type: '' },
      { key: 'create-assessment', label: '创建测评', type: '' }
    ],
    lab: [
      { key: 'analyze-results', label: '分析结果', type: 'primary' },
      { key: 'suggest-improvements', label: '改进建议', type: '' }
    ],
    experiment: [
      { key: 'design-experiment', label: '设计实验', type: 'primary' },
      { key: 'explain-concept', label: '解释原理', type: '' }
    ]
  }
  return actions[props.context] || []
})

// 获取当前组件
const currentComponent = computed(() => {
  const components = {
    course: () => import('./components/AICourseHelper.vue'),
    lab: () => import('./components/AILabHelper.vue'),
    experiment: () => import('./components/AIExperimentHelper.vue')
  }
  return components[props.context] ? defineAsyncComponent(components[props.context]) : null
})

// 获取内联组件
const inlineComponent = computed(() => {
  const components = {
    course: () => import('./components/AICourseInline.vue'),
    assignment: () => import('./components/AIAssignmentInline.vue')
  }
  return components[props.context] ? defineAsyncComponent(components[props.context]) : null
})

// 方法
const toggleActive = () => {
  isActive.value = !isActive.value
  if (isActive.value) {
    unreadCount.value = 0
  }
}

const handleClose = () => {
  isActive.value = false
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userMessage: AIMessage = {
    role: 'user',
    content: inputMessage.value,
    timestamp: Date.now()
  }

  messages.value.push(userMessage)
  const question = inputMessage.value
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  loading.value = true

  try {
    // 调用 AI API
    const response = await callAI(question, props.context)

    const aiMessage: AIMessage = {
      role: 'ai',
      content: response.content,
      timestamp: Date.now(),
      suggestions: response.suggestions
    }

    messages.value.push(aiMessage)

    if (!isActive.value) {
      unreadCount.value++
    }
  } catch (error) {
    console.error('AI response error:', error)
    ElMessage.error('AI 助手暂时无法响应，请稍后再试')
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const callAI = async (question: string, context: string) => {
  // 这里调用实际的 AI API
  // 模拟响应
  await new Promise(resolve => setTimeout(resolve, 1000))

  const responses = {
    course: {
      content: '根据您的课程内容，我建议您可以从以下几个方面进行设计...',
      suggestions: [
        { type: '结构调整', content: '建议增加互动环节以提高学生参与度' },
        { type: '内容补充', content: '可以添加更多实例来说明概念' }
      ]
    },
    lab: {
      content: '根据实验数据，我为您分析如下...',
      suggestions: [
        { type: '数据分析', content: '建议使用图表更直观地展示结果' },
        { type: '改进方案', content: '可以考虑增加对照组以提高实验准确性' }
      ]
    },
    general: {
      content: '我理解您的问题，让我为您提供一些建议...',
      suggestions: []
    }
  }

  return responses[context] || responses.general
}

const applySuggestion = (suggestion: AISuggestion) => {
  emit('suggestionApplied', suggestion)
  ElMessage.success('已应用建议')
}

const clearMessages = () => {
  messages.value = []
  ElMessage.success('已清空对话')
}

const handleQuickAction = async (action: any) => {
  emit('action', {
    type: 'quick_action',
    key: action.key,
    context: props.context
  })

  // 根据动作类型执行相应的 AI 调用
  loading.value = true
  try {
    // 这里处理各种快捷动作
    console.log('Executing quick action:', action.key)
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

const handleComponentAction = (action: AIAction) => {
  emit('action', action)
}

const handleInlineAction = (action: AIAction) => {
  emit('action', action)
}

const scrollToBottom = () => {
  const container = chatContainer.value || chatContainerRef.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

const formatMessage = (content: string) => {
  // 简单的格式化，支持 markdown
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听器
watch(() => props.suggestions, (newSuggestions) => {
  if (newSuggestions && newSuggestions.length > 0) {
    currentSuggestion.value = newSuggestions[0]
  }
}, { immediate: true })

// 自动触发
if (props.autoTrigger && props.suggestions && props.suggestions.length > 0) {
  isActive.value = true
}

// 初始化
onMounted(() => {
  // 添加欢迎消息
  if (props.mode !== 'inline') {
    messages.value.push({
      role: 'ai',
      content: `您好！我是${getTitle()}，有什么可以帮助您的吗？`,
      timestamp: Date.now()
    })
  }
})
</script>

<style scoped lang="scss">
.ai-assistant {
  &--float {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 9999;

    .ai-float-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light-3) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }

      .ai-icon {
        font-size: 24px;
        color: white;
      }
    }

    .ai-float-panel {
      position: absolute;
      right: 0;
      bottom: 70px;
      width: 380px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .ai-panel-header {
        padding: 16px;
        border-bottom: 1px solid var(--border-color-light);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .ai-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: var(--font-weight-semibold);
        }
      }

      .ai-panel-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .ai-suggestions {
          padding: 16px;
          border-bottom: 1px solid var(--border-color-light);
          max-height: 200px;
          overflow-y: auto;

          .suggestion-item {
            padding: 12px;
            background: var(--bg-color-page);
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              background: var(--color-primary-light-9);
            }

            .suggestion-type {
              font-size: var(--font-size-sm);
              color: var(--color-primary);
              margin-bottom: 4px;
            }

            .suggestion-content {
              margin-bottom: 8px;
            }
          }
        }

        .ai-chat-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;

          .chat-message {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;

            &.is-user {
              flex-direction: row-reverse;

              .message-content {
                text-align: right;
              }
            }

            .message-content {
              .message-text {
                background: var(--bg-color-page);
                padding: 12px;
                border-radius: 8px;
                max-width: 80%;
                word-break: break-word;
              }

              .message-time {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                margin-top: 4px;
              }
            }
          }
        }

        .ai-input-area {
          padding: 16px;
          border-top: 1px solid var(--border-color-light);

          .input-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
          }
        }
      }
    }
  }

  &--panel {
    height: 100%;

    .ai-panel-container {
      height: 100%;
      display: flex;
      flex-direction: column;

      .ai-panel {
        height: 100%;
        background: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;

        .ai-panel-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color-light);
          display: flex;
          justify-content: space-between;
          align-items: center;

          h3 {
            margin: 0;
          }
        }

        .ai-panel-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;

          .ai-quick-actions {
            margin-bottom: 16px;
          }
        }
      }
    }
  }

  &--inline {
    width: 100%;

    .ai-inline-assistant {
      margin: var(--spacing-md) 0;
    }
  }
}

// 动画
.bounce-enter-active {
  animation: bounce 0.5s;
}

.bounce-leave-active {
  animation: bounce 0.3s reverse;
}

@keyframes bounce {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>