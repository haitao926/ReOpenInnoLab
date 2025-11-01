<template>
  <div v-if="isVisible" class="ai-assistant-float">
    <!-- 浮动按钮 -->
    <el-button
      type="primary"
      circle
      class="ai-float-btn"
      :class="{ active: isExpanded }"
      @click="toggleExpanded"
    >
      <el-icon size="20">
        <MagicStick />
      </el-icon>
    </el-button>

    <!-- AI助手面板 -->
    <transition name="slide-up">
      <div v-if="isExpanded" class="ai-assistant-panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon><MagicStick /></el-icon>
            <span>AI助手</span>
          </div>
          <el-button type="text" :icon="Close" @click="toggleExpanded" />
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
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
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
              </div>
            </div>
          </el-scrollbar>

          <!-- 输入区域 -->
          <div class="input-area">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="输入您的问题..."
              :disabled="isLoading"
              @keydown.enter.prevent="handleEnter"
            />
            <el-button
              type="primary"
              :loading="isLoading"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElScrollbar } from 'element-plus'
import { MagicStick, Close } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: number
}

const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const isVisible = ref(true)
const isExpanded = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref<Message[]>([
  {
    id: '1',
    type: 'assistant',
    content: '您好！我是AI助手，有什么可以帮助您的吗？',
    timestamp: Date.now()
  }
])

// Refs
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()

// 计算属性
const userAvatar = computed(() => userStore.userAvatar)
const aiAvatar = computed(() => '/ai-avatar.png')

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    nextTick(() => {
      scrollToBottom()
    })
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

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: inputMessage.value.trim(),
    timestamp: Date.now()
  }

  messages.value.push(userMessage)
  inputMessage.value = ''
  isLoading.value = true

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })

  try {
    // 模拟AI回复
    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: generateAIResponse(userMessage.content),
      timestamp: Date.now()
    }

    messages.value.push(aiMessage)
  } catch (error) {
    console.error('发送消息失败:', error)
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

const generateAIResponse = (userMessage: string): string => {
  // 简单的AI回复逻辑（实际项目中需要调用AI API）
  const responses = [
    '这是一个很好的问题！让我为您详细解答...',
    '根据您的描述，我建议您可以尝试以下方法...',
    '我理解您的需求。这里有一些相关的建议...',
    '感谢您的提问！关于这个问题，我想说的是...'
  ]

  return responses[Math.floor(Math.random() * responses.length)]
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
  z-index: 1000;
}

.ai-float-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.ai-float-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.ai-float-btn.active {
  transform: rotate(45deg);
}

.ai-assistant-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 500px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  padding: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-item.user-message {
  flex-direction: row-reverse;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-text {
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  word-wrap: break-word;
}

.user-message .message-text {
  background: var(--el-color-primary);
  color: white;
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
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

.input-area {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area :deep(.el-textarea__inner) {
  resize: none;
  border-radius: 8px;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
  transform-origin: bottom right;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .ai-assistant-panel {
    width: calc(100vw - 40px);
    right: -10px;
    left: 10px;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>