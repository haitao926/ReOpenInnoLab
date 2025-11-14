<template>
  <StudentCourseLayout>
    <div class="lab-agent">
      <div class="agent-header">
        <h2>AI 实验代理</h2>
        <p>智能实验助手，为您提供个性化的实验指导</p>
      </div>

      <div class="agent-content">
        <div class="agent-interface">
          <div class="agent-avatar">
            <div class="avatar-circle">
              <span class="avatar-icon">🤖</span>
            </div>
            <div class="agent-status">
              <span class="status-dot online"></span>
              <span class="status-text">在线</span>
            </div>
          </div>

          <div class="agent-chat">
            <div class="chat-messages" ref="chatContainer">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="['message', message.type]"
              >
                <div class="message-content">
                  <div class="message-text">{{ message.text }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="2"
                placeholder="请输入您的问题..."
                @keydown.enter.exact="sendMessage"
                @keydown.enter.shift.exact.prevent="inputMessage += '\n'"
              />
              <el-button
                type="primary"
                @click="sendMessage"
                :disabled="!inputMessage.trim()"
                :loading="isProcessing"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>

        <div class="agent-capabilities">
          <h3>功能特点</h3>
          <div class="capabilities-grid">
            <div class="capability-card">
              <div class="capability-icon">💡</div>
              <h4>智能指导</h4>
              <p>提供实验步骤的实时指导和建议</p>
            </div>
            <div class="capability-card">
              <div class="capability-icon">🔬</div>
              <h4>实验分析</h4>
              <p>分析实验数据，生成可视化报告</p>
            </div>
            <div class="capability-card">
              <div class="capability-icon">🎯</div>
              <h4>个性化学习</h4>
              <p>根据学习进度调整实验难度</p>
            </div>
            <div class="capability-card">
              <div class="capability-icon">📊</div>
              <h4>进度跟踪</h4>
              <p>记录学习轨迹，评估掌握程度</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentCourseLayout>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import StudentCourseLayout from '@/components/layout/StudentCourseLayout.vue'

interface Message {
  id: string
  type: 'user' | 'agent'
  text: string
  timestamp: Date
}

const chatContainer = ref<HTMLElement>()
const inputMessage = ref('')
const isProcessing = ref(false)
const messages = ref<Message[]>([
  {
    id: '1',
    type: 'agent',
    text: '您好！我是您的AI实验助手。我可以帮助您：\n\n• 解答实验相关问题\n• 提供操作指导\n• 分析实验数据\n• 推荐学习资源\n\n请问有什么可以帮助您的吗？',
    timestamp: new Date()
  }
])

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isProcessing.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    text: inputMessage.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const question = inputMessage.value.trim()
  inputMessage.value = ''
  isProcessing.value = true

  await nextTick()
  scrollToBottom()

  // 模拟AI响应
  setTimeout(() => {
    const agentResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      text: generateAgentResponse(question),
      timestamp: new Date()
    }

    messages.value.push(agentResponse)
    isProcessing.value = false
    nextTick()
    scrollToBottom()
  }, 1500)
}

const generateAgentResponse = (question: string): string => {
  const responses = [
    '这是一个很好的问题！让我为您详细解答...',
    '根据您的实验进度，我建议您先完成基础步骤...',
    '我已经分析了您的实验数据，发现了一些有趣的模式...',
    '让我为您提供一些个性化的学习建议...',
    '这个概念确实有些复杂，我来为您分解说明...'
  ]

  return responses[Math.floor(Math.random() * responses.length)] +
    '\n\n如果您需要更详细的指导，请随时告诉我！'
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped lang="scss">
.lab-agent {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.agent-header {
  text-align: center;
}

.agent-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
}

.agent-header p {
  font-size: 16px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.agent-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
}

.agent-interface {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 24px;
  backdrop-filter: blur(14px);
}

.agent-avatar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--edu-border-color);
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--edu-primary-500), var(--edu-primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 24px;
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.online {
    background: #10b981;
  }
}

.status-text {
  font-size: 14px;
  color: var(--edu-text-secondary);
}

.agent-chat {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--edu-bg-color);
  border-radius: 12px;
  margin-bottom: 16px;
}

.message {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  &.user {
    text-align: right;

    .message-content {
      background: var(--edu-primary-500);
      color: white;
      margin-left: auto;
    }
  }

  &.agent {
    text-align: left;

    .message-content {
      background: white;
      color: var(--edu-text-primary);
      border: 1px solid var(--edu-border-color);
    }
  }
}

.message-content {
  display: inline-block;
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;

  .user & {
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 4px;
  }
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.chat-input {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input .el-textarea {
  flex: 1;
}

.agent-capabilities {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 24px;
  backdrop-filter: blur(14px);
}

.agent-capabilities h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 20px 0;
}

.capabilities-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.capability-card {
  text-align: center;
  padding: 20px 16px;
  background: var(--edu-bg-color);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.capability-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.capability-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
}

.capability-card p {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .agent-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .agent-avatar {
    justify-content: center;
    text-align: center;
  }

  .message-content {
    max-width: 85%;
  }

  .chat-input {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-input .el-button {
    width: 100%;
  }
}
</style>